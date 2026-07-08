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
  function schedule(){ clearTimeout(t); t = setTimeout(function(){ run(document.body); }, 120); }
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
  function notifCard(){ var h=[].slice.call(document.querySelectorAll('*')).find(function(e){ return !e.children.length && /^Email notifications$/i.test((e.textContent||'').trim()); }); if(!h) return null; var c=h; for(var i=0;i<6 && c;i++){ if(c.querySelectorAll('.toggle').length>=3) return c; c=c.parentElement; } return null; }
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
  function fixGreeting(){
    if(!first) return;
    [].slice.call(document.querySelectorAll('*')).forEach(function(e){
      if(e.children.length) return;
      var t=(e.textContent||'');
      if(/welcome back,\s*\S+/i.test(t) && !new RegExp('welcome back,\\s*'+first,'i').test(t)){
        e.textContent = t.replace(/(welcome back,\s*)([^\n!.,]+)/i, '$1'+first);
      }
    });
  }
  var deb; function schedule(){ clearTimeout(deb); deb=setTimeout(fixGreeting, 120); }
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
  function evalPw(){
    var p=q('suPass'), c=q('dsPass2'); if(!p||!c) return {ok:false};
    var pv=p.value||'', cv=c.value||'';
    var okLen=pv.length>=MINLEN, okMatch=cv.length>0 && pv===cv;
    var h=q('ds-pw-hint');
    if(h){
      if(!okLen){ h.style.color=RED; h.textContent='Password must be at least '+MINLEN+' characters.'; }
      else if(!okMatch){ h.style.color=cv.length?RED:MUT; h.textContent= cv.length? 'Passwords do not match.' : 'Re-enter your password to confirm.'; }
      else { h.style.color=GREEN; h.textContent='Passwords match ✓'; }
    }
    return {ok: okLen && okMatch, okLen:okLen, okMatch:okMatch};
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
          if(!st.ok){ try{ (st.okLen?q('dsPass2'):q('suPass')).focus(); }catch(_e){} }
          else if(!smsOk){ var m=q('ds-sms-req'); if(!m){ m=document.createElement('div'); m.id='ds-sms-req'; m.style.cssText='color:'+RED+';font-size:12px;margin-top:6px'; var host=q('suSms').closest('label')||q('suSms').parentElement; (host.parentElement||host).appendChild(m);} m.textContent='Please agree to receive text messages (including your sign-in codes) to continue.'; }
        }
      }, true);
    }
    if(sms && !sms.__dsCh){ sms.__dsCh=true; sms.addEventListener('change', function(){ var m=q('ds-sms-req'); if(m&&sms.checked) m.textContent=''; }); }
  }
  var mo=new MutationObserver(function(){ ensure(); }); mo.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', ensure); else ensure();
})();
