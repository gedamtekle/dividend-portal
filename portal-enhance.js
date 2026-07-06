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
