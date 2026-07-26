#!/usr/bin/env python3
"""
Dividend Shift - video intelligence worker.
Runs AFTER transcribe_worker.py in the same Action. For every finished Bunny
video that has an English caption:
  1. pulls the caption VTT and converts it to plain transcript text
  2. asks Groq LLM for a suggested title + summary bullet points
  3. writes the summary into the Bunny video description (metaTags)
  4. upserts transcript/summary/suggested title into Supabase
     (video_transcripts) for AI scanning + admin title approval.
Titles are NEVER changed here - admin approves suggestions in the portal.
"""
import os, json, re, time, urllib.request

def get(k, d=""):
    v = os.environ.get(k)
    return v if v not in (None, "") else d

GROQ  = get("GROQ_API_KEY")
BKEY  = get("BUNNY_API_KEY")
LIB   = get("BUNNY_LIBRARY_ID", "688516")
CDN   = get("BUNNY_CDN_HOST", "vz-27c13ac3-eef.b-cdn.net")
SB    = get("SUPABASE_URL", "https://dehttbxrkeqhsfkfpfwt.supabase.co").rstrip("/")
SBKEY = get("SUPABASE_SERVICE_ROLE_KEY")

def http(url, method="GET", headers=None, data=None, timeout=60):
    req = urllib.request.Request(url, method=method)
    req.add_header("User-Agent", "Mozilla/5.0 (compatible; ds-video-intel/1.0)")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    body = None
    if data is not None:
        body = data if isinstance(data, bytes) else json.dumps(data).encode()
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, body, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()
    except Exception as e:
        return 0, str(e).encode()

def bunny(path, method="GET", data=None):
    s, b = http(f"https://video.bunnycdn.com/library/{LIB}{path}", method,
                {"AccessKey": BKEY, "accept": "application/json"}, data)
    try: return s, json.loads(b or b"{}")
    except Exception: return s, {}

def vtt_to_text(vtt):
    out = []
    for line in vtt.splitlines():
        t = line.strip()
        if not t or t == "WEBVTT" or "-->" in t or re.fullmatch(r"\d+", t):
            continue
        t = re.sub(r"<[^>]+>", "", t)
        if out and out[-1] == t:
            continue
        out.append(t)
    return " ".join(out)

GROQ_MODELS = ["llama-3.3-70b-versatile", "meta-llama/llama-4-scout-17b-16e-instruct",
               "openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.1-8b-instant", "gemma2-9b-it"]

def groq_json(system, user):
    for model in GROQ_MODELS:
        payload = {"model": model,
                   "messages": [{"role": "system", "content": system},
                                 {"role": "user", "content": user}]}
        s, b = http("https://api.groq.com/openai/v1/chat/completions", "POST",
                    {"Authorization": f"Bearer {GROQ}"}, payload)
        if s != 200:
            print(f"    groq {model} -> {s}: {(b or b'')[:100]!r}")
            continue
        try:
            txt = json.loads(b)["choices"][0]["message"]["content"]
            m = re.search(r"\{.*\}", txt, re.S)
            return json.loads(m.group(0)) if m else None
        except Exception as e:
            print(f"    groq {model} parse error: {e}")
            continue
    return None

def sb_req(path, method="GET", data=None, prefer=None):
    h = {"apikey": SBKEY, "Authorization": f"Bearer {SBKEY}"}
    if prefer: h["Prefer"] = prefer
    return http(f"{SB}/rest/v1{path}", method, h, data)

def main():
    if not (BKEY and GROQ and SBKEY):
        print("video_intel: missing keys (BUNNY/GROQ/SUPABASE) - skipping")
        return
    s, j = bunny("/videos?page=1&itemsPerPage=100&orderBy=date")
    vids = [v for v in (j.get("items") or []) if v.get("status") == 4]
    print(f"video_intel: {len(vids)} finished videos")
    done = 0
    for v in vids:
        guid = v["guid"]
        title = v.get("title") or guid
        # skip if we already have a transcript row
        s, b = sb_req(f"/video_transcripts?video_guid=eq.{guid}&select=video_guid,title_status,transcript")
        rows = json.loads(b or b"[]") if s == 200 else []
        if rows and (rows[0].get("transcript") or "").strip():
            continue
        # fetch English captions from the CDN
        s, b = http(f"https://{CDN}/{guid}/captions/en.vtt")
        if s != 200 or not b:
            print(f"  no captions yet: {guid}")
            continue
        text = vtt_to_text(b.decode("utf-8", "ignore"))
        if len(text) < 40:
            print(f"  caption too short: {guid}")
            continue
        meta = groq_json(
            "You label coaching-call replay videos for a merchant-services training program. "
            "Given a transcript, return JSON with keys: title (max 60 chars, format 'Topic - Mon DD, YYYY' if a date is evident, else just Topic), "
            "summary (markdown, exactly 4-6 bullet points of the key takeaways, each one sentence, no preamble).",
            text[:24000])
        if not meta:
            print(f"  llm failed: {guid}")
            continue
        summary = (meta.get("summary") or "").strip()
        sug = (meta.get("title") or "").strip()[:120]
        # 1) write description onto the Bunny video (metaTags)
        plain = re.sub(r"^[-*] ", "", summary, flags=re.M).replace("**", "")
        bunny(f"/videos/{guid}", "POST", {"metaTags": [{"property": "description", "value": plain[:480]}]})
        # 2) upsert into Supabase (never clobber an accepted title)
        row = {"video_guid": guid, "current_title": title, "summary_md": summary,
               "transcript": text, "duration_seconds": v.get("length"),
               "updated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z"}
        if not rows or rows[0].get("title_status") != "accepted":
            row["suggested_title"] = sug
            row["title_status"] = "suggested"
        sb_req("/video_transcripts", "POST", row, prefer="resolution=merge-duplicates")
        done += 1
        print(f"  processed: {guid}")
        time.sleep(65)  # stay under Groq free-tier per-minute limits on batch runs
    print(f"video_intel: done, {done} processed")

if __name__ == "__main__":
    main()
