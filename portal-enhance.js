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
      lockedCard('Your Coaching Calls', 'Unlocks after approval'),
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

  function watchPending() {
    var el = document.getElementById('apPending');
    if (el) paintPending(el);
    // Re-apply if the app re-renders the panel, and catch late creation.
    var mo = new MutationObserver(function () {
      var p = document.getElementById('apPending');
      if (p) paintPending(p);
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
    if (wantsStart() && !isStandalone()) {
      setTimeout(launchWizard, 300);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
