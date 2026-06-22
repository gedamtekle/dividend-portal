#!/usr/bin/env python3
"""
Dividend Shift — Groq transcription + smart-metadata worker for Bunny Stream.

What it does each run:
  1. Lists videos in the Bunny library.
  2. For any FINISHED video missing an English caption:
     - pulls the audio (ffmpeg, straight from Bunny's HLS, compressed to ~16 MB)
     - transcribes it with Groq Whisper Large v3 Turbo (~5 cents/hour)
     - uploads the English .vtt caption back to Bunny (shows as CC in the player)
  3. For any FINISHED video with no chapters yet:
     - uses Groq's LLM to generate chapters + moments (+ a suggested title/description)
     - writes chapters & moments to Bunny; saves title/description to a sidecar JSON

Idempotent: re-running skips videos already captioned / chaptered.
Config: reads keys from config.env next to this file (KEY=VALUE lines).
"""
import os, sys, json, base64, subprocess, tempfile, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
META_DIR = os.path.join(HERE, "meta")
os.makedirs(META_DIR, exist_ok=True)

# ---------- config (env vars win; config.env is an optional local fallback) ----------
def load_config():
    cfg = {}
    path = os.path.join(HERE, "config.env")
    if os.path.exists(path):
        for line in open(path, encoding="utf-8"):
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, v = line.split("=", 1)
            cfg[k.strip()] = v.strip()
    return cfg

CFG = load_config()
def get(k, default=""):
    v = os.environ.get(k)
    return v if v not in (None, "") else CFG.get(k, default)

GROQ = get("GROQ_API_KEY")
BKEY = get("BUNNY_API_KEY")
LIB = get("BUNNY_LIBRARY_ID", "688516")
CDN = get("BUNNY_CDN_HOST", "vz-27c13ac3-eef.b-cdn.net")
SMART_TITLE = get("SMART_TITLE", "false").lower() == "true"      # overwrite Bunny title?
SMART_DESC = get("SMART_DESCRIPTION", "true").lower() == "true"  # save description sidecar?
SMART_CHAPTERS = get("SMART_CHAPTERS", "true").lower() == "true"
GROQ_LLM = get("GROQ_LLM_MODEL", "llama-3.3-70b-versatile")
if not GROQ or not BKEY:
    sys.exit("GROQ_API_KEY and BUNNY_API_KEY must both be set (env vars or config.env).")

BASE = f"https://video.bunnycdn.com/library/{LIB}"

# ---------- tiny HTTP helpers ----------
def http(method, url, headers=None, data=None):
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=600) as r:
            body = r.read()
            return r.status, body
    except urllib.error.HTTPError as e:
        return e.code, e.read()

def bunny_get(path):
    s, b = http("GET", BASE + path, {"AccessKey": BKEY, "accept": "application/json"})
    return json.loads(b) if b else {}

def bunny_json(method, path, payload):
    s, b = http(method, BASE + path,
                {"AccessKey": BKEY, "content-type": "application/json", "accept": "application/json"},
                json.dumps(payload).encode())
    return s, b

# ---------- ffmpeg ----------
def ffmpeg_path():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return "ffmpeg"  # fall back to system ffmpeg if present

def extract_audio(guid, out_path):
    src = f"https://{CDN}/{guid}/playlist.m3u8"
    cmd = [ffmpeg_path(), "-y", "-i", src, "-vn", "-ac", "1", "-ar", "16000",
           "-b:a", "32k", "-f", "mp3", out_path]
    p = subprocess.run(cmd, capture_output=True)
    if p.returncode != 0 or not os.path.exists(out_path) or os.path.getsize(out_path) == 0:
        raise RuntimeError("ffmpeg failed:\n" + p.stderr.decode()[-1500:])

# ---------- Groq ----------
def groq_transcribe(audio_path):
    import requests
    with open(audio_path, "rb") as f:
        r = requests.post(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            headers={"Authorization": f"Bearer {GROQ}"},
            files={"file": (os.path.basename(audio_path), f, "audio/mpeg")},
            data={"model": "whisper-large-v3-turbo", "response_format": "verbose_json",
                  "language": "en", "temperature": "0",
                  "timestamp_granularities[]": "segment"},
            timeout=600,
        )
    r.raise_for_status()
    return r.json()

def groq_llm_json(transcript):
    import requests
    sys_p = ("You create concise metadata for a business-coaching video from its transcript. "
             "Return ONLY JSON with keys: title (string, <=70 chars), "
             "description (string, 2-3 sentences), "
             "chapters (array of {start_seconds:int, title:string}, 4-8 items, start at 0), "
             "moments (array of {timestamp_seconds:int, label:string}, 3-6 key takeaways).")
    r = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ}", "content-type": "application/json"},
        data=json.dumps({
            "model": GROQ_LLM,
            "response_format": {"type": "json_object"},
            "temperature": 0.3,
            "messages": [
                {"role": "system", "content": sys_p},
                {"role": "user", "content": transcript[:48000]},
            ],
        }).encode(),
        timeout=180,
    )
    r.raise_for_status()
    return json.loads(r.json()["choices"][0]["message"]["content"])

