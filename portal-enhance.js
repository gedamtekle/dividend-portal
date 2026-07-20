/* ------------------------------------------------------------------ *
 * 0) PERFORMANCE SHIM (must stay at the top)
 *    Throttles every MutationObserver callback to at most once per
 *    ~250ms. The enhancers below observe the whole document; without
 *    this, SPA re-renders and the per-second countdown trigger repeated
 *    full-document scans, causing input/click lag.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsMOWrapped) return; window.__dsMOWrapped = true;
  var Native = window.MutationObserver || window.WebKitMutationObserver;
  if (!Native) return;
  var GAP = 250;
  function Wrapped(cb) {
    var queue = [], last = 0, timer = null, obs;
    function flush() { last = Date.now(); timer = null; var r = queue; queue = []; try { cb(r, obs); } catch (e) {} }
    obs = new Native(function (records) {
      for (var i = 0; i < records.length; i++) queue.push(records[i]);
      if (timer) return;
      var wait = GAP - (Date.now() - last);
      if (wait <= 0) flush(); else timer = setTimeout(flush, wait);
    });
    return obs;
  }
  Wrapped.prototype = Native.prototype;
  try { window.MutationObserver = Wrapped; } catch (e) {}
})();

/* Dividend Shift — portal enhancements
 * Add ONE line to index.html (right after the /pwa.js line is fine):
 *     <script src="/portal-enhance.js" defer></script>
 *
 * Two features, both self-contained (no changes to the app's own code):
 *  1) Pending-approval screen redesign — when the app shows its existing #apPending
 *     panel (only shown to clients whose status is still 'pending'), we replace its
 *     contents with a "your program, locked" view + a clear pending badge. The app's
 *     own gate still decides WHEN to show it; we only restyle it.
 *  2) /start onboarding wizard — open portal.dividendshift.com/?start to launch a
 *     guided first-run: install the app, then continue into sign-in. The app's own
 *     phone-verify and approval gates enforce the rest.
 */
(function () {
  'use strict';
  if (window.__dsEnhance) return;
  window.__dsEnhance = true;

  var GOLD = '#F2B33D', NAVY = '#0E1A2B', INK = '#14161D';
  var APP_NAME = 'Dividend Shift';

  /* ------------------------------------------------------------------ *
   * 1) PENDING-APPROVAL SCREEN
   * ------------------------------------------------------------------ */
  var PENDING_MARK = 'ds-pending-v1';

  function lockedCard(title, sub) {
    return (
      '<div style="display:flex;align-items:center;gap:14px;padding:16px 18px;border:1px solid #ECECEF;border-radius:14px;background:#fff;filter:grayscale(1);opacity:.55">' +
        '<div style="width:44px;height:44px;border-radius:11px;background:#F1F1F4;display:flex;align-items:center;justify-content:center;flex:0 0 auto">' +
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M6 10V8a6 6 0 1112 0v2m-13 0h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z" stroke="#8A8A93" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '</div>' +
        '<div style="flex:1 1 auto;min-width:0">' +
          '<div style="font-weight:700;color:' + INK + ';font-size:15px">' + title + '</div>' +
          '<div style="color:#8A8A93;font-size:13px">' + sub + '</div>' +
        '</div>' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 10V8a6 6 0 1112 0v2" stroke="#B7B7BE" stroke-width="1.8" stroke-linecap="round"/></svg>' +
      '</div>'
    );
  }

  function pendingHTML() {
    var cards = [
      lockedCard('Program Foundations', 'Unlocks after approval'),
      lockedCard('Your Mastermind Calls', 'Unlocks after approval'),
      lockedCard('Lessons &amp; Resources', 'Unlocks after approval'),
      lockedCard('Progress &amp; Milestones', 'Unlocks after approval')
    ].join('');
    return (
      '<div data-' + PENDING_MARK + '="1" style="max-width:520px;margin:0 auto;padding:28px 20px 40px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif">' +
        '<div style="text-align:center;margin-bottom:22px">' +
          '<img src="/icons/icon-192.png" alt="" width="64" height="64" style="border-radius:16px"/>' +
          '<div style="display:inline-flex;align-items:center;gap:8px;margin-top:16px;padding:7px 14px;border-radius:999px;background:rgba(242,179,61,.15);color:#8a5b00;font-weight:700;font-size:13px">' +
            '<span style="width:8px;height:8px;border-radius:50%;background:' + GOLD + ';display:inline-block"></span>Pending approval' +
          '</div>' +
          '<h2 style="margin:16px 0 8px;font-size:22px;color:' + INK + '">You’re almost in</h2>' +
          '<p style="margin:0;color:#5C6577;font-size:15px;line-height:1.5">Thanks for signing up. Your team is reviewing your account — you’ll get full access to your program as soon as you’re approved, usually within a few hours.</p>' +
        '</div>' +
        '<div style="position:relative">' +
          '<div style="display:flex;flex-direction:column;gap:12px;pointer-events:none;user-select:none">' + cards + '</div>' +
        '</div>' +
        '<button id="ds-pending-refresh" style="width:100%;margin-top:22px;background:' + NAVY + ';color:#fff;border:0;border-radius:12px;padding:14px;font-weight:700;font-size:15px;cursor:pointer">Check approval status</button>' +
        '<p style="text-align:center;color:#8A8A93;font-size:13px;margin-top:14px">Questions? Message your team and they’ll get you sorted.</p>' +
        '<div style="text-align:center;margin-top:6px"><a href="#" id="ds-pending-signout" style="color:#8A8A93;font-size:13px;text-decoration:underline">Sign out</a></div>' +
      '</div>'
    );
  }

  function signOutHard() {
    try {
      Object.keys(localStorage).forEach(function (k) {
        if (/^sb-.*-auth-token/.test(k) || /supabase\.auth/.test(k)) localStorage.removeItem(k);
      });
    } catch (_e) {}
    location.replace(location.pathname);
  }

  function paintPending(el) {
    if (!el || el.querySelector('[data-' + PENDING_MARK + ']')) return;
    el.innerHTML = pendingHTML();
    var btn = el.querySelector('#ds-pending-refresh');
    if (btn) btn.addEventListener('click', function () { location.reload(); });
    var so = el.querySelector('#ds-pending-signout');
    if (so) so.addEventListener('click', function (e) { e.preventDefault(); signOutHard(); });
  }

  /* ---- blank hardcoded demo transcript + resources on lessons ---- */
  var DS_PLACEHOLDER_RES = ['Merchant Targeting Worksheet', 'Done-For-You Onboarding Link', 'First-Call Script Template'];
  function blankPlaceholders() {
    var tx = document.querySelectorAll(".transcript");
    tx.forEach(function (el) {
      if (el.getAttribute("data-ds-tx")) return;
      el.setAttribute("data-ds-tx", "1");
      el.innerHTML = '<div class="mut" style="font-size:13px;padding:8px 2px">No transcript available for this video yet.</div>';
    });
    document.querySelectorAll(".res").forEach(function (r) {
      var t = (r.textContent || "").replace(/\s+/g, " ").trim();
      if (DS_PLACEHOLDER_RES.some(function (p) { return t.indexOf(p) >= 0; })) r.remove();
    });
  }
  function watchPending() {
    var el = document.getElementById('apPending');
    if (el) paintPending(el);
    // Re-apply if the app re-renders the panel, and catch late creation.
    var mo = new MutationObserver(function () {
      var p = document.getElementById('apPending');
      if (p) paintPending(p);
      blankPlaceholders();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  /* ------------------------------------------------------------------ *
   * 2) /start ONBOARDING WIZARD
   * ------------------------------------------------------------------ */
  function wantsStart() {
    try {
      var qs = new URLSearchParams(location.search);
      if (qs.has('start') || qs.get('onboard') === '1') return true;
    } catch (_e) {}
    return /[?#&]start\b/.test(location.href);
  }
  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  }
  var UA = navigator.userAgent;
  var isIOS = /iPhone|iPad|iPod/.test(UA) && !window.MSStream;
  var isAndroid = /Android/.test(UA);

  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferredPrompt = e; });

  function el(tag, css, html) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function launchWizard() {
    if (document.getElementById('ds-wizard')) return;
    var overlay = el('div', [
      'position:fixed', 'inset:0', 'z-index:2147483646', 'background:' + NAVY,
      'display:flex', 'flex-direction:column', 'align-items:center', 'justify-content:flex-start',
      'overflow:auto', 'font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif',
      'color:#fff', 'padding:0'
    ].join(';'));
    overlay.id = 'ds-wizard';

    var steps = [];
    // Step 1: install
    var installBody;
    if (isAndroid) {
      installBody = '<p style="color:#C9D2E0;font-size:15px;line-height:1.6;margin:0 0 22px">Add ' + APP_NAME + ' to your home screen so it opens like a normal app — full screen, one tap.</p>' +
        '<button id="ds-install-btn" style="background:' + GOLD + ';color:#111;border:0;border-radius:12px;padding:15px 20px;font-weight:800;font-size:16px;cursor:pointer;width:100%">Install the app</button>';
    } else if (isIOS) {
      installBody = '<p style="color:#C9D2E0;font-size:15px;line-height:1.6;margin:0 0 18px">Add ' + APP_NAME + ' to your home screen so it opens like a normal app:</p>' +
        '<ol style="color:#E6ECF5;font-size:15px;line-height:1.9;margin:0 0 22px;padding-left:22px">' +
          '<li>Tap the <b>Share</b> icon <span style="display:inline-block;transform:translateY(2px)">↑︎</span> at the bottom of Safari</li>' +
          '<li>Scroll and tap <b>“Add to Home Screen”</b></li>' +
          '<li>Tap <b>Add</b> — then open ' + APP_NAME + ' from your home screen</li>' +
        '</ol>';
    } else {
      installBody = '<p style="color:#C9D2E0;font-size:15px;line-height:1.6;margin:0 0 22px">For the best experience, open this link on your phone — you’ll be able to add ' + APP_NAME + ' to your home screen. You can also continue here in your browser.</p>';
    }
    steps.push({
      title: 'Get the app',
      body: installBody,
      cta: isAndroid ? 'Skip for now' : 'I’ve added it — Continue'
    });
    // Step 2: continue to sign in
    steps.push({
      title: 'Let’s get you set up',
      body: '<p style="color:#C9D2E0;font-size:15px;line-height:1.6;margin:0 0 22px">Next you’ll sign in (or create your account) and verify your phone. Your team approves your account, then your full program unlocks.</p>',
      cta: 'Continue to sign in'
    });

    var idx = 0;
    var card = el('div', 'width:100%;max-width:460px;margin:auto;padding:40px 24px 32px;box-sizing:border-box');
    overlay.appendChild(card);

    function dots() {
      return '<div style="display:flex;gap:7px;justify-content:center;margin-bottom:26px">' +
        steps.map(function (_s, i) {
          return '<span style="width:8px;height:8px;border-radius:50%;background:' + (i === idx ? GOLD : 'rgba(255,255,255,.25)') + '"></span>';
        }).join('') + '</div>';
    }

    function render() {
      var s = steps[idx];
      card.innerHTML =
        '<div style="text-align:center;margin-bottom:18px"><img src="/icons/icon-192.png" width="72" height="72" style="border-radius:18px" alt=""/></div>' +
        dots() +
        '<h1 style="font-size:26px;text-align:center;margin:0 0 14px">' + s.title + '</h1>' +
        '<div>' + s.body + '</div>' +
        '<button id="ds-next" style="width:100%;background:#fff;color:' + NAVY + ';border:0;border-radius:12px;padding:15px;font-weight:800;font-size:16px;cursor:pointer;margin-top:6px">' + s.cta + '</button>';

      var ib = card.querySelector('#ds-install-btn');
      if (ib) ib.addEventListener('click', function () {
        if (deferredPrompt) {
          deferredPrompt.prompt();
          deferredPrompt.userChoice.finally(function () { deferredPrompt = null; next(); });
        } else { next(); }
      });
      card.querySelector('#ds-next').addEventListener('click', next);
    }
    function next() {
      if (idx < steps.length - 1) { idx++; render(); }
      else finish();
    }
    function finish() {
      try { localStorage.setItem('ds_onboard_done', '1'); } catch (_e) {}
      overlay.remove();
      try {
        var u = new URL(location.href);
        u.searchParams.delete('start'); u.searchParams.delete('onboard');
        history.replaceState({}, '', u.pathname + (u.search || '') + (location.hash || ''));
      } catch (_e) {}
    }
    render();
    document.body.appendChild(overlay);
  }

  /* ------------------------------------------------------------------ *
   * INIT
   * ------------------------------------------------------------------ */
  function init() {
    watchPending();
    blankPlaceholders();
    if (wantsStart() && !isStandalone()) {
      setTimeout(launchWizard, 300);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();


/* ------------------------------------------------------------------ *
 * 3) REAL TRANSCRIPT LOADER
 *    When a real lesson video plays, the app injects a Bunny embed
 *    iframe into #playerFrame. We read the video GUID from that iframe,
 *    fetch its caption track (WEBVTT) from the Bunny CDN, and render a
 *    timestamped transcript into the .transcript panel. If the video has
 *    no captions we show a blank "no transcript yet" note. Demo/
 *    placeholder lessons have no iframe GUID, so they stay blank.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsTx) return;
  window.__dsTx = true;
  var CDN = ['video.dividendshift.com', 'vz-27c13ac3-eef.b-cdn.net'];
  var GRE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;
  var last = null, busy = false;
  function box() { return document.querySelector('#tTrans .transcript') || document.querySelector('.transcript'); }
  function guid() {
    var fr = document.querySelector('#playerFrame iframe');
    if (!fr) return null;
    var m = (fr.getAttribute('src') || '').match(GRE);
    return m ? m[0] : null;
  }
  function esc(s) { return s.replace(/[&<>]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; }); }
  function blank(msg) { var b = box(); if (b) b.innerHTML = '<div class="mut" style="font-size:13px;padding:8px 2px">' + msg + '</div>'; }
  function parse(t) {
    var L = t.replace(/\r/g, '').split('\n'), cues = [], i = 0;
    while (i < L.length && L[i].indexOf('-->') < 0) i++;
    for (; i < L.length; i++) {
      if (L[i].indexOf('-->') >= 0) {
        var ts = L[i].split('-->')[0].trim().replace(/\.\d+$/, '').replace(/^00:/, '');
        var tx = []; i++;
        while (i < L.length && L[i].trim() !== '') { tx.push(L[i].trim()); i++; }
        var s = tx.join(' ').replace(/<[^>]+>/g, '').trim();
        if (s) cues.push([ts, s]);
      }
    }
    return cues;
  }
  function render(cues) {
    var b = box(); if (!b) return;
    if (!cues.length) { blank('No transcript available for this video yet.'); return; }
    b.style.maxHeight = '340px'; b.style.overflow = 'auto';
    b.innerHTML = cues.map(function (c) {
      return '<div class="t" style="display:flex;gap:12px;padding:6px 2px;align-items:baseline">' +
        '<span style="color:#8A8A93;font-variant-numeric:tabular-nums;flex:0 0 46px;font-size:12px">' + c[0] + '</span>' +
        '<span style="font-size:13px;line-height:1.5">' + esc(c[1]) + '</span></div>';
    }).join('');
  }
  function fetchVtt(g) {
    var hosts = CDN.slice();
    return (function next() {
      if (!hosts.length) return Promise.resolve('');
      var h = hosts.shift();
      return fetch('https://' + h + '/' + g + '/captions/en.vtt', { mode: 'cors' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (t) { return (t && t.indexOf('-->') >= 0) ? t : next(); })
        .catch(function () { return next(); });
    })();
  }
  function sync() {
    if (busy) return;
    var g = guid();
    if (!g) { if (last) { last = null; blank('No transcript available for this video yet.'); } return; }
    if (g === last) return;
    busy = true; last = g; blank('Loading transcript\u2026');
    fetchVtt(g).then(function (v) { if (guid() === g) render(parse(v)); })
               .catch(function () {})
               .then(function () { busy = false; });
  }
  function boot() {
    var mo = new MutationObserver(function () { sync(); });
    mo.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['src'] });
    setInterval(sync, 1500);
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


/* ------------------------------------------------------------------ *
 * 4) VIDEO LIBRARY (admin/team only)
 *    Global library of Bunny videos with drag-drop attach.
 *    Upload once; drag a video onto a lesson to attach it (sets
 *    lessons.video_url) or onto a module to create a new lesson.
 *    Transcripts then load automatically via the loader above.
 *    Uses its own Supabase client bound to the signed-in admin
 *    session; the anon key below is the public publishable key.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsLib) return; window.__dsLib = true;
  var GOLD='#F2B33D', NAVY='#0E1A2B', INK='#14161D', LINE='#E7E7EC', MUT='#8A8A93';
  var LIB='688516', PULL='video.dividendshift.com';
  var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var sb=null, ROLE=null, DEF_COL='409ec36b-3e49-487c-81eb-357ae7e44ace';
  var S={videos:[],programs:[],modules:[],lessons:[],sel:null,open:{}};

  function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}
  function mmss(x){x=Math.round(x||0);var m=Math.floor(x/60),s=x%60;return m+':'+(s<10?'0':'')+s;}
  function guidOf(u){var m=String(u||'').match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);return m?m[0]:null;}
  function thumb(g){return 'https://'+PULL+'/'+g+'/thumbnail.jpg';}
  function embed(g){return 'https://iframe.mediadelivery.net/embed/'+LIB+'/'+g;}
  function statusLabel(v){var s=v.status;if(s>=4&&s!==5)return['ready','#1E7F4F','#E7F6EE'];if(s===5)return['error','#B4232A','#FBE9E9'];return['processing','#8a5b00','#FBF1DA'];}
  function toast(msg,bad){var t=document.createElement('div');t.textContent=msg;t.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2147483600;background:'+(bad?'#B4232A':NAVY)+';color:#fff;padding:11px 18px;border-radius:10px;font:600 14px -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 26px rgba(0,0,0,.3)';document.body.appendChild(t);setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .4s';setTimeout(function(){t.remove();},400);},1900);}

  async function ensureSb(){
    if(sb) return sb;
    if(window.__dsSB){ sb=window.__dsSB; } else { var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0'); sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}}); window.__dsSB=sb; }
    return sb;
  }
  async function checkAdmin(){
    await ensureSb();
    var u=(await sb.auth.getUser()).data; var uid=u&&u.user&&u.user.id;
    if(!uid) return false;
    var me=(await sb.from('profiles').select('role').eq('id',uid).single()).data;
    ROLE=me&&me.role; return ROLE==='admin'||ROLE==='team';
  }
  async function loadAll(){
    var v=await sb.functions.invoke('bunny-upload',{body:{action:'list'}});
    S.videos=((v.data&&v.data.items)||[]).slice().sort(function(a,b){return String(a.title||'').localeCompare(String(b.title||''));});
    S.programs=(await sb.from('programs').select('*').order('sort')).data||[];
    S.modules=(await sb.from('modules').select('*').order('sort')).data||[];
    S.lessons=(await sb.from('lessons').select('*').order('sort')).data||[];
  }
  function buckets(){
    var real=S.programs.map(function(p){return {key:p.key,name:p.name};});
    var known={}; S.programs.forEach(function(p){known[p.key]=1;});
    var orphKeys={};
    S.modules.forEach(function(m){if(!known[m.program_key])orphKeys[m.program_key]=1;});
    S.lessons.forEach(function(l){if(!known[l.program_key])orphKeys[l.program_key]=1;});
    var orph=Object.keys(orphKeys).map(function(k){return {key:k,name:(k==='default'?'Shared Curriculum (all programs)':k),orphan:true};});
    return orph.concat(real);
  }

  async function attach(lessonId, g, sec){
    var patch={video_url:embed(g)}; if(sec) patch.duration=mmss(sec);
    var r=await sb.from('lessons').update(patch).eq('id',lessonId).select('id');
    if(r.error){toast('Attach failed: '+r.error.message,1);return false;}
    var L=S.lessons.filter(function(x){return x.id===lessonId;})[0]; if(L){L.video_url=patch.video_url; if(patch.duration)L.duration=patch.duration;}
    toast('Video attached'); return true;
  }
  async function detach(lessonId){
    var r=await sb.from('lessons').update({video_url:''}).eq('id',lessonId).select('id');
    if(r.error){toast('Failed: '+r.error.message,1);return;}
    var L=S.lessons.filter(function(x){return x.id===lessonId;})[0]; if(L)L.video_url='';
    render(); toast('Video removed');
  }
  async function createLessonWithVideo(programKey, moduleId, title, g, sec){
    var sibs=S.lessons.filter(function(l){return moduleId? l.module_id===moduleId : (l.program_key===programKey && !l.module_id);});
    var nextSort=sibs.reduce(function(a,l){return Math.max(a,l.sort||0);},0)+10;
    var row={program_key:programKey, module_id:moduleId||null, title:title||'New lesson', duration: sec?mmss(sec):null, video_url:embed(g), sort:nextSort};
    var r=await sb.from('lessons').insert(row).select('*').single();
    if(r.error){toast('Create failed: '+r.error.message,1);return false;}
    S.lessons.push(r.data); toast('Lesson created + video attached'); return true;
  }

  function videoCard(v){
    var g=v.id, st=statusLabel(v);
    return '<div class="dsv-card" draggable="true" data-guid="'+g+'" data-secs="'+(v.seconds||0)+'" data-title="'+esc(v.title)+'" '+
      'style="display:flex;gap:10px;align-items:center;border:1.5px solid '+(S.sel===g?GOLD:LINE)+';border-radius:12px;padding:8px;background:#fff;cursor:grab;'+(S.sel===g?'box-shadow:0 0 0 3px rgba(242,179,61,.2)':'')+'">'+
        '<div style="width:78px;height:46px;border-radius:8px;background:#0b1728 center/cover no-repeat url('+thumb(g)+');flex:0 0 auto;overflow:hidden"></div>'+
        '<div style="flex:1 1 auto;min-width:0">'+
          '<div style="font-weight:700;color:'+INK+';font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(v.title)+'</div>'+
          '<div style="display:flex;gap:8px;align-items:center;margin-top:3px">'+
            '<span style="font-size:11px;color:'+MUT+';font-variant-numeric:tabular-nums">'+(v.seconds?mmss(v.seconds):'—')+'</span>'+
            '<span style="font-size:10px;font-weight:700;color:'+st[1]+';background:'+st[2]+';padding:2px 7px;border-radius:99px">'+st[0]+'</span>'+
          '</div>'+
        '</div>'+
      '</div>';
  }
  function lessonRow(l){
    var g=guidOf(l.video_url); var vt=null;
    if(g){ var vv=S.videos.filter(function(x){return x.id===g;})[0]; vt=vv?vv.title:'Attached video'; }
    return '<div class="dsv-drop" data-lesson="'+l.id+'" '+
      'style="display:flex;gap:10px;align-items:center;padding:9px 11px;border:1.5px dashed '+(g?'transparent':LINE)+';border-radius:10px;background:'+(g?'#F3F8F4':'#fff')+';margin:6px 0">'+
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" style="flex:0 0 auto"><path d="M8 5v14l11-7z" fill="'+(g?GOLD:'#C7C7CE')+'"/></svg>'+
        '<div style="flex:1 1 auto;min-width:0">'+
          '<div style="font-weight:600;color:'+INK+';font-size:13px">'+esc(l.title)+'</div>'+
          '<div style="font-size:11px;color:'+MUT+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(g?('▸ '+esc(vt)+(l.duration?(' · '+esc(l.duration)):'')):'Drop a video here to attach')+'</div>'+
        '</div>'+
        (g?'<button class="dsv-detach" data-lesson="'+l.id+'" style="flex:0 0 auto;background:#fff;border:1px solid '+LINE+';border-radius:8px;color:'+MUT+';font-size:11px;padding:5px 9px;cursor:pointer">Remove</button>':'')+
      '</div>';
  }
  function moduleBlock(bucketKey, mod, depth){
    var lessons=S.lessons.filter(function(l){return l.module_id===mod.id;});
    var subs=S.modules.filter(function(m){return m.parent_id===mod.id;});
    return '<div style="margin:4px 0 4px '+(6+depth*10)+'px">'+
      '<div class="dsv-moddrop" data-module="'+mod.id+'" data-pk="'+esc(bucketKey)+'" style="font-weight:700;color:'+NAVY+';font-size:12px;padding:7px 9px;border-radius:8px;background:#F5F6F8;border:1.5px dashed transparent">'+esc(mod.title)+' <span style="color:'+MUT+';font-weight:500">· drop to add lesson</span></div>'+
      '<div style="padding-left:6px">'+(lessons.length?lessons.map(lessonRow).join(''):'<div style="font-size:11px;color:'+MUT+';padding:5px 2px">No lessons</div>')+'</div>'+
      (subs.length?subs.map(function(s){return moduleBlock(bucketKey,s,depth+1);}).join(''):'')+
    '</div>';
  }
  function bucketBlock(b){
    var mods=S.modules.filter(function(m){return m.program_key===b.key && !m.parent_id;});
    var loose=S.lessons.filter(function(l){return l.program_key===b.key && !l.module_id;});
    var open=S.open[b.key]!==false;
    var body = open ? (
      (loose.length? '<div style="padding-left:6px">'+loose.map(lessonRow).join('')+'</div>':'') +
      (mods.length? mods.map(function(m){return moduleBlock(b.key,m,0);}).join('') : (loose.length?'':'<div style="font-size:11px;color:'+MUT+';padding:6px 8px">No modules yet</div>'))
    ) : '';
    return '<div style="border:1px solid '+(b.orphan?GOLD:LINE)+';border-radius:12px;margin-bottom:10px;overflow:hidden">'+
      '<div class="dsv-prog" data-pk="'+esc(b.key)+'" style="display:flex;align-items:center;gap:8px;padding:11px 13px;background:'+(b.orphan?'#FFFBF2':'#fff')+';cursor:pointer;border-bottom:'+(open?'1px solid '+LINE:'0')+'">'+
        '<span style="transform:rotate('+(open?'90':'0')+'deg);transition:.15s;color:'+MUT+'">▶</span>'+
        '<span style="font-weight:800;color:'+INK+';font-size:14px">'+esc(b.name)+'</span>'+
        '<span style="margin-left:auto;font-size:11px;color:'+MUT+'">'+(mods.length)+' modules</span>'+
      '</div>'+ (open?'<div style="padding:8px 10px 10px">'+body+'</div>':'') +
    '</div>';
  }

  function render(){
    var vlist=document.getElementById('dsv-videos'); var tlist=document.getElementById('dsv-tree');
    if(!vlist||!tlist) return;
    vlist.innerHTML = S.videos.length? S.videos.map(videoCard).join('') : '<div style="color:'+MUT+';font-size:13px;padding:12px">No videos yet — upload one above.</div>';
    tlist.innerHTML = buckets().map(bucketBlock).join('');
    wire();
  }

  function wire(){
    [].forEach.call(document.querySelectorAll('.dsv-card'),function(c){
      c.addEventListener('dragstart',function(e){ e.dataTransfer.setData('text/plain', JSON.stringify({g:c.dataset.guid,s:+c.dataset.secs,t:c.dataset.title})); e.dataTransfer.effectAllowed='copy'; });
      c.addEventListener('click',function(){ S.sel=(S.sel===c.dataset.guid?null:c.dataset.guid); render(); });
    });
    function payloadFrom(e){ try{ return JSON.parse(e.dataTransfer.getData('text/plain')); }catch(_){ return S.sel?{g:S.sel}:null; } }
    [].forEach.call(document.querySelectorAll('.dsv-drop'),function(row){
      row.addEventListener('dragover',function(e){e.preventDefault();row.style.borderColor=GOLD;row.style.background='#FFF8E9';});
      row.addEventListener('dragleave',function(){render();});
      row.addEventListener('drop',async function(e){e.preventDefault();var p=payloadFrom(e);if(!p||!p.g)return;var ok=await attach(row.dataset.lesson,p.g,p.s);if(ok){S.sel=null;render();}});
      row.addEventListener('click',async function(){ if(S.sel){var v=S.videos.filter(function(x){return x.id===S.sel;})[0];var ok=await attach(row.dataset.lesson,S.sel,v&&v.seconds);if(ok){S.sel=null;render();}} });
    });
    [].forEach.call(document.querySelectorAll('.dsv-detach'),function(b){ b.addEventListener('click',function(e){e.stopPropagation();detach(b.dataset.lesson);}); });
    [].forEach.call(document.querySelectorAll('.dsv-moddrop'),function(m){
      m.addEventListener('dragover',function(e){e.preventDefault();m.style.borderColor=GOLD;m.style.background='#FFF8E9';});
      m.addEventListener('dragleave',function(){render();});
      m.addEventListener('drop',async function(e){e.preventDefault();var p=payloadFrom(e);if(!p||!p.g)return;var title=prompt('New lesson title:', p.t||'New lesson');if(title===null)return;var ok=await createLessonWithVideo(m.dataset.pk,m.dataset.module,title,p.g,p.s);if(ok){S.sel=null;render();}});
      m.addEventListener('click',async function(){ if(S.sel){var v=S.videos.filter(function(x){return x.id===S.sel;})[0];var title=prompt('New lesson title:', (v&&v.title)||'New lesson');if(title===null)return;var ok=await createLessonWithVideo(m.dataset.pk,m.dataset.module,title,S.sel,v&&v.seconds);if(ok){S.sel=null;render();}} });
    });
    [].forEach.call(document.querySelectorAll('.dsv-prog'),function(h){ h.addEventListener('click',function(){var k=h.dataset.pk;S.open[k]=(S.open[k]===false);render();}); });
  }

  async function doUpload(file){
    var title=prompt('Video title:', file.name.replace(/\.[^.]+$/,''));
    if(title===null) return;
    toast('Preparing upload…');
    var cr=await sb.functions.invoke('bunny-upload',{body:{action:'create',title:title,collectionId:DEF_COL}});
    if(cr.error||!(cr.data&&cr.data.ok)){toast('Upload init failed',1);return;}
    var d=cr.data, tus=await import('https://esm.sh/tus-js-client@4');
    var up=new tus.Upload(file,{
      endpoint:'https://video.bunnycdn.com/tusupload',
      retryDelays:[0,3000,6000,12000],
      headers:{AuthorizationSignature:d.signature,AuthorizationExpire:String(d.expiration),VideoId:d.videoId,LibraryId:String(d.libraryId)},
      metadata:{filetype:file.type,title:title},
      onError:function(){toast('Upload failed',1);},
      onProgress:function(a,b){var pct=Math.round(a/b*100);var el=document.getElementById('dsv-upstat');if(el)el.textContent='Uploading '+pct+'%';},
      onSuccess:async function(){var el=document.getElementById('dsv-upstat');if(el)el.textContent='';toast('Uploaded — processing + captions will follow');await loadAll();render();}
    });
    up.start();
  }

  function openModal(){
    if(document.getElementById('ds-lib')) return;
    var o=document.createElement('div'); o.id='ds-lib';
    o.style.cssText='position:fixed;inset:0;z-index:2147483200;background:rgba(6,12,20,.72);backdrop-filter:blur(3px);display:flex;padding:22px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif';
    o.innerHTML =
      '<div style="max-width:1120px;width:100%;height:100%;margin:auto;background:#fff;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5)">'+
        '<div style="display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid '+LINE+'">'+
          '<span style="font-size:18px">🎬</span><b style="font-size:16px;color:'+INK+'">Video Library</b>'+
          '<span id="dsv-upstat" style="color:'+MUT+';font-size:12px;margin-left:6px"></span>'+
          '<div style="margin-left:auto;display:flex;gap:8px">'+
            '<button id="dsv-upload" style="background:'+GOLD+';color:#111;border:0;border-radius:10px;padding:9px 15px;font-weight:800;font-size:13px;cursor:pointer">Upload video</button>'+
            '<button id="dsv-refresh" style="background:#fff;border:1px solid '+LINE+';border-radius:10px;padding:9px 13px;font-weight:700;font-size:13px;cursor:pointer">Refresh</button>'+
            '<button id="dsv-close" style="background:#fff;border:1px solid '+LINE+';border-radius:10px;padding:9px 13px;font-weight:700;font-size:13px;cursor:pointer">Close</button>'+
          '</div>'+
        '</div>'+
        '<div style="padding:8px 18px;font-size:12px;color:'+MUT+';border-bottom:1px solid '+LINE+';background:#FAFAFB">Drag a video onto a lesson to attach it — or onto a module to create a new lesson. On touch: tap a video, then tap the lesson. Transcripts load automatically from the video.</div>'+
        '<div style="display:flex;gap:0;flex:1 1 auto;min-height:0">'+
          '<div style="flex:1 1 46%;border-right:1px solid '+LINE+';display:flex;flex-direction:column;min-width:0">'+
            '<div style="padding:10px 14px;font-size:12px;font-weight:700;color:'+MUT+';letter-spacing:.04em">VIDEOS · drag onto a lesson →</div>'+
            '<div id="dsv-videos" style="overflow:auto;padding:0 14px 14px;display:flex;flex-direction:column;gap:8px"></div>'+
          '</div>'+
          '<div style="flex:1 1 54%;display:flex;flex-direction:column;min-width:0">'+
            '<div style="padding:10px 14px;font-size:12px;font-weight:700;color:'+MUT+';letter-spacing:.04em">PROGRAMS · lessons</div>'+
            '<div id="dsv-tree" style="overflow:auto;padding:0 14px 16px"></div>'+
          '</div>'+
        '</div>'+
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('mousedown',function(e){ if(e.target===o) closeModal(); });
    document.getElementById('dsv-close').onclick=closeModal;
    document.getElementById('dsv-refresh').onclick=async function(){toast('Refreshing…');await loadAll();render();};
    var fi=document.createElement('input'); fi.type='file'; fi.accept='video/*'; fi.style.display='none'; o.appendChild(fi);
    document.getElementById('dsv-upload').onclick=function(){fi.click();};
    fi.onchange=function(){ if(fi.files&&fi.files[0]) doUpload(fi.files[0]); fi.value=''; };
    render();
  }
  function closeModal(){var o=document.getElementById('ds-lib');if(o)o.remove();}
  window.__dsLibOpen=async function(){ try{await loadAll();}catch(e){} openModal(); };

  function addLauncher(){
    if(document.getElementById('ds-lib-btn')) return;
    var b=document.createElement('button'); b.id='ds-lib-btn'; b.type='button';
    b.innerHTML='🎬 Video Library';
    b.style.cssText='position:fixed;left:16px;bottom:16px;z-index:2147483100;background:'+NAVY+';color:#fff;border:1px solid rgba(242,179,61,.5);border-radius:12px;padding:11px 15px;font:800 13px -apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;box-shadow:0 10px 26px rgba(0,0,0,.3)';
    b.onclick=window.__dsLibOpen;
    document.body.appendChild(b);
    var mo=new MutationObserver(function(){ if(!document.getElementById('ds-lib-btn')) document.body.appendChild(b); });
    mo.observe(document.documentElement,{childList:true,subtree:true});
  }

  (async function init(){
    try{ var ok=await checkAdmin(); if(!ok){ window.__dsLib=false; return; } await loadAll(); addLauncher(); }catch(e){ window.__dsLib=false; }
  })();
})();


/* ------------------------------------------------------------------ *
 * 5) ADMIN GUIDE (admin/team only)
 *    In-app operations handbook. Adds a "Admin Guide" launcher that
 *    opens a searchable modal with step-by-step instructions:
 *    uploading/attaching videos, approving & suspending clients,
 *    resetting logins, pulling payment-dispute evidence, and more.
 *    Static content; gated to admin/team via the signed-in session.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsGuide) return; window.__dsGuide = true;
  var GOLD='#B9891F', NAVY='#0E1A2B', INK='#14161D', LINE='#E7E7EC', MUT='#6B7280', BG='#FAFAFB';
  var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';

  function b(t){return '<strong>'+t+'</strong>';}
  function lead(t){return '<p style="color:'+MUT+';font-style:italic;margin:0 0 12px;line-height:1.55">'+t+'</p>';}
  function h3(t){return '<div style="font-weight:800;color:'+GOLD+';font-size:14px;margin:16px 0 7px">'+t+'</div>';}
  function note(t){return '<div style="border-left:3px solid '+GOLD+';background:#FFFBF2;padding:9px 12px;border-radius:0 8px 8px 0;color:'+INK+';font-size:13px;margin:10px 0;line-height:1.5">'+t+'</div>';}
  function ul(items){return '<ul style="margin:0 0 6px;padding-left:20px;line-height:1.6">'+items.map(function(i){return '<li style="margin:4px 0;font-size:13.5px">'+i+'</li>';}).join('')+'</ul>';}
  function ol(items){return '<ol style="margin:0 0 6px;padding-left:20px;line-height:1.6">'+items.map(function(i){return '<li style="margin:4px 0;font-size:13.5px">'+i+'</li>';}).join('')+'</ol>';}
  function tbl(head, rows){
    return '<table style="border-collapse:collapse;width:100%;margin:6px 0 8px;font-size:13px"><thead><tr>'+
      head.map(function(x){return '<th style="text-align:left;background:'+NAVY+';color:#fff;padding:8px 10px;border:1px solid '+NAVY+';font-weight:700">'+x+'</th>';}).join('')+
      '</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c){return '<td style="padding:8px 10px;border:1px solid '+LINE+';vertical-align:top">'+c+'</td>';}).join('')+'</tr>';}).join('')+'</tbody></table>';
  }

  var SECTIONS=[
    { id:'start', n:'1', t:'Before you start', h:
      ul([
        b('Sign in')+' at portal.dividendshift.com with your admin or team account — the same address clients use. The portal detects your role automatically.',
        b('Admin View vs. Preview as client')+' (top right): Admin View is where you manage everything; Preview as client shows exactly what a client sees.',
        b('Where things live:')+' the admin areas are Clients, Content, Team, Intake Review, Feedback &amp; Quizzes, Bug Reports, Helpdesk, and Settings.',
        b('Video Library:')+' the \u{1F3AC} button at the bottom-left. It only appears for admin and team accounts.',
        b('No passwords:')+' clients sign in with a one-time email link or a texted code, so there are never passwords to reset — you just resend a fresh link (see §5).'
      ]) },
    { id:'video', n:'2', t:'Upload a video &amp; attach it to a lesson', h:
      lead('Upload each recording once, then attach it wherever it belongs. Captions and the transcript generate automatically, so the same video can go on many lessons with no extra work and no repeat transcription.')+
      h3('Upload a video')+
      ol(['Click '+b('\u{1F3AC} Video Library')+' at the bottom-left.','Click '+b('Upload video')+', choose the file, confirm the title.','It uploads to your video host and shows '+b('Processing')+', then '+b('Ready')+' (a few minutes for long recordings). Captions + transcript generate automatically after processing.'])+
      h3('Attach a video to an existing lesson')+
      ol(['Videos are on the left; the program tree (programs → modules → lessons) is on the right.',b('Drag')+' the video card onto the target lesson — it attaches instantly (the lesson’s video &amp; duration update).','On a phone or tablet, '+b('tap')+' the video, then '+b('tap')+' the lesson.'])+
      h3('Create a new lesson straight from a video')+
      ol(['Drag a video onto a '+b('module')+' (the “drop to add lesson” row) and enter a title — the lesson is created with the video already attached.'])+
      h3('Replace or remove')+
      ul([b('Replace:')+' drag a different video onto the lesson.',b('Remove:')+' click Remove on that lesson.'])+
      h3('Good to know')+
      ul([b('Shared Curriculum')+' (highlighted, top) holds the modules that appear across all programs — usually where core lessons live.','The transcript appears automatically once captioning finishes. If a video has no captions yet, the lesson simply shows no transcript — never a fake placeholder.']) },
    { id:'approve', n:'3', t:'Approve a new client', h:
      lead('New sign-ups start as Pending and see a locked “Pending approval” screen instead of the program.')+
      ol([b('Admin View → Clients')+'.','Open the client.','Click '+b('Approve')+'. They get full access immediately (Pending → Active).'])+
      note('Tip: use “View as this client” to confirm what they’ll see after approval.') },
    { id:'remove', n:'4', t:'Remove or suspend a client’s access', h:
      lead('Suspending cuts off access but keeps all of the client’s history — which you need if a payment dispute comes up (see §6).')+
      ol([b('Admin View → Clients →')+' open the client.','Click '+b('Suspend')+'. They can no longer view program content — they’ll see the locked screen.','To restore access later, '+b('Approve / reactivate')+' them.'])+
      note('Permanent deletion is rare and irreversible — it erases the client’s entire history. Avoid it if you might ever need dispute evidence. If you truly must, remove the user from the Supabase Auth dashboard.') },
    { id:'reset', n:'5', t:'Reset a client’s login', h:
      lead('Clients sign in passwordless, so you never reset a password — you resend a fresh sign-in link.')+
      ol([b('Admin View → Clients →')+' open the client.','Use '+b('Reset login (email)')+' to send a one-time magic link, or the '+b('text a code')+' option to send it by SMS.','If they aren’t receiving it, check the email and phone under '+b('Profile &amp; details')+'.']) },
    { id:'dispute', n:'6', t:'Pull data for a payment dispute / chargeback', h:
      lead('Show the customer signed up, received access, and used the program. Gather these from the client’s record (Admin View → Clients → open the client), then submit with your payment processor’s dispute form.')+
      tbl(['Evidence','Where to find it in the portal'],[
        ['Account &amp; enrollment','Profile &amp; details — name, email, phone, signup / enrollment date, program &amp; plan'],
        ['Proof they could log in','Logins &amp; devices / session log — sign-in dates, device &amp; IP'],
        ['Proof they used it','Content viewed / watch tracking — lessons &amp; videos watched, dates, % completed'],
        ['Communications','Messages / SMS history and any support Tickets'],
        ['Onboarding','Intake forms they submitted (website / location intake)'],
        ['Engagement','Quizzes attempted, feedback / check-ins, milestones &amp; tasks completed'],
        ['The charge &amp; terms','Your payment processor (e.g., Stripe) — the charge, receipt, and Terms acceptance at signup']
      ])+
      h3('How to submit')+
      ol(['Capture a screenshot (or note dates/details) of each item above for that client.','Add the '+b('charge record and Terms acceptance')+' from your payment processor.','Paste a short '+b('timeline')+' into the dispute response: signed up → first login → content watched → communications.'])+
      note('Important: do not delete (or suspend-then-delete) the client before the dispute is resolved — you need the record intact.') },
    { id:'content', n:'7', t:'Manage program content', h:
      ol([b('Admin View → Content →')+' choose a program.','Add '+b('modules')+' and submodules, add '+b('lessons')+', attach '+b('videos')+' (via the Video Library), and add '+b('resources')+' and '+b('FAQs')+'.'])+
      ul([b('Shared Curriculum')+' content appears across every program; program-specific content shows only under that program.']) },
    { id:'sms', n:'8', t:'Message a client (SMS)', h:
      ul(['From the client’s record, use '+b('Message')+' to text them — it’s two-way; replies come back into the thread.','SMS is US-only and rate-limited for safety.']) },
    { id:'live', n:'9', t:'Live training &amp; replays', h:
      ul([b('Admin View')+' → schedule live sessions (StreamYard link + calendar invites; clients get a reminder before each session).','Replays update automatically from your video library.']) },
    { id:'team', n:'10', t:'Team &amp; access levels', h:
      ol([b('Admin View → Team')+': invite members and set each person’s role.'])+
      ul([b('Admin')+' — full control. '+b('Team')+' — day-to-day support. '+b('Client')+' — learner. Grant Admin sparingly.']) },
    { id:'support', n:'11', t:'Support inbox', h:
      ul([b('Helpdesk / Tickets')+' — client support requests.',b('Bug Reports')+' — issues clients submit from the app.',b('Feedback &amp; Quizzes')+' — check-in feedback and quiz results.']) },
    { id:'quick', n:'★', t:'Quick reference', h:
      tbl(['I need to…','Go to','Do this'],[
        ['Add a video','\u{1F3AC} Video Library','Upload video → pick file'],
        ['Put a video on a lesson','\u{1F3AC} Video Library','Drag video onto the lesson'],
        ['Approve a new client','Clients → client','Approve'],
        ['Cut off access','Clients → client','Suspend'],
        ['Resend a login link','Clients → client','Reset login (email)'],
        ['Text a client','Clients → client','Message'],
        ['Gather dispute evidence','Clients → client','See §6 + Stripe'],
        ['Edit curriculum','Content → program','Add module / lesson'],
        ['Add a teammate','Team','Invite member + role']
      ]) },
    { id:'trouble', n:'⚑', t:'Troubleshooting', h:
      ul([b('Client can’t see the program')+' → confirm they’re Approved (Active), not Pending.',b('Video won’t play or no transcript')+' → confirm it shows Ready in the Video Library and is attached; transcripts appear a few minutes after upload once captioning finishes.',b('Client didn’t get their login link')+' → Reset login again and verify the email/phone on file.',b('You don’t see the Video Library button')+' → you’re on a non-admin account, or in Preview as client — switch to Admin View.']) }
  ];

  async function isAdmin(){
    try{
      var sb=window.__dsSB;
      if(!sb){ var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0'); sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true}}); window.__dsSB=sb; }
      var u=(await sb.auth.getUser()).data; var uid=u&&u.user&&u.user.id; if(!uid) return false;
      var me=(await sb.from('profiles').select('role').eq('id',uid).single()).data;
      return me&&(me.role==='admin'||me.role==='team');
    }catch(e){ return false; }
  }

  function openGuide(){
    if(document.getElementById('ds-guide')) return;
    var o=document.createElement('div'); o.id='ds-guide';
    o.style.cssText='position:fixed;inset:0;z-index:2147483210;background:rgba(6,12,20,.72);backdrop-filter:blur(3px);display:flex;padding:22px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,Helvetica,Arial,sans-serif';
    var nav=SECTIONS.map(function(s){return '<a href="#" data-go="'+s.id+'" style="display:block;padding:7px 11px;border-radius:8px;color:'+INK+';text-decoration:none;font-size:13px;font-weight:600">'+s.n+'&nbsp;&nbsp;'+s.t+'</a>';}).join('');
    var body=SECTIONS.map(function(s){return '<section id="dsg-'+s.id+'" style="margin-bottom:26px;scroll-margin-top:8px"><h2 style="font-size:18px;color:'+NAVY+';margin:0 0 8px;border-bottom:2px solid '+LINE+';padding-bottom:6px">'+s.n+'. '+s.t+'</h2>'+s.h+'</section>';}).join('');
    o.innerHTML=
      '<div style="max-width:1040px;width:100%;height:100%;margin:auto;background:#fff;border-radius:16px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.5)">'+
        '<div style="display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid '+LINE+'">'+
          '<span style="font-size:18px">\u{1F4D8}</span><b style="font-size:16px;color:'+INK+'">Admin Guide</b>'+
          '<span style="color:'+MUT+';font-size:12px">Dividend Shift operations</span>'+
          '<button id="dsg-close" style="margin-left:auto;background:#fff;border:1px solid '+LINE+';border-radius:10px;padding:8px 13px;font-weight:700;font-size:13px;cursor:pointer">Close</button>'+
        '</div>'+
        '<div style="display:flex;flex:1 1 auto;min-height:0">'+
          '<nav id="dsg-nav" style="flex:0 0 250px;border-right:1px solid '+LINE+';overflow:auto;padding:12px 8px;background:'+BG+'">'+nav+'</nav>'+
          '<div id="dsg-body" style="flex:1 1 auto;overflow:auto;padding:20px 26px;color:'+INK+'">'+body+'</div>'+
        '</div>'+
      '</div>';
    document.body.appendChild(o);
    o.addEventListener('mousedown',function(e){ if(e.target===o) o.remove(); });
    o.querySelector('#dsg-close').onclick=function(){ o.remove(); };
    o.querySelectorAll('[data-go]').forEach(function(a){ a.addEventListener('click',function(e){ e.preventDefault(); var el=document.getElementById('dsg-'+a.getAttribute('data-go')); if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); }); });
  }
  window.__dsGuideOpen=openGuide;

  function addLauncher(){
    if(document.getElementById('ds-guide-btn')) return;
    var b2=document.createElement('button'); b2.id='ds-guide-btn'; b2.type='button'; b2.innerHTML='❓ Admin Guide';
    b2.style.cssText='position:fixed;left:16px;bottom:60px;z-index:2147483100;background:#fff;color:'+NAVY+';border:1px solid '+NAVY+';border-radius:12px;padding:9px 14px;font:800 13px -apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.22)';
    b2.onclick=openGuide;
    document.body.appendChild(b2);
    var mo=new MutationObserver(function(){ if(!document.getElementById('ds-guide-btn')) document.body.appendChild(b2); });
    mo.observe(document.documentElement,{childList:true,subtree:true});
  }

  (async function init(){ try{ if(await isAdmin()) addLauncher(); else window.__dsGuide=false; }catch(e){ window.__dsGuide=false; } })();
})();


/* ------------------------------------------------------------------ *
 * 6) PROVIDER-NAME SANITIZER (all users)
 *    Rewrites client-facing UI text that names an underlying provider
 *    (Bunny Stream, StreamYard) into neutral wording — e.g. "Join on
 *    StreamYard" -> "Join live", "Auto-updated from Bunny Stream" ->
 *    "Updated automatically". Links keep working (only visible text
 *    changes). Skips <script>/<style> and the admin-only Video Library
 *    and Admin Guide modals so internal wording stays intact.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsClean) return; window.__dsClean = true;
  var MAP = [
    [/Auto-updated from Bunny\s?Stream/gi, 'Updated automatically'],
    [/Bunny\s?Stream\s*[·|-]\s*1080p/gi, 'HD · 1080p'],
    [/Use Bunny\s?Stream for video hosting/gi, 'Use built-in video hosting'],
    [/Powered by Bunny\s?Stream/gi, ''],
    [/Bunny\s?Stream/gi, 'HD video'],
    [/BunnyCDN/gi, 'our CDN'],
    [/\bBunny\b/gi, ''],
    [/Join on StreamYard/gi, 'Join live'],
    [/Watch on StreamYard/gi, 'Watch live'],
    [/on StreamYard/gi, 'live'],
    [/StreamYard/gi, 'live stream']
  ];
  var SKIP = { SCRIPT:1, STYLE:1, TEXTAREA:1, NOSCRIPT:1 };
  function inTool(n){ return !!(n && n.closest && n.closest('#ds-guide,#ds-lib,#ds-guide-btn,#ds-lib-btn')); }
  function fixText(node){
    var v = node.nodeValue; if (!v) return;
    var nv;
    if (/https?:\/\/[^\s]*streamyard\.com[^\s]*/i.test(v) && v.trim().length < 90 && /^\s*https?:\/\//.test(v)) {
      nv = 'Open live stream';
    } else {
      nv = v;
      for (var i = 0; i < MAP.length; i++) nv = nv.replace(MAP[i][0], MAP[i][1]);
    }
    if (nv !== v) node.nodeValue = nv;
  }
  function run(root){
    try{
      var w = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (n) {
          var p = n.parentNode; if (!p) return NodeFilter.FILTER_REJECT;
          if (SKIP[p.nodeName]) return NodeFilter.FILTER_REJECT;
          if (inTool(p)) return NodeFilter.FILTER_REJECT;
          return /bunny|streamyard/i.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      var arr = [], n; while (n = w.nextNode()) arr.push(n); arr.forEach(fixText);
    }catch(e){}
  }
  var t;
  var _sLast=0; function schedule(){ clearTimeout(t); var w=Math.max(120, 1000-(Date.now()-_sLast)); t = setTimeout(function(){ _sLast=Date.now(); run(document.body); }, w); }
  function boot(){ run(document.body); var mo = new MutationObserver(schedule); mo.observe(document.documentElement, { childList:true, subtree:true, characterData:true }); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();


/* ------------------------------------------------------------------ *
 * 7) SETTINGS PAGE ENHANCER (signed-in user)
 *    On the account Settings & Notifications page:
 *    - Shows the REAL signed-in user's name + email (read-only),
 *      replacing the "Marcus Bell" sample.
 *    - Notification toggles become save-gated: a "Save changes" button
 *      persists them to profiles.notif_prefs and reloads them on return
 *      (previously the toggles applied instantly and saved nothing).
 *    - Neutralizes email-provider ("Resend") mentions on the page.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsSettings) return; window.__dsSettings = true;
  var GOLD='#B9891F', NAVY='#0E1A2B', LINE='#E7E7EC', MUT='#6B7280', GREEN='#1E7F4F';
  var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var NOTIF_MAP = [
    ['Team replied','team_replied'], ['New module','new_module'], ['Weekly progress','weekly_recap'],
    ['Live training reminders','live_reminders'], ['Inactivity nudges','inactivity'], ['Product announcements','announcements']
  ];
  var sb=null, ME=null;
  async function ensureSb(){ if(sb) return sb; if(window.__dsSB){ sb=window.__dsSB; return sb; } var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0'); sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true}}); window.__dsSB=sb; return sb; }
  async function loadMe(){ await ensureSb(); var u=(await sb.auth.getUser()).data; var uid=u&&u.user&&u.user.id; if(!uid) return null; var p=(await sb.from('profiles').select('id,full_name,first_name,last_name,email,notif_prefs').eq('id',uid).single()).data; if(p && !p.email && u.user.email) p.email=u.user.email; ME=p; return p; }
  function toast(msg){ var t=document.createElement('div'); t.textContent=msg; t.style.cssText='position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2147483600;background:'+GREEN+';color:#fff;padding:11px 18px;border-radius:10px;font:600 14px -apple-system,Segoe UI,Roboto,sans-serif;box-shadow:0 8px 26px rgba(0,0,0,.3)'; document.body.appendChild(t); setTimeout(function(){t.style.opacity='0';t.style.transition='opacity .4s';setTimeout(function(){t.remove();},400);},1800); }
  function labelledInput(labelText){ var lbls=[].slice.call(document.querySelectorAll('*')).filter(function(e){ return !e.children.length && new RegExp('^'+labelText+'$','i').test((e.textContent||'').trim()); }); for(var i=0;i<lbls.length;i++){ var nx=lbls[i].nextElementSibling; if(nx && nx.tagName==='INPUT' && !/search/i.test(nx.placeholder||'')) return nx; var qi=nx && nx.querySelector && nx.querySelector('input'); if(qi && !/search/i.test(qi.placeholder||'')) return qi; } return null; }
  function realName(){ return (ME && (ME.full_name || ((ME.first_name||'')+' '+(ME.last_name||'')).trim())) || ''; }
  function enhanceProfile(){
    var nameInp=labelledInput('Full name'), emailInp=labelledInput('Email address'), real=realName();
    if(nameInp && real){ if(nameInp.value!==real) nameInp.value=real; nameInp.readOnly=true; nameInp.style.opacity='0.85'; }
    if(emailInp && ME && ME.email){ if(emailInp.value!==ME.email) emailInp.value=ME.email; emailInp.readOnly=true; emailInp.style.opacity='0.85'; }
    var initials=(real||'').split(/\s+/).map(function(w){return w[0]||'';}).join('').slice(0,2).toUpperCase();
    [].slice.call(document.querySelectorAll('*')).forEach(function(e){ if(!e.children.length){ var t=(e.textContent||'').trim(); if(t==='Marcus Bell'&&real) e.textContent=real; if(t==='marcus.bell@gmail.com'&&ME&&ME.email) e.textContent=ME.email; if(t==='MB'&&initials&&e.parentElement) e.textContent=initials; } });
  }
  var _nc=null; function notifCard(){ if(_nc && _nc.isConnected) return _nc.offsetParent ? _nc : null; var h=[].slice.call(document.querySelectorAll('*')).find(function(e){ return !e.children.length && /^Email notifications$/i.test((e.textContent||'').trim()); }); if(!h) return null; var c=h; for(var i=0;i<6 && c;i++){ if(c.querySelectorAll('.toggle').length>=3){ _nc=c; return c.offsetParent ? c : null; } c=c.parentElement; } return null; }
  function tOn(t){ return /(^|\s)on(\s|$)/.test(t.className); }
  function rowKey(t){ var row=t.closest('div'); for(var i=0;i<5 && row;i++){ var txt=row.textContent||''; var hit=NOTIF_MAP.find(function(m){return new RegExp(m[0],'i').test(txt);}); if(hit) return hit[1]; row=row.parentElement; } return null; }
  var savedNotif={};
  function curNotif(card){ var o={}; card.querySelectorAll('.toggle').forEach(function(t){ var k=rowKey(t); if(k) o[k]=tOn(t); }); return o; }
  function dirty(card){ var c=curNotif(card); return Object.keys(c).some(function(k){ return c[k]!==savedNotif[k]; }); }
  function refreshBar(card){ var btn=document.getElementById('ds-notif-btn'), hint=document.getElementById('ds-notif-hint'); if(!btn) return; var d=dirty(card); btn.style.opacity=d?'1':'.5'; btn.style.pointerEvents=d?'auto':'none'; if(hint) hint.textContent=d?'Unsaved changes':''; }
  function enhanceNotifs(){
    var card=notifCard(); if(!card) return;
    var prefs=(ME && ME.notif_prefs && ME.notif_prefs.notifications)||null;
    if(prefs && !card.__dsLoaded){ card.querySelectorAll('.toggle').forEach(function(t){ var k=rowKey(t); if(k && typeof prefs[k]==='boolean') t.classList.toggle('on', prefs[k]); }); }
    card.__dsLoaded=true; savedNotif=curNotif(card);
    if(!document.getElementById('ds-notif-save')){
      var bar=document.createElement('div'); bar.id='ds-notif-save'; bar.style.cssText='display:flex;align-items:center;gap:10px;justify-content:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid '+LINE;
      bar.innerHTML='<span id="ds-notif-hint" style="color:'+MUT+';font-size:12px;margin-right:auto"></span><button id="ds-notif-btn" type="button" style="background:'+GOLD+';color:#111;border:0;border-radius:10px;padding:9px 16px;font-weight:800;font-size:13px;cursor:pointer;opacity:.5;pointer-events:none">Save changes</button>';
      card.appendChild(bar);
      document.getElementById('ds-notif-btn').onclick=async function(){ var cur=curNotif(card); var merged=Object.assign({},(ME.notif_prefs||{}),{notifications:cur}); var r=await sb.from('profiles').update({notif_prefs:merged}).eq('id',ME.id).select('id'); if(r.error){toast('Save failed');return;} ME.notif_prefs=merged; savedNotif=cur; refreshBar(card); toast('Notification settings saved'); };
    }
    if(!card.__dsBound){ card.__dsBound=true; card.addEventListener('click',function(){ setTimeout(function(){refreshBar(card);},30); }); }
    refreshBar(card);
  }
  function cleanResend(){ var w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode:function(n){ var p=n.parentNode; if(!p||p.nodeName==='SCRIPT'||p.nodeName==='STYLE') return NodeFilter.FILTER_REJECT; return /resend/i.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT; }}); var arr=[],n; while(n=w.nextNode()) arr.push(n); arr.forEach(function(node){ var v=node.nodeValue, nv=v.replace(/delivered by\s+Resend/gi,'delivered by email').replace(/\(via Resend\)/gi,'').replace(/\bResend\b\s+powers every system email/gi,'Our email service powers every system email').replace(/^\s*Resend\s*$/,'Email'); if(nv!==v) node.nodeValue=nv; }); }
  function run(){ if(!ME) return; if(!notifCard()) return; try{ enhanceProfile(); }catch(e){} try{ enhanceNotifs(); }catch(e){} try{ cleanResend(); }catch(e){} }
  (async function init(){ await loadMe(); var mo=new MutationObserver(function(){ try{run();}catch(e){} }); mo.observe(document.documentElement,{childList:true,subtree:true}); run(); })();
})();


/* ------------------------------------------------------------------ *
 * 8) REGISTRATION LINK + DASHBOARD GREETING
 *    - portal.dividendshift.com/?register opens the self-registration
 *      form directly (same panel as the app's "Create an account").
 *      New sign-ups land as pending for admin approval.
 *    - Personalizes the dashboard greeting to the signed-in client's
 *      real first name instead of the sample "Marcus".
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsReg) return; window.__dsReg = true;
  var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  function wantsRegister(){ try{ var qs=new URLSearchParams(location.search); if(qs.has('register')||qs.get('signup')==='1') return true; }catch(e){} return /[?#&]register\b/.test(location.href); }
  function openSignup(n){ n=n||0; if(typeof window.showPanel==='function' && document.getElementById('apSignup')){ try{ window.showPanel('apSignup'); }catch(e){} return; } if(n<80) setTimeout(function(){ openSignup(n+1); }, 250); }
  var first=null;
  async function loadFirst(){
    try{
      var sb=window.__dsSB;
      if(!sb){ var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0'); sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true}}); window.__dsSB=sb; }
      var u=(await sb.auth.getUser()).data; var uid=u&&u.user&&u.user.id; if(!uid) return;
      var p=(await sb.from('profiles').select('first_name,full_name').eq('id',uid).single()).data;
      first=(p && (p.first_name || (p.full_name||'').trim().split(/\s+/)[0])) || null;
    }catch(e){}
  }
  var _ge=null;
  function fixGreeting(){
    if(!first) return;
    if(_ge && _ge.isConnected){ var t0=(_ge.textContent||''); if(/welcome back,\s*\S+/i.test(t0) && !new RegExp('welcome back,\\s*'+first,'i').test(t0)) _ge.textContent = t0.replace(/(welcome back,\s*)([^\n!.,]+)/i, '$1'+first); return; }
    [].slice.call(document.querySelectorAll('*')).forEach(function(e){
      if(e.children.length) return;
      var t=(e.textContent||'');
      if(/welcome back,\s*\S+/i.test(t)){ _ge=e; if(!new RegExp('welcome back,\\s*'+first,'i').test(t)) e.textContent = t.replace(/(welcome back,\s*)([^\n!.,]+)/i, '$1'+first); }
    });
  }
  var deb, _gLast=0; function schedule(){ clearTimeout(deb); var w=Math.max(120, 1000-(Date.now()-_gLast)); deb=setTimeout(function(){ _gLast=Date.now(); fixGreeting(); }, w); }
  function boot(){
    if(wantsRegister()) setTimeout(function(){ openSignup(0); }, 400);
    loadFirst().then(function(){ fixGreeting(); var mo=new MutationObserver(schedule); mo.observe(document.documentElement,{childList:true,subtree:true,characterData:true}); });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();


/* ------------------------------------------------------------------ *
 * 9) REGISTRATION FORM HARDENING (the /?register signup form)
 *    - Password must be at least 8 characters; Continue is blocked
 *      until it is (with live feedback).
 *    - Adds a "Confirm password" field that must match.
 *    - Adds a Show/Hide toggle on each password field.
 *    - Makes the SMS-consent checkbox required (needed for sign-in
 *      codes) and blocks Continue until it is checked.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsRegForm) return; window.__dsRegForm = true;
  var RED='#B4232A', GREEN='#1E7F4F', NAVY='#0E1A2B', MUT='#6B7280', MINLEN=8;
  function q(id){ return document.getElementById(id); }
  function panel(){ return q('apSignup'); }
  function contBtn(sp){ return [].slice.call(sp.querySelectorAll('button')).find(function(b){ return /continue/i.test(b.textContent||''); }); }
  function addEye(input){
    if(!input || input.__dsEye) return; input.__dsEye=true;
    var wrap=document.createElement('div'); wrap.style.cssText='position:relative;display:block;width:100%';
    input.parentElement.insertBefore(wrap, input); wrap.appendChild(input);
    input.style.paddingRight='62px';
    var b=document.createElement('button'); b.type='button'; b.textContent='Show';
    b.style.cssText='position:absolute;top:50%;right:10px;transform:translateY(-50%);background:transparent;border:0;color:'+NAVY+';font:700 12px -apple-system,Segoe UI,Roboto,sans-serif;cursor:pointer;padding:4px 6px;z-index:2';
    b.addEventListener('click', function(){ var showing=input.getAttribute('type')==='password'; input.setAttribute('type', showing?'text':'password'); b.textContent=showing?'Hide':'Show'; });
    wrap.appendChild(b);
  }
  function ensureConfirm(pass){
    if(q('dsPass2')) return q('dsPass2');
    var c=document.createElement('input'); c.id='dsPass2'; c.setAttribute('type','password'); c.placeholder='Re-enter password'; c.autocomplete='new-password';
    c.className=pass.className; c.style.marginTop='8px';
    var host=pass.__dsEye ? pass.parentElement : pass;
    (host.parentElement||pass.parentElement).insertBefore(c, host.nextSibling);
    return c;
  }
  function hintEl(afterNode){
    var h=q('ds-pw-hint');
    if(!h){ h=document.createElement('div'); h.id='ds-pw-hint'; h.style.cssText='font-size:12px;margin-top:6px;line-height:1.4'; (afterNode.parentElement||afterNode).appendChild(h); }
    return h;
  }
  var WEAK=['password','passw0rd','12345678','123456789','1234567890','qwertyui','qwerty123','letmein1','iloveyou','admin123','welcome1','abc12345','football','baseball','sunshine','dividend','dividendshift'];
  function pwWeak(pv){
    var low=pv.toLowerCase();
    for(var i=0;i<WEAK.length;i++){ if(low===WEAK[i]) return 'That password is too common — pick something less guessable.'; }
    if(/^(.)\1+$/.test(pv)) return 'Password can\u2019t be one repeated character.';
    if(/^(?:0123456789|1234567890|12345678|abcdefgh|qwertyui)/i.test(pv)) return 'Password can\u2019t be a simple sequence.';
    var classes=0;
    if(/[a-z]/.test(pv)) classes++;
    if(/[A-Z]/.test(pv)) classes++;
    if(/[0-9]/.test(pv)) classes++;
    if(/[^A-Za-z0-9]/.test(pv)) classes++;
    if(classes<3) return 'Too weak \u2014 use at least 3 of: lowercase, uppercase, number, symbol.';
    return null;
  }
  function evalPw(){
    var p=q('suPass'), c=q('dsPass2'); if(!p||!c) return {ok:false};
    var pv=p.value||'', cv=c.value||'';
    var okLen=pv.length>=MINLEN;
    var weak = okLen ? pwWeak(pv) : null;
    var okStrong = okLen && !weak;
    var okMatch = okStrong && cv.length>0 && pv===cv;
    var h=q('ds-pw-hint');
    if(h){
      if(!okLen){ h.style.color=RED; h.textContent='Password must be at least '+MINLEN+' characters.'; }
      else if(weak){ h.style.color=RED; h.textContent=weak; }
      else if(!okMatch){ h.style.color=cv.length?RED:MUT; h.textContent= cv.length? 'Passwords do not match.' : 'Strong password \u2713 \u2014 re-enter it to confirm.'; }
      else { h.style.color=GREEN; h.textContent='Strong password, and they match \u2713'; }
    }
    return {ok: okStrong && okMatch, okLen:okLen, okStrong:okStrong, okMatch:okMatch};
  }
  function ensure(){
    var sp=panel(); if(!sp) return;
    var pass=q('suPass'), sms=q('suSms'), btn=contBtn(sp); if(!pass||!btn) return;
    addEye(pass);
    var conf=ensureConfirm(pass); addEye(conf);
    hintEl(conf.__dsEye?conf.parentElement:conf);
    if(sms && !sms.__dsMark){ sms.__dsMark=true; var lab=sms.closest('label'); if(lab && !/\*/.test(lab.textContent)){ var s=document.createElement('span'); s.textContent=' *'; s.style.color=RED; lab.appendChild(s); } }
    if(!pass.__dsIn){ pass.__dsIn=true; pass.addEventListener('input', evalPw); }
    if(!conf.__dsIn){ conf.__dsIn=true; conf.addEventListener('input', evalPw); }
    evalPw();
    if(!btn.__dsBound){ btn.__dsBound=true;
      btn.addEventListener('click', function(e){
        var st=evalPw(); var smsOk = !q('suSms') || q('suSms').checked;
        if(!st.ok || !smsOk){
          e.preventDefault(); e.stopImmediatePropagation();
          if(!st.ok){ try{ (st.okStrong?q('dsPass2'):q('suPass')).focus(); }catch(_e){} }
          else if(!smsOk){ var m=q('ds-sms-req'); if(!m){ m=document.createElement('div'); m.id='ds-sms-req'; m.style.cssText='color:'+RED+';font-size:12px;margin-top:6px'; var host=q('suSms').closest('label')||q('suSms').parentElement; (host.parentElement||host).appendChild(m);} m.textContent='Please agree to receive text messages (including your sign-in codes) to continue.'; }
        }
      }, true);
    }
    if(sms && !sms.__dsCh){ sms.__dsCh=true; sms.addEventListener('change', function(){ var m=q('ds-sms-req'); if(m&&sms.checked) m.textContent=''; }); }
  }
  var mo=new MutationObserver(function(){ ensure(); }); mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ensure); else ensure();
})();


/* ------------------------------------------------------------------ *
 * 10) /register CLEAN ROUTE + bottom "Create an account" link
 *     - Visiting portal.dividendshift.com/register opens the signup
 *       form (needs the /register rewrite in vercel.json).
 *     - The login screen's "Create an account" link now routes to
 *       /register instead of just swapping panels, so the URL reflects
 *       it and the hardened register form (feature 9) applies.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsRegRoute) return; window.__dsRegRoute = true;
  function onRegPath(){ return /^\/register\/?$/i.test(location.pathname); }
  function openSignup(n){ n=n||0; if(typeof window.showPanel==='function' && document.getElementById('apSignup')){ try{ window.showPanel('apSignup'); }catch(e){} return; } if(n<80) setTimeout(function(){ openSignup(n+1); }, 250); }
  function goRegister(){ try{ if(location.pathname!=='/register') history.pushState({}, '', '/register'); }catch(_e){} openSignup(0); }
  function rewriteLinks(){
    [].slice.call(document.querySelectorAll('a,button,[onclick]')).forEach(function(el){
      if(el.__dsRegLink) return;
      var t=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(t.length<40 && (/create an account/i.test(t) || /^register$/i.test(t))){
        el.__dsRegLink=true;
        el.addEventListener('click', function(e){ e.preventDefault(); e.stopImmediatePropagation(); goRegister(); }, true);
        if(el.tagName==='A'){ el.setAttribute('href','/register'); }
      }
    });
  }
  function boot(){
    if(onRegPath()) setTimeout(function(){ openSignup(0); }, 400);
    rewriteLinks();
    var _rLast=0,_rT=null; function _rSched(){ if(_rT) return; var w=Math.max(120, 1000-(Date.now()-_rLast)); _rT=setTimeout(function(){ _rT=null; _rLast=Date.now(); rewriteLinks(); }, w); } var mo=new MutationObserver(_rSched); mo.observe(document.documentElement,{childList:true,subtree:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();



/* ------------------------------------------------------------------ *
 * 11) COMPOSITOR PERF: drop backdrop-filter on the pinned bars.
 *     .top (sticky) and .botnav (fixed) used backdrop-filter: blur(10px),
 *     forcing the GPU to re-blur the strip behind them on every scroll
 *     and repaint. That is compositor-bound lag (no long tasks), worst
 *     in Safari. .botnav was already 97% opaque and .top 85% over a white
 *     body, so a solid background is visually near-identical.
 *     #askOverlay keeps its blur (only painted while the overlay is open).
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsPerfCss) return; window.__dsPerfCss = true;
  var css = '.top{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:#fff!important;}'
          + '.botnav{-webkit-backdrop-filter:none!important;backdrop-filter:none!important;background:#fff!important;}';
  function add(){
    if (document.getElementById('ds-perf-css')) return;
    var s = document.createElement('style'); s.id = 'ds-perf-css'; s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }
  if (document.head) add(); else document.addEventListener('DOMContentLoaded', add);
})();


/* ------------------------------------------------------------------ *
 * 12) TEAM SCREEN: real data instead of the mockup array.
 *
 *     index.html ships a hardcoded `teamMembers` array (Gedam, Nik,
 *     Miles, Zack, Elona). renderTeam() iterated it; the screen never
 *     touched the database. removeTeamMember(i) spliced that in-memory
 *     array and suspended the matching profile, so rows "came back" on
 *     reload and the wrong thing happened in the DB.
 *
 *     Here we keep the static access-ladder UI, rehydrate the Members
 *     table from public.profiles (role in 'admin','team'), make Remove
 *     demote to role='client' (profiles has no DELETE policy, and
 *     revoking staff access should not nuke a login), make the role
 *     <select> write role + access_tier, and wire Invite to the real
 *     invite-client edge function.
 *
 *     Tiers are labels. RLS enforces admin-vs-not; it does not yet
 *     distinguish Manager from CES.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsTeam) return; window.__dsTeam = true;

  var URL_ = 'https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var TIERS = ['Owner', 'Admin', 'Manager', 'CES'];
  var sb = null, ME = null, LAST = null;

  async function ensureSb() {
    if (sb) return sb;
    if (window.__dsSB) { sb = window.__dsSB; return sb; }
    var m = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    sb = m.createClient(URL_, ANON, { auth: { storageKey: 'sb-dehttbxrkeqhsfkfpfwt-auth-token', persistSession: true, autoRefreshToken: true } });
    window.__dsSB = sb; return sb;
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function toast(m) { try { if (typeof window.toast === 'function') window.toast(m); } catch (e) {} }
  function initials(n, e) {
    n = (n || '').trim();
    if (n) { var p = n.split(/\s+/); return (((p[0] || '')[0] || '') + ((p[1] || '')[0] || '')).toUpperCase(); }
    return ((e || '?')[0] || '?').toUpperCase();
  }
  function tierOf(p) { return p.access_tier || (p.role === 'admin' ? 'Admin' : 'Manager'); }
  function roleForTier(t) { return (t === 'Owner' || t === 'Admin') ? 'admin' : 'team'; }

  async function fetchTeam() {
    var s = await ensureSb();
    try { var u = await s.auth.getUser(); ME = (u && u.data && u.data.user) ? u.data.user.id : null; } catch (e) { ME = null; }
    // Signed out (or session not restored yet): RLS returns 0 rows with no error.
    // Painting that would show an empty team and, worse, cache it.
    if (!ME) return null;
    var r = await s.from('profiles')
      .select('id,full_name,email,role,status,access_tier')
      .in('role', ['admin', 'team'])
      .order('created_at', { ascending: true });
    if (r.error) throw r.error;
    return r.data || [];
  }

  function rowHtml(p) {
    var t = tierOf(p);
    var isMe = (p.id === ME);
    var isOwner = (t === 'Owner');
    var locked = isMe || isOwner;
    var opts = TIERS.map(function (x) { return '<option value="' + x + '"' + (x === t ? ' selected' : '') + '>' + x + '</option>'; }).join('');
    var last = locked
      ? '<span class="small mut">—</span>'
      : '<a class="small" href="#" data-rm="' + esc(p.id) + '" style="color:#c0392b">Remove</a>';
    return '<tr data-uid="' + esc(p.id) + '">'
      + '<td><div style="display:flex;align-items:center;gap:10px">'
      + '<div class="avatar">' + esc(initials(p.full_name, p.email)) + '</div>'
      + '<div><b>' + esc(p.full_name || '—') + '</b>'
      + '<div class="small mut">' + esc(p.email || '') + '</div></div>'
      + '</div></td>'
      + '<td><select class="field" data-tier="' + esc(p.id) + '"' + (isOwner ? ' disabled' : '') + '>' + opts + '</select></td>'
      + '<td>' + last + '</td>'
      + '</tr>';
  }

  function setCount(tb, n) {
    var card = tb.closest ? tb.closest('.card') : null;
    if (!card) return;
    var table = tb.closest('table');
    var nodes = [].slice.call(card.querySelectorAll('*'));
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.children.length) continue;
      if (table && table.contains(el)) continue;
      if (/^\d+$/.test((el.textContent || '').trim())) { el.textContent = String(n); return; }
    }
  }

  async function hydrate() {
    var inner = document.getElementById('teamInner'); if (!inner) return;
    var tb = inner.querySelector('table tbody'); if (!tb) return;
    var rows;
    try { rows = await fetchTeam(); }
    catch (e) {
      tb.innerHTML = '<tr><td colspan="3" class="small mut">Couldn’t load the team list.</td></tr>';
      return;
    }
    if (rows === null) {
      if (!LAST) tb.innerHTML = '<tr><td colspan="3" class="small mut">Loading\u2026</td></tr>';
      return;
    }
    LAST = rows;
    paint(tb, rows);
  }

  function paint(tb, rows) {
    tb.innerHTML = rows.length
      ? rows.map(rowHtml).join('')
      : '<tr><td colspan="3" class="small mut">No team members yet.</td></tr>';
    setCount(tb, rows.length);
    wire(tb);
  }

  function wire(tb) {
    if (tb.__dsWired) return; tb.__dsWired = true;

    tb.addEventListener('change', async function (e) {
      var sel = e.target && e.target.closest ? e.target.closest('select[data-tier]') : null;
      if (!sel) return;
      var id = sel.getAttribute('data-tier'), tier = sel.value;
      var s = await ensureSb();
      var r = await s.from('profiles')
        .update({ role: roleForTier(tier), access_tier: tier })
        .eq('id', id).select('id');
      if (r.error || !r.data || !r.data.length) { toast('Couldn’t change that role'); hydrate(); return; }
      toast('Role updated');
    });

    tb.addEventListener('click', async function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[data-rm]') : null;
      if (!a) return;
      e.preventDefault();
      var tr = a.closest('tr');
      var nameEl = tr ? tr.querySelector('b') : null;
      var name = nameEl ? nameEl.textContent : 'this member';
      if (!window.confirm('Remove ' + name + ' from the team?\n\nThey keep their login but lose all staff access and become a regular client. Their account is not deleted.')) return;
      var s = await ensureSb();
      var r = await s.from('profiles')
        .update({ role: 'client', access_tier: null })
        .eq('id', a.getAttribute('data-rm')).select('id');
      if (r.error || !r.data || !r.data.length) { toast('Couldn’t remove — admin access required'); return; }
      toast('Staff access removed');
      hydrate();
    });
  }

  async function inviteMemberReal() {
    var emailEl = document.getElementById('inviteEmail');
    var roleEl = document.getElementById('inviteRole');
    var email = ((emailEl && emailEl.value) || '').trim().toLowerCase();
    var tier = (roleEl && roleEl.value) || 'Manager';
    if (!email || email.indexOf('@') < 0) { toast('Enter an email'); if (emailEl) emailEl.focus(); return; }

    var s = await ensureSb();
    var sess = await s.auth.getSession();
    var tok = (sess && sess.data && sess.data.session) ? sess.data.session.access_token : null;
    if (!tok) { toast('Sign in again'); return; }

    var res, body;
    try {
      res = await fetch(URL_ + '/functions/v1/invite-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + tok },
        body: JSON.stringify({ email: email, full_name: '', send_email: true, send_sms: false })
      });
      body = await res.json();
    } catch (e) { toast('Invite failed'); return; }
    if (!res.ok || !body || !body.ok) { toast('Invite failed'); return; }

    var up = await s.from('profiles')
      .update({ role: roleForTier(tier), access_tier: tier, status: 'active' })
      .eq('id', body.userId).select('id');
    if (up.error || !up.data || !up.data.length) toast('Invited, but couldn’t set the role — set it in the table');
    else toast('Invitation sent to ' + email);
    if (emailEl) emailEl.value = '';
    hydrate();
  }

  function install() {
    var orig = window.renderTeam;
    if (typeof orig !== 'function') return false;

    // orig paints the hardcoded mockup array. Overwrite it synchronously,
    // before the browser gets a chance to paint, or the ghosts flash on screen
    // every time setCurrentRole() re-renders this screen.
    window.renderTeam = function () {
      var out;
      try { out = orig.apply(this, arguments); } catch (e) {}
      try {
        var inner = document.getElementById('teamInner');
        var tb = inner && inner.querySelector('table tbody');
        if (tb) {
          if (LAST) paint(tb, LAST);
          else tb.innerHTML = '<tr><td colspan="3" class="small mut">Loading\u2026</td></tr>';
        }
      } catch (e) {}
      setTimeout(hydrate, 0);
      return out;
    };

    window.removeTeamMember = function () { toast('Use the Remove link in the members table.'); };
    window.inviteMember = function () { inviteMemberReal(); };

    var inner = document.getElementById('teamInner');
    if (inner && inner.querySelector('table tbody')) setTimeout(hydrate, 0);

    // Sign-in can land after the first hydrate. Drop the cache and refetch.
    ensureSb().then(function (s) {
      try {
        s.auth.onAuthStateChange(function () { LAST = null; ME = null; hydrate(); });
      } catch (e) {}
    });
    return true;
  }

  var tries = 0;
  (function wait() {
    if (install()) return;
    if (++tries > 80) return;
    setTimeout(wait, 250);
  })();
})();


/* ------------------------------------------------------------------ *
 * 13) OWNER-ONLY CLIENT DELETION + "Deleted Clients" archive.
 *
 *     Deleting a client is permanent. There is deliberately no undelete
 *     anywhere in this file.
 *
 *     Deleting the auth user cascades through profiles and destroys
 *     tickets, sessions, client_events, milestones and quiz_attempts.
 *     The delete-client edge function archives all of it into
 *     public.deleted_clients first, so dispute evidence survives.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsDel) return; window.__dsDel = true;

  var URL_ = 'https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var sb = null, IS_OWNER = null;

  async function ensureSb() {
    if (sb) return sb;
    if (window.__dsSB) { sb = window.__dsSB; return sb; }
    var m = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    sb = m.createClient(URL_, ANON, { auth: { storageKey: 'sb-dehttbxrkeqhsfkfpfwt-auth-token', persistSession: true, autoRefreshToken: true } });
    window.__dsSB = sb; return sb;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function toast(m) { try { if (typeof window.toast === 'function') window.toast(m); } catch (e) {} }
  function fmt(d) { if (!d) return '—'; try { return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return '—'; } }

  async function isOwner() {
    if (IS_OWNER !== null) return IS_OWNER;
    var s = await ensureSb();
    var u = await s.auth.getUser();
    var id = u && u.data && u.data.user ? u.data.user.id : null;
    if (!id) { IS_OWNER = false; return false; }
    var r = await s.from('profiles').select('role,access_tier').eq('id', id).single();
    IS_OWNER = !!(r.data && r.data.role === 'admin' && r.data.access_tier === 'Owner');
    return IS_OWNER;
  }

  function closeModal() { var m = document.getElementById('ds-del-modal'); if (m) m.remove(); }

  function openModal(client) {
    closeModal();
    var w = document.createElement('div');
    w.id = 'ds-del-modal';
    w.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(14,26,43,.55);display:flex;align-items:center;justify-content:center;padding:18px;';
    w.innerHTML =
      '<div style="background:#fff;border-radius:14px;max-width:460px;width:100%;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.3)">'
      + '<div style="font-size:18px;font-weight:700;color:#0E1A2B;margin-bottom:6px">Delete this client permanently?</div>'
      + '<div style="font-size:14px;color:#48566b;line-height:1.5;margin-bottom:14px">'
      + '<b>' + esc(client.name || '—') + '</b><br><span style="color:#8A8A93">' + esc(client.email || '') + '</span>'
      + '</div>'
      + '<div style="background:#fff5f5;border:1px solid #f3c9c9;border-radius:10px;padding:12px;font-size:13px;color:#8a2b2b;line-height:1.55;margin-bottom:14px">'
      + 'This erases their login and all live records — tickets, sessions, activity, milestones and quiz attempts.<br><br>'
      + 'A read-only summary is kept in <b>Deleted Clients</b>. <b>This cannot be undone.</b>'
      + '</div>'
      + '<label style="display:block;font-size:13px;color:#48566b;margin-bottom:6px">Reason (optional)</label>'
      + '<input id="ds-del-reason" class="field" style="width:100%;margin-bottom:12px" placeholder="e.g. refunded and offboarded">'
      + '<label style="display:block;font-size:13px;color:#48566b;margin-bottom:6px">Type <b>DELETE</b> to confirm</label>'
      + '<input id="ds-del-confirm" class="field" style="width:100%;margin-bottom:16px" autocomplete="off" spellcheck="false" placeholder="DELETE">'
      + '<div style="display:flex;gap:10px;justify-content:flex-end">'
      + '<button id="ds-del-cancel" class="btn" style="background:#eef1f6;color:#0E1A2B">Cancel</button>'
      + '<button id="ds-del-go" class="btn" disabled style="background:#c0392b;color:#fff;opacity:.45;cursor:not-allowed">Delete permanently</button>'
      + '</div></div>';
    document.body.appendChild(w);

    var inp = w.querySelector('#ds-del-confirm');
    var go = w.querySelector('#ds-del-go');
    inp.focus();
    inp.addEventListener('input', function () {
      var ok = inp.value === 'DELETE';
      go.disabled = !ok;
      go.style.opacity = ok ? '1' : '.45';
      go.style.cursor = ok ? 'pointer' : 'not-allowed';
    });
    w.querySelector('#ds-del-cancel').addEventListener('click', closeModal);
    w.addEventListener('click', function (e) { if (e.target === w) closeModal(); });
    document.addEventListener('keydown', function onEsc(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEsc); }
    });

    go.addEventListener('click', async function () {
      if (inp.value !== 'DELETE') return;
      go.disabled = true; go.textContent = 'Deleting…';
      var reason = (w.querySelector('#ds-del-reason').value || '').trim();
      var res = await doDelete(client.id, reason);
      if (!res.ok) { toast(res.error || 'Delete failed'); go.disabled = false; go.textContent = 'Delete permanently'; return; }
      closeModal();
      toast('Client deleted');
      try { if (typeof window.loadClients === 'function') await window.loadClients(); } catch (e) {}
      renderDeleted(true);
    });
  }

  async function doDelete(userId, reason) {
    var s = await ensureSb();
    var sess = await s.auth.getSession();
    var tok = sess && sess.data && sess.data.session ? sess.data.session.access_token : null;
    if (!tok) return { ok: false, error: 'Sign in again' };
    try {
      var r = await fetch(URL_ + '/functions/v1/delete-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + tok },
        body: JSON.stringify({ user_id: userId, confirm: 'DELETE', reason: reason })
      });
      var b = await r.json();
      if (!r.ok || !b.ok) return { ok: false, error: b.error || ('HTTP ' + r.status) };
      return { ok: true, body: b };
    } catch (e) { return { ok: false, error: String(e) }; }
  }

  async function decorateRows() {
    if (!(await isOwner())) return;
    var inner = document.getElementById('clientsInner'); if (!inner) return;
    var table = inner.querySelector('table'); if (!table) return;

    var head = table.querySelector('tr');
    if (head && !head.querySelector('[data-ds-delhead]')) {
      var th = document.createElement(head.children[0] ? head.children[0].tagName : 'TH');
      th.setAttribute('data-ds-delhead', '1');
      th.textContent = '';
      head.appendChild(th);
    }

    var trs = [].slice.call(table.querySelectorAll('tr[onclick^="openClient("]'));
    trs.forEach(function (tr) {
      if (tr.querySelector('[data-ds-del]')) return;
      var m = (tr.getAttribute('onclick') || '').match(/openClient\('([^']+)'\)/);
      if (!m) return;
      var id = m[1];
      var nameEl = tr.children[0];
      var txt = nameEl ? nameEl.innerText.split('\n').filter(Boolean) : [];
      var td = document.createElement('td');
      td.innerHTML = '<a href="#" data-ds-del="' + esc(id) + '" style="color:#c0392b;font-size:12.5px;font-weight:600">Delete</a>';
      td.addEventListener('click', function (e) { e.stopPropagation(); });
      tr.appendChild(td);
      td.querySelector('a').addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        openModal({ id: id, name: (txt[0] || '').trim(), email: (txt[1] || '').trim() });
      });
    });
  }

  function downloadJson(name, obj) {
    var blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { window.URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function chips(summary) {
    var keys = Object.keys(summary || {}).filter(function (k) { return summary[k] > 0; });
    if (!keys.length) return '<span class="small mut">no activity records</span>';
    return keys.map(function (k) {
      return '<span class="pill mut" style="margin-right:6px;font-size:11.5px">' + esc(k.replace(/_/g, ' ')) + ': ' + summary[k] + '</span>';
    }).join('');
  }

  async function renderDeleted(force) {
    if (!(await isOwner())) return;
    var inner = document.getElementById('clientsInner'); if (!inner) return;

    var card = document.getElementById('ds-deleted-card');
    if (!card) {
      card = document.createElement('div');
      card.id = 'ds-deleted-card';
      card.className = 'card pad';
      card.style.marginTop = '18px';
      inner.appendChild(card);
    } else if (!force && card.getAttribute('data-loaded') === '1') {
      return;
    }

    var head = '<div class="h-eyebrow">Owner only</div>'
      + '<div style="font-size:16px;font-weight:700;color:#0E1A2B;margin:2px 0 4px">Deleted Clients</div>'
      + '<div class="small mut" style="margin-bottom:12px">Permanently removed accounts. Kept for records and dispute response. These cannot be restored.</div>';

    card.innerHTML = head + '<div class="small mut">Loading…</div>';

    var s = await ensureSb();
    var r = await s.from('deleted_clients')
      .select('id,original_user_id,email,full_name,program,stage,status,signed_up_at,last_sign_in_at,deleted_at,deleted_by_email,reason,summary')
      .order('deleted_at', { ascending: false });

    if (r.error) { card.innerHTML = head + '<div class="small mut">Couldn’t load deleted clients.</div>'; return; }
    var rows = r.data || [];
    if (!rows.length) { card.innerHTML = head + '<div class="small mut">No clients have been deleted.</div>'; card.setAttribute('data-loaded', '1'); return; }

    card.innerHTML = head + rows.map(function (d) {
      return '<div class="dc-row" style="border-top:1px solid #E7E7EC">'
        + '<div class="dc-head" data-dc="' + esc(d.id) + '" style="display:flex;align-items:baseline;gap:8px;padding:11px 0;cursor:pointer">'
          + '<span class="dc-caret" style="color:#8A8A93;font-size:12px">▸</span>'
          + '<b>' + esc(d.full_name || '—') + '</b>'
          + '<span class="small mut">' + esc(d.email || '') + '</span>'
          + '<span class="small mut" style="margin-left:auto">deleted ' + fmt(d.deleted_at) + '</span>'
        + '</div>'
        + '<div class="dc-detail" style="display:none;padding:0 0 14px 20px">'
          + '<div class="small mut" style="margin:0 0 8px">'
          + (d.program ? 'Program: ' + esc(d.program) + ' · ' : '')
          + 'Joined ' + fmt(d.signed_up_at) + ' · Last login ' + fmt(d.last_sign_in_at)
          + ' · Deleted by ' + esc(d.deleted_by_email || '—')
          + (d.reason ? ' · Reason: ' + esc(d.reason) : '')
          + '</div>'
          + '<div style="margin-bottom:8px">' + chips(d.summary) + '</div>'
          + '<a href="#" data-ds-export="' + esc(d.id) + '" class="small" style="font-weight:600">Export full record (JSON)</a>'
        + '</div>'
      + '</div>';
    }).join('');
    card.setAttribute('data-loaded', '1');

    if (!card.__dsWired) {
      card.__dsWired = true;
      card.addEventListener('click', async function (e) {
        var head = e.target && e.target.closest ? e.target.closest('.dc-head') : null;
        if (head) {
          var det = head.nextElementSibling;
          var car = head.querySelector('.dc-caret');
          var open = det && det.style.display !== 'none';
          if (det) det.style.display = open ? 'none' : 'block';
          if (car) car.textContent = open ? '▸' : '▾';
          return;
        }
        var a = e.target && e.target.closest ? e.target.closest('a[data-ds-export]') : null;
        if (!a) return;
        e.preventDefault();
        var id = a.getAttribute('data-ds-export');
        var s2 = await ensureSb();
        var one = await s2.from('deleted_clients').select('*').eq('id', id).single();
        if (one.error || !one.data) { toast('Couldn’t export'); return; }
        downloadJson('deleted-client-' + (one.data.email || id) + '.json', one.data);
      });
    }
  }

  async function refresh() {
    try { await decorateRows(); } catch (e) {}
    try { await renderDeleted(false); } catch (e) {}
  }

  function install() {
    if (typeof window.loadClients !== 'function') return false;
    var orig = window.loadClients;
    window.loadClients = async function () {
      var out;
      try { out = await orig.apply(this, arguments); } catch (e) {}
      setTimeout(refresh, 60);
      return out;
    };
    if (document.getElementById('clientsInner')) setTimeout(refresh, 60);
    return true;
  }

  var tries = 0;
  (function wait() {
    if (install()) return;
    if (++tries > 80) return;
    setTimeout(wait, 250);
  })();
})();


/* ------------------------------------------------------------------ *
 * 14) MERCHANT APPLICATION (client-facing) + BitFlow referral redirect.
 *
 *   Client sidebar item + full application form. On submit we save to
 *   public.merchant_applications and redirect to BitFlow:
 *     https://merchant.getbitflow.com/sign-up?code=<client id>,
 *   falling back to the house code NC-3B2087 when no personal id is set.
 *   Admin sets each client's BitFlow referral ID on the client-detail
 *   editor; it rides along on saveProfile() and is protected from
 *   client self-edit.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsMerchant) return; window.__dsMerchant = true;

  var BITFLOW_URL = 'https://merchant.getbitflow.com/sign-up';
  var BITFLOW_PARAM = 'code';
  var BITFLOW_DEFAULT_CODE = 'NC-3B2087'; // house code used when a client has no personal referral id

  var URL_ = 'https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var sb = null;

  async function ensureSb() {
    if (sb) return sb;
    if (window.__dsSB) { sb = window.__dsSB; return sb; }
    var m = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    sb = m.createClient(URL_, ANON, { auth: { storageKey: 'sb-dehttbxrkeqhsfkfpfwt-auth-token', persistSession: true, autoRefreshToken: true } });
    window.__dsSB = sb; return sb;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  var STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

  var INDUSTRIES = [
    'Retail — General', 'Restaurant / Food Service', 'E-commerce / Online', 'Automotive (Sales & Repair)',
    'Salon / Spa / Beauty', 'Health & Wellness', 'Medical / Dental Practice', 'Professional Services',
    'Legal Services', 'Accounting / Bookkeeping', 'Construction / Contractor', 'Home Services (HVAC, Plumbing, Electrical)',
    'Real Estate', 'Hospitality / Hotel / Lodging', 'Travel & Tourism', 'Fitness / Gym',
    'Education / Tutoring', 'Nonprofit / Charity', 'Grocery / Convenience Store', 'Clothing / Apparel',
    'Jewelry / Accessories', 'Electronics / Technology', 'Furniture / Home Goods', 'Pet Services / Veterinary',
    'Childcare / Daycare', 'Entertainment / Events', 'Transportation / Logistics', 'Cleaning Services',
    'Landscaping / Lawn Care', 'Insurance'
  ];

  function label(t, sub) {
    return '<label style="display:block;font-size:13px;font-weight:600;color:#0E1A2B;margin-bottom:5px">' + esc(t)
      + (sub ? '<span style="display:block;font-weight:400;font-size:12px;color:#8A8A93;margin-top:2px">' + esc(sub) + '</span>' : '') + '</label>';
  }
  function text(id, ph) { return '<input id="' + id + '" class="field" style="width:100%"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '>'; }
  function block(inner) { return '<div style="margin-bottom:16px">' + inner + '</div>'; }
  function seg(id, opts) {
    return '<div id="' + id + '" class="ma-seg" data-val="" style="display:flex;gap:8px">'
      + opts.map(function (o) {
        return '<button type="button" class="ma-seg-btn" data-v="' + esc(o) + '" '
          + 'style="flex:1;padding:11px;border:1.5px solid #E7E7EC;border-radius:9px;background:#fff;font-weight:600;color:#48566b;cursor:pointer">'
          + esc(o) + '</button>';
      }).join('') + '</div>';
  }
  function select(id, opts, withOther) {
    return '<select id="' + id + '" class="field" style="width:100%">'
      + '<option value="">Select…</option>'
      + opts.map(function (o) { return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('')
      + (withOther ? '<option value="__other">Other…</option>' : '') + '</select>';
  }

  function screenHtml() {
    return '<div class="wrap" style="max-width:680px">'
      + '<div class="h-eyebrow">Merchant services</div>'
      + '<h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 6px">Merchant Application</h1>'
      + '<p class="mut" style="margin-bottom:18px">Fill this out and we’ll take you to BitFlow to finish setting up your merchant account.</p>'
      + '<div class="card pad">'
      + block(label('Are you a merchant or representative filling out this form?') + seg('ma_role', ['Merchant', 'Representative']))
      + block(label('What is your name?')
          + '<div style="display:flex;gap:10px">' + text('ma_first', 'First name') + text('ma_last', 'Last name') + '</div>')
      + '<div id="ma-rep-wrap" style="display:none">'
        + block(label('Who is the representative that referred you?') + text('ma_ref_rep', 'Representative name'))
      + '</div>'
      + block(label('What is the business name to sign up?') + text('ma_business_name'))
      + block(label('What is the business address?')
          + text('ma_addr', 'Street address')
          + '<div style="display:flex;gap:10px;margin-top:10px">'
            + '<div style="flex:2">' + text('ma_city', 'City') + '</div>'
            + '<div style="flex:1">' + select('ma_state', STATES, false) + '</div>'
            + '<div style="flex:1">' + text('ma_zip', 'ZIP') + '</div>'
          + '</div>')
      + block(label('Who is the business primary point of contact?')
          + '<div style="display:flex;gap:10px">' + text('ma_poc_first', 'First name') + text('ma_poc_last', 'Last name') + '</div>')
      + block(label('What is the business phone number?')
          + '<div style="display:flex;align-items:center;gap:8px">'
            + '<span style="padding:11px 12px;border:1.5px solid #E7E7EC;border-radius:9px;background:#f7f8fa;color:#48566b;font-weight:600">+1</span>'
            + '<input id="ma_phone" class="field" style="flex:1" placeholder="(555) 555-5555" inputmode="tel">'
          + '</div>')
      + block(label('What is the business email address?') + text('ma_email', 'name@business.com'))
      + block(label('What is the current monthly sales?', 'Roughly how much do you do in sales across all payment methods') + text('ma_monthly_sales', '$'))
      + block(label('What is the business industry?')
          + select('ma_industry', INDUSTRIES, true)
          + '<div id="ma-industry-other-wrap" style="display:none;margin-top:10px">' + text('ma_industry_other', 'Describe the industry') + '</div>')
      + block(label('Who will be charged the transaction fee?') + seg('ma_fee_payer', ['Customer', 'Merchant']))
      + block(label('What equipment will you be using?', 'If software only put N/A') + text('ma_equipment'))
      + block(label('What percentage will be charged?', 'Typically 4%')
          + '<div style="display:flex;align-items:center;gap:8px">'
            + '<input id="ma_percentage" class="field" style="flex:1" placeholder="4" inputmode="decimal">'
            + '<span style="color:#48566b;font-weight:600">%</span>'
          + '</div>')
      + '<div id="ma-msg" class="small" style="min-height:18px;margin:4px 0 10px"></div>'
      + '<button id="ma-submit" class="btn primary" style="width:100%;justify-content:center">Submit application</button>'
      + '</div></div>';
  }

  var GLOBE_SVG = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

  function wireForm(sec) {
    [].forEach.call(sec.querySelectorAll('.ma-seg'), function (grp) {
      grp.addEventListener('click', function (e) {
        var b = e.target && e.target.closest ? e.target.closest('.ma-seg-btn') : null;
        if (!b || !grp.contains(b)) return;
        [].forEach.call(grp.querySelectorAll('.ma-seg-btn'), function (x) {
          x.style.borderColor = '#E7E7EC'; x.style.background = '#fff'; x.style.color = '#48566b';
        });
        b.style.borderColor = '#F2B33D'; b.style.background = '#FFF8EC'; b.style.color = '#0E1A2B';
        grp.setAttribute('data-val', b.getAttribute('data-v'));
        if (grp.id === 'ma_role') {
          var repWrap = sec.querySelector('#ma-rep-wrap');
          if (repWrap) repWrap.style.display = (b.getAttribute('data-v') === 'Merchant') ? '' : 'none';
        }
      });
    });
    var ind = sec.querySelector('#ma_industry');
    if (ind) ind.addEventListener('change', function () {
      var w = sec.querySelector('#ma-industry-other-wrap');
      if (w) w.style.display = (ind.value === '__other') ? '' : 'none';
    });
  }

  function collect(sec) {
    function v(id) { var el = sec.querySelector('#' + id); return el ? (el.value || '').trim() : ''; }
    function segv(id) { var el = sec.querySelector('#' + id); return el ? (el.getAttribute('data-val') || '') : ''; }
    var role = segv('ma_role');
    var industry = v('ma_industry');
    if (industry === '__other') industry = v('ma_industry_other') || 'Other';
    var phone = v('ma_phone').replace(/[^\d]/g, '');
    return {
      role: role,
      first_name: v('ma_first'),
      last_name: v('ma_last'),
      referred_by_representative: role === 'Merchant' ? v('ma_ref_rep') : '',
      business_name: v('ma_business_name'),
      business_address: v('ma_addr'),
      business_city: v('ma_city'),
      business_state: v('ma_state'),
      business_zip: v('ma_zip'),
      poc_first_name: v('ma_poc_first'),
      poc_last_name: v('ma_poc_last'),
      business_phone: phone ? '+1' + phone : '',
      business_email: v('ma_email'),
      monthly_sales: v('ma_monthly_sales'),
      industry: industry,
      fee_paid_by: segv('ma_fee_payer'),
      equipment: v('ma_equipment'),
      fee_percentage: v('ma_percentage')
    };
  }

  function activate(nav, sec) {
    [].forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('active'); });
    [].forEach.call(document.querySelectorAll('.nav'), function (n) { n.classList.remove('active'); });
    sec.classList.add('active'); nav.classList.add('active');
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  async function submit(sec) {
    var msg = sec.querySelector('#ma-msg'), btn = sec.querySelector('#ma-submit');
    msg.style.color = '#c0392b'; msg.textContent = '';
    var data = collect(sec);

    if (!data.role) { msg.textContent = 'Please choose merchant or representative.'; return; }
    if (!data.first_name || !data.last_name) { msg.textContent = 'Please enter your name.'; return; }
    if (!data.business_name) { msg.textContent = 'Please enter the business name.'; return; }
    if (!data.business_email || data.business_email.indexOf('@') < 0) { msg.textContent = 'Please enter a valid business email.'; return; }

    var s = await ensureSb();
    var u = await s.auth.getUser();
    var uid = u && u.data && u.data.user ? u.data.user.id : null;
    if (!uid) { msg.textContent = 'Please sign in again.'; return; }

    var pr = await s.from('profiles').select('bitflow_referral_id').eq('id', uid).single();
    var ref = pr.data && pr.data.bitflow_referral_id ? String(pr.data.bitflow_referral_id).trim() : '';
    var code = ref || BITFLOW_DEFAULT_CODE;
    var redirect = BITFLOW_URL + (BITFLOW_URL.indexOf('?') > -1 ? '&' : '?') + BITFLOW_PARAM + '=' + encodeURIComponent(code);

    btn.disabled = true; btn.textContent = 'Submitting…';
    var ins = await s.from('merchant_applications').insert({ client_id: uid, data: data, referral_id: ref || null, redirected_to: redirect }).select('id').single();
    if (ins.error) {
      btn.disabled = false; btn.textContent = 'Submit application';
      msg.textContent = 'Couldn’t submit — please try again.'; return;
    }

    // notify the pp-agent-secured channel (best-effort; never blocks the redirect)
    try {
      var sess = await s.auth.getSession();
      var tok = sess && sess.data && sess.data.session ? sess.data.session.access_token : null;
      if (tok) {
        fetch(URL_ + '/functions/v1/merchant-notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + tok },
          body: JSON.stringify({ application_id: ins.data.id })
        }).catch(function () {});
      }
    } catch (e) {}

    msg.style.color = '#1a7f4b'; msg.textContent = 'Submitted. Taking you to BitFlow…';
    setTimeout(function () { window.location.href = redirect; }, 1200);
  }

  function mount() {
    var settingsNav = document.querySelector('.nav[data-screen="settings"]');
    if (!settingsNav) return false;
    if (document.querySelector('.nav[data-screen="merchant"]')) return true;
    var side = settingsNav.parentElement;
    var screenParent = (document.querySelector('section.screen') || {}).parentElement;
    if (!side || !screenParent) return false;

    var nav = document.createElement('div');
    nav.className = 'nav'; nav.setAttribute('data-screen', 'merchant');
    nav.innerHTML = GLOBE_SVG + 'Merchant Application';
    side.insertBefore(nav, settingsNav);

    var sec = document.createElement('section');
    sec.className = 'screen'; sec.id = 'merchant'; sec.innerHTML = screenHtml();
    screenParent.appendChild(sec);

    wireForm(sec);
    nav.addEventListener('click', function () { activate(nav, sec); });
    sec.querySelector('#ma-submit').addEventListener('click', function () { submit(sec); });

    if (typeof window.show === 'function' && !window.show.__dsMerchantWrapped) {
      var origShow = window.show;
      var wrapped = function (screen) {
        var out = origShow.apply(this, arguments);
        if (screen !== 'merchant') { var el = document.getElementById('merchant'); if (el) el.classList.remove('active'); }
        return out;
      };
      wrapped.__dsMerchantWrapped = true; window.show = wrapped;
    }
    return true;
  }

  var tries = 0;
  (function wait() { if (mount()) return; if (++tries > 80) return; setTimeout(wait, 250); })();

  /* ---- Admin: BitFlow Referral ID field on the client-detail editor ---- */
  (function adminField() {
    if (typeof window.openClient !== 'function') { setTimeout(adminField, 300); return; }
    var origOpen = window.openClient;
    window.openClient = function (id) {
      var out = origOpen.apply(this, arguments);
      var n = 0;
      (function tryInject() {
        if (document.getElementById('pf_bitflow')) return;
        var a = document.getElementById('pf_slack') || document.getElementById('pf_address') || document.getElementById('pf_program');
        if (a) { injectReferralField(id); return; }
        if (++n > 40) return;
        setTimeout(tryInject, 150);
      })();
      return out;
    };
    if (typeof window.saveProfile === 'function') {
      var origSave = window.saveProfile;
      window.saveProfile = async function () {
        var el0 = document.getElementById('pf_bitflow');
        var uid0 = el0 && el0.getAttribute('data-uid');
        var val0 = el0 ? (el0.value || '').trim() : null;
        var out = await origSave.apply(this, arguments);
        try { if (uid0) { var s = await ensureSb(); await s.from('profiles').update({ bitflow_referral_id: val0 || null }).eq('id', uid0); } } catch (e) {}
        return out;
      };
    }
    async function injectReferralField(clientId) {
      if (document.getElementById('pf_bitflow')) return;
      var anchor = document.getElementById('pf_slack') || document.getElementById('pf_address') || document.getElementById('pf_program');
      if (!anchor) return;
      var wrap = document.createElement('div');
      wrap.style.marginTop = '10px';
      wrap.innerHTML = '<label style="display:block;font-size:12.5px;color:#48566b;margin-bottom:5px">BitFlow referral ID</label>'
        + '<input id="pf_bitflow" class="field" placeholder="client’s unique BitFlow code" style="width:100%">';
      var host = anchor.closest ? (anchor.closest('.field-row') || anchor.parentElement) : anchor.parentElement;
      (host && host.parentElement ? host.parentElement : host).appendChild(wrap);
      var input = wrap.querySelector('#pf_bitflow');
      input.setAttribute('data-uid', clientId);
      try {
        var s = await ensureSb();
        var r = await s.from('profiles').select('bitflow_referral_id').eq('id', clientId).single();
        if (!r.error && r.data && r.data.bitflow_referral_id) input.value = r.data.bitflow_referral_id;
      } catch (e) {}
    }
  })();
})();


/* ------------------------------------------------------------------ *
 * 15) ADMIN — Merchant Applications grid.
 *   Admin-only sidebar screen. A rich, sortable, searchable table of
 *   public.merchant_applications with inline status editing, expandable
 *   full-detail rows, and CSV export.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsMGrid) return; window.__dsMGrid = true;

  var URL_ = 'https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var sb = null, ROWS = [], SORT = { key: 'created_at', dir: -1 }, QUERY = '', EXPANDED = {};

  async function ensureSb() {
    if (sb) return sb;
    if (window.__dsSB) { sb = window.__dsSB; return sb; }
    var m = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    sb = m.createClient(URL_, ANON, { auth: { storageKey: 'sb-dehttbxrkeqhsfkfpfwt-auth-token', persistSession: true, autoRefreshToken: true } });
    window.__dsSB = sb; return sb;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function toast(m) { try { if (typeof window.toast === 'function') window.toast(m); } catch (e) {} }
  function fmtDate(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch (e) { return ''; } }

  var STATUSES = ['submitted', 'contacted', 'approved', 'declined'];
  var STATUS_COLOR = { submitted: '#2F6BFF', contacted: '#B8860B', approved: '#1a7f4b', declined: '#c0392b' };

  var COLS = [
    { k: 'created_at', label: 'Submitted', get: function (r) { return r.created_at; }, cell: function (r) { return fmtDate(r.created_at); } },
    { k: 'business_name', label: 'Business', get: function (r) { return r.d.business_name; } },
    { k: 'industry', label: 'Industry', get: function (r) { return r.d.industry; } },
    { k: 'submitter', label: 'Submitted by', get: function (r) { return (r.d.first_name || '') + ' ' + (r.d.last_name || ''); }, cell: function (r) { var n = ((r.d.first_name || '') + ' ' + (r.d.last_name || '')).trim(); return esc(n) + (r.d.role ? ' <span class="mut" style="font-size:11px">(' + esc(r.d.role) + ')</span>' : ''); } },
    { k: 'business_phone', label: 'Phone', get: function (r) { return r.d.business_phone; } },
    { k: 'business_email', label: 'Email', get: function (r) { return r.d.business_email; } },
    { k: 'monthly_sales', label: 'Monthly sales', get: function (r) { return r.d.monthly_sales; } },
    { k: 'fee_paid_by', label: 'Fee by', get: function (r) { return r.d.fee_paid_by; } },
    { k: 'fee_percentage', label: 'Rate', get: function (r) { return r.d.fee_percentage; }, cell: function (r) { return r.d.fee_percentage ? esc(r.d.fee_percentage) + '%' : ''; } },
    { k: 'code', label: 'BitFlow code', get: function (r) { return r.code; }, cell: function (r) { return r.code ? '<code style="font-size:12px">' + esc(r.code) + '</code>' : ''; } },
    { k: 'status', label: 'Status', get: function (r) { return r.status; }, cell: statusCell }
  ];

  function statusCell(r) {
    var c = STATUS_COLOR[r.status] || '#8A8A93';
    var opts = STATUSES.map(function (s) { return '<option value="' + s + '"' + (s === r.status ? ' selected' : '') + '>' + s + '</option>'; }).join('');
    return '<select data-status="' + esc(r.id) + '" style="border:1px solid ' + c + '55;color:' + c + ';font-weight:700;border-radius:20px;padding:4px 8px;font-size:11.5px;background:' + c + '11;text-transform:capitalize;cursor:pointer">' + opts + '</select>';
  }

  function normalize(row, nameMap) {
    var d = row.data || {};
    var code = row.referral_id || (String(row.redirected_to || '').split('code=')[1] || '');
    return { id: row.id, created_at: row.created_at, status: row.status || 'submitted', d: d, code: code,
             redirect: row.redirected_to || '', client_id: row.client_id, client: nameMap[row.client_id] || '' };
  }

  async function load() {
    var s = await ensureSb();
    var r = await s.from('merchant_applications').select('*').order('created_at', { ascending: false });
    if (r.error) { ROWS = []; return { error: r.error.message }; }
    var rows = r.data || [];
    var ids = [].concat.apply([], rows.map(function (x) { return x.client_id ? [x.client_id] : []; }));
    var nameMap = {};
    if (ids.length) {
      var pr = await s.from('profiles').select('id,full_name,email').in('id', ids);
      (pr.data || []).forEach(function (p) { nameMap[p.id] = p.full_name || p.email || ''; });
    }
    ROWS = rows.map(function (x) { return normalize(x, nameMap); });
    return { ok: true };
  }

  function filtered() {
    var q = QUERY.trim().toLowerCase();
    var out = ROWS;
    if (q) {
      out = ROWS.filter(function (r) {
        var hay = [r.d.business_name, r.d.industry, r.d.first_name, r.d.last_name, r.d.business_email,
          r.d.business_phone, r.d.business_city, r.d.business_state, r.code, r.status, r.client].join(' ').toLowerCase();
        return hay.indexOf(q) > -1;
      });
    }
    var col = COLS.filter(function (c) { return c.k === SORT.key; })[0] || COLS[0];
    out = out.slice().sort(function (a, b) {
      var av = col.get(a), bv = col.get(b);
      if (SORT.key === 'created_at') { av = new Date(av || 0).getTime(); bv = new Date(bv || 0).getTime(); }
      else { av = String(av == null ? '' : av).toLowerCase(); bv = String(bv == null ? '' : bv).toLowerCase(); }
      if (av < bv) return -1 * SORT.dir; if (av > bv) return 1 * SORT.dir; return 0;
    });
    return out;
  }

  function detailHtml(r) {
    var d = r.d;
    function kv(k, v) { v = (v == null ? '' : String(v)).trim(); return '<div style="min-width:180px;margin:0 18px 10px 0"><div class="mut" style="font-size:11px;text-transform:uppercase;letter-spacing:.04em">' + esc(k) + '</div><div style="font-size:13.5px">' + (v ? esc(v) : '<span class="mut">—</span>') + '</div></div>'; }
    var addr = [d.business_address, d.business_city, [d.business_state, d.business_zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    return '<td colspan="' + (COLS.length + 1) + '" style="background:#FAFAFB;padding:16px 18px">'
      + '<div style="display:flex;flex-wrap:wrap">'
      + kv('Referred by rep', d.referred_by_representative)
      + kv('Point of contact', ((d.poc_first_name || '') + ' ' + (d.poc_last_name || '')).trim())
      + kv('Business address', addr)
      + kv('Equipment', d.equipment)
      + kv('Portal client', r.client)
      + kv('Redirect', r.redirect)
      + '</div></td>';
  }

  function render() {
    var sec = document.getElementById('mgrid'); if (!sec) return;
    var rows = filtered();
    var head = COLS.map(function (c) {
      var arrow = SORT.key === c.k ? (SORT.dir === 1 ? ' ▲' : ' ▼') : '';
      return '<th data-sort="' + c.k + '" style="position:sticky;top:0;background:#0E1A2B;color:#fff;text-align:left;padding:11px 12px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;white-space:nowrap;cursor:pointer;z-index:1">' + esc(c.label) + arrow + '</th>';
    }).join('');
    head = '<th style="position:sticky;top:0;background:#0E1A2B;z-index:1;width:26px"></th>' + head;

    var body = rows.length ? rows.map(function (r, i) {
      var zebra = i % 2 ? '#fff' : '#FBFBFD';
      var tds = COLS.map(function (c) {
        var v = c.cell ? c.cell(r) : esc(c.get(r) || '');
        return '<td style="padding:10px 12px;font-size:13px;white-space:nowrap;max-width:220px;overflow:hidden;text-overflow:ellipsis">' + v + '</td>';
      }).join('');
      var caret = EXPANDED[r.id] ? '▾' : '▸';
      var main = '<tr data-row="' + esc(r.id) + '" style="background:' + zebra + ';border-bottom:1px solid #EEF0F4;cursor:pointer">'
        + '<td style="padding:10px 6px;text-align:center;color:#8A8A93">' + caret + '</td>' + tds + '</tr>';
      var det = EXPANDED[r.id] ? '<tr>' + detailHtml(r) + '</tr>' : '';
      return main + det;
    }).join('') : '<tr><td colspan="' + (COLS.length + 1) + '" style="padding:28px;text-align:center" class="mut">No applications yet.</td></tr>';

    sec.querySelector('#mgrid-count').textContent = rows.length + (rows.length === 1 ? ' application' : ' applications');
    sec.querySelector('#mgrid-tbody').innerHTML = body;
    sec.querySelector('#mgrid-thead').innerHTML = '<tr>' + head + '</tr>';
  }

  function toCsv() {
    var rows = filtered();
    var headers = ['Submitted', 'Status', 'Role', 'First', 'Last', 'Business', 'Industry', 'Phone', 'Email',
      'Address', 'City', 'State', 'ZIP', 'POC first', 'POC last', 'Monthly sales', 'Fee by', 'Rate %',
      'Equipment', 'Referred by rep', 'BitFlow code', 'Portal client'];
    function q(v) { v = (v == null ? '' : String(v)); return '"' + v.replace(/"/g, '""') + '"'; }
    var lines = [headers.map(q).join(',')];
    rows.forEach(function (r) {
      var d = r.d;
      lines.push([r.created_at, r.status, d.role, d.first_name, d.last_name, d.business_name, d.industry,
        d.business_phone, d.business_email, d.business_address, d.business_city, d.business_state, d.business_zip,
        d.poc_first_name, d.poc_last_name, d.monthly_sales, d.fee_paid_by, d.fee_percentage, d.equipment,
        d.referred_by_representative, r.code, r.client].map(q).join(','));
    });
    var blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = window.URL.createObjectURL(blob);
    a.download = 'merchant-applications-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click();
    setTimeout(function () { window.URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function screenHtml() {
    return '<div class="wrap" style="max-width:1200px">'
      + '<div class="h-eyebrow">Admin</div>'
      + '<h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 4px">Merchant Applications</h1>'
      + '<p class="mut" style="margin-bottom:16px">Every submission, newest first. Click a row for full detail. Edit status inline.</p>'
      + '<div style="display:flex;gap:12px;align-items:center;margin-bottom:14px;flex-wrap:wrap">'
        + '<input id="mgrid-search" class="field" placeholder="Search business, name, email, code…" style="flex:1;min-width:240px;max-width:420px">'
        + '<span id="mgrid-count" class="mut" style="font-size:13px;font-weight:600"></span>'
        + '<button id="mgrid-refresh" class="btn" style="background:#eef1f6;color:#0E1A2B">Refresh</button>'
        + '<button id="mgrid-csv" class="btn primary">Export CSV</button>'
      + '</div>'
      + '<div class="card" style="padding:0;overflow:hidden">'
        + '<div style="overflow:auto;max-height:70vh">'
          + '<table style="width:100%;border-collapse:collapse;min-width:900px">'
            + '<thead id="mgrid-thead"></thead><tbody id="mgrid-tbody"></tbody>'
          + '</table>'
        + '</div>'
      + '</div></div>';
  }

  var ICON = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3z"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/></svg>';

  function activate(nav, sec) {
    [].forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('active'); });
    [].forEach.call(document.querySelectorAll('.nav'), function (n) { n.classList.remove('active'); });
    sec.classList.add('active'); nav.classList.add('active');
    try { window.scrollTo(0, 0); } catch (e) {}
    load().then(render);
  }

  function wire(sec) {
    sec.querySelector('#mgrid-search').addEventListener('input', function (e) { QUERY = e.target.value; render(); });
    sec.querySelector('#mgrid-csv').addEventListener('click', toCsv);
    sec.querySelector('#mgrid-refresh').addEventListener('click', function () { load().then(render); });

    sec.querySelector('#mgrid-thead').addEventListener('click', function (e) {
      var th = e.target && e.target.closest ? e.target.closest('th[data-sort]') : null;
      if (!th) return;
      var k = th.getAttribute('data-sort');
      if (SORT.key === k) SORT.dir *= -1; else { SORT.key = k; SORT.dir = (k === 'created_at') ? -1 : 1; }
      render();
    });

    sec.querySelector('#mgrid-tbody').addEventListener('click', function (e) {
      if (e.target && e.target.closest && e.target.closest('select[data-status]')) return;
      var tr = e.target && e.target.closest ? e.target.closest('tr[data-row]') : null;
      if (!tr) return;
      var id = tr.getAttribute('data-row');
      EXPANDED[id] = !EXPANDED[id];
      render();
    });

    sec.querySelector('#mgrid-tbody').addEventListener('change', async function (e) {
      var sel = e.target && e.target.closest ? e.target.closest('select[data-status]') : null;
      if (!sel) return;
      var id = sel.getAttribute('data-status'), val = sel.value;
      var s = await ensureSb();
      var r = await s.from('merchant_applications').update({ status: val }).eq('id', id).select('id');
      if (r.error || !r.data || !r.data.length) { toast('Couldn’t update status'); return; }
      var row = ROWS.filter(function (x) { return x.id === id; })[0]; if (row) row.status = val;
      toast('Status updated'); render();
    });
  }

  async function isAdmin() {
    var s = await ensureSb();
    var u = await s.auth.getUser();
    var id = u && u.data && u.data.user ? u.data.user.id : null;
    if (!id) return false;
    var r = await s.from('profiles').select('role').eq('id', id).single();
    return !!(r.data && (r.data.role === 'admin' || r.data.role === 'team'));
  }

  async function mount() {
    var anchorNav = document.querySelector('.nav[data-screen="clients"]') || document.querySelector('.nav[data-screen="settings"]');
    if (!anchorNav) return false;
    if (document.querySelector('.nav[data-screen="mgrid"]')) return true;
    if (!(await isAdmin())) return true;

    var side = anchorNav.parentElement;
    var screenParent = (document.querySelector('section.screen') || {}).parentElement;
    if (!side || !screenParent) return false;

    var nav = document.createElement('div');
    nav.className = 'nav admin-only';
    nav.setAttribute('data-screen', 'mgrid');
    nav.style.display = '';
    nav.innerHTML = ICON + 'Merchant Apps <span class="badge-admin" style="margin-left:auto">Admin</span>';
    side.insertBefore(nav, anchorNav.nextSibling);

    var sec = document.createElement('section');
    sec.className = 'screen'; sec.id = 'mgrid'; sec.innerHTML = screenHtml();
    screenParent.appendChild(sec);

    wire(sec);
    nav.addEventListener('click', function () { activate(nav, sec); });

    if (typeof window.show === 'function' && !window.show.__dsMGridWrapped) {
      var origShow = window.show;
      var wrapped = function (screen) {
        var out = origShow.apply(this, arguments);
        if (screen !== 'mgrid') { var el = document.getElementById('mgrid'); if (el) el.classList.remove('active'); }
        return out;
      };
      wrapped.__dsMGridWrapped = true; window.show = wrapped;
    }
    return true;
  }

  var tries = 0;
  (function wait() { mount().then(function (done) { if (done) return; if (++tries > 80) return; setTimeout(wait, 300); }); })();
})();


/* ------------------------------------------------------------------ *
 * 16) AI COACH — hide training sources from the client view.
 *   The coach screen shows a "Knowledge base" card listing its sources
 *   (lesson transcripts, recordings, worksheets, counts). Clients must
 *   not see the coach's training sources. There is no client-facing way
 *   to ADD a source, so nothing to lock there.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsCoachHide) return; window.__dsCoachHide = true;
  function hide() {
    var coach = document.getElementById('coach'); if (!coach) return false;
    var hidden = false;
    [].forEach.call(coach.querySelectorAll('.h-eyebrow'), function (e) {
      if (/knowledge base/i.test(e.textContent || '')) {
        var card = e.closest ? e.closest('.card') : null;
        if (card) { card.style.display = 'none'; hidden = true; }
      }
    });
    return hidden;
  }
  var n = 0;
  (function w() { if (hide() || ++n > 100) return; setTimeout(w, 250); })();
})();


/* ------------------------------------------------------------------ *
 * 17) ADMIN — AI Coach guardrails editor.
 *   Admin-only screen to define the Coach "like a team member": name,
 *   role/persona, tone, rhetoric, follow-up level, and hard guardrails
 *   (do / don't / escalation / knowledge scope). Stored in
 *   public.ai_coach_config (single row, admin-only, no client access).
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsCoachCfg) return; window.__dsCoachCfg = true;

  var URL_ = 'https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var sb = null;

  async function ensureSb() {
    if (sb) return sb;
    if (window.__dsSB) { sb = window.__dsSB; return sb; }
    var m = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    sb = m.createClient(URL_, ANON, { auth: { storageKey: 'sb-dehttbxrkeqhsfkfpfwt-auth-token', persistSession: true, autoRefreshToken: true } });
    window.__dsSB = sb; return sb;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function toast(m) { try { if (typeof window.toast === 'function') window.toast(m); } catch (e) {} }
  function fmtDT(d) { if (!d) return ''; try { return new Date(d).toLocaleString(); } catch (e) { return ''; } }

  var FIELDS = [
    { k: 'agent_name', label: 'Agent name', sub: 'What the coach calls itself', big: false },
    { k: 'persona', label: 'Role / persona', sub: 'Who the agent is — write it as if onboarding a team member', big: true },
    { k: 'tone', label: 'Tone', sub: 'e.g. warm, direct, professional, motivational', big: true },
    { k: 'rhetoric', label: 'Rhetoric / style', sub: 'How it argues and explains — consultative, Socratic, directive…', big: true },
    { k: 'follow_up', label: 'Follow-up level', sub: 'How much it should follow up / push', big: true },
    { k: 'guardrails_do', label: 'Guardrails — always do', sub: 'Hard rules the agent must follow', big: true },
    { k: 'guardrails_dont', label: 'Guardrails — never do', sub: 'Hard limits the agent must never cross', big: true },
    { k: 'escalation', label: 'When to hand off to the team', sub: 'Conditions that should route to a human', big: true },
    { k: 'knowledge_scope', label: 'Knowledge scope', sub: 'What the agent is allowed to reference', big: true },
    { k: 'extra', label: 'Additional guardrails / notes', sub: 'Anything else', big: true }
  ];

  function fieldHtml(f) {
    var id = 'cc_' + f.k;
    var input = f.big
      ? '<textarea id="' + id + '" class="field" rows="3" style="width:100%"></textarea>'
      : '<input id="' + id + '" class="field" style="width:100%">';
    return '<div style="margin-bottom:16px">'
      + '<label style="display:block;font-size:13px;font-weight:700;color:#0E1A2B;margin-bottom:2px">' + esc(f.label) + '</label>'
      + '<div class="small mut" style="margin-bottom:6px">' + esc(f.sub) + '</div>'
      + input + '</div>';
  }

  function screenHtml() {
    return '<div class="wrap" style="max-width:760px">'
      + '<div class="h-eyebrow">Admin</div>'
      + '<h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 4px">AI Coach — Persona &amp; Guardrails</h1>'
      + '<p class="mut" style="margin-bottom:8px">Define the Coach like a team member. This is the single, always-current source of truth for how the agent behaves. Clients never see any of this.</p>'
      + '<div id="cc-note" class="small mut" style="margin-bottom:16px"></div>'
      + '<div class="card pad">'
      + FIELDS.map(fieldHtml).join('')
      + '<div id="cc-msg" class="small" style="min-height:18px;margin:2px 0 10px"></div>'
      + '<button id="cc-save" class="btn primary" style="width:100%;justify-content:center">Save guardrails</button>'
      + '</div></div>';
  }

  var ICON = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a3 3 0 0 1 3 3v1a3 3 0 0 1 3 3 3 3 0 0 1 0 6 3 3 0 0 1-3 3v1a3 3 0 0 1-6 0v-1a3 3 0 0 1-3-3 3 3 0 0 1 0-6 3 3 0 0 1 3-3V5a3 3 0 0 1 3-3z"/></svg>';

  async function loadInto(sec) {
    var s = await ensureSb();
    var r = await s.from('ai_coach_config').select('*').eq('id', 'default').single();
    var note = sec.querySelector('#cc-note');
    if (r.error || !r.data) { note.textContent = 'Couldn’t load the current config.'; return; }
    FIELDS.forEach(function (f) { var el = sec.querySelector('#cc_' + f.k); if (el) el.value = r.data[f.k] || ''; });
    note.textContent = 'Last updated ' + (r.data.updated_at ? fmtDT(r.data.updated_at) : '—') + (r.data.updated_by_email ? ' by ' + r.data.updated_by_email : '');
  }

  async function save(sec) {
    var msg = sec.querySelector('#cc-msg'), btn = sec.querySelector('#cc-save');
    msg.style.color = '#c0392b'; msg.textContent = '';
    var s = await ensureSb();
    var u = await s.auth.getUser();
    var uid = u && u.data && u.data.user ? u.data.user.id : null;
    var email = u && u.data && u.data.user ? u.data.user.email : null;
    if (!uid) { msg.textContent = 'Please sign in again.'; return; }
    var patch = { updated_at: new Date().toISOString(), updated_by: uid, updated_by_email: email };
    FIELDS.forEach(function (f) { var el = sec.querySelector('#cc_' + f.k); patch[f.k] = el ? (el.value || '').trim() : ''; });
    btn.disabled = true; btn.textContent = 'Saving…';
    var r = await s.from('ai_coach_config').update(patch).eq('id', 'default').select('id');
    btn.disabled = false; btn.textContent = 'Save guardrails';
    if (r.error || !r.data || !r.data.length) { msg.textContent = 'Couldn’t save — admin access required.'; return; }
    msg.style.color = '#1a7f4b'; msg.textContent = 'Saved.';
    loadInto(sec);
  }

  function activate(nav, sec) {
    [].forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('active'); });
    [].forEach.call(document.querySelectorAll('.nav'), function (n) { n.classList.remove('active'); });
    sec.classList.add('active'); nav.classList.add('active');
    try { window.scrollTo(0, 0); } catch (e) {}
    loadInto(sec);
  }

  async function isAdmin() {
    var s = await ensureSb();
    var u = await s.auth.getUser();
    var id = u && u.data && u.data.user ? u.data.user.id : null;
    if (!id) return false;
    var r = await s.from('profiles').select('role').eq('id', id).single();
    return !!(r.data && (r.data.role === 'admin' || r.data.role === 'team'));
  }

  async function mount() {
    var anchorNav = document.querySelector('.nav[data-screen="mgrid"]') || document.querySelector('.nav[data-screen="clients"]') || document.querySelector('.nav[data-screen="settings"]');
    if (!anchorNav) return false;
    if (document.querySelector('.nav[data-screen="coachcfg"]')) return true;
    if (!(await isAdmin())) return true;

    var side = anchorNav.parentElement;
    var screenParent = (document.querySelector('section.screen') || {}).parentElement;
    if (!side || !screenParent) return false;

    var nav = document.createElement('div');
    nav.className = 'nav admin-only';
    nav.setAttribute('data-screen', 'coachcfg');
    nav.style.display = '';
    nav.innerHTML = ICON + 'AI Coach <span class="badge-admin" style="margin-left:auto">Admin</span>';
    side.insertBefore(nav, anchorNav.nextSibling);

    var sec = document.createElement('section');
    sec.className = 'screen'; sec.id = 'coachcfg'; sec.innerHTML = screenHtml();
    screenParent.appendChild(sec);

    nav.addEventListener('click', function () { activate(nav, sec); });
    sec.querySelector('#cc-save').addEventListener('click', function () { save(sec); });

    if (typeof window.show === 'function' && !window.show.__dsCoachCfgWrapped) {
      var origShow = window.show;
      var wrapped = function (screen) {
        var out = origShow.apply(this, arguments);
        if (screen !== 'coachcfg') { var el = document.getElementById('coachcfg'); if (el) el.classList.remove('active'); }
        return out;
      };
      wrapped.__dsCoachCfgWrapped = true; window.show = wrapped;
    }
    return true;
  }

  var tries = 0;
  (function wait() { mount().then(function (done) { if (done) return; if (++tries > 80) return; setTimeout(wait, 300); }); })();
})();


/* ------------------------------------------------------------------ *
 * 18) AI COACH — wire the client chat to the live coach-chat function.
 *   Replaces the canned demo (sendCoach / sendFab -> converse) with real
 *   calls to /functions/v1/coach-chat. Keeps short history for context,
 *   renders light markdown, and shows a friendly out-of-credits message.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsCoachLive) return; window.__dsCoachLive = true;

  var URL_ = 'https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var sb = null;

  async function ensureSb() {
    if (sb) return sb;
    if (window.__dsSB) { sb = window.__dsSB; return sb; }
    var m = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    sb = m.createClient(URL_, ANON, { auth: { storageKey: 'sb-dehttbxrkeqhsfkfpfwt-auth-token', persistSession: true, autoRefreshToken: true } });
    window.__dsSB = sb; return sb;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]; }); }
  function fmt(s) {
    s = esc(s);
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    s = s.replace(/\n/g, '<br>');
    return s;
  }
  function scroll(box) { try { box.scrollTop = box.scrollHeight; } catch (e) {} }
  function add(box, cls, html) {
    var d = document.createElement('div');
    d.className = 'msg ' + cls;
    d.innerHTML = html;
    box.appendChild(d); scroll(box);
    return d;
  }
  function history(box) {
    var out = [];
    [].forEach.call(box.querySelectorAll('.msg'), function (el) {
      if (el.getAttribute('data-typing')) return;
      var role = el.classList.contains('me') ? 'user' : 'assistant';
      var text = el.getAttribute('data-raw') || el.textContent || '';
      if (text.trim()) out.push({ role: role, content: text.trim() });
    });
    return out.slice(-8);
  }

  async function callCoach(message, hist) {
    try {
      var s = await ensureSb();
      var sess = await s.auth.getSession();
      var tok = sess && sess.data && sess.data.session ? sess.data.session.access_token : null;
      if (!tok) return { error: 'signin' };
      var r = await fetch(URL_ + '/functions/v1/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + tok },
        body: JSON.stringify({ message: message, history: hist })
      });
      return await r.json();
    } catch (e) { return { error: 'network' }; }
  }

  async function ask(box, input) {
    if (!box || !input) return;
    var q = (input.value || '').trim(); if (!q) return;
    var hist = history(box);
    add(box, 'me', esc(q));
    input.value = '';
    var typing = add(box, 'ai', '<span style="opacity:.5">…</span>');
    typing.setAttribute('data-typing', '1');
    var res = await callCoach(q, hist);
    typing.removeAttribute('data-typing');
    if (res && res.ok && res.reply) {
      typing.innerHTML = fmt(res.reply);
      typing.setAttribute('data-raw', res.reply);
      if (typeof res.remaining_credits === 'number') { try { window.__dsCoachCredits = res.remaining_credits; document.dispatchEvent(new CustomEvent('ds-credits', { detail: res.remaining_credits })); } catch (e) {} }
    } else if (res && res.error === 'insufficient_credits') {
      typing.innerHTML = 'You’re out of Coach credits for this month. They reset on the 1st — or you can top up from Settings.';
    } else if (res && res.error === 'signin') {
      typing.innerHTML = 'Please sign in again to keep chatting.';
    } else {
      typing.innerHTML = 'Hmm, I couldn’t answer that just now — try again in a moment.';
    }
    scroll(box);
  }

  function install() {
    if (typeof window.sendCoach !== 'function' && typeof window.sendFab !== 'function') return false;
    window.sendCoach = function () { ask(document.getElementById('coachMsgs'), document.getElementById('coachInput')); };
    window.sendFab = function () { ask(document.getElementById('fabMsgs'), document.getElementById('fabInput')); };
    return true;
  }
  var tries = 0;
  (function wait() { if (install()) return; if (++tries > 80) return; setTimeout(wait, 250); })();
})();


/* ------------------------------------------------------------------ *
 * 19) DEAL ANALYZER (client-facing) — 5 credits.
 *   Client enters deal context; Claude returns assessment + drafted
 *   email + follow-up plan. Calls /functions/v1/deal-analyzer.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsDeal) return; window.__dsDeal = true;

  var URL_ = 'https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var sb = null;

  async function ensureSb() {
    if (sb) return sb;
    if (window.__dsSB) { sb = window.__dsSB; return sb; }
    var m = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    sb = m.createClient(URL_, ANON, { auth: { storageKey: 'sb-dehttbxrkeqhsfkfpfwt-auth-token', persistSession: true, autoRefreshToken: true } });
    window.__dsSB = sb; return sb;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function md(s) {
    s = esc(s);
    s = s.replace(/^###\s?(.*)$/gm, '<div style="font-weight:700;color:#0E1A2B;margin:14px 0 4px">$1</div>');
    s = s.replace(/^##\s?(.*)$/gm, '<div style="font-weight:800;color:#0E1A2B;font-size:15px;margin:18px 0 6px;border-top:1px solid #EEF0F4;padding-top:12px">$1</div>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
    s = s.replace(/^\s*[-*]\s+/gm, '• ');
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  var FIELDS = [
    { k: 'business', label: 'Business / location(s)', big: false, ph: 'e.g. Sunrise Diner — 2 locations, Tampa' },
    { k: 'industry', label: 'Business type / industry', big: false, ph: 'e.g. Restaurant' },
    { k: 'decision_maker', label: 'Decision-maker(s) and role', big: false, ph: 'e.g. Sam Cook, owner' },
    { k: 'conversations', label: 'Conversations so far', big: true, ph: 'What was discussed, their situation, pain points…' },
    { k: 'goals', label: 'My goals for this account', big: true, ph: 'What a win looks like — rate, locations, timing…' },
    { k: 'feedback', label: 'Current status / feedback / objections', big: true, ph: 'Where it stands, what they pushed back on…' },
    { k: 'extra', label: 'Other context (optional)', big: true, ph: '' }
  ];

  function fieldHtml(f) {
    var id = 'da_' + f.k;
    var input = f.big
      ? '<textarea id="' + id + '" class="field" rows="3" style="width:100%" placeholder="' + esc(f.ph) + '"></textarea>'
      : '<input id="' + id + '" class="field" style="width:100%" placeholder="' + esc(f.ph) + '">';
    return '<div style="margin-bottom:14px"><label style="display:block;font-size:13px;font-weight:700;color:#0E1A2B;margin-bottom:5px">' + esc(f.label) + '</label>' + input + '</div>';
  }

  function screenHtml() {
    return '<div class="wrap" style="max-width:760px">'
      + '<div class="h-eyebrow">Deal tools</div>'
      + '<h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 6px">Deal Analyzer</h1>'
      + '<p class="mut" style="margin-bottom:16px">Enter what you know about the prospect. You’ll get an assessment, a drafted email to the decision-maker, and a follow-up plan. <b>Costs 5 credits.</b></p>'
      + '<div class="card pad">' + FIELDS.map(fieldHtml).join('')
      + '<div id="da-msg" class="small" style="min-height:18px;margin:2px 0 10px"></div>'
      + '<button id="da-go" class="btn primary" style="width:100%;justify-content:center">Analyze deal (5 credits)</button>'
      + '</div>'
      + '<div id="da-result" class="card pad" style="display:none;margin-top:16px"></div>'
      + '</div>';
  }

  var ICON = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>';

  function activate(nav, sec) {
    [].forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('active'); });
    [].forEach.call(document.querySelectorAll('.nav'), function (n) { n.classList.remove('active'); });
    sec.classList.add('active'); nav.classList.add('active');
    try { window.scrollTo(0, 0); } catch (e) {}
  }

  async function run(sec) {
    var msg = sec.querySelector('#da-msg'), btn = sec.querySelector('#da-go'), out = sec.querySelector('#da-result');
    msg.style.color = '#c0392b'; msg.textContent = '';
    var data = {}; var any = false;
    FIELDS.forEach(function (f) { var el = sec.querySelector('#da_' + f.k); var v = el ? (el.value || '').trim() : ''; data[f.k] = v; if (v) any = true; });
    if (!any) { msg.textContent = 'Add some details about the deal first.'; return; }

    var s = await ensureSb();
    var sess = await s.auth.getSession();
    var tok = sess && sess.data && sess.data.session ? sess.data.session.access_token : null;
    if (!tok) { msg.textContent = 'Please sign in again.'; return; }

    btn.disabled = true; btn.textContent = 'Analyzing…';
    var res;
    try {
      var r = await fetch(URL_ + '/functions/v1/deal-analyzer', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + tok },
        body: JSON.stringify({ data: data })
      });
      res = await r.json();
    } catch (e) { res = { error: 'network' }; }
    btn.disabled = false; btn.textContent = 'Analyze deal (5 credits)';

    if (res && res.ok && res.analysis) {
      out.style.display = 'block';
      out.innerHTML = '<div class="h-eyebrow">Analysis</div>' + md(res.analysis);
      if (typeof res.remaining_credits === 'number') { msg.style.color = '#1a7f4b'; msg.textContent = res.remaining_credits + ' credits left.'; }
      out.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else if (res && res.error === 'insufficient_credits') {
      msg.textContent = 'You’re out of credits (this costs ' + (res.cost || 5) + '). They reset on the 1st, or top up from Settings.';
    } else {
      msg.textContent = 'Couldn’t analyze that just now — try again in a moment.';
    }
  }

  function mount() {
    var anchorNav = document.querySelector('.nav[data-screen="merchant"]') || document.querySelector('.nav[data-screen="settings"]');
    if (!anchorNav) return false;
    if (document.querySelector('.nav[data-screen="deal"]')) return true;
    var side = anchorNav.parentElement;
    var screenParent = (document.querySelector('section.screen') || {}).parentElement;
    if (!side || !screenParent) return false;

    var nav = document.createElement('div');
    nav.className = 'nav'; nav.setAttribute('data-screen', 'deal');
    nav.innerHTML = ICON + 'Deal Analyzer';
    side.insertBefore(nav, anchorNav);

    var sec = document.createElement('section');
    sec.className = 'screen'; sec.id = 'deal'; sec.innerHTML = screenHtml();
    screenParent.appendChild(sec);

    nav.addEventListener('click', function () { activate(nav, sec); });
    sec.querySelector('#da-go').addEventListener('click', function () { run(sec); });

    if (typeof window.show === 'function' && !window.show.__dsDealWrapped) {
      var origShow = window.show;
      var wrapped = function (screen) {
        var o = origShow.apply(this, arguments);
        if (screen !== 'deal') { var el = document.getElementById('deal'); if (el) el.classList.remove('active'); }
        return o;
      };
      wrapped.__dsDealWrapped = true; window.show = wrapped;
    }
    return true;
  }

  var tries = 0;
  (function wait() { if (mount()) return; if (++tries > 80) return; setTimeout(wait, 250); })();
})();


/* ------------------------------------------------------------------ *
 * 20) ADMIN — Client Progress Analysis button on the client detail.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsProg) return; window.__dsProg = true;
  var URL_ = 'https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var sb = null;
  async function ensureSb() { if (sb) return sb; if (window.__dsSB) { sb = window.__dsSB; return sb; } var m = await import('https://esm.sh/@supabase/supabase-js@2.45.0'); sb = m.createClient(URL_, ANON, { auth: { storageKey: 'sb-dehttbxrkeqhsfkfpfwt-auth-token', persistSession: true, autoRefreshToken: true } }); window.__dsSB = sb; return sb; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function md(s) { s = esc(s); s = s.replace(/^###\s?(.*)$/gm, '<div style="font-weight:700;margin:12px 0 4px">$1</div>'); s = s.replace(/^##\s?(.*)$/gm, '<div style="font-weight:800;font-size:15px;margin:16px 0 6px;border-top:1px solid #EEF0F4;padding-top:10px">$1</div>'); s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>'); s = s.replace(/^\s*[-*]\s+/gm, '• '); s = s.replace(/\n/g, '<br>'); return s; }
  async function analyze(clientId, panel, btn) {
    btn.disabled = true; btn.textContent = 'Analyzing…';
    var res;
    try { var s = await ensureSb(); var sess = await s.auth.getSession(); var tok = sess.data.session ? sess.data.session.access_token : null;
      var r = await fetch(URL_ + '/functions/v1/progress-analyzer', { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + tok }, body: JSON.stringify({ client_id: clientId }) }); res = await r.json();
    } catch (e) { res = { error: 'network' }; }
    btn.disabled = false; btn.textContent = 'Analyze progress';
    panel.style.display = 'block';
    panel.innerHTML = (res && res.ok && res.analysis) ? md(res.analysis) : '<div class="small mut">Couldn’t analyze right now — try again.</div>';
  }
  function inject(clientId, inner) {
    if (document.getElementById('ds-prog-card')) return;
    var card = document.createElement('div'); card.id = 'ds-prog-card'; card.className = 'card pad'; card.style.marginBottom = '14px';
    card.innerHTML = '<div class="h-eyebrow">Team tool</div>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">'
      + '<div><b>AI Progress Analysis</b><div class="small mut">Summary, next actions & risks from this client’s activity.</div></div>'
      + '<button id="ds-prog-btn" class="btn primary">Analyze progress</button></div>'
      + '<div id="ds-prog-panel" style="display:none;margin-top:12px"></div>';
    inner.insertBefore(card, inner.firstChild);
    card.querySelector('#ds-prog-btn').addEventListener('click', function () { analyze(clientId, card.querySelector('#ds-prog-panel'), card.querySelector('#ds-prog-btn')); });
  }
  (function hook() {
    if (typeof window.openClient !== 'function') { setTimeout(hook, 300); return; }
    var orig = window.openClient;
    window.openClient = function (id) {
      var out = orig.apply(this, arguments);
      var n = 0; (function t() { if (document.getElementById('ds-prog-card')) return; var inner = document.getElementById('clientInner'); var ready = document.getElementById('pf_name'); if (inner && ready) { inject(id, inner); return; } if (++n > 60) return; setTimeout(t, 150); })();
      return out;
    };
  })();
})();


/* ------------------------------------------------------------------ *
 * 21) ADMIN — Credits screen (settings + per-client balances + top-up).
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsCredAdmin) return; window.__dsCredAdmin = true;
  var URL_ = 'https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var sb = null, SET = null, CLIENTS = [], CR = {};
  async function ensureSb() { if (sb) return sb; if (window.__dsSB) { sb = window.__dsSB; return sb; } var m = await import('https://esm.sh/@supabase/supabase-js@2.45.0'); sb = m.createClient(URL_, ANON, { auth: { storageKey: 'sb-dehttbxrkeqhsfkfpfwt-auth-token', persistSession: true, autoRefreshToken: true } }); window.__dsSB = sb; return sb; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function toast(m) { try { if (typeof window.toast === 'function') window.toast(m); } catch (e) {} }
  function avail(id) { var a = SET ? SET.monthly_allowance : 100; var r = CR[id]; var used = r ? r.monthly_used : 0; var pur = r ? r.purchased_balance : 0; return Math.max(0, a - used) + pur; }
  async function isAdmin() { var s = await ensureSb(); var u = await s.auth.getUser(); var id = u.data.user ? u.data.user.id : null; if (!id) return false; var r = await s.from('profiles').select('role').eq('id', id).single(); return !!(r.data && (r.data.role === 'admin' || r.data.role === 'team')); }
  async function load(sec) {
    var s = await ensureSb();
    var st = await s.from('ai_credit_settings').select('*').eq('id', 'default').single();
    var cl = await s.from('profiles').select('id,full_name,email').eq('role', 'client').order('created_at');
    var cr = await s.from('ai_credits').select('*');
    SET = st.data; CLIENTS = cl.data || []; CR = {}; (cr.data || []).forEach(function (r) { CR[r.client_id] = r; });
    render(sec);
  }
  function render(sec) {
    var rows = CLIENTS.map(function (c) {
      return '<tr style="border-bottom:1px solid #EEF0F4"><td style="padding:8px 10px">' + esc(c.full_name || c.email || '—') + '<div class="small mut">' + esc(c.email || '') + '</div></td>'
        + '<td style="padding:8px 10px;font-weight:700">' + avail(c.id) + '</td>'
        + '<td style="padding:8px 10px"><input class="field ds-tp" data-id="' + esc(c.id) + '" style="width:90px" placeholder="+ credits" inputmode="numeric"><button class="btn ds-tpb" data-id="' + esc(c.id) + '" style="margin-left:6px;background:#eef1f6;color:#0E1A2B">Add</button></td></tr>';
    }).join('');
    sec.querySelector('#cr-body').innerHTML = '<div class="card pad" style="margin-bottom:16px"><div class="h-eyebrow">Settings</div>'
      + '<div style="display:flex;gap:14px;flex-wrap:wrap;margin-top:8px">'
      + '<div><label class="small mut">Monthly allowance</label><input id="cs_allow" class="field" style="width:120px" value="' + (SET ? SET.monthly_allowance : 100) + '"></div>'
      + '<div><label class="small mut">Coach cost</label><input id="cs_coach" class="field" style="width:90px" value="' + (SET ? SET.cost_coach : 1) + '"></div>'
      + '<div><label class="small mut">Location cost</label><input id="cs_loc" class="field" style="width:90px" value="' + (SET ? SET.cost_location : 2) + '"></div>'
      + '<div><label class="small mut">Deal cost</label><input id="cs_deal" class="field" style="width:90px" value="' + (SET ? SET.cost_deal : 5) + '"></div>'
      + '<div style="align-self:flex-end"><button id="cs_save" class="btn primary">Save</button></div></div>'
      + '<div id="cs_msg" class="small" style="margin-top:8px"></div></div>'
      + '<div class="card" style="padding:0;overflow:hidden"><div style="padding:12px 14px" class="h-eyebrow">Client balances</div>'
      + '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#FBFBFD"><th style="text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;color:#8A8A93">Client</th><th style="text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;color:#8A8A93">Balance</th><th style="text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;color:#8A8A93">Top up</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    sec.querySelector('#cs_save').addEventListener('click', function () { saveSettings(sec); });
    [].forEach.call(sec.querySelectorAll('.ds-tpb'), function (b) { b.addEventListener('click', function () { topup(sec, b.getAttribute('data-id')); }); });
  }
  async function saveSettings(sec) {
    var s = await ensureSb();
    var patch = { monthly_allowance: parseInt(sec.querySelector('#cs_allow').value || '0', 10), cost_coach: parseInt(sec.querySelector('#cs_coach').value || '0', 10), cost_location: parseInt(sec.querySelector('#cs_loc').value || '0', 10), cost_deal: parseInt(sec.querySelector('#cs_deal').value || '0', 10), updated_at: new Date().toISOString() };
    var r = await s.from('ai_credit_settings').update(patch).eq('id', 'default').select('id');
    var msg = sec.querySelector('#cs_msg');
    if (r.error || !r.data || !r.data.length) { msg.style.color = '#c0392b'; msg.textContent = 'Couldn’t save.'; return; }
    msg.style.color = '#1a7f4b'; msg.textContent = 'Saved.'; load(sec);
  }
  async function topup(sec, id) {
    var inp = sec.querySelector('.ds-tp[data-id="' + id + '"]');
    var amt = parseInt((inp && inp.value) || '0', 10);
    if (!(amt > 0)) { toast('Enter a positive number'); return; }
    var s = await ensureSb(); var sess = await s.auth.getSession(); var tok = sess.data.session ? sess.data.session.access_token : null;
    var r = await fetch(URL_ + '/functions/v1/admin-credits', { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': ANON, 'Authorization': 'Bearer ' + tok }, body: JSON.stringify({ client_id: id, amount: amt, reason: 'admin top-up' }) });
    var j = await r.json();
    if (j.ok) { toast('Added ' + amt + ' credits'); load(sec); } else { toast('Top-up failed'); }
  }
  function activate(nav, sec) { [].forEach.call(document.querySelectorAll('.screen'), function (s) { s.classList.remove('active'); }); [].forEach.call(document.querySelectorAll('.nav'), function (n) { n.classList.remove('active'); }); sec.classList.add('active'); nav.classList.add('active'); try { window.scrollTo(0, 0); } catch (e) {} load(sec); }
  var ICON = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9 10h4a2 2 0 0 1 0 4H9"/></svg>';
  async function mount() {
    var anchor = document.querySelector('.nav[data-screen="coachcfg"]') || document.querySelector('.nav[data-screen="mgrid"]') || document.querySelector('.nav[data-screen="settings"]');
    if (!anchor) return false;
    if (document.querySelector('.nav[data-screen="credits"]')) return true;
    if (!(await isAdmin())) return true;
    var side = anchor.parentElement; var screenParent = (document.querySelector('section.screen') || {}).parentElement; if (!side || !screenParent) return false;
    var nav = document.createElement('div'); nav.className = 'nav admin-only'; nav.setAttribute('data-screen', 'credits'); nav.style.display = '';
    nav.innerHTML = ICON + 'Credits <span class="badge-admin" style="margin-left:auto">Admin</span>';
    side.insertBefore(nav, anchor.nextSibling);
    var sec = document.createElement('section'); sec.className = 'screen'; sec.id = 'credits';
    sec.innerHTML = '<div class="wrap" style="max-width:900px"><div class="h-eyebrow">Admin</div><h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 12px">Credits</h1><div id="cr-body"></div></div>';
    screenParent.appendChild(sec);
    nav.addEventListener('click', function () { activate(nav, sec); });
    if (typeof window.show === 'function' && !window.show.__dsCredWrapped) { var o = window.show; var w = function (screen) { var out = o.apply(this, arguments); if (screen !== 'credits') { var el = document.getElementById('credits'); if (el) el.classList.remove('active'); } return out; }; w.__dsCredWrapped = true; window.show = w; }
    return true;
  }
  var tries = 0; (function wait() { mount().then(function (d) { if (d) return; if (++tries > 80) return; setTimeout(wait, 300); }); })();
})();


/* ------------------------------------------------------------------ *
 * 22) CLIENT — credit balance + history on the Settings screen.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';
  if (window.__dsCredClient) return; window.__dsCredClient = true;
  var URL_ = 'https://dehttbxrkeqhsfkfpfwt.supabase.co';
  var ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
  var sb = null;
  async function ensureSb() { if (sb) return sb; if (window.__dsSB) { sb = window.__dsSB; return sb; } var m = await import('https://esm.sh/@supabase/supabase-js@2.45.0'); sb = m.createClient(URL_, ANON, { auth: { storageKey: 'sb-dehttbxrkeqhsfkfpfwt-auth-token', persistSession: true, autoRefreshToken: true } }); window.__dsSB = sb; return sb; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }
  function fmt(d) { if (!d) return ''; try { return new Date(d).toLocaleDateString(); } catch (e) { return ''; } }
  var busy = false;
  async function render() {
    var settings = document.getElementById('settings'); if (!settings) return;
    var host = settings.querySelector('.wrap') || settings;
    if (busy) return; busy = true;
    try {
      var s = await ensureSb(); var u = await s.auth.getUser(); var uid = u.data.user ? u.data.user.id : null; if (!uid) { busy = false; return; }
      var st = await s.from('ai_credit_settings').select('monthly_allowance').eq('id', 'default').single();
      var cr = await s.from('ai_credits').select('*').eq('client_id', uid).maybeSingle();
      var led = await s.from('ai_credit_ledger').select('*').eq('client_id', uid).order('created_at', { ascending: false }).limit(10);
      var allow = st.data ? st.data.monthly_allowance : 100;
      var row = cr.data; var used = row ? row.monthly_used : 0; var pur = row ? row.purchased_balance : 0;
      var bal = Math.max(0, allow - used) + pur;
      var hist = (led.data || []).map(function (e) {
        var lbl = e.feature === 'coach' ? 'Coach' : e.feature === 'deal' ? 'Deal Analyzer' : e.feature === 'location' ? 'Location Finder' : e.feature === 'reset' ? 'Monthly reset' : (e.reason || e.feature || '');
        var sign = e.delta > 0 ? '+' : '';
        return '<div style="display:flex;justify-content:space-between;border-top:1px solid #EEF0F4;padding:6px 0;font-size:13px"><span>' + esc(lbl) + ' <span class="small mut">' + fmt(e.created_at) + '</span></span><span style="font-weight:700;color:' + (e.delta > 0 ? '#1a7f4b' : '#48566b') + '">' + sign + e.delta + '</span></div>';
      }).join('') || '<div class="small mut">No usage yet.</div>';
      var card = document.getElementById('ds-cred-card');
      if (!card) { card = document.createElement('div'); card.id = 'ds-cred-card'; card.className = 'card pad'; card.style.marginBottom = '16px'; host.insertBefore(card, host.firstChild); }
      card.innerHTML = '<div class="h-eyebrow">AI credits</div>'
        + '<div style="display:flex;align-items:baseline;gap:8px;margin:2px 0 4px"><div style="font-size:30px;font-weight:800;color:#0E1A2B">' + bal + '</div><div class="mut">credits available</div></div>'
        + '<div class="small mut" style="margin-bottom:10px">' + Math.max(0, allow - used) + ' of ' + allow + ' monthly + ' + pur + ' purchased. Resets on the 1st.</div>'
        + '<div>' + hist + '</div>';
    } catch (e) {}
    busy = false;
  }
  function hook() {
    if (typeof window.show === 'function' && !window.show.__dsCredCliWrapped) {
      var o = window.show; var w = function (screen) { var out = o.apply(this, arguments); if (screen === 'settings') setTimeout(render, 60); return out; }; w.__dsCredCliWrapped = true; window.show = w;
    }
    if (document.getElementById('settings') && document.getElementById('settings').classList.contains('active')) setTimeout(render, 60);
    document.addEventListener('ds-credits', function () { render(); });
  }
  var n = 0; (function wait() { if (typeof window.show === 'function') { hook(); return; } if (++n > 80) return; setTimeout(wait, 250); })();
})();


/* ---- 23) RE-ORDERS (client): catalog + full order form + Stripe charge ---- */
(function(){'use strict';
if(window.__dsReorder)return;window.__dsReorder=true;
var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';
var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
var sb=null,CAT=[],POLICY='';
async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}
function toast(m){try{if(typeof window.toast==='function')window.toast(m);}catch(e){}}
function money(c){if(c==null)return '';return '$'+(c/100).toFixed(2);}
async function tok(){var s=await ensureSb();var r=await s.auth.getSession();return r.data.session&&r.data.session.access_token;}
async function call(fn,p){var t=await tok();var r=await fetch(URL_+'/functions/v1/'+fn,{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON,'Authorization':'Bearer '+t},body:JSON.stringify(p||{})});return await r.json();}
function qtyOpts(){var o='';for(var i=1;i<=10;i++)o+='<option value="'+i+'">'+i+'</option>';return o;}
function itemRow(it){
  var priced=it.price_cents>0;
  var img=it.image_url?'<img src="'+esc(it.image_url)+'" alt="" style="width:70px;height:70px;object-fit:cover;border-radius:8px;background:#EEF2F6">':'<div style="width:70px;height:70px;border-radius:8px;background:#EEF2F6"></div>';
  return '<div class="ro-item" data-id="'+it.id+'" data-price="'+(it.price_cents||0)+'" data-cat="'+esc(it.category||'')+'" style="display:flex;gap:12px;padding:14px 0;border-top:1px solid #EEF2F6">'
    +'<div style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" class="ro-pick" '+(priced?'':'disabled')+' style="margin-top:6px">'+img+'</div>'
    +'<div style="flex:1"><div style="font-weight:700;color:#0E1A2B">'+esc(it.name)+'</div>'
    +(it.description?'<div class="small mut" style="margin-top:2px;white-space:pre-line">'+esc(it.description)+'</div>':'')
    +'<div style="margin-top:8px;display:flex;align-items:center;gap:8px"><span class="small mut">Quantity</span><select class="ro-qty field" '+(priced?'':'disabled')+' style="width:72px;padding:4px">'+qtyOpts()+'</select></div>'
    +'</div>'
    +'<div style="text-align:right;white-space:nowrap;font-weight:700;color:#0E1A2B">'+(priced?money(it.price_cents):'<span class="small mut">Price on request</span>')+'</div>'
    +'</div>';
}
function addrFields(pfx){
  return '<input class="field" id="'+pfx+'l1" placeholder="Street address" style="width:100%;margin-bottom:6px">'
    +'<input class="field" id="'+pfx+'l2" placeholder="Apt, suite (optional)" style="width:100%;margin-bottom:6px">'
    +'<div style="display:flex;gap:6px;margin-bottom:6px"><input class="field" id="'+pfx+'city" placeholder="City" style="flex:1"><input class="field" id="'+pfx+'state" placeholder="State" style="width:80px"><input class="field" id="'+pfx+'zip" placeholder="ZIP" style="width:100px"></div>';
}
function screenHtml(){
  return '<div class="wrap" style="max-width:860px">'
    +'<div class="h-eyebrow">Operate</div>'
    +'<h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 4px">Re-Orders</h1>'
    +'<p class="mut" style="margin-bottom:12px">Order equipment and supplies. Select items, choose how you want to pay, and check out securely.</p>'
    +'<div class="card pad" style="margin-bottom:14px">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px"><div class="h-eyebrow" style="margin:0">Select items</div>'
    +'<select id="ro-cat" class="field" style="width:200px;padding:6px"><option value="">All categories</option></select></div>'
    +'<div id="ro-list"></div></div>'
    +'<div class="card pad" style="margin-bottom:14px">'
    +'<div class="h-eyebrow" style="margin:0 0 8px">Payment method</div>'
    +'<label style="display:flex;gap:8px;align-items:center;margin-bottom:6px;cursor:pointer"><input type="radio" name="ro-pay" value="card" checked> Credit / debit card <span class="small mut">(+3% processing fee)</span></label>'
    +'<label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="radio" name="ro-pay" value="ach"> ACH bank withdrawal <span class="small mut">(no fee)</span></label>'
    +'<div style="border-top:1px solid #EEF2F6;margin-top:10px;padding-top:10px">'
    +'<div style="display:flex;justify-content:space-between"><span class="small mut">Subtotal</span><span id="ro-sub" class="small">$0.00</span></div>'
    +'<div id="ro-feeRow" style="display:flex;justify-content:space-between"><span class="small mut">Card fee (3%)</span><span id="ro-fee" class="small">$0.00</span></div>'
    +'<div style="display:flex;justify-content:space-between;font-weight:800;color:#0E1A2B;margin-top:4px"><span>Total</span><span id="ro-total">$0.00</span></div>'
    +'</div></div>'
    +'<div class="card pad" style="margin-bottom:14px">'
    +'<div class="h-eyebrow" style="margin:0 0 8px">Your details</div>'
    +'<input class="field" id="ro-name" placeholder="Full name" style="width:100%;margin-bottom:6px">'
    +'<input class="field" id="ro-email" placeholder="Email" style="width:100%;margin-bottom:6px">'
    +'<input class="field" id="ro-merch" placeholder="Merchant / location (optional)" style="width:100%">'
    +'<div class="h-eyebrow" style="margin:14px 0 8px">Shipping address</div>'+addrFields('ro-s-')
    +'<label style="display:flex;gap:8px;align-items:center;margin:8px 0;cursor:pointer"><input type="checkbox" id="ro-samebill" checked> Billing address same as shipping</label>'
    +'<div id="ro-billbox" style="display:none"><div class="h-eyebrow" style="margin:6px 0 8px">Billing address</div>'+addrFields('ro-b-')+'</div>'
    +'<div class="h-eyebrow" style="margin:14px 0 6px">Special requests or notes</div>'
    +'<textarea class="field" id="ro-notes" rows="3" style="width:100%" placeholder="Anything we should know?"></textarea>'
    +'</div>'
    +'<div class="card pad" style="margin-bottom:14px">'
    +'<div class="h-eyebrow" style="margin:0 0 6px">Refund policy</div>'
    +'<div id="ro-policy" class="small mut" style="white-space:pre-line;max-height:150px;overflow:auto;background:#F7FAFC;border:1px solid #EEF2F6;border-radius:8px;padding:10px;margin-bottom:8px"></div>'
    +'<label style="display:flex;gap:8px;align-items:center;cursor:pointer"><input type="checkbox" id="ro-ack"> I have read and accept the refund policy.</label>'
    +'</div>'
    +'<div id="ro-msg" class="small" style="min-height:18px;margin-bottom:6px"></div>'
    +'<button id="ro-submit" class="btn primary" style="width:100%;justify-content:center">Place order</button>'
    +'<div class="card pad" style="margin-top:18px"><div class="h-eyebrow" style="margin:0 0 8px">Your orders</div><div id="ro-orders"></div></div>'
    +'</div>';
}
function selectedItems(root){
  var out=[];
  [].forEach.call(root.querySelectorAll('.ro-item'),function(el){
    var pick=el.querySelector('.ro-pick');
    if(pick&&pick.checked){var qty=parseInt(el.querySelector('.ro-qty').value,10)||1;out.push({id:el.getAttribute('data-id'),qty:qty,price:parseInt(el.getAttribute('data-price'),10)||0});}
  });
  return out;
}
function recompute(root){
  var items=selectedItems(root);
  var sub=items.reduce(function(a,b){return a+b.price*b.qty;},0);
  var pay=(root.querySelector('input[name=ro-pay]:checked')||{}).value||'card';
  var fee=pay==='card'?Math.round(sub*0.03):0;
  root.querySelector('#ro-sub').textContent=money(sub);
  root.querySelector('#ro-fee').textContent=money(fee);
  root.querySelector('#ro-feeRow').style.display=pay==='card'?'flex':'none';
  root.querySelector('#ro-total').textContent=money(sub+fee);
}
function addr(root,pfx){return {line1:root.querySelector('#'+pfx+'l1').value.trim(),line2:root.querySelector('#'+pfx+'l2').value.trim(),city:root.querySelector('#'+pfx+'city').value.trim(),state:root.querySelector('#'+pfx+'state').value.trim(),zip:root.querySelector('#'+pfx+'zip').value.trim()};}
async function submit(root){
  var msg=root.querySelector('#ro-msg');msg.style.color='#c0392b';msg.textContent='';
  var items=selectedItems(root).map(function(x){return {id:x.id,qty:x.qty};});
  if(!items.length){msg.textContent='Select at least one item.';return;}
  var name=root.querySelector('#ro-name').value.trim();
  if(!name){msg.textContent='Enter your full name.';return;}
  var ship=addr(root,'ro-s-');
  if(!ship.line1||!ship.city||!ship.zip){msg.textContent='Enter a complete shipping address.';return;}
  if(!root.querySelector('#ro-ack').checked){msg.textContent='Please accept the refund policy.';return;}
  var same=root.querySelector('#ro-samebill').checked;
  var payload={items:items,full_name:name,email:root.querySelector('#ro-email').value.trim(),merchant_name:root.querySelector('#ro-merch').value.trim(),notes:root.querySelector('#ro-notes').value.trim(),ship:ship,billing_same:same,bill:same?ship:addr(root,'ro-b-'),payment_method:(root.querySelector('input[name=ro-pay]:checked')||{}).value||'card',refund_ack:true};
  var btn=root.querySelector('#ro-submit');btn.disabled=true;btn.textContent='Starting checkout...';
  try{
    var res=await call('create-reorder-checkout',payload);
    if(res.ok&&res.url){window.location.href=res.url;return;}
    msg.textContent=res.message||('Could not start checkout: '+esc(res.error||'unknown'));
  }catch(e){msg.textContent='Checkout error. Please try again.';}
  btn.disabled=false;btn.textContent='Place order';
}
async function loadOrders(root){
  try{var s=await ensureSb();var u=await s.auth.getUser();var id=u.data.user.id;
  var r=await s.from('reorders').select('*').eq('client_id',id).order('created_at',{ascending:false}).limit(20);
  var rows=r.data||[];var el=root.querySelector('#ro-orders');if(!el)return;
  if(!rows.length){el.innerHTML='<div class="small mut">No orders yet.</div>';return;}
  el.innerHTML=rows.map(function(o){
var d=new Date(o.created_at);
var its=(o.order_items&&o.order_items.length)?o.order_items.map(function(i){return i.qty+'x '+esc(i.name);}).join(', '):(esc(o.item_name||''));
var st=o.status||'pending';
var LB={paid:'Paid',processing:'Processing — ACH clearing',pending:'Pending payment',payment_failed:'Payment failed',shipped:'Shipped',completed:'Completed',cancelled:'Cancelled',refunded:'Refunded',error:'Error'};
var lab=LB[st]||st;
var col=(st==='paid'||st==='shipped'||st==='completed')?'#1a7f4b':((st==='payment_failed'||st==='cancelled')?'#b42318':((st==='processing'||st==='pending')?'#8a6d1a':'#64748B'));
var ship=[o.ship_line1,o.ship_city,o.ship_state].filter(Boolean).join(', ');
var pay=(o.payment_method==='ach'?'ACH':'Card');
var sub=(o.subtotal_cents!=null?o.subtotal_cents:(o.total_cents!=null?o.total_cents:o.amount_total));
var fee=(o.surcharge_cents||0);
var tot=(o.total_cents!=null?o.total_cents:o.amount_total);
var lines=(o.order_items&&o.order_items.length)?o.order_items.map(function(i){return '<div style="display:flex;justify-content:space-between"><span>'+i.qty+' &times; '+esc(i.name)+'</span><span>'+money((i.price_cents||0)*(i.qty||1))+'</span></div>';}).join(''):('<div>'+esc(o.item_name||'')+'</div>');
function addr(p){return [o[p+'line1'],o[p+'line2'],[o[p+'city'],o[p+'state']].filter(Boolean).join(', ')+(o[p+'zip']?' '+o[p+'zip']:'')].filter(function(x){return x&&String(x).trim()&&String(x).trim()!==',';}).map(esc).join('<br>');}
var shipFull=addr('ship_');
var billFull=o.billing_same?'Same as shipping':addr('bill_');
var dd=new Date(o.created_at||Date.now());
var inv='DS-'+(''+dd.getFullYear()+String(dd.getMonth()+1).padStart(2,'0')+String(dd.getDate()).padStart(2,'0'))+'-'+String(o.id||'').slice(0,6).toUpperCase();
var note=(st==='processing')?'<div class="small" style="color:#8a6d1a;margin:6px 0">Your ACH bank transfer is still clearing. This order is marked paid and prepared for fulfillment once it clears.</div>':'';
var bs='display:inline-block;margin:8px 8px 0 0;padding:8px 12px;border:1px solid #D5DBE1;border-radius:8px;background:#fff;cursor:pointer;font-weight:600;font-size:13px';
var detail='<div style="background:#F8FAFC;border:1px solid #EEF2F6;border-radius:10px;padding:12px;margin-top:6px">'
+'<div class="small mut" style="margin-bottom:6px">Invoice '+inv+'</div>'
+lines
+'<div style="border-top:1px solid #E6EAEF;margin:8px 0 4px"></div>'
+'<div style="display:flex;justify-content:space-between"><span class="mut">Subtotal</span><span>'+money(sub)+'</span></div>'
+(fee>0?'<div style="display:flex;justify-content:space-between"><span class="mut">Card fee (3%)</span><span>'+money(fee)+'</span></div>':'')
+'<div style="display:flex;justify-content:space-between;font-weight:700"><span>Total</span><span>'+money(tot)+'</span></div>'
+'<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:10px"><div><div class="small mut">Ship to</div><div class="small">'+(shipFull||'—')+'</div></div><div><div class="small mut">Bill to</div><div class="small">'+(billFull||'—')+'</div></div><div><div class="small mut">Payment</div><div class="small">'+pay+'</div></div></div>'
+note
+'<div><button data-inv-act="pdf" data-oid="'+o.id+'" style="'+bs+'">Download PDF</button>'
+'<button data-inv-act="print" data-oid="'+o.id+'" style="'+bs+'">Print</button>'
+'<button data-inv-act="email" data-oid="'+o.id+'" style="'+bs+'">Email me the invoice</button></div>'
+'</div>';
return '<div class="ds-ord" data-oid="'+o.id+'">'
+'<div data-inv-toggle="'+o.id+'" style="cursor:pointer;padding:8px 0;border-top:1px solid #EEF2F6">'
+'<div style="display:flex;justify-content:space-between;align-items:center"><div class="small" style="font-weight:600">'+its+'</div><div class="small" style="font-weight:700;color:'+col+'">'+lab+' <span class="ds-ord-caret" style="color:#9AA5B1">&#9656;</span></div></div>'
+'<div class="small mut">'+money(tot)+' - '+pay+' - '+d.toLocaleDateString()+(ship?' - ships to '+esc(ship):'')+'</div>'
+'</div><div class="ds-ord-d" style="display:none">'+detail+'</div></div>';
}).join('');
  }catch(e){}
}
async function loadData(root){
  var s=await ensureSb();
  var r=await s.from('reorder_catalog').select('*').eq('active',true).order('category',{ascending:true}).order('sort',{ascending:true});
  CAT=r.data||[];
  var cats=[];CAT.forEach(function(c){if(c.category&&cats.indexOf(c.category)<0)cats.push(c.category);});
  var catSel=root.querySelector('#ro-cat');
  catSel.innerHTML='<option value="">All categories</option>'+cats.map(function(c){return '<option value="'+esc(c)+'">'+esc(c)+'</option>';}).join('');
  renderList(root);
  var pol=await s.from('reorder_config').select('refund_policy').eq('id','default').single();
  POLICY=(pol.data&&pol.data.refund_policy)||'Contact your rep for the current refund policy.';
  root.querySelector('#ro-policy').textContent=POLICY;
  // prefill email
  var u=await s.auth.getUser();if(u.data.user&&u.data.user.email)root.querySelector('#ro-email').value=u.data.user.email;
  loadOrders(root);
}
function renderList(root){
  var f=root.querySelector('#ro-cat').value;
  var list=CAT.filter(function(c){return !f||c.category===f;});
  root.querySelector('#ro-list').innerHTML=list.length?list.map(itemRow).join(''):'<div class="small mut" style="padding:10px 0">No items in this category.</div>';
  recompute(root);
}
function activate(root){recompute(root);}
var RO_ICON='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h2l2 13h11l2-8H6"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/></svg>';
function mount(){
  var screenParent=(document.querySelector('section.screen')||{}).parentElement;
  if(!screenParent)return false;
  var nav=document.querySelector('.nav[data-screen="reorders"]');
  if(!nav){
    var anchor=document.querySelector('.nav[data-screen="reachout"]')||document.querySelector('.nav[data-screen="merchant"]')||document.querySelector('.nav[data-screen="settings"]')||document.querySelector('.nav');
    if(!anchor||!anchor.parentElement)return false;
    nav=document.createElement('div');nav.className='nav';nav.setAttribute('data-screen','reorders');nav.innerHTML=RO_ICON+'Re-Orders';
    anchor.parentElement.insertBefore(nav,anchor.nextSibling);
  }
  var sec=document.getElementById('reorders');
  if(!sec){sec=document.createElement('section');sec.className='screen';sec.id='reorders';screenParent.appendChild(sec);}
  if(sec.getAttribute('data-dsro'))return true;
  sec.setAttribute('data-dsro','1');
  sec.innerHTML=screenHtml();var root=sec;
  root.querySelector('#ro-cat').addEventListener('change',function(){renderList(root);});
  root.querySelector('#ro-list').addEventListener('change',function(){recompute(root);});
  [].forEach.call(root.querySelectorAll('input[name=ro-pay]'),function(r){r.addEventListener('change',function(){recompute(root);});});
  root.querySelector('#ro-samebill').addEventListener('change',function(e){root.querySelector('#ro-billbox').style.display=e.target.checked?'none':'block';});
  root.querySelector('#ro-submit').addEventListener('click',function(){submit(root);});
  nav.addEventListener('click',function(){setTimeout(function(){loadOrders(root);recompute(root);},250);});
  loadData(root);
  return true;
}
var n=0;(function wait(){if(mount()===true||++n>100)return;setTimeout(wait,250);})();
})();
/* ---- 24) MY MERCHANTS (client CRM) ---- */
(function(){'use strict';if(window.__dsMyMerch)return;window.__dsMyMerch=true;var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';var sb=null;async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}function toast(m){try{if(typeof window.toast==='function')window.toast(m);}catch(e){}}
var STAGES=[['lead','Lead'],['submitted','Submitted'],['need_ein','Need EIN letter'],['partially_approved','Partially approved'],['approved','Approved'],['live','Live'],['lost','Lost']];
var SC={lead:'#8A8A93',submitted:'#2F6BFF',need_ein:'#B8860B',partially_approved:'#B8860B',approved:'#1a7f4b',live:'#1a7f4b',lost:'#c0392b'};
var ICON='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/></svg>';
function stageOpts(v){return STAGES.map(function(s){return '<option value="'+s[0]+'"'+(s[0]===v?' selected':'')+'>'+s[1]+'</option>';}).join('');}
function screenHtml(){return '<div class="wrap" style="max-width:820px"><div class="h-eyebrow">Pipeline</div><h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 6px">My Merchants</h1><p class="mut" style="margin-bottom:12px">Every merchant you’ve submitted shows here automatically. Add prospects you’re working and track each one through the pipeline.</p><div class="card pad" style="margin-bottom:14px"><div id="mm-script-head" style="display:flex;justify-content:space-between;align-items:center;cursor:pointer"><b>📞 Sales scripts</b><span id="mm-script-caret" class="mut">▸</span></div><div id="mm-scripts" style="display:none;margin-top:10px"></div></div><div class="card pad" style="margin-bottom:14px;display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap"><div style="flex:1;min-width:200px"><label style="font-size:12.5px;font-weight:700">Add a merchant prospect</label><input id="mm-new" class="field" style="width:100%" placeholder="Business name"></div><button id="mm-add" class="btn primary">Add</button></div><div id="mm-list"></div></div>';}
async function loadScripts(sec){var s=await ensureSb();var r=await s.from('marketing_resources').select('*').eq('kind','script').order('sort');var box=sec.querySelector('#mm-scripts');box.innerHTML=(r.data&&r.data.length)?r.data.map(function(x){return '<div style="border-top:1px solid #EEF0F4;padding:8px 0"><b class="small">'+esc(x.title)+'</b><div class="small" style="white-space:pre-wrap;color:#48566b;margin-top:2px">'+esc(x.body||'')+'</div></div>';}).join(''):'<div class="small mut">No scripts yet.</div>';}
async function load(sec){var s=await ensureSb();var r=await s.from('merchant_applications').select('id,merchant_name,stage,source,notes,data,created_at').order('created_at',{ascending:false});var rows=r.data||[];sec.querySelector('#mm-list').innerHTML=rows.length?('<div class="card" style="padding:0;overflow:hidden">'+rows.map(function(x){var nm=x.merchant_name||(x.data&&x.data.business_name)||'—';var c=SC[x.stage]||'#8A8A93';return '<div style="border-bottom:1px solid #EEF0F4;padding:12px 14px"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><b>'+esc(nm)+'</b> <span class="small mut">'+(x.source==='manual'?'prospect':'submitted')+'</span></div><select data-stage="'+x.id+'" style="border:1px solid '+c+'55;color:'+c+';font-weight:700;border-radius:20px;padding:4px 8px;font-size:11.5px;background:'+c+'11">'+stageOpts(x.stage)+'</select></div><input data-note="'+x.id+'" class="field" style="width:100%;margin-top:8px;font-size:12.5px" placeholder="Notes" value="'+esc(x.notes||'')+'"></div>';}).join('')+'</div>'):'<div class="card pad"><div class="small mut">No merchants yet. Add a prospect above, or submit a Merchant Application.</div></div>';wire(sec);}
function wire(sec){var list=sec.querySelector('#mm-list');if(list.__w)return;list.__w=true;list.addEventListener('change',async function(e){var sel=e.target.closest&&e.target.closest('select[data-stage]');if(!sel)return;var s=await ensureSb();var r=await s.from('merchant_applications').update({stage:sel.value}).eq('id',sel.getAttribute('data-stage')).select('id');if(r.error||!r.data||!r.data.length){toast('Couldn’t update');return;}toast('Stage updated');var c=SC[sel.value]||'#8A8A93';sel.style.color=c;sel.style.borderColor=c+'55';sel.style.background=c+'11';});var t;list.addEventListener('input',function(e){var inp=e.target.closest&&e.target.closest('input[data-note]');if(!inp)return;clearTimeout(t);t=setTimeout(async function(){var s=await ensureSb();await s.from('merchant_applications').update({notes:inp.value}).eq('id',inp.getAttribute('data-note'));},700);});}
async function add(sec){var nm=(sec.querySelector('#mm-new').value||'').trim();if(!nm){toast('Enter a name');return;}var s=await ensureSb();var u=await s.auth.getUser();var uid=u.data.user&&u.data.user.id;if(!uid)return;var r=await s.from('merchant_applications').insert({client_id:uid,merchant_name:nm,stage:'lead',source:'manual',data:{}}).select('id');if(r.error){toast('Couldn’t add');return;}sec.querySelector('#mm-new').value='';load(sec);}
function activate(nav,sec){[].forEach.call(document.querySelectorAll('.screen'),function(s){s.classList.remove('active');});[].forEach.call(document.querySelectorAll('.nav'),function(n){n.classList.remove('active');});sec.classList.add('active');nav.classList.add('active');try{window.scrollTo(0,0);}catch(e){}loadScripts(sec);load(sec);}
function mount(){var anchor=document.querySelector('.nav[data-screen="settings"]');if(!anchor)return false;if(document.querySelector('.nav[data-screen="mymerch"]'))return true;var side=anchor.parentElement;var sp=(document.querySelector('section.screen')||{}).parentElement;if(!side||!sp)return false;var nav=document.createElement('div');nav.className='nav';nav.setAttribute('data-screen','mymerch');nav.innerHTML=ICON+'My Merchants';side.insertBefore(nav,anchor);var sec=document.createElement('section');sec.className='screen';sec.id='mymerch';sec.innerHTML=screenHtml();sp.appendChild(sec);nav.addEventListener('click',function(){activate(nav,sec);});sec.querySelector('#mm-add').addEventListener('click',function(){add(sec);});sec.querySelector('#mm-script-head').addEventListener('click',function(){var b=sec.querySelector('#mm-scripts');var open=b.style.display!=='none';b.style.display=open?'none':'block';sec.querySelector('#mm-script-caret').textContent=open?'▸':'▾';});if(typeof window.show==='function'&&!window.show.__dsMyMerchW){var o=window.show;var w=function(x){var out=o.apply(this,arguments);if(x!=='mymerch'){var el=document.getElementById('mymerch');if(el)el.classList.remove('active');}return out;};w.__dsMyMerchW=true;window.show=w;}return true;}
var tr=0;(function wait(){if(mount())return;if(++tr>80)return;setTimeout(wait,250);})();})();


/* ---- 25) SALES & MARKETING RESOURCES (client) ---- */
(function(){'use strict';if(window.__dsSMR)return;window.__dsSMR=true;var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';var sb=null;async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}function toast(m){try{if(typeof window.toast==='function')window.toast(m);}catch(e){}}async function isAdmin(){var s=await ensureSb();var u=await s.auth.getUser();var id=u.data.user&&u.data.user.id;if(!id)return false;var r=await s.from('profiles').select('role').eq('id',id).single();return !!(r.data&&(r.data.role==='admin'||r.data.role==='team'));}
var ICON='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4zM8 8h8M8 12h8M8 16h5"/></svg>';
function screenHtml(){return '<div class="wrap" style="max-width:820px"><div class="h-eyebrow">Toolbox</div><h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 6px">Sales & Marketing Resources</h1><p class="mut" style="margin-bottom:16px">Scripts, marketing materials, and links to use with prospects.</p><div id="smr-body"></div></div>';}
async function load(sec){var s=await ensureSb();var r=await s.from('marketing_resources').select('*').order('sort').order('created_at');var rows=r.data||[];function grp(k){return rows.filter(function(x){return x.kind===k;});}var out='';var scripts=grp('script');if(scripts.length){out+='<div class="card pad" style="margin-bottom:14px"><div class="h-eyebrow">Scripts</div>'+scripts.map(function(x){return '<div style="border-top:1px solid #EEF0F4;padding:10px 0"><div style="display:flex;justify-content:space-between;align-items:center"><b>'+esc(x.title)+'</b><button class="btn" data-copy="'+x.id+'" style="background:#eef1f6;color:#0E1A2B;font-size:12px">Copy</button></div><div class="small" style="white-space:pre-wrap;color:#48566b;margin-top:4px" id="smr-s-'+x.id+'">'+esc(x.body||'')+'</div></div>';}).join('')+'</div>';}var pdfs=grp('pdf');if(pdfs.length){out+='<div class="card pad" style="margin-bottom:14px"><div class="h-eyebrow">Marketing materials</div>'+pdfs.map(function(x){return '<div style="border-top:1px solid #EEF0F4;padding:10px 0;display:flex;justify-content:space-between;align-items:center"><b>'+esc(x.title)+'</b><a class="btn primary" style="font-size:12px" href="'+esc(x.url||'#')+'" target="_blank" rel="noopener">Download</a></div>';}).join('')+'</div>';}var links=grp('link');if(links.length){out+='<div class="card pad"><div class="h-eyebrow">Links</div>'+links.map(function(x){return '<div style="border-top:1px solid #EEF0F4;padding:10px 0;display:flex;justify-content:space-between;align-items:center"><b>'+esc(x.title)+'</b><a class="btn" style="background:#eef1f6;color:#0E1A2B;font-size:12px" href="'+esc(x.url||'#')+'" target="_blank" rel="noopener">Open</a></div>';}).join('')+'</div>';}sec.querySelector('#smr-body').innerHTML=out||'<div class="card pad"><div class="small mut">No resources yet.</div></div>';var body=sec.querySelector('#smr-body');if(!body.__w){body.__w=true;body.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-copy]');if(!b)return;var el=document.getElementById('smr-s-'+b.getAttribute('data-copy'));if(el){try{navigator.clipboard.writeText(el.textContent);toast('Copied');}catch(x){}}});}}
function activate(nav,sec){[].forEach.call(document.querySelectorAll('.screen'),function(s){s.classList.remove('active');});[].forEach.call(document.querySelectorAll('.nav'),function(n){n.classList.remove('active');});sec.classList.add('active');nav.classList.add('active');try{window.scrollTo(0,0);}catch(e){}load(sec);}
function mount(){var anchor=document.querySelector('.nav[data-screen="settings"]');if(!anchor)return false;if(document.querySelector('.nav[data-screen="smr"]'))return true;var side=anchor.parentElement;var sp=(document.querySelector('section.screen')||{}).parentElement;if(!side||!sp)return false;var nav=document.createElement('div');nav.className='nav';nav.setAttribute('data-screen','smr');nav.innerHTML=ICON+'Sales & Marketing Resources';side.insertBefore(nav,anchor);var sec=document.createElement('section');sec.className='screen';sec.id='smr';sec.innerHTML=screenHtml();sp.appendChild(sec);nav.addEventListener('click',function(){activate(nav,sec);});if(typeof window.show==='function'&&!window.show.__dsSMRW){var o=window.show;var w=function(x){var out=o.apply(this,arguments);if(x!=='smr'){var el=document.getElementById('smr');if(el)el.classList.remove('active');}return out;};w.__dsSMRW=true;window.show=w;}return true;}
var tr=0;(function wait(){if(mount())return;if(++tr>80)return;setTimeout(wait,250);})();})();

/* ---- 26) ADMIN — manage Sales & Marketing Resources ---- */
(function(){'use strict';if(window.__dsSMRAdmin)return;window.__dsSMRAdmin=true;var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';var sb=null;async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}function toast(m){try{if(typeof window.toast==='function')window.toast(m);}catch(e){}}async function isAdmin(){var s=await ensureSb();var u=await s.auth.getUser();var id=u.data.user&&u.data.user.id;if(!id)return false;var r=await s.from('profiles').select('role').eq('id',id).single();return !!(r.data&&(r.data.role==='admin'||r.data.role==='team'));}
var ICON='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M4 20V4l7 8-7 8zM14 4h6v6"/></svg>';
function screenHtml(){return '<div class="wrap" style="max-width:820px"><div class="h-eyebrow">Admin</div><h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 10px">Manage Resources</h1><div class="card pad" style="margin-bottom:14px"><div class="h-eyebrow">Add</div><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:8px"><select id="mra-kind" class="field" style="width:130px"><option value="script">Script</option><option value="pdf">PDF / material</option><option value="link">Link</option></select><input id="mra-title" class="field" style="flex:1;min-width:180px" placeholder="Title"><input id="mra-cat" class="field" style="width:130px" placeholder="Category"></div><textarea id="mra-body" class="field" rows="2" style="width:100%;margin-top:8px" placeholder="Script text (for scripts)"></textarea><input id="mra-url" class="field" style="width:100%;margin-top:8px" placeholder="URL (for PDF / link)"><div style="margin-top:8px"><button id="mra-add" class="btn primary">Add resource</button></div></div><div id="mra-list"></div></div>';}
async function load(sec){var s=await ensureSb();var r=await s.from('marketing_resources').select('*').order('kind').order('sort');var rows=r.data||[];sec.querySelector('#mra-list').innerHTML='<div class="card" style="padding:0;overflow:hidden">'+(rows.length?rows.map(function(x){return '<div style="border-bottom:1px solid #EEF0F4;padding:10px 14px;display:flex;justify-content:space-between;align-items:center;gap:10px"><div><span class="pill mut" style="font-size:10.5px">'+esc(x.kind)+'</span> <b>'+esc(x.title)+'</b> <span class="small mut">'+esc(x.category||'')+'</span></div><a href="#" data-del="'+x.id+'" class="small" style="color:#c0392b">Delete</a></div>';}).join(''):'<div style="padding:16px" class="small mut">No resources.</div>')+'</div>';var list=sec.querySelector('#mra-list');list.addEventListener('click',async function(e){var a=e.target.closest&&e.target.closest('[data-del]');if(!a)return;e.preventDefault();if(!window.confirm('Delete this resource?'))return;var s2=await ensureSb();var r2=await s2.from('marketing_resources').delete().eq('id',a.getAttribute('data-del')).select('id');if(r2.error){toast('Couldn’t delete');return;}toast('Deleted');load(sec);});}
async function add(sec){var s=await ensureSb();var kind=sec.querySelector('#mra-kind').value;var title=(sec.querySelector('#mra-title').value||'').trim();if(!title){toast('Add a title');return;}var r=await s.from('marketing_resources').insert({kind:kind,title:title,category:(sec.querySelector('#mra-cat').value||'').trim(),body:(sec.querySelector('#mra-body').value||'').trim()||null,url:(sec.querySelector('#mra-url').value||'').trim()||null}).select('id');if(r.error){toast('Couldn’t add — admin only');return;}toast('Added');sec.querySelector('#mra-title').value='';sec.querySelector('#mra-cat').value='';sec.querySelector('#mra-body').value='';sec.querySelector('#mra-url').value='';load(sec);}
function activate(nav,sec){[].forEach.call(document.querySelectorAll('.screen'),function(s){s.classList.remove('active');});[].forEach.call(document.querySelectorAll('.nav'),function(n){n.classList.remove('active');});sec.classList.add('active');nav.classList.add('active');try{window.scrollTo(0,0);}catch(e){}load(sec);}
async function mount(){var anchor=document.querySelector('.nav[data-screen="coachcfg"]')||document.querySelector('.nav[data-screen="clients"]')||document.querySelector('.nav[data-screen="settings"]');if(!anchor)return false;if(document.querySelector('.nav[data-screen="smradmin"]'))return true;if(!(await isAdmin()))return true;var side=anchor.parentElement;var sp=(document.querySelector('section.screen')||{}).parentElement;if(!side||!sp)return false;var nav=document.createElement('div');nav.className='nav admin-only';nav.setAttribute('data-screen','smradmin');nav.style.display='';nav.innerHTML=ICON+'Resources <span class="badge-admin" style="margin-left:auto">Admin</span>';side.insertBefore(nav,anchor.nextSibling);var sec=document.createElement('section');sec.className='screen';sec.id='smradmin';sec.innerHTML=screenHtml();sp.appendChild(sec);nav.addEventListener('click',function(){activate(nav,sec);});sec.querySelector('#mra-add').addEventListener('click',function(){add(sec);});if(typeof window.show==='function'&&!window.show.__dsSMRAdminW){var o=window.show;var w=function(x){var out=o.apply(this,arguments);if(x!=='smradmin'){var el=document.getElementById('smradmin');if(el)el.classList.remove('active');}return out;};w.__dsSMRAdminW=true;window.show=w;}return true;}
var tr=0;(function wait(){mount().then(function(d){if(d)return;if(++tr>80)return;setTimeout(wait,300);});})();})();


/* ---- 27) ADMIN — Re-order Catalog (images, category, price, refund policy) ---- */
(function(){'use strict';
if(window.__dsCatAdmin)return;window.__dsCatAdmin=true;
var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';
var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
var sb=null;
async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}
function toast(m){try{if(typeof window.toast==='function')window.toast(m);}catch(e){}}
function centsToStr(c){return c==null?'':(c/100).toFixed(2);}
function strToCents(v){var n=parseFloat(String(v).replace(/[^0-9.]/g,''));return isFinite(n)?Math.round(n*100):null;}
async function uploadImage(file){
  var s=await ensureSb();
  var ext=(String(file.name).split('.').pop()||'jpg').toLowerCase().replace(/[^a-z0-9]/g,'')||'jpg';
  var path='reorder/'+Date.now()+'-'+Math.random().toString(36).slice(2,8)+'.'+ext;
  var up=await s.storage.from('resources').upload(path,file,{upsert:true,contentType:file.type||'image/jpeg'});
  if(up.error)throw up.error;
  return s.storage.from('resources').getPublicUrl(path).data.publicUrl;
}
function screenHtml(){
  return '<div class="wrap" style="max-width:820px">'
    +'<div class="h-eyebrow">Admin</div>'
    +'<h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 4px">Re-order Catalog</h1>'
    +'<p class="mut" style="margin-bottom:12px">Items clients can order, plus the refund policy shown at checkout.</p>'
    +'<div class="card pad" style="margin-bottom:14px"><div class="h-eyebrow" style="margin:0 0 6px">Refund policy</div>'
    +'<textarea id="cp-policy" class="field" rows="4" style="width:100%" placeholder="Refund policy shown to clients before they order"></textarea>'
    +'<div style="display:flex;gap:8px;align-items:center;margin-top:6px"><button id="cp-save" class="btn primary" style="padding:5px 14px">Save policy</button><span id="cp-msg" class="small"></span></div></div>'
    +'<div class="card pad" style="margin-bottom:14px"><div class="h-eyebrow" style="margin:0 0 8px">Add item</div>'
    +'<div style="display:flex;gap:6px;margin-bottom:6px"><input id="ca-name" class="field" placeholder="Item name" style="flex:1"><input id="ca-cat" class="field" placeholder="Category" style="width:170px"><input id="ca-price" class="field" placeholder="Price $" style="width:110px"></div>'
    +'<textarea id="ca-desc" class="field" rows="3" style="width:100%;margin-bottom:6px" placeholder="Description (line breaks are kept)"></textarea>'
    +'<div style="display:flex;gap:8px;align-items:center"><label class="small mut">Image <input id="ca-img" type="file" accept="image/*" style="font-size:12px"></label><button id="ca-add" class="btn primary" style="margin-left:auto">Add item</button></div>'
    +'<div id="ca-amsg" class="small" style="margin-top:6px"></div></div>'
    +'<div id="ca-list"></div></div>';
}
function itemCard(it){
  var img=it.image_url?'<img src="'+esc(it.image_url)+'" style="width:64px;height:64px;object-fit:cover;border-radius:8px">':'<div style="width:64px;height:64px;border-radius:8px;background:#EEF2F6"></div>';
  return '<div class="card pad" data-id="'+it.id+'" style="margin-bottom:8px"><div style="display:flex;gap:10px">'
    +'<div style="text-align:center">'+img+'<div style="margin-top:4px"><label class="small mut" style="cursor:pointer;color:#2F6BFF">Change<input type="file" accept="image/*" class="ca-chimg" style="display:none"></label></div></div>'
    +'<div style="flex:1">'
    +'<div style="display:flex;gap:6px;margin-bottom:6px"><input class="field ca-en" value="'+esc(it.name||'')+'" style="flex:1"><input class="field ca-ec" value="'+esc(it.category||'')+'" placeholder="Category" style="width:150px"><input class="field ca-ep" value="'+centsToStr(it.price_cents)+'" placeholder="$" style="width:90px"></div>'
    +'<textarea class="field ca-ed" rows="2" style="width:100%">'+esc(it.description||'')+'</textarea>'
    +'<div style="display:flex;gap:8px;align-items:center;margin-top:6px"><label class="small" style="display:flex;gap:4px;align-items:center;cursor:pointer"><input type="checkbox" class="ca-ea"'+(it.active?' checked':'')+'>Active</label><div style="flex:1"></div><button class="btn ca-save" style="padding:3px 10px">Save</button><button class="btn ca-del" style="padding:3px 10px">Delete</button></div>'
    +'</div></div></div>';
}
async function loadPolicy(sec){var s=await ensureSb();var r=await s.from('reorder_config').select('refund_policy').eq('id','default').single();if(r.data)sec.querySelector('#cp-policy').value=r.data.refund_policy||'';}
async function loadList(sec){var s=await ensureSb();var r=await s.from('reorder_catalog').select('*').order('category',{ascending:true}).order('sort',{ascending:true}).order('created_at',{ascending:true});var rows=r.data||[];var el=sec.querySelector('#ca-list');el.innerHTML=rows.length?rows.map(itemCard).join(''):'<div class="small mut">No items yet.</div>';}
async function savePolicy(sec){var s=await ensureSb();var u=await s.auth.getUser();var email=u.data.user?u.data.user.email:null;var msg=sec.querySelector('#cp-msg');msg.style.color='#c0392b';var r=await s.from('reorder_config').update({refund_policy:sec.querySelector('#cp-policy').value,updated_at:new Date().toISOString(),updated_by_email:email}).eq('id','default').select('id');if(r.error||!r.data||!r.data.length){msg.textContent='Could not save (admin only).';return;}msg.style.color='#1a7f4b';msg.textContent='Saved.';}
async function addItem(sec){
  var msg=sec.querySelector('#ca-amsg');msg.style.color='#c0392b';msg.textContent='';
  var name=sec.querySelector('#ca-name').value.trim();if(!name){msg.textContent='Enter an item name.';return;}
  var cents=strToCents(sec.querySelector('#ca-price').value);
  var btn=sec.querySelector('#ca-add');btn.disabled=true;btn.textContent='Adding...';
  try{
    var img=null;var f=sec.querySelector('#ca-img').files[0];if(f)img=await uploadImage(f);
    var s=await ensureSb();
    var row={name:name,category:sec.querySelector('#ca-cat').value.trim()||null,description:sec.querySelector('#ca-desc').value||null,price_cents:cents,price_display:cents!=null?('$'+(cents/100).toFixed(2)):null,image_url:img,active:true};
    var r=await s.from('reorder_catalog').insert(row).select('id');
    if(r.error){msg.textContent='Could not add: '+esc(r.error.message);}
    else{sec.querySelector('#ca-name').value='';sec.querySelector('#ca-cat').value='';sec.querySelector('#ca-price').value='';sec.querySelector('#ca-desc').value='';sec.querySelector('#ca-img').value='';msg.style.color='#1a7f4b';msg.textContent='Added.';loadList(sec);}
  }catch(e){msg.textContent='Upload or save failed.';}
  btn.disabled=false;btn.textContent='Add item';
}
function activate(nav,sec){[].forEach.call(document.querySelectorAll('.nav'),function(n){n.classList.remove('active');});nav.classList.add('active');try{window.scrollTo(0,0);}catch(e){}loadPolicy(sec);loadList(sec);}
async function isAdmin(){var s=await ensureSb();var u=await s.auth.getUser();var id=u&&u.data&&u.data.user?u.data.user.id:null;if(!id)return false;var r=await s.from('profiles').select('role').eq('id',id).single();return !!(r.data&&(r.data.role==='admin'||r.data.role==='team'));}
var ICON='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4 8 4 8-4z"/><path d="M4 7v10l8 4 8-4V7"/></svg>';
async function mount(){
  var anchorNav=document.querySelector('.nav[data-screen="catadmin"]');
  if(anchorNav)return true;
  var anchor=document.querySelector('.nav[data-screen="mgrid"]')||document.querySelector('.nav[data-screen="coachcfg"]')||document.querySelector('.nav[data-screen="clients"]');
  if(!anchor)return false;
  if(!(await isAdmin()))return true;
  var screenParent=(document.querySelector('section.screen')||{}).parentElement;if(!anchor.parentElement||!screenParent)return false;
  var nav=document.createElement('div');nav.className='nav admin-only';nav.setAttribute('data-screen','catadmin');nav.innerHTML=ICON+'Re-order Catalog <span class="badge-admin" style="margin-left:auto">Admin</span>';
  anchor.parentElement.insertBefore(nav,anchor.nextSibling);
  var sec=document.createElement('section');sec.className='screen';sec.id='catadmin';sec.innerHTML=screenHtml();screenParent.appendChild(sec);
  nav.addEventListener('click',function(){activate(nav,sec);});
  sec.querySelector('#cp-save').addEventListener('click',function(){savePolicy(sec);});
  sec.querySelector('#ca-add').addEventListener('click',function(){addItem(sec);});
  sec.querySelector('#ca-list').addEventListener('click',async function(e){
    var card=e.target.closest('[data-id]');if(!card)return;var id=card.getAttribute('data-id');var s=await ensureSb();
    if(e.target.classList.contains('ca-save')){
      var cents=strToCents(card.querySelector('.ca-ep').value);
      await s.from('reorder_catalog').update({name:card.querySelector('.ca-en').value,category:card.querySelector('.ca-ec').value||null,description:card.querySelector('.ca-ed').value||null,price_cents:cents,price_display:cents!=null?('$'+(cents/100).toFixed(2)):null,active:card.querySelector('.ca-ea').checked}).eq('id',id);
      toast('Saved');loadList(sec);
    } else if(e.target.classList.contains('ca-del')){
      await s.from('reorder_catalog').delete().eq('id',id);loadList(sec);
    }
  });
  sec.querySelector('#ca-list').addEventListener('change',async function(e){
    if(!e.target.classList.contains('ca-chimg'))return;var card=e.target.closest('[data-id]');var id=card.getAttribute('data-id');var f=e.target.files[0];if(!f)return;
    try{var url=await uploadImage(f);var s=await ensureSb();await s.from('reorder_catalog').update({image_url:url}).eq('id',id);loadList(sec);}catch(err){toast('Image upload failed');}
  });
  return true;
}
var tries=0;(function wait(){mount().then(function(done){if(done)return;if(++tries>80)return;setTimeout(wait,300);});})();
})();
/* ---- 28) REFERRAL LINK — admin field preview + client Settings card ---- */
(function(){'use strict';if(window.__dsRefLink)return;window.__dsRefLink=true;var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';var sb=null;async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}function toast(m){try{if(typeof window.toast==='function')window.toast(m);}catch(e){}}
var BASE='https://merchant.getbitflow.com/sign-up?code=';
function linkFor(c){return c?BASE+encodeURIComponent(c):'';}
/* admin: show copyable link under the pf_bitflow field */
setInterval(function(){var f=document.getElementById('pf_bitflow');if(!f||document.getElementById('pf_bitflow_link'))return;var box=document.createElement('div');box.id='pf_bitflow_link';box.style.marginTop='6px';function render(){var v=(f.value||'').trim();box.innerHTML=v?('<a href="'+linkFor(v)+'" target="_blank" rel="noopener" class="small" style="word-break:break-all">'+esc(linkFor(v))+'</a> <button type="button" data-cp class="btn" style="font-size:11px;background:#eef1f6;color:#0E1A2B;padding:2px 8px">Copy</button>'):'<span class="small mut">Add a code to generate the referral link.</span>';}render();f.parentElement.appendChild(box);f.addEventListener('input',render);box.addEventListener('click',function(e){if(e.target&&e.target.hasAttribute&&e.target.hasAttribute('data-cp')){try{navigator.clipboard.writeText(linkFor((f.value||'').trim()));toast('Copied');}catch(x){}}});},700);
/* client: 'Your referral link' card on Settings */
async function renderCard(){var settings=document.getElementById('settings');if(!settings)return;var host=settings.querySelector('.wrap')||settings;var s=await ensureSb();var u=await s.auth.getUser();var uid=u.data.user&&u.data.user.id;if(!uid)return;var r=await s.from('profiles').select('bitflow_referral_id,role').eq('id',uid).single();if(r.error||!r.data)return;if(r.data.role&&r.data.role!=='client')return;var code=r.data.bitflow_referral_id;var card=document.getElementById('ds-ref-card');if(!card){card=document.createElement('div');card.id='ds-ref-card';card.className='card pad';card.style.marginBottom='16px';var credCard=document.getElementById('ds-cred-card');if(credCard&&credCard.nextSibling){host.insertBefore(card,credCard.nextSibling);}else{host.insertBefore(card,host.firstChild);}}if(code){var link=linkFor(code);card.innerHTML='<div class="h-eyebrow">Your referral link</div><div class="small mut" style="margin-bottom:8px">Share this with merchants to sign them up under you.</div><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input readonly value="'+esc(link)+'" class="field" style="flex:1;min-width:200px;font-size:12.5px" id="ds-ref-input"><button id="ds-ref-copy" class="btn primary" style="font-size:12px">Copy</button></div>';card.querySelector('#ds-ref-copy').addEventListener('click',function(){try{navigator.clipboard.writeText(link);toast('Referral link copied');}catch(x){var i=card.querySelector('#ds-ref-input');i.select();document.execCommand('copy');toast('Copied');}});}else{card.innerHTML='<div class="h-eyebrow">Your referral link</div><div class="small mut">Your referral link isn\u2019t set up yet — your team will assign your code shortly.</div>';}}
function hook(){if(typeof window.show==='function'&&!window.show.__dsRefW){var o=window.show;var w=function(x){var out=o.apply(this,arguments);if(x==='settings')setTimeout(renderCard,120);return out;};w.__dsRefW=true;window.show=w;}if(document.getElementById('settings')&&document.getElementById('settings').classList.contains('active'))setTimeout(renderCard,120);}
var n=0;(function wait(){if(typeof window.show==='function'){hook();return;}if(++n>80)return;setTimeout(wait,250);})();})();


/* ---- 29) RE-ORDER checkout return: confirm + record on redirect ---- */
(function(){'use strict';if(window.__dsReorderConfirm)return;window.__dsReorderConfirm=true;var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';var sb=null;async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}function toast(m){try{if(typeof window.toast==='function')window.toast(m);}catch(e){}}
function clean(){try{history.replaceState({},'',location.pathname+location.hash);}catch(e){}}
async function run(){var p=new URLSearchParams(location.search);var ro=p.get('reorder');if(!ro)return;if(ro==='cancel'){clean();toast('Checkout canceled.');return;}if(ro!=='success')return;var sid=p.get('session_id');clean();if(!sid)return;try{var s=await ensureSb();var sess=await s.auth.getSession();var tok=sess.data.session&&sess.data.session.access_token;if(!tok)return;var r=await fetch(URL_+'/functions/v1/confirm-reorder',{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON,'Authorization':'Bearer '+tok},body:JSON.stringify({session_id:sid})});var j=await r.json();if(j&&j.ok){toast('Order confirmed — thank you!');var nav=document.querySelector('.nav[data-screen="reorders"]');if(nav)setTimeout(function(){nav.click();},400);}}catch(e){}}
var n=0;(function wait(){if(document.querySelector('.nav[data-screen="reorders"]')){run();return;}if(++n>60)return;setTimeout(wait,300);})();})();


/* ---- 30) LOCATION FINDER (Scouter): map radius + type/keyword/hours + history ---- */
(function(){'use strict';
if(window.__dsFinder)return;window.__dsFinder=true;
var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';
var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
var sb=null,map=null,circle=null;
var TYPES=[['','Any business type'],['liquor_store','Liquor / package store'],['convenience_store','Convenience store'],['supermarket','Grocery / supermarket'],['restaurant','Restaurant'],['cafe','Cafe / coffee'],['bar','Bar'],['bakery','Bakery'],['jewelry_store','Jewelry store'],['clothing_store','Clothing / apparel'],['shoe_store','Shoe store'],['furniture_store','Furniture store'],['electronics_store','Electronics store'],['hardware_store','Hardware store'],['home_goods_store','Home goods'],['florist','Florist'],['pet_store','Pet store'],['pharmacy','Pharmacy'],['gas_station','Gas station'],['car_repair','Auto repair'],['car_dealer','Car dealer'],['beauty_salon','Beauty salon'],['hair_salon','Hair salon'],['nail_salon','Nail salon'],['barber_shop','Barber shop'],['spa','Spa'],['gym','Gym / fitness'],['laundry','Laundry / dry cleaning'],['book_store','Book store'],['store','General retail store']];
var DAYS=[['0','Sun'],['1','Mon'],['2','Tue'],['3','Wed'],['4','Thu'],['5','Fri'],['6','Sat']];
async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}
function toast(m){try{if(typeof window.toast==='function')window.toast(m);}catch(e){}}
async function tok(){var s=await ensureSb();var r=await s.auth.getSession();return r.data.session&&r.data.session.access_token;}
async function call(fn,payload){var t=await tok();if(!t)throw new Error('signin');var r=await fetch(URL_+'/functions/v1/'+fn,{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON,'Authorization':'Bearer '+t},body:JSON.stringify(payload||{})});return await r.json();}
async function refreshBal(root){try{var s=await ensureSb();var u=await s.auth.getUser();var id=u.data.user.id;var r=await s.rpc('credits_available',{p_client:id});var el=root.querySelector('#ds-fi-bal');if(el)el.textContent=(r.data==null?'-':r.data)+' credits';}catch(e){}}
function milesToM(mi){return Math.round(mi*1609.34);}
function hm(v){if(!v)return null;var p=String(v).split(':');if(p.length<2)return null;var h=parseInt(p[0],10),m=parseInt(p[1],10);if(isNaN(h)||isNaN(m))return null;return h*60+m;}
function stripUrl(u){return String(u).replace('https://','').replace('http://','').slice(0,48);}
function setRlabel(root){var s=root.querySelector('#ds-fi-radius');root.querySelector('#ds-fi-rlabel').textContent=parseFloat(s.value).toFixed(1)+' mi';}
function drow(label,val){if(val==null||val==='')return '';return '<div style="display:flex;gap:8px;margin:2px 0"><div class="small mut" style="min-width:130px">'+label+'</div><div class="small" style="flex:1">'+val+'</div></div>';}
function renderEnrich(d){
  if(!d)return '<div class="small mut">No data.</div>';
  if(d.found===false)return '<div class="small mut">'+esc(d.note||'No public records found. Credits were refunded.')+'</div>';
  var officers=(d.officers||[]).map(function(o){return esc(o.name||'')+(o.role?' ('+esc(o.role)+')':'');}).filter(Boolean).join(', ');
  var lic=(d.licenses||[]).map(function(l){return esc(l.type||'License')+(l.number?' #'+esc(l.number):'')+(l.status?' - '+esc(l.status):'')+(l.expires?', exp '+esc(l.expires):'');}).join('<br>');
  var src=(d.sources||[]).map(function(u){return '<a href="'+esc(u)+'" target="_blank" rel="noopener" class="small">'+esc(stripUrl(u))+'</a>';}).join('<br>');
  return '<div class="card pad" style="background:#F7FAFC">'
    +drow('Legal name',esc(d.legal_name))+drow('Entity number',esc(d.company_number))+drow('Status',esc(d.status))
    +drow('Formed',esc(d.incorporation_date))+drow('Registered agent',esc(d.registered_agent))+drow('Officers / owners',officers)
    +drow('Address',esc(d.address))+drow('Business type',esc(d.business_type))+drow('Licenses',lic)+drow('Sources',src)
    +(d.notes?'<div class="small mut" style="margin-top:6px">'+esc(d.notes)+'</div>':'')+'</div>';
}
function resultCard(row,i){
  var meta=[];if(row.distance_m!=null)meta.push((row.distance_m/1609.34).toFixed(1)+' mi');if(row.phone)meta.push(esc(row.phone));if(row.rating)meta.push('Rating '+row.rating+' ('+(row.reviews||0)+')');if(row.status&&row.status!=='OPERATIONAL')meta.push(esc(row.status));
  var hrs=(row.hours&&row.hours.length)?'<div class="small mut" style="margin-top:2px">'+esc(row.hours.join('  |  ')).slice(0,180)+'</div>':(row.hours_unknown?'<div class="small mut" style="margin-top:2px">Opening hours not published on Google - shown because hours could not be confirmed.</div>':'');
  return '<div class="card pad" style="margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">'
    +'<div style="flex:1"><div style="font-weight:700;color:#0E1A2B">'+esc(row.name)+(row.hours_unknown?' <span class="small" style="font-weight:600;color:#8a6d1a;background:#FDF6E3;border:1px solid #EBD9A6;border-radius:5px;padding:1px 5px;vertical-align:middle">Hours unknown</span>':'')+'</div>'
    +'<div class="small mut">'+esc(row.type||'')+(row.state?' - '+esc(row.state):'')+'</div>'
    +'<div class="small" style="margin-top:2px">'+esc(row.address||'')+'</div>'
    +(meta.length?'<div class="small mut" style="margin-top:2px">'+meta.join(' - ')+'</div>':'')+hrs+'</div>'
    +'<div style="text-align:right;white-space:nowrap">'
    +(row.website?'<a class="small" href="'+esc(row.website)+'" target="_blank" rel="noopener">Website</a><br>':'')
    +(row.maps_url?'<a class="small" href="'+esc(row.maps_url)+'" target="_blank" rel="noopener">Map</a><br>':'')
    +'<button class="btn primary" data-enrich="'+i+'" style="margin-top:6px">Enrich (6 credits)</button>'
    +'</div></div><div id="ds-fi-out-'+i+'" style="margin-top:8px"></div></div>';
}
async function enrich(root,i,btn){
  var row=(root.__rows||[])[i];if(!row)return;
  var out=root.querySelector('#ds-fi-out-'+i);btn.disabled=true;btn.textContent='Enriching...';
  out.innerHTML='<div class="small mut">Pulling public records - this can take up to a minute.</div>';
  try{
    var res=await call('enrich-business',{name:row.name,state:row.state});
    if(res.error==='insufficient_credits'){out.innerHTML='<div class="small" style="color:#c0392b">Not enough credits (needs '+(res.cost||6)+').</div>';btn.disabled=false;btn.textContent='Enrich (6 credits)';refreshBal(root);return;}
    if(!res.ok||!res.job_id){out.innerHTML='<div class="small" style="color:#c0392b">Could not start enrichment.</div>';btn.disabled=false;btn.textContent='Enrich (6 credits)';return;}
    refreshBal(root);var s=await ensureSb();var tries=0;
    var iv=setInterval(async function(){
      tries++;var qr=await s.from('enrichment_jobs').select('status,result,error').eq('id',res.job_id).single();if(qr.error)return;var st=qr.data.status;
      if(st==='done'){clearInterval(iv);out.innerHTML=renderEnrich(qr.data.result);btn.textContent='Enriched';refreshBal(root);}
      else if(st==='error'){clearInterval(iv);out.innerHTML='<div class="small" style="color:#c0392b">Enrichment failed'+(qr.data.error?': '+esc(qr.data.error):'')+'. Credits refunded.</div>';btn.disabled=false;btn.textContent='Enrich (6 credits)';refreshBal(root);}
      else if(tries>40){clearInterval(iv);out.innerHTML='<div class="small mut">Still working - reopen later to see the result.</div>';btn.disabled=false;btn.textContent='Enrich (6 credits)';}
    },2500);
  }catch(e){out.innerHTML='<div class="small" style="color:#c0392b">Enrichment error.</div>';btn.disabled=false;btn.textContent='Enrich (6 credits)';}
}
function loadMaps(key){return new Promise(function(res,rej){if(window.google&&window.google.maps){res();return;}var cbn='__dsGmapsCb';window[cbn]=function(){res();};var s=document.createElement('script');s.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(key)+'&libraries=geometry&loading=async&callback='+cbn;s.async=true;s.onerror=function(){rej(new Error('maps_load_failed'));};document.head.appendChild(s);});}
function kickMap(){if(!map||!circle)return;try{window.dispatchEvent(new Event('resize'));}catch(e){}try{map.setCenter(circle.getCenter());map.fitBounds(circle.getBounds());}catch(e){}}
function mapVisible(root){var el=root.querySelector('#ds-fi-map');return !!(el&&el.offsetParent!==null&&el.offsetWidth>0&&el.offsetHeight>0);}
function ensureMapInit(root){
  if(root.__nomap)return;
  if(map){kickMap();return;}
  if(!window.google||!window.google.maps)return;
  if(!mapVisible(root))return;
  try{initMap(root);}catch(e){}
}
function watchVisible(root){
  var el=root.querySelector('#ds-fi-map');
  try{var io=new IntersectionObserver(function(ents){ents.forEach(function(en){if(en.isIntersecting){ensureMapInit(root);setTimeout(function(){ensureMapInit(root);},300);}});},{threshold:0.01});io.observe(el);}catch(e){}
  var nv=document.querySelector('.nav[data-screen="scouter"]');if(nv)nv.addEventListener('click',function(){setTimeout(function(){ensureMapInit(root);},250);setTimeout(function(){ensureMapInit(root);},800);});
  setTimeout(function(){ensureMapInit(root);},500);
}
function initMap(root){
  var center={lat:33.749,lng:-84.388};
  map=new google.maps.Map(root.querySelector('#ds-fi-map'),{center:center,zoom:11,mapTypeControl:false,streetViewControl:false,fullscreenControl:false});
  circle=new google.maps.Circle({map:map,center:center,radius:milesToM(parseFloat(root.querySelector('#ds-fi-radius').value)),editable:true,draggable:true,fillColor:'#2F6BFF',fillOpacity:0.10,strokeColor:'#2F6BFF',strokeOpacity:0.85,strokeWeight:1.5});
  try{map.fitBounds(circle.getBounds());}catch(e){}
  google.maps.event.addListener(circle,'radius_changed',function(){var mi=circle.getRadius()/1609.34;var s=root.querySelector('#ds-fi-radius');s.value=Math.min(30,Math.max(0.5,parseFloat(mi.toFixed(1))));setRlabel(root);});
}
function locate(root){
  var q=(root.querySelector('#ds-fi-place').value||'').trim();if(!q)return;
  if(!window.google||!google.maps){root.querySelector('#ds-fi-msg').textContent='Map not ready yet.';return;}
  var gc=new google.maps.Geocoder();
  gc.geocode({address:q,componentRestrictions:{country:'US'}},function(r,status){
    if(status==='OK'&&r&&r[0]){var loc=r[0].geometry.location;map.setCenter(loc);circle.setCenter(loc);try{map.fitBounds(circle.getBounds());}catch(e){}root.__city=q;var m=root.querySelector('#ds-fi-msg');m.style.color='';m.textContent='';}
    else{var m2=root.querySelector('#ds-fi-msg');m2.style.color='#c0392b';m2.textContent='Could not find that place. Check spelling or add a state.';}
  });
}
function showSetup(root){
  var s=root.querySelector('#ds-fi-setup');s.style.display='';s.style.color='#8a6d1a';
  s.innerHTML='Map is not set up yet. Add a Google Maps browser key (GOOGLE_MAPS_BROWSER_KEY) and enable the Maps JavaScript + Geocoding APIs to use the map and radius. You can still search by keyword below.';
  var mp=root.querySelector('#ds-fi-map');if(mp)mp.style.display='none';
  var pe=root.querySelector('#ds-fi-place');if(pe&&pe.parentElement)pe.parentElement.style.display='none';
  var re=root.querySelector('#ds-fi-radius');if(re&&re.parentElement)re.parentElement.style.display='none';
}
async function loadHistory(root){
  try{var s=await ensureSb();var u=await s.auth.getUser();var id=u.data.user.id;
  var r=await s.from('search_history').select('id,label,result_count,created_at').eq('client_id',id).order('created_at',{ascending:false}).limit(25);
  var rows=r.data||[];var el=root.querySelector('#ds-fi-history');if(!el)return;
  if(!rows.length){el.innerHTML='<div class="small mut">No searches yet. Your searches and their results will be saved here.</div>';return;}
  el.innerHTML=rows.map(function(h){var d=new Date(h.created_at);return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;border-top:1px solid #EEF2F6"><div style="flex:1"><div class="small" style="font-weight:600">'+esc(h.label||'Search')+'</div><div class="small mut">'+h.result_count+' results - '+d.toLocaleDateString()+' '+d.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</div></div><div style="white-space:nowrap"><button class="btn" data-hload="'+h.id+'" style="padding:2px 8px">Load</button> <button class="btn" data-hdel="'+h.id+'" style="padding:2px 7px">Delete</button></div></div>';}).join('');
  }catch(e){}
}
async function search(root){
  var msg=root.querySelector('#ds-fi-msg');msg.style.color='';msg.textContent='';
  var type=root.querySelector('#ds-fi-type').value;
  var kw=(root.querySelector('#ds-fi-kw').value||'').trim();
  var days=[].slice.call(root.querySelectorAll('#ds-fi-days input:checked')).map(function(c){return parseInt(c.getAttribute('data-day'),10);});
  var t1=hm(root.querySelector('#ds-fi-t1').value),t2=hm(root.querySelector('#ds-fi-t2').value);
  if(!type&&!kw){msg.style.color='#c0392b';msg.textContent='Pick a business type or enter a keyword.';return;}
  if(root.__nomap&&!kw){msg.style.color='#c0392b';msg.textContent='Map not set up yet - enter a keyword to search.';return;}
  var payload={included_type:type,keyword:kw,open_days:days};
  if(t1!=null&&t2!=null){payload.time_start=t1;payload.time_end=t2;}
  if(!root.__nomap&&circle){var c=circle.getCenter();payload.lat=c.lat();payload.lng=c.lng();payload.radius=circle.getRadius();payload.city=root.__city||(root.querySelector('#ds-fi-place').value||'');}
  var topt=root.querySelector('#ds-fi-type').selectedOptions[0];var typeLabel=topt?topt.textContent:'';
  var parts=[];if(kw)parts.push(kw);else if(type)parts.push(typeLabel);if(payload.city)parts.push(payload.city);if(payload.radius)parts.push((payload.radius/1609.34).toFixed(1)+' mi');
  payload.label=parts.join(' - ')||'Search';
  var go=root.querySelector('#ds-fi-go');go.disabled=true;go.textContent='Searching...';root.querySelector('#ds-fi-results').innerHTML='';
  try{
    var res=await call('places-search',payload);
    if(res.error==='insufficient_credits'){msg.style.color='#c0392b';msg.textContent='Not enough credits to search (needs '+(res.cost||1)+').';}
    else if(res.error==='places_not_configured'){msg.style.color='#c0392b';msg.textContent='Places API key not set up yet.';}
    else if(res.error==='need_location_or_keyword'){msg.style.color='#c0392b';msg.textContent='Set a location on the map or enter a keyword.';}
    else if(!res.ok){msg.style.color='#c0392b';msg.textContent='Search failed: '+esc(res.detail||res.error||'unknown');}
    else{var list=res.results||[];root.__rows=list;if(!list.length){msg.textContent=res.note||'No results.';}root.querySelector('#ds-fi-results').innerHTML=list.map(resultCard).join('');loadHistory(root);}
  }catch(e){msg.style.color='#c0392b';msg.textContent='Search error. Please try again.';}
  go.disabled=false;go.textContent='Search (1 credit)';refreshBal(root);
}
function newSearch(root){
  root.querySelector('#ds-fi-results').innerHTML='';root.querySelector('#ds-fi-kw').value='';
  [].slice.call(root.querySelectorAll('#ds-fi-days input')).forEach(function(c){c.checked=false;});
  root.querySelector('#ds-fi-t1').value='';root.querySelector('#ds-fi-t2').value='';
  root.__rows=[];var m=root.querySelector('#ds-fi-msg');m.style.color='';m.textContent='';toast('Cleared - history kept below.');
}
var UI='<div class="wrap" style="max-width:1000px">'
  +'<div class="h-eyebrow">Tools</div>'
  +'<h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 4px">Location Finder</h1>'
  +'<p class="mut" style="margin-bottom:12px">Set an area on the map, filter by business type and hours, then enrich the ones you want. Your searches are saved below.</p>'
  +'<div id="ds-fi-setup" class="small" style="display:none;margin-bottom:10px"></div>'
  +'<div class="card pad" style="margin-bottom:14px"><div style="display:flex;gap:14px;flex-wrap:wrap">'
  +'<div style="flex:1;min-width:260px;display:flex;flex-direction:column;gap:8px">'
  +'<div style="display:flex;gap:6px"><input id="ds-fi-place" class="field" placeholder="City or ZIP (e.g. Atlanta, GA)" style="flex:1"><button id="ds-fi-loc" class="btn">Go</button></div>'
  +'<select id="ds-fi-type" class="field"></select>'
  +'<input id="ds-fi-kw" class="field" placeholder="Optional keyword (e.g. package store)">'
  +'<div><div class="small mut" style="margin-bottom:3px">Radius: <b id="ds-fi-rlabel">5.0 mi</b></div><input id="ds-fi-radius" type="range" min="0.5" max="30" step="0.5" value="5" style="width:100%"></div>'
  +'<div><div class="small mut" style="margin-bottom:3px">Open on days</div><div id="ds-fi-days" style="display:flex;gap:4px;flex-wrap:wrap"></div></div>'
  +'<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="small mut">Open between</span><input id="ds-fi-t1" type="time" class="field" style="width:120px"><span class="small mut">and</span><input id="ds-fi-t2" type="time" class="field" style="width:120px"></div>'
  +'<div style="display:flex;gap:8px;margin-top:2px"><button id="ds-fi-go" class="btn primary" style="flex:1">Search (1 credit)</button><button id="ds-fi-new" class="btn">New search</button></div>'
  +'<div style="display:flex;justify-content:space-between;gap:10px"><div id="ds-fi-msg" class="small" style="min-height:16px;flex:1"></div><div class="small mut">Balance: <b id="ds-fi-bal">-</b></div></div>'
  +'</div>'
  +'<div style="flex:1;min-width:280px"><div id="ds-fi-map" style="width:100%;height:360px;border-radius:10px;background:#EEF2F6"></div></div>'
  +'</div></div>'
  +'<div id="ds-fi-results"></div>'
  +'<div class="card pad" style="margin-top:14px"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h-eyebrow" style="margin:0">Search history</div><button id="ds-fi-hrefresh" class="btn" style="padding:2px 8px">Refresh</button></div><div id="ds-fi-history" style="margin-top:8px"></div></div>'
  +'</div>';
async function mount(){
  var inner=document.getElementById('scouterInner');if(!inner)return false;
  if(inner.getAttribute('data-dsfi'))return true;inner.setAttribute('data-dsfi','1');
  inner.innerHTML=UI;var root=inner;
  root.querySelector('#ds-fi-type').innerHTML=TYPES.map(function(t){return '<option value="'+t[0]+'">'+esc(t[1])+'</option>';}).join('');
  root.querySelector('#ds-fi-days').innerHTML=DAYS.map(function(d){return '<label class="small" style="display:inline-flex;align-items:center;gap:3px;border:1px solid #D8E0EA;border-radius:6px;padding:3px 7px;cursor:pointer"><input type="checkbox" data-day="'+d[0]+'" style="margin:0">'+d[1]+'</label>';}).join('');
  var slider=root.querySelector('#ds-fi-radius');
  slider.addEventListener('input',function(){setRlabel(root);if(!root.__nomap&&circle)circle.setRadius(milesToM(parseFloat(slider.value)));});
  setRlabel(root);
  root.querySelector('#ds-fi-go').addEventListener('click',function(){search(root);});
  root.querySelector('#ds-fi-new').addEventListener('click',function(){newSearch(root);});
  root.querySelector('#ds-fi-loc').addEventListener('click',function(){locate(root);});
  root.querySelector('#ds-fi-place').addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();locate(root);}});
  root.querySelector('#ds-fi-kw').addEventListener('keydown',function(e){if(e.key==='Enter')search(root);});
  root.querySelector('#ds-fi-hrefresh').addEventListener('click',function(){loadHistory(root);});
  root.querySelector('#ds-fi-results').addEventListener('click',function(e){var b=e.target.closest('[data-enrich]');if(b)enrich(root,parseInt(b.getAttribute('data-enrich'),10),b);});
  root.querySelector('#ds-fi-history').addEventListener('click',async function(e){
    var lb=e.target.closest('[data-hload]');var db=e.target.closest('[data-hdel]');
    if(lb){var id=lb.getAttribute('data-hload');var s=await ensureSb();var r=await s.from('search_history').select('results,params,label').eq('id',id).single();if(r.data){root.__rows=r.data.results||[];root.querySelector('#ds-fi-results').innerHTML=(r.data.results||[]).map(resultCard).join('');var p=r.data.params||{};if(!root.__nomap&&circle&&p.lat){var cc={lat:p.lat,lng:p.lng};map.setCenter(cc);circle.setCenter(cc);if(p.radius)circle.setRadius(p.radius);try{map.fitBounds(circle.getBounds());}catch(e2){}}var m=root.querySelector('#ds-fi-msg');m.style.color='';m.textContent='Loaded saved results (no credits used).';try{window.scrollTo(0,0);}catch(e3){}}}
    else if(db){var id2=db.getAttribute('data-hdel');var s2=await ensureSb();await s2.from('search_history').delete().eq('id',id2);loadHistory(root);}
  });
  refreshBal(root);loadHistory(root);
  try{var cfg=await call('public-config',{});if(cfg&&cfg.maps_key){await loadMaps(cfg.maps_key);watchVisible(root);}else{root.__nomap=true;showSetup(root);}}catch(e){root.__nomap=true;showSetup(root);}
  return true;
}
var n=0;(function w(){if(mount()===true||++n>80)return;setTimeout(w,300);})();
})();


/* ---- 31) ADMIN: Deal Analyzer playbook + knowledge base ---- */
(function(){'use strict';
if(window.__dsDealCfg)return;window.__dsDealCfg=true;
var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';
var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
var sb=null;
async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}
function fmtDT(d){if(!d)return '';try{return new Date(d).toLocaleString();}catch(e){return '';}}
var TOGGLES=[
 {k:'inherit_coach',label:'Inherit the AI Coach persona and guardrails',sub:'When on, the Deal Analyzer uses the same voice and rules as the AI Coach. Anything below is layered on top.'},
 {k:'use_marketing_resources',label:'Reference approved sales scripts',sub:'Pull the scripts from Sales and Marketing Resources so drafts match your talk tracks.'}
];
var OVERRIDES=[
 {k:'persona',label:'Persona notes',sub:'Added on top of the Coach persona (or replaces it when inherit is off)'},
 {k:'tone',label:'Tone notes',sub:'How it should sound on deal work'},
 {k:'rhetoric',label:'Style notes',sub:'How it argues and explains'},
 {k:'guardrails_do',label:'Always do',sub:'Extra hard rules for deal analysis'},
 {k:'guardrails_dont',label:'Never do',sub:'Extra hard limits for deal analysis'}
];
var FIELDS=[
 {k:'ideal_merchant',label:'Ideal merchant profile',sub:'What a good-fit account looks like'},
 {k:'objection_handling',label:'Objection handling',sub:'Common objections and how you want them answered'},
 {k:'pricing_guidance',label:'Pricing and rate guidance',sub:'What it may and may not say about pricing'},
 {k:'competitive_positioning',label:'Competitive positioning',sub:'How you position against competitors'},
 {k:'email_rules',label:'Email rules',sub:'Rules for the drafted email: length, tone, sign-off, what to avoid'},
 {k:'extra',label:'Additional notes',sub:'Anything else it should know'}
];
function fieldHtml(f){
  return '<div style="margin-bottom:14px">'
    +'<label style="display:block;font-size:13px;font-weight:700;color:#0E1A2B;margin-bottom:2px">'+esc(f.label)+'</label>'
    +(f.sub?'<div class="small mut" style="margin-bottom:6px">'+esc(f.sub)+'</div>':'')
    +'<textarea id="da_'+f.k+'" class="field" rows="3" style="width:100%"></textarea></div>';
}
function toggleHtml(t){
  return '<label style="display:flex;gap:8px;align-items:flex-start;margin-bottom:10px;cursor:pointer">'
    +'<input type="checkbox" id="da_'+t.k+'" style="margin-top:3px">'
    +'<span><span style="font-size:13px;font-weight:700;color:#0E1A2B">'+esc(t.label)+'</span>'
    +'<div class="small mut">'+esc(t.sub)+'</div></span></label>';
}
function screenHtml(){
  return '<div class="wrap" style="max-width:820px">'
    +'<div class="h-eyebrow">Admin</div>'
    +'<h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 4px">Deal Analyzer - Playbook and Knowledge</h1>'
    +'<p class="mut" style="margin-bottom:8px">What the Deal Analyzer knows and how it behaves on every client analysis. Clients never see this.</p>'
    +'<div id="da-note" class="small mut" style="margin-bottom:14px"></div>'
    +'<div class="card pad">'
    +TOGGLES.map(toggleHtml).join('')
    +'<div class="h-eyebrow" style="margin:14px 0 8px">Voice and guardrails</div>'
    +OVERRIDES.map(fieldHtml).join('')
    +'<div class="h-eyebrow" style="margin:14px 0 8px">Playbook</div>'
    +FIELDS.map(fieldHtml).join('')
    +'<div id="da-msg" class="small" style="min-height:18px;margin:2px 0 10px"></div>'
    +'<div style="display:flex;gap:8px"><button id="da-save" class="btn primary" style="flex:1;justify-content:center">Save</button><button id="da-preview" class="btn">Preview prompt</button></div>'
    +'</div>'
    +'<div class="card pad" style="margin-top:14px">'
    +'<div class="h-eyebrow" style="margin:0 0 4px">Knowledge base entries</div>'
    +'<div class="small mut" style="margin-bottom:10px">Reusable notes the analyzer references on every deal.</div>'
    +'<div style="display:flex;gap:6px;margin-bottom:6px"><input id="da-nt" class="field" placeholder="Title" style="flex:1"><input id="da-nc" class="field" placeholder="Category (optional)" style="width:170px"></div>'
    +'<textarea id="da-nb" class="field" rows="3" placeholder="What should the analyzer know?" style="width:100%"></textarea>'
    +'<button id="da-add" class="btn primary" style="margin-top:6px">Add entry</button>'
    +'<div id="da-kb" style="margin-top:14px"></div>'
    +'</div>'
    +'<div id="da-prev" class="card pad" style="margin-top:14px;display:none"><div class="h-eyebrow" style="margin:0 0 6px">Composed prompt preview</div><div id="da-prevmeta" class="small mut" style="margin-bottom:6px"></div><pre id="da-prevtxt" class="small" style="white-space:pre-wrap;max-height:340px;overflow:auto;margin:0"></pre></div>'
    +'</div>';
}
var ICON='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>';
async function loadCfg(sec){
  var s=await ensureSb();
  var r=await s.from('deal_analyzer_config').select('*').eq('id','default').single();
  var note=sec.querySelector('#da-note');
  if(r.error||!r.data){note.textContent='Could not load the config (admin access required).';return;}
  TOGGLES.forEach(function(t){var el=sec.querySelector('#da_'+t.k);if(el)el.checked=r.data[t.k]!==false;});
  OVERRIDES.concat(FIELDS).forEach(function(f){var el=sec.querySelector('#da_'+f.k);if(el)el.value=r.data[f.k]||'';});
  note.textContent='Last updated '+(r.data.updated_at?fmtDT(r.data.updated_at):'-')+(r.data.updated_by_email?' by '+r.data.updated_by_email:'');
}
async function loadKb(sec){
  var s=await ensureSb();
  var r=await s.from('deal_knowledge').select('*').order('sort',{ascending:true}).order('created_at',{ascending:true});
  var el=sec.querySelector('#da-kb');if(!el)return;
  var rows=r.data||[];
  if(!rows.length){el.innerHTML='<div class="small mut">No entries yet.</div>';return;}
  el.innerHTML=rows.map(function(k){
    return '<div class="card pad" style="margin-bottom:8px;background:#F7FAFC" data-kid="'+k.id+'">'
      +'<div style="display:flex;gap:6px;margin-bottom:6px"><input class="field da-kt" value="'+esc(k.title||'')+'" style="flex:1"><input class="field da-kc" value="'+esc(k.category||'')+'" placeholder="Category" style="width:160px"></div>'
      +'<textarea class="field da-kb2" rows="3" style="width:100%">'+esc(k.body||'')+'</textarea>'
      +'<div style="display:flex;gap:8px;align-items:center;margin-top:6px">'
      +'<label class="small" style="display:flex;gap:4px;align-items:center;cursor:pointer"><input type="checkbox" class="da-ka"'+(k.active?' checked':'')+'>Active</label>'
      +'<div style="flex:1"></div>'
      +'<button class="btn da-ksave" style="padding:3px 10px">Save</button>'
      +'<button class="btn da-kdel" style="padding:3px 10px">Delete</button>'
      +'</div></div>';
  }).join('');
}
async function save(sec){
  var msg=sec.querySelector('#da-msg'),btn=sec.querySelector('#da-save');
  msg.style.color='#c0392b';msg.textContent='';
  var s=await ensureSb();var u=await s.auth.getUser();
  var uid=u&&u.data&&u.data.user?u.data.user.id:null;var email=u&&u.data&&u.data.user?u.data.user.email:null;
  if(!uid){msg.textContent='Please sign in again.';return;}
  var patch={updated_at:new Date().toISOString(),updated_by:uid,updated_by_email:email};
  TOGGLES.forEach(function(t){var el=sec.querySelector('#da_'+t.k);patch[t.k]=el?!!el.checked:true;});
  OVERRIDES.concat(FIELDS).forEach(function(f){var el=sec.querySelector('#da_'+f.k);patch[f.k]=el?(el.value||'').trim():'';});
  btn.disabled=true;btn.textContent='Saving...';
  var r=await s.from('deal_analyzer_config').update(patch).eq('id','default').select('id');
  btn.disabled=false;btn.textContent='Save';
  if(r.error||!r.data||!r.data.length){msg.textContent='Could not save - admin access required.';return;}
  msg.style.color='#1a7f4b';msg.textContent='Saved. New analyses use this immediately.';
  loadCfg(sec);
}
async function preview(sec){
  var box=sec.querySelector('#da-prev'),txt=sec.querySelector('#da-prevtxt'),meta=sec.querySelector('#da-prevmeta');
  var btn=sec.querySelector('#da-preview');btn.disabled=true;btn.textContent='Loading...';
  try{
    var s=await ensureSb();var ses=await s.auth.getSession();var tk=ses.data.session&&ses.data.session.access_token;
    var r=await fetch(URL_+'/functions/v1/deal-analyzer',{method:'POST',headers:{'Content-Type':'application/json','apikey':ANON,'Authorization':'Bearer '+tk},body:JSON.stringify({preview:true})});
    var j=await r.json();
    if(j&&j.ok&&j.system){box.style.display='';txt.textContent=j.system;meta.textContent=j.chars+' characters - model '+(j.model||'');}
    else{box.style.display='';txt.textContent='Could not build preview.';meta.textContent='';}
  }catch(e){box.style.display='';txt.textContent='Preview failed.';}
  btn.disabled=false;btn.textContent='Preview prompt';
}
function activate(nav,sec){
  [].forEach.call(document.querySelectorAll('.screen'),function(s){s.classList.remove('active');});
  [].forEach.call(document.querySelectorAll('.nav'),function(n){n.classList.remove('active');});
  sec.classList.add('active');nav.classList.add('active');
  try{window.scrollTo(0,0);}catch(e){}
  loadCfg(sec);loadKb(sec);
}
async function isAdmin(){
  var s=await ensureSb();var u=await s.auth.getUser();
  var id=u&&u.data&&u.data.user?u.data.user.id:null;if(!id)return false;
  var r=await s.from('profiles').select('role').eq('id',id).single();
  return !!(r.data&&(r.data.role==='admin'||r.data.role==='team'));
}
async function mount(){
  var anchorNav=document.querySelector('.nav[data-screen="coachcfg"]')||document.querySelector('.nav[data-screen="mgrid"]')||document.querySelector('.nav[data-screen="clients"]');
  if(!anchorNav)return false;
  if(document.querySelector('.nav[data-screen="dealcfg"]'))return true;
  if(!(await isAdmin()))return true;
  var side=anchorNav.parentElement;
  var screenParent=(document.querySelector('section.screen')||{}).parentElement;
  if(!side||!screenParent)return false;
  var nav=document.createElement('div');
  nav.className='nav admin-only';nav.setAttribute('data-screen','dealcfg');nav.style.display='';
  nav.innerHTML=ICON+'Deal Analyzer <span class="badge-admin" style="margin-left:auto">Admin</span>';
  side.insertBefore(nav,anchorNav.nextSibling);
  var sec=document.createElement('section');
  sec.className='screen';sec.id='dealcfg';sec.innerHTML=screenHtml();
  screenParent.appendChild(sec);
  nav.addEventListener('click',function(){activate(nav,sec);});
  sec.querySelector('#da-save').addEventListener('click',function(){save(sec);});
  sec.querySelector('#da-preview').addEventListener('click',function(){preview(sec);});
  sec.querySelector('#da-add').addEventListener('click',async function(){
    var t=(sec.querySelector('#da-nt').value||'').trim();var c=(sec.querySelector('#da-nc').value||'').trim();var b=(sec.querySelector('#da-nb').value||'').trim();
    if(!t||!b)return;
    var s=await ensureSb();
    await s.from('deal_knowledge').insert({title:t,category:c||null,body:b,active:true});
    sec.querySelector('#da-nt').value='';sec.querySelector('#da-nc').value='';sec.querySelector('#da-nb').value='';
    loadKb(sec);
  });
  sec.querySelector('#da-kb').addEventListener('click',async function(e){
    var card=e.target.closest('[data-kid]');if(!card)return;var id=card.getAttribute('data-kid');
    var s=await ensureSb();
    if(e.target.classList.contains('da-ksave')){
      await s.from('deal_knowledge').update({title:card.querySelector('.da-kt').value,category:card.querySelector('.da-kc').value||null,body:card.querySelector('.da-kb2').value,active:card.querySelector('.da-ka').checked,updated_at:new Date().toISOString()}).eq('id',id);
      loadKb(sec);
    } else if(e.target.classList.contains('da-kdel')){
      await s.from('deal_knowledge').delete().eq('id',id);loadKb(sec);
    }
  });
  if(typeof window.show==='function'&&!window.show.__dsDealCfgWrapped){
    var origShow=window.show;
    var wrapped=function(screen){var out=origShow.apply(this,arguments);if(screen!=='dealcfg'){var el=document.getElementById('dealcfg');if(el)el.classList.remove('active');}return out;};
    wrapped.__dsDealCfgWrapped=true;window.show=wrapped;
  }
  return true;
}
var tries=0;
(function wait(){mount().then(function(done){if(done)return;if(++tries>80)return;setTimeout(wait,300);});})();
})();


/* ---- 32) SIDEBAR: make it scrollable and keep the floating helper buttons
   from covering the bottom nav items (Deal Analyzer / Merchant Application /
   Re-Orders / My Merchants / Sales & Marketing Resources / Settings). ---- */
(function(){'use strict';
if(window.__dsSideFix)return;window.__dsSideFix=true;
var CSS=''
 +'.side{overflow-y:auto !important;overflow-x:hidden !important;max-height:100vh !important;'
 +'padding-bottom:112px !important;scrollbar-width:thin;-webkit-overflow-scrolling:touch;}'
 +'.side::-webkit-scrollbar{width:8px}'
 +'.side::-webkit-scrollbar-thumb{background:#D8E0EA;border-radius:4px}'
 +'.side::-webkit-scrollbar-track{background:transparent}';
function inject(){
  if(document.getElementById('ds-side-fix'))return true;
  var st=document.createElement('style');st.id='ds-side-fix';st.textContent=CSS;
  document.head.appendChild(st);
  return true;
}
inject();
// If a nav item ends up under a fixed helper button, scroll it into view on click.
function guard(){
  var side=document.querySelector('.side');if(!side)return false;
  if(side.__dsGuard)return true;side.__dsGuard=true;
  side.addEventListener('click',function(e){
    var n=e.target.closest?e.target.closest('.nav'):null;if(!n)return;
    try{var r=n.getBoundingClientRect();if(r.bottom>window.innerHeight-8){n.scrollIntoView({block:'nearest'});}}catch(err){}
  },true);
  return true;
}
var n=0;(function w(){if(guard()||++n>60)return;setTimeout(w,300);})();
})();


/* ---- 33) SCREEN VISIBILITY SHIM: the app shows screens via the .show class
   (.screen.show{display:block}), but injected admin screens' nav handlers used
   .active, so they never displayed. On any nav[data-screen] click, apply the
   app's real visibility model to guarantee the target screen shows. ---- */
(function(){'use strict';
if(window.__dsShowShim)return;window.__dsShowShim=true;
function applyShow(id,nav){
  var sec=document.getElementById(id);
  if(!sec||!sec.classList.contains('screen'))return;
  [].forEach.call(document.querySelectorAll('section.screen'),function(s){s.classList.remove('show');});
  sec.classList.add('show');
  [].forEach.call(document.querySelectorAll('.nav'),function(x){x.classList.remove('active');});
  if(nav)nav.classList.add('active');
  try{window.scrollTo(0,0);}catch(e){}
}
document.addEventListener('click',function(e){
  var nav=e.target.closest?e.target.closest('.nav[data-screen]'):null;
  if(!nav)return;
  var id=nav.getAttribute('data-screen');
  // run after both the base app and any injected handlers have processed the click
  setTimeout(function(){ applyShow(id,nav); },40);
},true);
})();


/* ---- 34) ADMIN — Orders (all re-orders with full detail) ---- */
(function(){'use strict';
if(window.__dsOrdersAdmin)return;window.__dsOrdersAdmin=true;
var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';
var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
var sb=null;
async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}
function toast(m){try{if(typeof window.toast==='function')window.toast(m);}catch(e){}}
function money(c){return c==null?'':'$'+(c/100).toFixed(2);}
var STATUSES=['pending','paid','shipped','completed','cancelled','refunded'];
function addrBlock(o,p){var l=[o[p+'line1'],o[p+'line2'],[o[p+'city'],o[p+'state'],o[p+'zip']].filter(Boolean).join(' ')].filter(Boolean);return l.length?l.join('<br>'):'<span class="mut">-</span>';}
function orderCard(o){
  var d=new Date(o.created_at);
  var items=(o.order_items&&o.order_items.length)?o.order_items.map(function(i){return '<div class="small">'+i.qty+' x '+esc(i.name)+' <span class="mut">'+money(i.price_cents)+'</span></div>';}).join(''):('<div class="small">'+esc(o.item_name||'-')+'</div>');
  var opts=STATUSES.map(function(s){return '<option value="'+s+'"'+(o.status===s?' selected':'')+'>'+s+'</option>';}).join('');
  var billing=o.billing_same?'<span class="mut">Same as shipping</span>':addrBlock(o,'bill_');
  return '<div class="card pad" data-oid="'+o.id+'" style="margin-bottom:10px">'
    +'<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><div style="font-weight:700;color:#0E1A2B">'+esc(o.full_name||'(no name)')+'</div><div class="small mut">'+esc(o.email||'')+(o.merchant_name?' - '+esc(o.merchant_name):'')+' - '+d.toLocaleString()+'</div></div>'
    +'<div style="text-align:right"><div style="font-weight:800;color:#0E1A2B">'+money(o.total_cents!=null?o.total_cents:o.amount_total)+'</div><div class="small mut">'+(o.payment_method==='ach'?'ACH (no fee)':'Card +3%')+'</div></div></div>'
    +'<div style="display:flex;gap:18px;flex-wrap:wrap;margin-top:10px">'
    +'<div style="min-width:180px"><div class="h-eyebrow" style="margin:0 0 4px">Items</div>'+items+'<div class="small mut" style="margin-top:4px">Subtotal '+money(o.subtotal_cents)+(o.surcharge_cents?' + fee '+money(o.surcharge_cents):'')+'</div></div>'
    +'<div style="min-width:150px"><div class="h-eyebrow" style="margin:0 0 4px">Ship to</div><div class="small">'+addrBlock(o,'ship_')+'</div></div>'
    +'<div style="min-width:150px"><div class="h-eyebrow" style="margin:0 0 4px">Billing</div><div class="small">'+billing+'</div></div>'
    +'</div>'
    +(o.notes?'<div class="small mut" style="margin-top:8px">Notes: '+esc(o.notes)+'</div>':'')
    +'<div style="display:flex;gap:8px;align-items:center;margin-top:10px"><span class="small mut">Status</span><select class="oa-status field" style="width:150px;padding:4px">'+opts+'</select><span class="small mut">'+(o.refund_ack?'Refund policy accepted':'')+'</span></div>'
    +'</div>';
}
async function load(sec){
  var s=await ensureSb();
  var r=await s.from('reorders').select('*').order('created_at',{ascending:false}).limit(200);
  var rows=r.data||[];var el=sec.querySelector('#oa-list');
  var f=sec.querySelector('#oa-filter').value;
  if(f)rows=rows.filter(function(o){return (o.status||'pending')===f;});
  el.innerHTML=rows.length?rows.map(orderCard).join(''):'<div class="small mut">No orders'+(f?' with status '+f:'')+'.</div>';
  sec.querySelector('#oa-count').textContent=rows.length+' order'+(rows.length===1?'':'s');
}
function screenHtml(){
  return '<div class="wrap" style="max-width:900px">'
    +'<div class="h-eyebrow">Admin</div>'
    +'<h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 4px">Orders</h1>'
    +'<p class="mut" style="margin-bottom:12px">Every re-order with contact, shipping, billing, items and payment. <span id="oa-count"></span></p>'
    +'<div style="display:flex;gap:8px;align-items:center;margin-bottom:12px"><span class="small mut">Filter</span><select id="oa-filter" class="field" style="width:170px;padding:6px"><option value="">All statuses</option>'+STATUSES.map(function(s){return '<option value="'+s+'">'+s+'</option>';}).join('')+'</select><button id="oa-refresh" class="btn" style="padding:4px 12px">Refresh</button></div>'
    +'<div id="oa-list"></div></div>';
}
function activate(nav,sec){[].forEach.call(document.querySelectorAll('.nav'),function(n){n.classList.remove('active');});nav.classList.add('active');try{window.scrollTo(0,0);}catch(e){}load(sec);}
async function isAdmin(){var s=await ensureSb();var u=await s.auth.getUser();var id=u&&u.data&&u.data.user?u.data.user.id:null;if(!id)return false;var r=await s.from('profiles').select('role').eq('id',id).single();return !!(r.data&&(r.data.role==='admin'||r.data.role==='team'));}
var ICON='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2l1.5 3h9L18 2"/><path d="M4 7h16l-1.5 12a2 2 0 0 1-2 2H7.5a2 2 0 0 1-2-2L4 7z"/></svg>';
async function mount(){
  if(document.querySelector('.nav[data-screen="ordersadmin"]'))return true;
  var anchor=document.querySelector('.nav[data-screen="catadmin"]')||document.querySelector('.nav[data-screen="mgrid"]')||document.querySelector('.nav[data-screen="clients"]');
  if(!anchor)return false;
  if(!(await isAdmin()))return true;
  var screenParent=(document.querySelector('section.screen')||{}).parentElement;if(!anchor.parentElement||!screenParent)return false;
  var nav=document.createElement('div');nav.className='nav admin-only';nav.setAttribute('data-screen','ordersadmin');nav.innerHTML=ICON+'Orders <span class="badge-admin" style="margin-left:auto">Admin</span>';
  anchor.parentElement.insertBefore(nav,anchor.nextSibling);
  var sec=document.createElement('section');sec.className='screen';sec.id='ordersadmin';sec.innerHTML=screenHtml();screenParent.appendChild(sec);
  nav.addEventListener('click',function(){activate(nav,sec);});
  sec.querySelector('#oa-refresh').addEventListener('click',function(){load(sec);});
  sec.querySelector('#oa-filter').addEventListener('change',function(){load(sec);});
  sec.querySelector('#oa-list').addEventListener('change',async function(e){
    if(!e.target.classList.contains('oa-status'))return;
    var card=e.target.closest('[data-oid]');var id=card.getAttribute('data-oid');var s=await ensureSb();
    var patch={status:e.target.value};if(e.target.value==='paid')patch.paid_at=new Date().toISOString();
    await s.from('reorders').update(patch).eq('id',id);toast('Status updated');
  });
  return true;
}
var tries=0;(function wait(){mount().then(function(done){if(done)return;if(++tries>80)return;setTimeout(wait,300);});})();
})();


/* ---- 35) RESIDUAL ESTIMATOR (client): iframe calculator + saved scenarios ---- */
(function(){'use strict';
if(window.__dsResidual)return;window.__dsResidual=true;
var URL_='https://dehttbxrkeqhsfkfpfwt.supabase.co';
var ANON='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlaHR0Ynhya2VxaHNma2ZwZnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjk4MjcsImV4cCI6MjA5NzY0NTgyN30.sZdkRz0QmLgbsTC_ZjdVd01bxjFH2TaoVgT_yVpoV40';
var sb=null;
async function ensureSb(){if(sb)return sb;if(window.__dsSB){sb=window.__dsSB;return sb;}var m=await import('https://esm.sh/@supabase/supabase-js@2.45.0');sb=m.createClient(URL_,ANON,{auth:{storageKey:'sb-dehttbxrkeqhsfkfpfwt-auth-token',persistSession:true,autoRefreshToken:true}});window.__dsSB=sb;return sb;}
function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});}
function toast(m){try{if(typeof window.toast==='function')window.toast(m);}catch(e){}}
var ICON='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/></svg>';
function screenHtml(){
  return '<div class="wrap" style="max-width:920px">'
    +'<div class="h-eyebrow">Tools</div>'
    +'<h1 style="font-size:24px;font-weight:800;color:#0E1A2B;margin:2px 0 4px">Residual Estimator</h1>'
    +'<p class="mut" style="margin-bottom:12px">Model your crypto and card-processing residual income and equipment breakeven. Save scenarios to revisit later. Estimates only.</p>'
    +'<div class="card pad" style="margin-bottom:12px"><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><input id="ds-res-name" class="field" placeholder="Name this scenario (e.g. Corner Store)" style="flex:1;min-width:220px"><button id="ds-res-save" class="btn primary">Save this estimate</button></div><div id="ds-res-msg" class="small" style="min-height:16px;margin-top:6px"></div></div>'
    +'<iframe id="ds-res-frame" src="/residual-estimator.html" style="width:100%;height:1500px;border:0;border-radius:12px;background:#f1f5f9;overflow:hidden" scrolling="no"></iframe>'
    +'<div class="card pad" style="margin-top:14px"><div style="display:flex;justify-content:space-between;align-items:center"><div class="h-eyebrow" style="margin:0">Saved scenarios</div><button id="ds-res-refresh" class="btn" style="padding:2px 8px">Refresh</button></div><div id="ds-res-list" style="margin-top:8px"></div></div>'
    +'</div>';
}
function frameDoc(root){var f=root.querySelector('#ds-res-frame');return f&&f.contentWindow?f.contentWindow.document:null;}
function frameWin(root){var f=root.querySelector('#ds-res-frame');return f?f.contentWindow:null;}
function readParams(root){
  var d=frameDoc(root);if(!d)return null;
  var chargedEl=d.getElementById('toggle-merchant');
  return {
    sales:d.getElementById('sales-input').value,
    crypto_pct:d.getElementById('crypto-pct').value,
    crypto_rate:d.getElementById('crypto-rate').value,
    cc_enabled:d.getElementById('cc-enabled').checked,
    cc_tier:d.getElementById('cc-tier').value,
    charged_to:(chargedEl&&chargedEl.classList.contains('active'))?'merchant':'customer',
    equip:d.getElementById('equip-input').value
  };
}
function applyParams(root,p){
  var d=frameDoc(root),w=frameWin(root);if(!d||!w)return;
  try{
    if(p.sales!=null)d.getElementById('sales-input').value=p.sales;
    if(p.crypto_pct!=null)d.getElementById('crypto-pct').value=p.crypto_pct;
    if(p.crypto_rate!=null)d.getElementById('crypto-rate').value=p.crypto_rate;
    if(p.equip!=null)d.getElementById('equip-input').value=p.equip;
    if(p.cc_tier!=null)d.getElementById('cc-tier').value=p.cc_tier;
    d.getElementById('cc-enabled').checked=!!p.cc_enabled;
    if(typeof w.toggleCC==='function')w.toggleCC();
    if(typeof w.setChargedTo==='function')w.setChargedTo(p.charged_to||'merchant');
    if(typeof w.updateLabel==='function')w.updateLabel('crypto-pct','crypto-pct-label','%');
    if(typeof w.updateLabelDec==='function')w.updateLabelDec('crypto-rate','crypto-rate-label','%',2);
    if(typeof w.calc==='function')w.calc();
  }catch(e){}
}
async function loadList(root){
  try{var s=await ensureSb();var u=await s.auth.getUser();var id=u.data.user.id;
  var r=await s.from('residual_scenarios').select('id,label,params,created_at').eq('client_id',id).order('created_at',{ascending:false}).limit(30);
  var rows=r.data||[];var el=root.querySelector('#ds-res-list');if(!el)return;
  if(!rows.length){el.innerHTML='<div class="small mut">No saved scenarios yet.</div>';return;}
  el.innerHTML=rows.map(function(h){var d=new Date(h.created_at);var p=h.params||{};return '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:6px 0;border-top:1px solid #EEF2F6"><div style="flex:1"><div class="small" style="font-weight:600">'+esc(h.label||'Scenario')+'</div><div class="small mut">'+esc(p.sales||'')+' vol - '+esc(p.crypto_rate||'')+'% crypto'+(p.cc_enabled?' + CC':'')+' - '+d.toLocaleDateString()+'</div></div><div style="white-space:nowrap"><button class="btn" data-rload="'+h.id+'" style="padding:2px 8px">Load</button> <button class="btn" data-rdel="'+h.id+'" style="padding:2px 7px">Delete</button></div></div>';}).join('');
  }catch(e){}
}
async function save(root){
  var msg=root.querySelector('#ds-res-msg');msg.style.color='#c0392b';msg.textContent='';
  var p=readParams(root);if(!p){msg.textContent='Calculator still loading, try again in a moment.';return;}
  var name=(root.querySelector('#ds-res-name').value||'').trim()||('Scenario '+new Date().toLocaleDateString());
  try{var s=await ensureSb();var u=await s.auth.getUser();var id=u.data.user.id;
  var r=await s.from('residual_scenarios').insert({client_id:id,label:name,params:p}).select('id');
  if(r.error){msg.textContent='Could not save.';return;}
  msg.style.color='#1a7f4b';msg.textContent='Saved.';root.querySelector('#ds-res-name').value='';loadList(root);
  }catch(e){msg.textContent='Save error.';}
}
function mount(){
  var screenParent=(document.querySelector('section.screen')||{}).parentElement;
  if(!screenParent)return false;
  var nav=document.querySelector('.nav[data-screen="residual"]');
  if(!nav){
    var anchor=document.querySelector('.nav[data-screen="scouter"]')||document.querySelector('.nav[data-screen="reachout"]')||document.querySelector('.nav[data-screen="settings"]')||document.querySelector('.nav');
    if(!anchor||!anchor.parentElement)return false;
    nav=document.createElement('div');nav.className='nav';nav.setAttribute('data-screen','residual');nav.innerHTML=ICON+'Residual Estimator';
    anchor.parentElement.insertBefore(nav,anchor.nextSibling);
  }
  var sec=document.getElementById('residual');
  if(!sec){sec=document.createElement('section');sec.className='screen';sec.id='residual';screenParent.appendChild(sec);}
  if(sec.getAttribute('data-dsres'))return true;
  sec.setAttribute('data-dsres','1');
  sec.innerHTML=screenHtml();var root=sec;
  root.querySelector('#ds-res-save').addEventListener('click',function(){save(root);});
  root.querySelector('#ds-res-refresh').addEventListener('click',function(){loadList(root);});
  root.querySelector('#ds-res-list').addEventListener('click',async function(e){
    var lb=e.target.closest('[data-rload]');var db=e.target.closest('[data-rdel]');
    if(lb){var id=lb.getAttribute('data-rload');var s=await ensureSb();var r=await s.from('residual_scenarios').select('params').eq('id',id).single();if(r.data){applyParams(root,r.data.params||{});var m=root.querySelector('#ds-res-msg');m.style.color='';m.textContent='Scenario loaded into the calculator.';}}
    else if(db){var id2=db.getAttribute('data-rdel');var s2=await ensureSb();await s2.from('residual_scenarios').delete().eq('id',id2);loadList(root);}
  });
  window.addEventListener('message',function(ev){if(ev.data&&ev.data.dsResidualHeight){var f=root.querySelector('#ds-res-frame');if(f)f.style.height=(ev.data.dsResidualHeight+24)+'px';}});
  var nv=document.querySelector('.nav[data-screen="residual"]');if(nv)nv.addEventListener('click',function(){setTimeout(function(){loadList(root);var f=root.querySelector('#ds-res-frame');if(f&&f.contentWindow&&f.contentWindow.document&&f.contentWindow.document.body){f.style.height=(f.contentWindow.document.body.scrollHeight+24)+'px';}},250);});
  loadList(root);
  return true;
}
var n=0;(function wait(){if(mount()===true||++n>100)return;setTimeout(wait,250);})();
})();

;(function(){
if(window.__dsInvoiceUI) return; window.__dsInvoiceUI=1;
function toast(msg,ok){try{var t=document.createElement('div');t.textContent=msg;t.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483600;background:'+(ok===false?'#b42318':'#0f1a26')+';color:#fff;padding:10px 16px;border-radius:10px;font:600 13px system-ui;box-shadow:0 6px 24px rgba(0,0,0,.25);max-width:80vw;text-align:center';document.body.appendChild(t);setTimeout(function(){t.style.transition='opacity .4s';t.style.opacity='0';setTimeout(function(){t.remove();},450);},3800);}catch(e){}}
async function invoke(oid,action){var c=window.__dsSB;if(!c)throw new Error('Not signed in');var sres=await c.auth.getSession();var tok=(sres&&sres.data&&sres.data.session)?sres.data.session.access_token:'';return await fetch(c.functionsUrl+'/order-invoice',{method:'POST',headers:{'Authorization':'Bearer '+tok,'apikey':c.supabaseKey,'Content-Type':'application/json'},body:JSON.stringify({order_id:oid,action:action})});}
function fnameFrom(res,oid){var cd=res.headers.get('Content-Disposition')||'';var m=cd.match(/filename="?([^";]+)"?/);return (m&&m[1])||('DividendShift-Invoice-'+String(oid).slice(0,6)+'.pdf');}
async function getPdf(oid){var res=await invoke(oid,'pdf');var ct=res.headers.get('Content-Type')||'';if(ct.indexOf('application/pdf')<0){var j=await res.json().catch(function(){return{};});throw new Error(j.message||j.error||'Could not generate PDF');}return {blob:await res.blob(),name:fnameFrom(res,oid)};}
async function doDownload(oid,btn){if(btn)btn.disabled=true;try{var r=await getPdf(oid);var u=URL.createObjectURL(r.blob);var a=document.createElement('a');a.href=u;a.download=r.name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u);},4000);}catch(e){toast(String(e.message||e),false);}if(btn)btn.disabled=false;}
async function doPrint(oid,btn){if(btn)btn.disabled=true;try{var r=await getPdf(oid);var u=URL.createObjectURL(r.blob);var f=document.createElement('iframe');f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';f.src=u;document.body.appendChild(f);f.onload=function(){setTimeout(function(){try{f.contentWindow.focus();f.contentWindow.print();}catch(e){window.open(u,'_blank');}},350);};setTimeout(function(){URL.revokeObjectURL(u);},60000);}catch(e){toast(String(e.message||e),false);}if(btn)btn.disabled=false;}
async function doEmail(oid,btn){var old=btn?btn.textContent:'';if(btn){btn.disabled=true;btn.textContent='Sending…';}try{var res=await invoke(oid,'email');var j=await res.json().catch(function(){return{};});if(j.ok){toast('Invoice emailed to '+(j.sent_to||'your email on file')+'.',true);}else if(j.error==='email_not_configured'){toast(j.message||'Email delivery is not set up yet. Use Download or Print for now.',false);}else{toast(j.message||j.detail||j.error||'Could not send email.',false);}}catch(e){toast(String(e.message||e),false);}if(btn){btn.textContent=old;btn.disabled=false;}}
document.addEventListener('click',function(ev){var el=ev.target;if(!el||!el.closest)return;var tg=el.closest('[data-inv-act]');if(tg){ev.preventDefault();ev.stopPropagation();var oid=tg.getAttribute('data-oid');var act=tg.getAttribute('data-inv-act');if(act==='pdf')doDownload(oid,tg);else if(act==='print')doPrint(oid,tg);else if(act==='email')doEmail(oid,tg);return;}var hd=el.closest('[data-inv-toggle]');if(hd){var wrap=hd.parentElement;var dd=wrap&&wrap.querySelector('.ds-ord-d');if(dd){var open=dd.style.display!=='none';dd.style.display=open?'none':'block';var car=hd.querySelector('.ds-ord-caret');if(car)car.innerHTML=open?'&#9656;':'&#9662;';}}},true);
})();


/* ---- Feature 37: OS membership (client) card-on-file gate + Membership screen ---- */
;(function(){
if(window.__dsOSClient) return; window.__dsOSClient=1;
var SB=window.__dsSB||null;
function money(c){return '$'+(((c||0))/100).toFixed(2);}
function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function fmtDate(d){ if(!d) return '—'; try{ return new Date(String(d).slice(0,10)+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}); }catch(e){ return String(d); } }
async function api(fn,body){ var s=await SB.auth.getSession(); var tok=s&&s.data&&s.data.session?s.data.session.access_token:''; var r=await fetch(SB.functionsUrl+'/'+fn,{method:'POST',headers:{'Authorization':'Bearer '+tok,'apikey':SB.supabaseKey,'Content-Type':'application/json'},body:JSON.stringify(body||{})}); return await r.json().catch(function(){return{};}); }
window.__dsOS={money:money,esc:esc,fmtDate:fmtDate,api:api};
function toast(msg,ok){ try{ var t=document.createElement('div'); t.textContent=msg; t.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483600;background:'+(ok===false?'#b42318':'#0f1a26')+';color:#fff;padding:10px 16px;border-radius:10px;font:600 13px system-ui;box-shadow:0 6px 24px rgba(0,0,0,.25)'; document.body.appendChild(t); setTimeout(function(){t.remove();},4000);}catch(e){} }
function removeGate(){ var g=document.getElementById('ds-os-gate'); if(g) g.remove(); }
function showGate(sub){ removeGate(); var price=sub.monthly_price_cents||19900; var o=document.createElement('div'); o.id='ds-os-gate'; o.style.cssText='position:fixed;inset:0;z-index:2147483500;background:rgba(12,20,32,.72);display:flex;align-items:center;justify-content:center;padding:20px'; o.innerHTML='<div style="max-width:520px;width:100%;background:#fff;border-radius:16px;padding:28px;box-shadow:0 20px 60px rgba(0,0,0,.35);font-family:system-ui,Arial"><div style="font-weight:800;font-size:20px;margin-bottom:8px;color:#0f1a26">Add a card to unlock your program</div><div style="color:#475569;font-size:14px;line-height:1.55">Your <b>Dividend Shift OS</b> membership ('+money(price)+'/mo) begins on <b>'+fmtDate(sub.start_date)+'</b>. You will not be charged anything today — we just need a card on file to activate your access. You can cancel anytime before billing starts.</div>'+(sub._notice?'<div style="margin-top:12px;background:#F1F5F9;border-radius:10px;padding:12px;color:#334155;font-size:13px">'+esc(sub._notice)+'</div>':'')+'<div id="ds-os-gate-msg" style="color:#b42318;font-size:13px;margin-top:10px;display:none"></div><button id="ds-os-gate-btn" style="margin-top:18px;width:100%;padding:13px;border:0;border-radius:10px;background:#0f1a26;color:#fff;font-weight:700;font-size:15px;cursor:pointer">Add card &amp; unlock →</button><div style="color:#94a3b8;font-size:12px;margin-top:12px;text-align:center">Secured by Stripe • '+money(price)+'/mo starting '+fmtDate(sub.start_date)+' • cancel anytime</div></div>'; document.body.appendChild(o); document.getElementById('ds-os-gate-btn').addEventListener('click',async function(){ var b=this; b.disabled=true; b.textContent='Opening secure checkout…'; var msg=document.getElementById('ds-os-gate-msg'); try{ var res=await api('os-checkout',{}); if(res&&res.ok&&res.url){ window.location.href=res.url; return;} msg.style.display='block'; msg.textContent=(res&&(res.message||res.error))||'Could not start checkout.'; }catch(e){ msg.style.display='block'; msg.textContent=String(e.message||e); } b.disabled=false; b.innerHTML='Add card &amp; unlock →'; }); }
function mountScreen(){ if(document.getElementById('osmembership')) return; var aside=document.querySelector('aside.side'), content=document.querySelector('div.content'); if(!aside||!content) return; var nav=document.createElement('div'); nav.className='nav'; nav.setAttribute('data-screen','osmembership'); nav.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20"></path></svg>Membership'; aside.appendChild(nav); var sec=document.createElement('section'); sec.className='screen'; sec.id='osmembership'; sec.innerHTML='<div class="kick">ACCOUNT</div><h1 class="h1">Membership &amp; Billing</h1><div id="ds-os-mem" class="card" style="padding:16px">Loading…</div>'; content.appendChild(sec); nav.addEventListener('click',function(){ refresh(); }); }
function renderMembership(sub){ var el=document.getElementById('ds-os-mem'); if(!el) return; if(!sub){ el.innerHTML='<div class="mut">No membership is assigned to your account yet.</div>'; return; } var started=sub.status==='active'; var card=sub.card_on_file?((sub.card_brand||'Card')+' •••• '+(sub.card_last4||'')):'None on file'; var SL={pending_setup:'Card needed',trialing:'Scheduled',active:'Active',past_due:'Payment failed',canceled:'Canceled'}; var statusLabel=SL[sub.status]||sub.status; var h='<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:16px"><div><div class="small mut">Plan</div><div style="font-weight:700">Dividend Shift OS — '+esc(sub.package_key||'')+'</div></div><div><div class="small mut">Price</div><div style="font-weight:700">'+money(sub.monthly_price_cents||19900)+'/mo</div></div><div><div class="small mut">'+(started?'Billing since':'Billing starts')+'</div><div style="font-weight:700">'+fmtDate(sub.start_date)+'</div></div><div><div class="small mut">Status</div><div style="font-weight:700">'+esc(statusLabel)+'</div></div><div><div class="small mut">Card on file</div><div style="font-weight:700">'+esc(card)+'</div></div></div>'; if(sub.card_on_file){ h+='<div style="margin-top:16px"><button id="ds-os-manage" style="padding:10px 14px;border:1px solid #D5DBE1;border-radius:8px;background:#fff;cursor:pointer;font-weight:600">Manage / cancel membership</button></div><div class="small mut" style="margin-top:8px">Update your card or cancel anytime in the secure Stripe portal'+(started?'':' before billing begins')+'.</div>'; } else { h+='<div style="margin-top:16px"><button id="ds-os-add" style="padding:11px 16px;border:0;border-radius:8px;background:#0f1a26;color:#fff;cursor:pointer;font-weight:700">Add card &amp; unlock →</button></div>'; } el.innerHTML=h; var mb=document.getElementById('ds-os-manage'); if(mb) mb.addEventListener('click',async function(){ this.disabled=true; var old=this.textContent; this.textContent='Opening…'; try{ var r=await api('os-portal',{}); if(r&&r.ok&&r.url){ window.location.href=r.url; return;} toast((r&&(r.message||r.error))||'Could not open portal.',false);}catch(e){ toast(String(e.message||e),false);} this.disabled=false; this.textContent=old; }); var ab=document.getElementById('ds-os-add'); if(ab) ab.addEventListener('click',async function(){ this.disabled=true; this.innerHTML='Opening…'; try{ var r=await api('os-checkout',{}); if(r&&r.ok&&r.url){ window.location.href=r.url; return;} toast((r&&(r.message||r.error))||'Could not start.',false);}catch(e){ toast(String(e.message||e),false);} this.disabled=false; this.innerHTML='Add card &amp; unlock →'; }); }
async function isStaff(uid){ try{ var r=await SB.from('profiles').select('role,access_tier').eq('id',uid).single(); var p=r.data; return !!(p&&(p.role==='admin'||p.role==='team'||p.access_tier==='Owner')); }catch(e){ return false; } }
async function loadSub(uid){ try{ var r=await SB.from('os_subscriptions').select('*').eq('client_id',uid).maybeSingle(); return r.data; }catch(e){ return null; } }
var busy=false;
async function refresh(){ if(busy) return; busy=true; try{ var ur=await SB.auth.getUser(); var u=ur&&ur.data&&ur.data.user; if(!u){ busy=false; return; } mountScreen(); var staff=await isStaff(u.id); var sub=await loadSub(u.id); if(sub){ try{ var pk=await SB.from('os_packages').select('notice').eq('key',sub.package_key).maybeSingle(); if(pk&&pk.data) sub._notice=pk.data.notice; }catch(e){} } renderMembership(sub); removeGate(); }catch(e){} busy=false; }
async function init(){ var qs=new URLSearchParams(location.search); if(qs.get('osbill')==='success' && qs.get('session_id')){ try{ await api('os-confirm',{session_id:qs.get('session_id')}); toast('Card saved — your membership is set. Billing starts on your scheduled date.',true);}catch(e){} qs.delete('osbill'); qs.delete('session_id'); try{ history.replaceState({}, '', location.pathname+(qs.toString()?('?'+qs.toString()):'')); }catch(e){} } refresh(); }

var tries=0; var iv=setInterval(function(){ tries++; if(!SB){SB=window.__dsSB;} if(SB && document.querySelector('aside.side')){ clearInterval(iv); try{ SB.auth.onAuthStateChange(function(){ setTimeout(refresh,300); }); }catch(e){} init(); } else if(tries>40){ clearInterval(iv); } },500);
})();

/* ---- Feature 38: OS Billing admin (packages + per-client assignment) ---- */
;(function(){
if(window.__dsOSAdmin) return; window.__dsOSAdmin=1;
var SB=window.__dsSB||null;
function H(){ return window.__dsOS||{money:function(c){return '$'+(((c||0))/100).toFixed(2);},esc:function(v){return String(v==null?'':v);},fmtDate:function(d){return d||'';},api:async function(fn,b){var s=await SB.auth.getSession();var t=s&&s.data&&s.data.session?s.data.session.access_token:'';var r=await fetch(SB.functionsUrl+'/'+fn,{method:'POST',headers:{'Authorization':'Bearer '+t,'apikey':SB.supabaseKey,'Content-Type':'application/json'},body:JSON.stringify(b||{})});return await r.json().catch(function(){return{};});}}; }
var pkgs=[], clients=[];
function mount(){ if(document.getElementById('osbilling')) return; var aside=document.querySelector('aside.side'), content=document.querySelector('div.content'); if(!aside||!content) return; var nav=document.createElement('div'); nav.className='nav admin-only'; nav.setAttribute('data-screen','osbilling'); nav.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"></rect><path d="M2 10h20"></path></svg>OS Billing <span class="badge-admin" style="margin-left:auto">Admin</span>'; aside.appendChild(nav); var sec=document.createElement('section'); sec.className='screen'; sec.id='osbilling'; sec.innerHTML='<div class="kick">REVENUE</div><h1 class="h1">OS Billing</h1><div id="ds-osa-pkgs" class="card" style="padding:16px;margin-bottom:16px">Loading packages…</div><div id="ds-osa-assign" class="card" style="padding:16px;margin-bottom:16px"></div><div id="ds-osa-subs" class="card" style="padding:16px"></div>'; content.appendChild(sec); nav.addEventListener('click',load); }
async function load(){ try{ pkgs=(await SB.from('os_packages').select('*').order('sort')).data||[]; }catch(e){ pkgs=[]; } try{ clients=(await SB.from('profiles').select('id,full_name,email,role,access_tier').order('full_name')).data||[]; }catch(e){ clients=[]; } renderPkgs(); renderAssign(); renderSubs(); }
function renderPkgs(){ var h=H(); var el=document.getElementById('ds-osa-pkgs'); if(!el) return; var rows=pkgs.map(function(p){ return '<div data-key="'+p.key+'" style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;border-top:1px solid #EEF2F6;padding:8px 0"><div style="width:120px;font-weight:700">'+h.esc(p.name)+'</div><label class="small mut">$/mo <input type="number" step="0.01" value="'+((p.monthly_price_cents||0)/100)+'" class="osa-price" style="width:84px;padding:5px;border:1px solid #D5DBE1;border-radius:6px"></label><label class="small mut">delay mo <input type="number" value="'+(p.delay_months||0)+'" class="osa-mo" style="width:58px;padding:5px;border:1px solid #D5DBE1;border-radius:6px"></label><label class="small mut">days <input type="number" value="'+(p.delay_days||0)+'" class="osa-dy" style="width:58px;padding:5px;border:1px solid #D5DBE1;border-radius:6px"></label><label class="small mut" style="flex:1;min-width:160px">notice <input type="text" value="'+h.esc(p.notice||'')+'" class="osa-notice" style="width:100%;padding:5px;border:1px solid #D5DBE1;border-radius:6px"></label><label class="small mut"><input type="checkbox" class="osa-active" '+(p.active?'checked':'')+'> active</label><button class="osa-save" style="padding:6px 12px;border:0;border-radius:6px;background:#0f1a26;color:#fff;cursor:pointer;font-weight:600">Save</button></div>'; }).join(''); el.innerHTML='<div style="font-weight:700;margin-bottom:6px">Packages &amp; pricing</div><div class="small mut" style="margin-bottom:6px">Delay = time after enrollment before the first charge. Changes apply to newly-assigned clients; re-assign a client to reschedule an existing one.</div>'+rows; [].slice.call(el.querySelectorAll('.osa-save')).forEach(function(btn){ btn.addEventListener('click',async function(){ var row=this.closest('[data-key]'); var key=row.getAttribute('data-key'); var price=Math.round(parseFloat(row.querySelector('.osa-price').value||'0')*100); var mo=parseInt(row.querySelector('.osa-mo').value||'0',10); var dy=parseInt(row.querySelector('.osa-dy').value||'0',10); var notice=row.querySelector('.osa-notice').value; var active=row.querySelector('.osa-active').checked; var self=this; self.disabled=true; var old=self.textContent; self.textContent='Saving…'; try{ var r=await SB.from('os_packages').update({monthly_price_cents:price,delay_months:mo,delay_days:dy,notice:notice,active:active,updated_at:new Date().toISOString()}).eq('key',key); if(r.error) throw r.error; self.textContent='Saved'; }catch(e){ self.textContent='Error'; } setTimeout(function(){ self.disabled=false; self.textContent=old; },1200); }); }); }
function renderAssign(){ var h=H(); var el=document.getElementById('ds-osa-assign'); if(!el) return; var copts=clients.map(function(c){ var staff=(c.role==='admin'||c.role==='team'||c.access_tier==='Owner'); return '<option value="'+c.id+'">'+h.esc((c.full_name||c.email||c.id))+(staff?' (staff)':'')+'</option>'; }).join(''); var popts=pkgs.map(function(p){ return '<option value="'+p.key+'">'+h.esc(p.name)+'</option>'; }).join(''); var today=new Date().toISOString().slice(0,10); el.innerHTML='<div style="font-weight:700;margin-bottom:8px">Assign membership to a client</div><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:end"><label class="small mut">Client<br><select id="osa-client" style="padding:7px;border:1px solid #D5DBE1;border-radius:6px;min-width:220px">'+copts+'</select></label><label class="small mut">Package<br><select id="osa-pkg" style="padding:7px;border:1px solid #D5DBE1;border-radius:6px">'+popts+'</select></label><label class="small mut">Enrollment date<br><input type="date" id="osa-date" value="'+today+'" style="padding:7px;border:1px solid #D5DBE1;border-radius:6px"></label><label class="small mut">Charge starts (days after enrollment)<br><input type="number" min="0" id="osa-days" placeholder="pkg default" style="width:150px;padding:7px;border:1px solid #D5DBE1;border-radius:6px"></label><button id="osa-assign-btn" style="padding:9px 16px;border:0;border-radius:8px;background:#0f1a26;color:#fff;cursor:pointer;font-weight:700">Assign</button></div><div id="osa-assign-msg" class="small" style="margin-top:8px"></div>'; document.getElementById('osa-assign-btn').addEventListener('click',async function(){ var cid=document.getElementById('osa-client').value; var pk=document.getElementById('osa-pkg').value; var dt=document.getElementById('osa-date').value; var msg=document.getElementById('osa-assign-msg'); var self=this; self.disabled=true; var old=self.textContent; self.textContent='Assigning…'; try{ var odv=document.getElementById('osa-days').value; var r=await h.api('os-assign',{client_id:cid,package_key:pk,enrollment_date:dt,override_days:(odv===''?null:parseInt(odv,10))}); if(r&&r.ok){ msg.style.color='#1a7f4b'; msg.textContent='Assigned. Billing start date: '+h.fmtDate(r.start_date)+(r.rescheduled?' (Stripe trial rescheduled).':'.'); renderSubs(); } else { msg.style.color='#b42318'; msg.textContent=(r&&(r.message||r.error))||'Could not assign.'; } }catch(e){ msg.style.color='#b42318'; msg.textContent=String(e.message||e); } self.disabled=false; self.textContent=old; }); }
async function renderSubs(){ var h=H(); var el=document.getElementById('ds-osa-subs'); if(!el) return; var subs=[]; try{ subs=(await SB.from('os_subscriptions').select('*').order('updated_at',{ascending:false})).data||[]; }catch(e){} var byId={}; clients.forEach(function(c){ byId[c.id]=c; }); if(!subs.length){ el.innerHTML='<div style="font-weight:700;margin-bottom:6px">Assigned memberships</div><div class="mut small">None yet.</div>'; return; } var SL={pending_setup:'Card needed',trialing:'Scheduled',active:'Active',past_due:'Payment failed',canceled:'Canceled'}; var rows=subs.map(function(s){ var c=byId[s.client_id]||{}; var col=s.status==='active'?'#1a7f4b':((s.status==='past_due'||s.status==='canceled')?'#b42318':(s.status==='pending_setup'?'#8a6d1a':'#334155')); var card=s.card_on_file?((s.card_brand||'Card')+' ••'+(s.card_last4||'')):'—'; return '<div style="display:flex;flex-wrap:wrap;gap:10px;border-top:1px solid #EEF2F6;padding:8px 0;align-items:center"><div style="width:180px"><div style="font-weight:600">'+h.esc(c.full_name||c.email||s.client_id)+'</div><div class="small mut">'+h.esc(c.email||'')+'</div></div><div class="small">'+h.esc(s.package_key||'')+'</div><div class="small mut">enrolled '+(s.enrollment_date||'—')+'</div><div class="small">starts <b>'+h.fmtDate(s.start_date)+'</b></div><div class="small">'+h.money(s.monthly_price_cents||0)+'/mo</div><div class="small">'+h.esc(card)+'</div><div class="small" style="font-weight:700;color:'+col+';margin-left:auto">'+(SL[s.status]||s.status)+'</div><button class="osa-resched" data-cid="'+s.client_id+'" data-pkg="'+(s.package_key||'')+'" data-enr="'+(s.enrollment_date||'')+'" style="margin-left:10px;padding:4px 10px;border:1px solid #D5DBE1;border-radius:6px;background:#fff;cursor:pointer;font-size:12px">Reschedule</button></div>'; }).join(''); el.innerHTML='<div style="font-weight:700;margin-bottom:6px">Assigned memberships</div>'+rows; [].slice.call(el.querySelectorAll('.osa-resched')).forEach(function(btn){ btn.addEventListener('click',async function(){ var ndt=prompt('Start charging this client on (YYYY-MM-DD):'); if(!ndt) return; if(!/^\\d{4}-\\d{2}-\\d{2}$/.test(ndt)){ alert('Please use YYYY-MM-DD'); return; } var self=this; self.disabled=true; var rr=await H().api('os-assign',{client_id:self.getAttribute('data-cid'),package_key:self.getAttribute('data-pkg'),enrollment_date:self.getAttribute('data-enr'),start_date:ndt}); if(rr&&rr.ok){ renderSubs(); } else { self.disabled=false; alert((rr&&(rr.message||rr.error))||'Could not reschedule.'); } }); }); }
var tries=0; var iv=setInterval(function(){ tries++; if(!SB){SB=window.__dsSB;} if(SB && document.querySelector('aside.side')){ clearInterval(iv); mount(); } else if(tries>40){ clearInterval(iv);} },500);
})();


/* ---- Feature 39: two-gate access — OS feature lock + program expiry ---- */
;(function(){
if(window.__dsOSGate2) return; window.__dsOSGate2=1;
var SB=window.__dsSB||null;
var OS_SCREENS={scouter:1,deal:1,coach:1,mymerch:1};
var ALWAYS={osmembership:1,settings:1,adminsettings:1};
var st={staff:false,osActive:false,progExpired:false,progExp:null,hasSub:false,loaded:false};
function H(){ return window.__dsOS||null; }
function fmt(d){ var h=H(); return h?h.fmtDate(d):(d||''); }
async function load(){ if(!SB){SB=window.__dsSB;} if(!SB) return; var ur; try{ ur=await SB.auth.getUser(); }catch(e){ return; } var u=ur&&ur.data&&ur.data.user; if(!u) return;
  try{ var pr=await SB.from('profiles').select('role,access_tier').eq('id',u.id).single(); var p=pr.data; st.staff=!!(p&&(p.role==='admin'||p.role==='team'||p.access_tier==='Owner')); }catch(e){}
  try{ var s=await SB.from('os_subscriptions').select('card_on_file,status').eq('client_id',u.id).maybeSingle(); var sub=s.data; st.hasSub=!!sub; st.osActive=!!(sub&&sub.card_on_file&&(sub.status==='trialing'||sub.status==='active')); }catch(e){}
  try{ var pa=await SB.from('program_access').select('expires_at,active').eq('client_id',u.id).maybeSingle(); var d=pa.data; st.progExpired=!!(d&&d.active&&d.expires_at&&(new Date(d.expires_at+'T23:59:59Z').getTime()<Date.now())); st.progExp=d?d.expires_at:null; }catch(e){}
  st.loaded=true;
}
function activeScreen(){ var s=document.querySelector('.screen.show'); return s?s.id:''; }
function ensureOverlay(){ var content=document.querySelector('div.content'); if(!content) return null; if(getComputedStyle(content).position==='static') content.style.position='relative'; var o=document.getElementById('ds-os-lock'); if(!o){ o=document.createElement('div'); o.id='ds-os-lock'; o.style.cssText='position:absolute;inset:0;z-index:900;background:rgba(248,250,252,.975);display:none;align-items:flex-start;justify-content:center;padding:64px 20px'; content.appendChild(o); } return o; }
function osHTML(){ return '<div style="max-width:520px;background:#fff;border:1px solid #E6EAEF;border-radius:16px;padding:28px;box-shadow:0 10px 40px rgba(0,0,0,.12);font-family:system-ui,Arial;text-align:center"><div style="font-weight:800;font-size:20px;color:#0f1a26">Unlock DividendShift OS</div><div style="color:#475569;font-size:14px;margin-top:8px;line-height:1.55">This is a DividendShift OS feature. Your $199/mo membership unlocks the Location Scouter, Deal Analyzer, AI Coach and CRM — plus 100 AI credits every month.</div><button id="ds-oslock-btn" style="margin-top:18px;padding:12px 20px;border:0;border-radius:10px;background:#0f1a26;color:#fff;font-weight:700;font-size:15px;cursor:pointer">'+(st.hasSub?'Add card &amp; unlock →':'See membership →')+'</button><div id="ds-oslock-msg" style="color:#b42318;font-size:13px;margin-top:10px;display:none"></div><div style="color:#94a3b8;font-size:12px;margin-top:12px">Cancel anytime • secured by Stripe</div></div>'; }
function progHTML(){ return '<div style="max-width:520px;background:#fff;border:1px solid #E6EAEF;border-radius:16px;padding:28px;box-shadow:0 10px 40px rgba(0,0,0,.12);font-family:system-ui,Arial;text-align:center"><div style="font-weight:800;font-size:20px;color:#0f1a26">Your program access has ended</div><div style="color:#475569;font-size:14px;margin-top:8px;line-height:1.55">Your program window ended on <b>'+fmt(st.progExp)+'</b>. Reach out to your advisor to renew or extend your access.'+(st.osActive?' Your DividendShift OS features are still available from the Membership menu.':'')+'</div><a href="mailto:support@dividendshift.com?subject=Renew%20program%20access" style="display:inline-block;margin-top:18px;padding:12px 20px;border-radius:10px;background:#0f1a26;color:#fff;font-weight:700;font-size:15px;text-decoration:none">Contact my advisor</a></div>'; }
function wire(o,mode){ if(mode!=='os') return; var b=o.querySelector('#ds-oslock-btn'); if(!b) return; b.addEventListener('click',async function(){ if(!st.hasSub){ var mn=document.querySelector('.nav[data-screen="osmembership"]'); if(mn) mn.click(); return; } var self=this; self.disabled=true; self.innerHTML='Opening…'; var msg=o.querySelector('#ds-oslock-msg'); try{ var H2=H(); var r=await H2.api('os-checkout',{}); if(r&&r.ok&&r.url){ window.location.href=r.url; return; } if(msg){msg.style.display='block'; msg.textContent=(r&&(r.message||r.error))||'Could not start.';} }catch(e){ if(msg){msg.style.display='block'; msg.textContent=String(e.message||e);} } self.disabled=false; self.innerHTML='Add card &amp; unlock →'; }); }
function apply(){ var o=document.getElementById('ds-os-lock'); if(!st.loaded||st.staff){ if(o)o.style.display='none'; return; } o=ensureOverlay(); if(!o) return; var scr=activeScreen(); if(!scr||ALWAYS[scr]){ o.style.display='none'; return; } var locked=false, mode=''; if(OS_SCREENS[scr]){ if(!st.osActive){ locked=true; mode='os'; } } else if(st.progExpired){ locked=true; mode='prog'; } if(!locked){ o.style.display='none'; return; } if(o.getAttribute('data-mode')!==mode){ o.innerHTML=(mode==='os')?osHTML():progHTML(); o.setAttribute('data-mode',mode); wire(o,mode); } o.style.display='flex'; }
async function boot(){ await load(); apply(); }
try{ if(SB) SB.auth.onAuthStateChange(function(){ setTimeout(boot,400); }); }catch(e){}
setInterval(function(){ if(!SB)SB=window.__dsSB; apply(); },700);
setInterval(boot,60000);
setTimeout(boot,1200); setTimeout(boot,3200);
})();

/* ---- Feature 40: admin Program Access screen ---- */
;(function(){
if(window.__dsProgAdmin) return; window.__dsProgAdmin=1;
var SB=window.__dsSB||null;
function H(){ return window.__dsOS||{esc:function(v){return String(v==null?'':v);},fmtDate:function(d){return d||'';}}; }
var clients=[], rows=[];
function addMonths(base,m){ var d=new Date(base+'T12:00:00Z'); d.setUTCMonth(d.getUTCMonth()+(m||0)); return d.toISOString().slice(0,10); }
function mount(){ if(document.getElementById('progaccess')) return; var aside=document.querySelector('aside.side'), content=document.querySelector('div.content'); if(!aside||!content) return; var nav=document.createElement('div'); nav.className='nav admin-only'; nav.setAttribute('data-screen','progaccess'); nav.innerHTML='<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v4l3 3"></path></svg>Program Access <span class="badge-admin" style="margin-left:auto">Admin</span>'; aside.appendChild(nav); var sec=document.createElement('section'); sec.className='screen'; sec.id='progaccess'; sec.innerHTML='<div class="kick">ACCESS</div><h1 class="h1">Program Access</h1><div id="ds-pa-assign" class="card" style="padding:16px;margin-bottom:16px"></div><div id="ds-pa-list" class="card" style="padding:16px"></div>'; content.appendChild(sec); nav.addEventListener('click',load); }
async function load(){ try{ clients=(await SB.from('profiles').select('id,full_name,email,role,access_tier').order('full_name')).data||[]; }catch(e){ clients=[]; } try{ rows=(await SB.from('program_access').select('*')).data||[]; }catch(e){ rows=[]; } renderAssign(); renderList(); }
function renderAssign(){ var h=H(); var el=document.getElementById('ds-pa-assign'); if(!el) return; var copts=clients.map(function(c){ return '<option value="'+c.id+'">'+h.esc(c.full_name||c.email||c.id)+'</option>'; }).join(''); var today=new Date().toISOString().slice(0,10); el.innerHTML='<div style="font-weight:700;margin-bottom:8px">Grant / update program access</div><div class="small mut" style="margin-bottom:8px">Program content unlocks from the start date and locks when the window ends. Default window is 6 months. OS tool access is separate (OS Billing).</div><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:end"><label class="small mut">Client<br><select id="pa-client" style="padding:7px;border:1px solid #D5DBE1;border-radius:6px;min-width:220px">'+copts+'</select></label><label class="small mut">Start date<br><input type="date" id="pa-start" value="'+today+'" style="padding:7px;border:1px solid #D5DBE1;border-radius:6px"></label><label class="small mut">Length (months)<br><input type="number" min="0" id="pa-months" value="6" style="width:90px;padding:7px;border:1px solid #D5DBE1;border-radius:6px"></label><label class="small mut">or exact expiry<br><input type="date" id="pa-exp" style="padding:7px;border:1px solid #D5DBE1;border-radius:6px"></label><button id="pa-set" style="padding:9px 16px;border:0;border-radius:8px;background:#0f1a26;color:#fff;cursor:pointer;font-weight:700">Set access</button></div><div id="pa-msg" class="small" style="margin-top:8px"></div>'; document.getElementById('pa-set').addEventListener('click',async function(){ var cid=document.getElementById('pa-client').value; var start=document.getElementById('pa-start').value; var months=parseInt(document.getElementById('pa-months').value||'6',10); var expOverride=document.getElementById('pa-exp').value; var exp=(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(expOverride))?expOverride:addMonths(start,months); var msg=document.getElementById('pa-msg'); var self=this; self.disabled=true; var old=self.textContent; self.textContent='Saving…'; try{ var r=await SB.from('program_access').upsert({client_id:cid,started_at:start,months:months,expires_at:exp,active:true,updated_at:new Date().toISOString()},{onConflict:'client_id'}); if(r.error) throw r.error; msg.style.color='#1a7f4b'; msg.textContent='Program access set. Expires '+exp+'.'; load(); }catch(e){ msg.style.color='#b42318'; msg.textContent=String(e.message||e); } self.disabled=false; self.textContent=old; }); }
function renderList(){ var h=H(); var el=document.getElementById('ds-pa-list'); if(!el) return; var byId={}; clients.forEach(function(c){byId[c.id]=c;}); if(!rows.length){ el.innerHTML='<div style="font-weight:700;margin-bottom:6px">Program windows</div><div class="mut small">None yet.</div>'; return; } var now=Date.now(); var out=rows.map(function(r){ var c=byId[r.client_id]||{}; var exp=r.expires_at; var expired=r.active&&exp&&(new Date(exp+'T23:59:59Z').getTime()<now); var daysLeft=exp?Math.ceil((new Date(exp+'T23:59:59Z').getTime()-now)/86400000):null; var col=(!r.active)?'#64748B':(expired?'#b42318':((daysLeft!=null&&daysLeft<=30)?'#8a6d1a':'#1a7f4b')); var statusTxt=(!r.active)?'Revoked':(expired?'Expired':(daysLeft+' days left')); return '<div style="display:flex;flex-wrap:wrap;gap:10px;border-top:1px solid #EEF2F6;padding:8px 0;align-items:center"><div style="width:190px"><div style="font-weight:600">'+h.esc(c.full_name||c.email||r.client_id)+'</div><div class="small mut">'+h.esc(c.email||'')+'</div></div><div class="small mut">start '+(r.started_at||'—')+'</div><div class="small">expires <b>'+(exp||'—')+'</b></div><div class="small" style="font-weight:700;color:'+col+'">'+statusTxt+'</div><button class="pa-ext" data-cid="'+r.client_id+'" style="margin-left:auto;padding:4px 10px;border:1px solid #D5DBE1;border-radius:6px;background:#fff;cursor:pointer;font-size:12px">Extend</button><button class="pa-rev" data-cid="'+r.client_id+'" style="padding:4px 10px;border:1px solid #f0c2c2;border-radius:6px;background:#fff;color:#b42318;cursor:pointer;font-size:12px">Revoke</button></div>'; }).join(''); el.innerHTML='<div style="font-weight:700;margin-bottom:6px">Program windows</div>'+out; [].slice.call(el.querySelectorAll('.pa-ext')).forEach(function(b){ b.addEventListener('click',async function(){ var nd=prompt('New expiry date (YYYY-MM-DD):'); if(!nd) return; if(!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(nd)){ alert('Use YYYY-MM-DD'); return; } var r=await SB.from('program_access').update({expires_at:nd,active:true,updated_at:new Date().toISOString()}).eq('client_id',this.getAttribute('data-cid')); if(!r.error) load(); else alert(String(r.error.message||r.error)); }); }); [].slice.call(el.querySelectorAll('.pa-rev')).forEach(function(b){ b.addEventListener('click',async function(){ if(!confirm('Revoke program access now?')) return; var r=await SB.from('program_access').update({active:false,updated_at:new Date().toISOString()}).eq('client_id',this.getAttribute('data-cid')); if(!r.error) load(); else alert(String(r.error.message||r.error)); }); }); }
var tries=0; var iv=setInterval(function(){ tries++; if(!SB)SB=window.__dsSB; if(SB && document.querySelector('aside.side')){ clearInterval(iv); mount(); } else if(tries>60){ clearInterval(iv);} },500);
})();


/* ---- Feature 41: password-recovery guard (hold reset screen until password updated) ---- */
;(function(){
if(window.__dsRecoveryFix) return; window.__dsRecoveryFix=1;
var recovery = (location.hash||'').indexOf('type=recovery')>=0;
if(recovery) window.__inRecovery=true;
function apVisible(){ var p=document.getElementById('apNewpw'); return !!(p && p.offsetParent!==null); }
function forceReset(){ if(apVisible()) return; try{ var a=document.getElementById('authScreen'); if(a) a.classList.remove('hide'); if(typeof window.showPanel==='function') window.showPanel('apNewpw'); }catch(e){} }
try{ var SB=window.__dsSB; if(SB&&SB.auth&&SB.auth.onAuthStateChange){ SB.auth.onAuthStateChange(function(evt){ if(evt==='PASSWORD_RECOVERY'){ window.__inRecovery=true; recovery=true; forceReset(); } else if(evt==='USER_UPDATED' || evt==='SIGNED_OUT'){ window.__inRecovery=false; } }); } }catch(e){}
if(recovery){ var n=0; var iv=setInterval(function(){ n++; if(window.__inRecovery){ forceReset(); } else { clearInterval(iv); } if(n>2400){ clearInterval(iv); } }, 250); forceReset(); }
})();


/* ---- Feature 42: Manage Membership (retention + one-click cancel) ---- */
;(function(){
if(window.__dsManageMembership) return; window.__dsManageMembership=1;
var SB=window.__dsSB; if(!SB) return;
function api(fn,body){ var H=window.__dsOS; if(H&&H.api) return H.api(fn,body); return (async function(){ var s=await SB.auth.getSession(); var t=s&&s.data&&s.data.session?s.data.session.access_token:''; var r=await fetch(SB.functionsUrl+'/'+fn,{method:'POST',headers:{'Authorization':'Bearer '+t,'apikey':SB.supabaseKey,'Content-Type':'application/json'},body:JSON.stringify(body||{})}); return await r.json().catch(function(){return{};}); })(); }
function toast(msg,ok){ try{ var t=document.createElement('div'); t.textContent=msg; t.style.cssText='position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:2147483650;background:'+(ok===false?'#b42318':'#0f1a26')+';color:#fff;padding:11px 16px;border-radius:10px;font:600 13px system-ui;box-shadow:0 6px 24px rgba(0,0,0,.25);max-width:82vw;text-align:center'; document.body.appendChild(t); setTimeout(function(){t.remove();},5000);}catch(e){} }
function refreshMem(){ var n=document.querySelector('.nav[data-screen="osmembership"]'); if(n) n.click(); }
function close(){ var m=document.getElementById('ds-mm-modal'); if(m) m.remove(); }
function modal(){ close(); var o=document.createElement('div'); o.id='ds-mm-modal'; o.style.cssText='position:fixed;inset:0;z-index:2147483600;background:rgba(12,20,32,.72);display:flex;align-items:center;justify-content:center;padding:20px'; var box=document.createElement('div'); box.id='ds-mm-box'; box.style.cssText='max-width:560px;width:100%;background:#fff;border-radius:16px;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.35);font-family:system-ui,Arial;max-height:90vh;overflow:auto'; o.appendChild(box); o.addEventListener('click',function(e){ if(e.target===o) close(); }); document.body.appendChild(o); return box; }
var state={feedback:''};
function step1(box){ box.innerHTML='<div style="font-weight:800;font-size:20px;color:#0f1a26">Manage membership</div><div style="color:#475569;font-size:14px;margin-top:6px;line-height:1.5">Before anything changes, tell us what is not working. Specific feedback (75+ characters) helps us get you results.</div><textarea id="ds-mm-fb" rows="5" placeholder="What is not working for you right now?" style="width:100%;margin-top:12px;padding:10px;border:1px solid #D5DBE1;border-radius:10px;font:inherit;box-sizing:border-box"></textarea><div id="ds-mm-count" class="small mut" style="margin-top:4px">0 / 75</div><div style="display:flex;justify-content:space-between;margin-top:14px;gap:10px"><button id="ds-mm-back" style="padding:10px 14px;border:1px solid #D5DBE1;border-radius:8px;background:#fff;cursor:pointer;font-weight:600">Never mind</button><button id="ds-mm-cont" disabled style="padding:10px 16px;border:0;border-radius:8px;background:#94a3b8;color:#fff;font-weight:700;cursor:not-allowed">Continue</button></div>'; var ta=box.querySelector('#ds-mm-fb'); if(state.feedback) ta.value=state.feedback; var cnt=box.querySelector('#ds-mm-count'); var cont=box.querySelector('#ds-mm-cont'); function upd(){ var n=ta.value.trim().length; cnt.textContent=n+' / 75'; var ok=n>=75; cont.disabled=!ok; cont.style.background=ok?'#0f1a26':'#94a3b8'; cont.style.cursor=ok?'pointer':'not-allowed'; } ta.addEventListener('input',upd); upd(); box.querySelector('#ds-mm-back').addEventListener('click',close); cont.addEventListener('click',function(){ state.feedback=ta.value.trim(); step2(box); }); }
function step2(box){ box.innerHTML='<div style="font-weight:800;font-size:20px;color:#0f1a26">Before you go — we want you winning.</div><div style="color:#475569;font-size:14px;margin-top:6px;line-height:1.5">DividendShift OS is how you keep getting results long-term. Grab one and keep your momentum:</div><div style="border:1px solid #E6EAEF;border-radius:12px;padding:14px;margin-top:14px"><div style="font-weight:700">Keep building — 25% off your next 2 months</div><div class="small mut" style="margin:4px 0 10px">Stay in, pay less while you ramp.</div><button id="ds-mm-disc" style="padding:10px 16px;border:0;border-radius:8px;background:#0f1a26;color:#fff;font-weight:700;cursor:pointer">Apply 25% off</button></div><div style="border:1px solid #E6EAEF;border-radius:12px;padding:14px;margin-top:12px"><div style="font-weight:700">Go all-in — prepay 90 days, save 40%</div><div class="small mut" style="margin:4px 0 10px">Commit to results and lock in the biggest discount.</div><button id="ds-mm-prepay" style="padding:10px 16px;border:0;border-radius:8px;background:#1a7f4b;color:#fff;font-weight:700;cursor:pointer">Prepay &amp; save 40%</button></div><div id="ds-mm-msg" style="color:#b42318;font-size:13px;margin-top:10px;display:none"></div><div style="text-align:center;margin-top:16px"><a id="ds-mm-cancel" href="#" style="color:#94a3b8;font-size:13px;text-decoration:underline">No thanks, cancel my membership</a></div>'; var msg=box.querySelector('#ds-mm-msg'); function err(m){ msg.style.display='block'; msg.textContent=m; } box.querySelector('#ds-mm-disc').addEventListener('click',async function(){ var self=this; self.disabled=true; self.textContent='Applying…'; try{ var r=await api('os-retain',{action:'discount',feedback:state.feedback}); if(r&&r.ok){ close(); toast('25% off applied to your next 2 months — keep winning!',true); refreshMem(); return; } err((r&&(r.message||r.detail||r.error))||'Could not apply. Try again.'); }catch(e){ err(String(e.message||e)); } self.disabled=false; self.textContent='Apply 25% off'; }); box.querySelector('#ds-mm-prepay').addEventListener('click',async function(){ var self=this; self.disabled=true; self.innerHTML='Opening…'; try{ var r=await api('os-retain',{action:'prepay',feedback:state.feedback}); if(r&&r.ok&&r.url){ window.location.href=r.url; return; } err((r&&(r.message||r.detail||r.error))||'Could not start prepay.'); }catch(e){ err(String(e.message||e)); } self.disabled=false; self.innerHTML='Prepay &amp; save 40%'; }); box.querySelector('#ds-mm-cancel').addEventListener('click',function(e){ e.preventDefault(); step3(box); }); }
function step3(box){ box.innerHTML='<div style="font-weight:800;font-size:20px;color:#0f1a26">Cancel membership?</div><div style="color:#475569;font-size:14px;margin-top:8px;line-height:1.5">You will keep full access until the end of your current billing period, then it ends. You can resubscribe anytime.</div><div id="ds-mm-msg2" style="color:#b42318;font-size:13px;margin-top:10px;display:none"></div><div style="display:flex;justify-content:space-between;margin-top:16px;gap:10px"><button id="ds-mm-keep" style="padding:10px 16px;border:0;border-radius:8px;background:#0f1a26;color:#fff;font-weight:700;cursor:pointer">Keep my membership</button><button id="ds-mm-doconf" style="padding:10px 14px;border:1px solid #f0c2c2;border-radius:8px;background:#fff;color:#b42318;font-weight:700;cursor:pointer">Yes, cancel</button></div>'; var msg=box.querySelector('#ds-mm-msg2'); box.querySelector('#ds-mm-keep').addEventListener('click',function(){ step2(box); }); box.querySelector('#ds-mm-doconf').addEventListener('click',async function(){ var self=this; self.disabled=true; self.textContent='Canceling…'; try{ var r=await api('os-retain',{action:'cancel',feedback:state.feedback}); if(r&&r.ok){ close(); toast('Membership canceled — active until '+(r.cancel_at||'period end')+'.',true); refreshMem(); return; } msg.style.display='block'; msg.textContent=(r&&(r.message||r.detail||r.error))||'Could not cancel. Please contact support.'; }catch(e){ msg.style.display='block'; msg.textContent=String(e.message||e); } self.disabled=false; self.textContent='Yes, cancel'; }); }
async function openFlow(){ state.feedback=''; var box=modal(); step1(box); try{ api('os-retain',{action:'alert'}); }catch(e){} }
function ensureButton(){ var host=document.getElementById('ds-os-mem'); if(!host) return; if(host.querySelector('#ds-mm-btn')) return; var txt=(host.innerText||''); if(txt.indexOf('No membership')>=0) return; var b=document.createElement('button'); b.id='ds-mm-btn'; b.textContent='Manage membership'; b.style.cssText='display:block;margin-top:12px;padding:11px 16px;border:1px solid #D5DBE1;border-radius:8px;background:#fff;cursor:pointer;font-weight:700'; b.addEventListener('click',openFlow); host.appendChild(b); }
setInterval(ensureButton, 900);
(function(){ try{ var qs=new URLSearchParams(location.search); if(qs.get('osprepay')==='success' && qs.get('session_id')){ api('os-prepay-confirm',{session_id:qs.get('session_id')}).then(function(r){ if(r&&r.ok) toast('You are prepaid — next charge resumes '+(r.prepay_until||'in ~90 days')+'. Thanks for staying!',true); else toast((r&&(r.message||r.error))||'Prepay recorded.',true); }); qs.delete('osprepay'); qs.delete('session_id'); history.replaceState({},'',location.pathname+(qs.toString()?('?'+qs.toString()):'')); } }catch(e){} })();
})();


/* ---- Feature 43: OS Billing admin — retention activity panel ---- */
;(function(){
if(window.__dsRetentionAdmin) return; window.__dsRetentionAdmin=1;
var SB=window.__dsSB; if(!SB) return;
function H(){ return window.__dsOS||{esc:function(v){return String(v==null?'':v);}}; }
var clients={};
async function load(){ var h=H(); var el=document.getElementById('ds-osa-ret-list'); if(!el) return; var rows=[]; try{ rows=(await SB.from('os_retention_log').select('*').order('created_at',{ascending:false}).limit(60)).data||[]; }catch(e){ el.innerHTML='<span class="mut">Could not load retention activity.</span>'; return; } if(!Object.keys(clients).length){ try{ var ps=(await SB.from('profiles').select('id,full_name,email')).data||[]; ps.forEach(function(p){ clients[p.id]=p; }); }catch(e){} } if(!rows.length){ el.innerHTML='<span class="mut">No retention activity yet.</span>'; return; } var LB={open:{t:'Opened cancel flow',c:'#8a6d1a'},offer_discount:{t:'Took 25% off (2 mo)',c:'#1a7f4b'},offer_prepay:{t:'Prepaid 90d / 40% off',c:'#1a7f4b'},canceled:{t:'Canceled',c:'#b42318'}}; el.innerHTML=rows.map(function(r){ var c=clients[r.client_id]||{}; var lab=LB[r.kind]||{t:r.kind,c:'#334155'}; var d=new Date(r.created_at); var fb=r.feedback?('<div class="small" style="margin-top:3px;color:#475569">“'+h.esc(String(r.feedback).slice(0,260))+'”</div>'):''; return '<div style="border-top:1px solid #EEF2F6;padding:8px 0"><div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><div class="small" style="font-weight:600">'+h.esc(c.full_name||c.email||r.client_id)+'</div><div class="small" style="font-weight:700;color:'+lab.c+'">'+lab.t+'</div></div><div class="small mut">'+h.esc(c.email||'')+' • '+d.toLocaleString()+'</div>'+fb+'</div>'; }).join(''); }
function ensureCard(){ var sec=document.getElementById('osbilling'); if(!sec) return; if(document.getElementById('ds-osa-retention')) return; var card=document.createElement('div'); card.id='ds-osa-retention'; card.className='card'; card.style.cssText='padding:16px;margin-top:16px'; card.innerHTML='<div style="font-weight:700;margin-bottom:6px">Retention activity</div><div class="small mut" style="margin-bottom:6px">Every Manage-Membership open, save, and cancellation (with feedback). Newest first.</div><div id="ds-osa-ret-list" class="mut small">Loading…</div>'; sec.appendChild(card); var nav=document.querySelector('.nav[data-screen="osbilling"]'); if(nav) nav.addEventListener('click',load); load(); }
var tries=0; var iv=setInterval(function(){ tries++; if(!SB)SB=window.__dsSB; if(document.getElementById('osbilling')){ ensureCard(); } if(tries>400){ clearInterval(iv);} },1000);
})();


/* ---- Feature 44: mobile polish (16px fields to stop iOS zoom, scrollable tables) ---- */
;(function(){if(window.__dsMobilePolish)return;window.__dsMobilePolish=1;try{var css='@media (max-width:640px){ input,select,textarea{ font-size:16px !important } } @media (max-width:880px){ table{ display:block; overflow-x:auto; -webkit-overflow-scrolling:touch; max-width:100% } }';var s=document.createElement('style');s.id='ds-mobile-polish';s.appendChild(document.createTextNode(css));(document.head||document.documentElement).appendChild(s);}catch(e){}})();


/* ---- Feature 45: Reach Out — contact your success team ---- */
;(function(){
if(window.__dsReachOut) return; window.__dsReachOut=1;
var SB=window.__dsSB; if(!SB) return;
function api(fn,body){ var H=window.__dsOS; if(H&&H.api) return H.api(fn,body); return (async function(){ var s=await SB.auth.getSession(); var t=s&&s.data&&s.data.session?s.data.session.access_token:''; var r=await fetch(SB.functionsUrl+'/'+fn,{method:'POST',headers:{'Authorization':'Bearer '+t,'apikey':SB.supabaseKey,'Content-Type':'application/json'},body:JSON.stringify(body||{})}); return await r.json().catch(function(){return{};}); })(); }
function esc(v){ return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
var state={kind:'message'};
function paintTabs(host){ [].slice.call(host.querySelectorAll('.ds-ro-tab')).forEach(function(b){ var on=b.getAttribute('data-ro-kind')===state.kind; b.style.background=on?'#0f1a26':'#fff'; b.style.color=on?'#fff':'#0f1a26'; b.style.borderColor=on?'#0f1a26':'#D5DBE1'; }); }
async function loadRecent(){ var el=document.getElementById('ds-ro-recent'); if(!el) return; var rows=[]; try{ rows=(await SB.from('reach_out').select('kind,urgency,message,status,created_at').order('created_at',{ascending:false}).limit(10)).data||[]; }catch(e){ el.innerHTML='<span class="mut">Could not load.</span>'; return; } if(!rows.length){ el.innerHTML='<span class="mut">No requests yet.</span>'; return; } el.innerHTML=rows.map(function(r){ var d=new Date(r.created_at); var stc=r.status==='done'?'#1a7f4b':(r.status==='in_progress'?'#8a6d1a':'#64748B'); return '<div style="border-top:1px solid #EEF2F6;padding:8px 0"><div style="display:flex;justify-content:space-between"><div class="small" style="font-weight:600">'+(r.kind==='call'?'Call request':'Message')+(r.urgency==='high'?' • Urgent':'')+'</div><div class="small" style="font-weight:700;color:'+stc+'">'+esc(r.status)+'</div></div><div class="small mut">'+esc(String(r.message||'').slice(0,140))+' • '+d.toLocaleDateString()+'</div></div>'; }).join(''); }
function render(host){ host.innerHTML='<div class="kick">SUPPORT</div><h1 class="h1">Reach out to your success team</h1><div class="card" style="padding:18px;max-width:640px"><div style="display:flex;gap:8px;margin-bottom:14px"><button class="ds-ro-tab" data-ro-kind="message" style="padding:9px 14px;border:1px solid #0f1a26;border-radius:8px;background:#0f1a26;color:#fff;font-weight:600;cursor:pointer">Send a message</button><button class="ds-ro-tab" data-ro-kind="call" style="padding:9px 14px;border:1px solid #D5DBE1;border-radius:8px;background:#fff;color:#0f1a26;font-weight:600;cursor:pointer">Request a call</button></div><label class="small mut">How soon do you need this?<br><select id="ds-ro-urg" style="margin-top:4px;padding:8px;border:1px solid #D5DBE1;border-radius:8px"><option value="low">Whenever</option><option value="normal" selected>Soon</option><option value="high">Urgent</option></select></label><textarea id="ds-ro-msg" rows="5" placeholder="What do you need help with?" style="width:100%;margin-top:12px;padding:10px;border:1px solid #D5DBE1;border-radius:10px;font:inherit;box-sizing:border-box"></textarea><div style="margin-top:12px"><button id="ds-ro-send" style="padding:11px 18px;border:0;border-radius:9px;background:#0f1a26;color:#fff;font-weight:700;cursor:pointer">Send to my team</button></div><div id="ds-ro-status" class="small" style="margin-top:10px"></div></div><div class="card" style="padding:16px;max-width:640px;margin-top:16px"><div style="font-weight:700;margin-bottom:4px">Your recent requests</div><div id="ds-ro-recent" class="small mut">Loading…</div></div>'; paintTabs(host); [].slice.call(host.querySelectorAll('.ds-ro-tab')).forEach(function(b){ b.addEventListener('click',function(){ state.kind=this.getAttribute('data-ro-kind'); paintTabs(host); }); }); var send=host.querySelector('#ds-ro-send'); send.addEventListener('click',async function(){ var msg=host.querySelector('#ds-ro-msg').value.trim(); var urg=host.querySelector('#ds-ro-urg').value; var st=host.querySelector('#ds-ro-status'); if(msg.length<5){ st.style.color='#b42318'; st.textContent='Please add a few words about what you need.'; return; } send.disabled=true; var old=send.textContent; send.textContent='Sending…'; try{ var r=await api('reach-out',{kind:state.kind,urgency:urg,message:msg}); if(r&&r.ok){ st.style.color='#1a7f4b'; st.textContent=state.kind==='call'?'Call requested — your advisor will reach out.':'Sent — your success team will follow up shortly.'; host.querySelector('#ds-ro-msg').value=''; loadRecent(); } else { st.style.color='#b42318'; st.textContent=(r&&(r.message||r.error))||'Could not send. Try again.'; } }catch(e){ st.style.color='#b42318'; st.textContent=String(e.message||e); } send.disabled=false; send.textContent=old; }); loadRecent(); }
function ensure(){ var h=document.getElementById('reachoutInner'); if(!h) return; if(h.querySelector('#ds-ro-send')) return; render(h); var nav=document.querySelector('.nav[data-screen="reachout"]'); if(nav) nav.addEventListener('click',function(){ setTimeout(loadRecent,300); }); }
setInterval(ensure, 900);
})();


/* ---- Feature 46: Admin Console — real live metrics ---- */
;(function(){
if(window.__dsAdminConsole) return; window.__dsAdminConsole=1;
var SB=window.__dsSB; if(!SB) return;
function money(c){ return '$'+Math.round((c||0)/100).toLocaleString(); }
async function cnt(table, build){ try{ var q=SB.from(table).select('*',{count:'exact',head:true}); if(build) q=build(q); var r=await q; return r.count||0; }catch(e){ return 0; } }
function card(label,val,sub){ return '<div class="card pad"><div class="small mut">'+label+'</div><div class="stat">'+val+'</div>'+(sub?'<div class="small mut">'+sub+'</div>':'')+'</div>'; }
async function load(){ var host=document.getElementById('ds-adm-metrics'); if(!host) return; host.innerHTML='<div class="mut small">Loading live metrics…</div>';
  var now=Date.now(); var d7=new Date(now-7*86400000).toISOString(); var d30=new Date(now+30*86400000).toISOString().slice(0,10); var today=new Date().toISOString().slice(0,10);
  var totalClients=await cnt('profiles');
  var activeClients=await cnt('profiles',function(q){return q.eq('status','active');});
  var pending=await cnt('profiles',function(q){return q.eq('status','pending');});
  var logins7=await cnt('client_events',function(q){return q.gte('created_at',d7);});
  var openTickets=await cnt('tickets',function(q){return q.eq('status','open');});
  var reachOpen=await cnt('reach_out',function(q){return q.eq('status','open');});
  var subs=[]; try{ subs=(await SB.from('os_subscriptions').select('monthly_price_cents,status,card_on_file')).data||[]; }catch(e){}
  var activeSubs=subs.filter(function(s){return s.card_on_file&&(s.status==='trialing'||s.status==='active');});
  var mrr=activeSubs.reduce(function(a,s){return a+(s.monthly_price_cents||0);},0);
  var canceledSubs=subs.filter(function(s){return s.status==='canceled';}).length;
  var ords=[]; try{ ords=(await SB.from('reorders').select('total_cents,amount_total,status')).data||[]; }catch(e){}
  var paidOrds=ords.filter(function(o){return ['paid','shipped','completed'].indexOf(o.status)>=0;});
  var rev=paidOrds.reduce(function(a,o){return a+(o.total_cents!=null?o.total_cents:(o.amount_total||0));},0);
  var pa=[]; try{ pa=(await SB.from('program_access').select('expires_at,active')).data||[]; }catch(e){}
  var expiring=pa.filter(function(p){return p.active&&p.expires_at&&p.expires_at>today&&p.expires_at<=d30;}).length;
  host.innerHTML='<div class="grid" style="grid-template-columns:repeat(4,1fr);gap:12px">'
    +card('Clients', totalClients, activeClients+' active')
    +card('Pending approvals', pending)
    +card('OS members', activeSubs.length, canceledSubs+' canceled')
    +card('Est. MRR', money(mrr))
    +card('Orders (paid)', paidOrds.length)
    +card('Order revenue', money(rev))
    +card('Open tickets', openTickets)
    +card('Reach-outs open', reachOpen)
    +card('Program windows ending ≤30d', expiring)
    +card('Logins (7d)', logins7)
    +'</div>';
}
function ensure(){ var inner=document.getElementById('adminInner'); if(!inner) return; if(document.getElementById('ds-adm-metrics')) return; var wrap=document.createElement('div'); wrap.innerHTML='<div class="kick">OVERVIEW</div><h1 class="h1">Admin Console</h1><p class="mut" style="margin-bottom:16px">Live snapshot across your clients, memberships, orders, and support.</p><div id="ds-adm-metrics"></div>'; inner.insertBefore(wrap, inner.firstChild); var nav=document.querySelector('.nav[data-screen="admin"]'); if(nav) nav.addEventListener('click',function(){ setTimeout(load,250); }); load(); }
setInterval(ensure, 1000);
})();


/* ---- Feature 47: wire the global 'Ask the team' modal (openAsk/sendAsk) to reach-out ---- */
;(function(){
if(window.__dsAskWire) return; window.__dsAskWire=1;
var SB=window.__dsSB; if(!SB) return;
function api(fn,body){ var H=window.__dsOS; if(H&&H.api) return H.api(fn,body); return (async function(){ var s=await SB.auth.getSession(); var t=s&&s.data&&s.data.session?s.data.session.access_token:''; var r=await fetch(SB.functionsUrl+'/'+fn,{method:'POST',headers:{'Authorization':'Bearer '+t,'apikey':SB.supabaseKey,'Content-Type':'application/json'},body:JSON.stringify(body||{})}); return await r.json().catch(function(){return{};}); })(); }
function wire(){ if(typeof window.sendAsk!=='function' || window.sendAsk.__dsWired) return; var realSend=async function(){ var ctxEl=document.getElementById('askCtx'); var txtEl=document.getElementById('askText'); var ctx=ctxEl?String(ctxEl.value||''):''; var text=txtEl?String(txtEl.value||'').trim():''; var m=document.getElementById('askModal'); if(text.length<5){ if(txtEl){ txtEl.focus(); txtEl.style.borderColor='#b42318'; } return; } if(m) m.innerHTML='<div class="pad" style="text-align:center;padding:46px"><div class="typing" style="font-size:0"><span></span><span></span><span></span></div><p class="note" style="margin-top:14px">Posting to Slack…</p></div>'; try{ var kind=/coach/i.test(ctx)?'coach':'message'; var msg=(ctx?'['+ctx+'] ':'')+text; await api('reach-out',{kind:kind,message:msg}); }catch(e){} setTimeout(function(){ try{ if(m&&typeof window.askSent==='function') m.innerHTML=window.askSent(ctx); }catch(e){} },500); }; realSend.__dsWired=true; window.sendAsk=realSend; }
var n=0; var iv=setInterval(function(){ n++; wire(); if((window.sendAsk&&window.sendAsk.__dsWired)||n>80) clearInterval(iv); },500);
})();