# ---------- VTT ----------
def ts(sec):
    sec = max(0, float(sec)); h = int(sec // 3600); m = int((sec % 3600) // 60)
    s = sec % 60
    return f"{h:02d}:{m:02d}:{s:06.3f}"

def build_vtt(segments):
    out = ["WEBVTT", ""]
    for seg in segments:
        txt = (seg.get("text") or "").strip()
        if not txt:
            continue
        out.append(f"{ts(seg['start'])} --> {ts(seg['end'])}")
        out.append(txt)
        out.append("")
    return "\n".join(out)

# ---------- per-video processing ----------
def has_en_caption(detail):
    for c in (detail.get("captions") or []):
        if (c.get("srclang") or "").lower() == "en":
            return True
    return False

def process(video):
    guid = video["guid"]
    detail = bunny_get(f"/videos/{guid}")
    title = detail.get("title", guid)
    did = []

    # --- captions ---
    if not has_en_caption(detail):
        print(f"  transcribing: {title}")
        with tempfile.TemporaryDirectory() as td:
            audio = os.path.join(td, f"{guid}.mp3")
            extract_audio(guid, audio)
            tr = groq_transcribe(audio)
        vtt = build_vtt(tr.get("segments", []))
        payload = {"srclang": "en", "label": "English",
                   "captionsFile": base64.b64encode(vtt.encode()).decode()}
        s, b = bunny_json("POST", f"/videos/{guid}/captions/en", payload)
        if s in (200, 201):
            did.append("captions")
            # cache transcript text for smart step
            detail["_transcript"] = tr.get("text", "")
        else:
            print(f"    caption upload failed [{s}]: {b[:300]}")
    else:
        print(f"  captions already present: {title}")

    # --- smart chapters / moments / title / description ---
    needs_smart = SMART_CHAPTERS and not (detail.get("chapters"))
    if needs_smart:
        transcript = detail.get("_transcript", "")
        if not transcript:
            # rebuild transcript from existing caption if needed
            transcript = title  # minimal fallback
        try:
            meta = groq_llm_json(transcript)
        except Exception as e:
            print(f"    smart-metadata skipped: {e}")
            meta = None
        if meta:
            update = {}
            chapters = meta.get("chapters") or []
            chapters = sorted(chapters, key=lambda c: c.get("start_seconds", 0))
            bch = []
            for i, c in enumerate(chapters):
                start = int(c.get("start_seconds", 0))
                end = int(chapters[i + 1]["start_seconds"]) if i + 1 < len(chapters) else start + 60
                bch.append({"title": c.get("title", f"Chapter {i+1}"), "start": start, "end": max(end, start + 1)})
            if bch:
                update["chapters"] = bch
            moments = meta.get("moments") or []
            bm = [{"label": m.get("label", "")[:80], "timestamp": int(m.get("timestamp_seconds", 0))}
                  for m in moments if m.get("label")]
            if bm:
                update["moments"] = bm
            if SMART_TITLE and meta.get("title"):
                update["title"] = meta["title"]
            if update:
                s, b = bunny_json("POST", f"/videos/{guid}", update)
                if s in (200, 201):
                    did.append("chapters/moments" + ("/title" if SMART_TITLE else ""))
                else:
                    print(f"    metadata update failed [{s}]: {b[:300]}")
            if SMART_DESC and meta.get("description"):
                # store description as a Bunny metaTag (non-destructive) in its own call
                s3, b3 = bunny_json("POST", f"/videos/{guid}",
                                    {"metaTags": [{"property": "ds_description",
                                                   "value": meta["description"][:900]}]})
                if s3 in (200, 201):
                    did.append("description")
            if SMART_DESC:
                json.dump({"guid": guid, "suggested_title": meta.get("title"),
                           "description": meta.get("description"),
                           "chapters": meta.get("chapters"), "moments": meta.get("moments")},
                          open(os.path.join(META_DIR, f"{guid}.json"), "w"), indent=2)
    return did

def main():
    data = bunny_get("/videos?itemsPerPage=100&orderBy=date")
    vids = data.get("items", [])
    finished = [v for v in vids if v.get("status") == 4]
    print(f"{len(vids)} videos, {len(finished)} finished encoding.")
    total = 0
    for v in finished:
        done = process(v)
        if done:
            total += 1
            print(f"  -> {v.get('title')}: {', '.join(done)}")
    print(f"Done. Processed {total} video(s).")

if __name__ == "__main__":
    main()
