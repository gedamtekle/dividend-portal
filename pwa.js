/* Dividend Shift — PWA bootstrap
 * Add ONE line to index.html (ideally near the top of <head>):
 *     <script src="/pwa.js" defer></script>
 * This file injects the required <head> tags, registers the service worker,
 * and handles the "Add to Home Screen" experience on Android and iOS.
 * No other portal code changes are needed.
 */
(function () {
  'use strict';
  if (window.__dsPwaInit) return;
  window.__dsPwaInit = true;

  var THEME = '#0E1A2B';
  var APP_NAME = 'Dividend Shift';

  // ---- 1. Inject <head> tags (idempotent) ------------------------------------
  function ensure(sel, make) { if (!document.head.querySelector(sel)) document.head.appendChild(make()); }
  function meta(name, content) { var m = document.createElement('meta'); m.name = name; m.content = content; return m; }
  function link(rel, href, extra) { var l = document.createElement('link'); l.rel = rel; l.href = href; if (extra) Object.keys(extra).forEach(function (k) { l.setAttribute(k, extra[k]); }); return l; }

  ensure('link[rel="manifest"]', function () { return link('manifest', '/manifest.json'); });
  ensure('meta[name="theme-color"]', function () { return meta('theme-color', THEME); });
  ensure('meta[name="mobile-web-app-capable"]', function () { return meta('mobile-web-app-capable', 'yes'); });
  ensure('meta[name="apple-mobile-web-app-capable"]', function () { return meta('apple-mobile-web-app-capable', 'yes'); });
  ensure('meta[name="apple-mobile-web-app-status-bar-style"]', function () { return meta('apple-mobile-web-app-status-bar-style', 'black-translucent'); });
  ensure('meta[name="apple-mobile-web-app-title"]', function () { return meta('apple-mobile-web-app-title', APP_NAME); });
  ensure('link[rel="apple-touch-icon"]', function () { return link('apple-touch-icon', '/icons/apple-touch-icon.png'); });
  ensure('link[rel="icon"]', function () { return link('icon', '/icons/favicon-32.png', { sizes: '32x32', type: 'image/png' }); });
  if (!document.head.querySelector('meta[name="viewport"]')) {
    document.head.appendChild(meta('viewport', 'width=device-width, initial-scale=1, viewport-fit=cover'));
  }

  // ---- 2. Register the service worker ----------------------------------------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function (e) { console.warn('SW register failed', e); });
    });
  }

  // ---- 3. Install experience --------------------------------------------------
  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) return; // already installed — nothing to prompt

  function dismissed(key) { try { return localStorage.getItem(key) === '1'; } catch (_e) { return false; } }
  function setDismissed(key) { try { localStorage.setItem(key, '1'); } catch (_e) {} }

  function banner(html) {
    var bar = document.createElement('div');
    bar.setAttribute('role', 'dialog');
    bar.style.cssText = [
      'position:fixed', 'left:12px', 'right:12px', 'bottom:12px', 'z-index:2147483647',
      'background:#0E1A2B', 'color:#fff', 'border:1px solid rgba(212,175,55,.35)',
      'border-radius:14px', 'padding:14px 14px', 'box-shadow:0 10px 30px rgba(0,0,0,.35)',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
      'font-size:14px', 'line-height:1.4', 'max-width:520px', 'margin:0 auto',
      'display:flex', 'align-items:center', 'gap:12px'
    ].join(';');
    bar.innerHTML = html;
    document.body.appendChild(bar);
    return bar;
  }

  // Android / Chrome / Edge: real install prompt
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (dismissed('ds_pwa_install_dismissed')) return;
    var bar = banner(
      '<img src="/icons/icon-192.png" alt="" width="40" height="40" style="border-radius:9px;flex:0 0 auto">' +
      '<div style="flex:1 1 auto"><b>Install ' + APP_NAME + '</b><br><span style="opacity:.8">Add it to your home screen for quick access.</span></div>' +
      '<button id="ds-install" style="flex:0 0 auto;background:#D4AF37;color:#111;border:0;border-radius:10px;padding:9px 14px;font-weight:700;cursor:pointer">Install</button>' +
      '<button id="ds-x" aria-label="Dismiss" style="flex:0 0 auto;background:transparent;color:#fff;border:0;font-size:20px;cursor:pointer;opacity:.7">&times;</button>'
    );
    bar.querySelector('#ds-install').addEventListener('click', function () {
      bar.remove();
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () { deferredPrompt = null; });
    });
    bar.querySelector('#ds-x').addEventListener('click', function () { bar.remove(); setDismissed('ds_pwa_install_dismissed'); });
  });

  // iOS Safari: no install prompt API — show a one-time "Add to Home Screen" hint
  var ua = window.navigator.userAgent;
  var isIOS = /iPhone|iPad|iPod/.test(ua) && !window.MSStream;
  var isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
  if (isIOS && isSafari && !dismissed('ds_pwa_ios_dismissed')) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        var bar = banner(
          '<img src="/icons/icon-192.png" alt="" width="40" height="40" style="border-radius:9px;flex:0 0 auto">' +
          '<div style="flex:1 1 auto">Install ' + APP_NAME + ': tap the <b>Share</b> icon, then <b>“Add to Home Screen.”</b></div>' +
          '<button id="ds-x" aria-label="Dismiss" style="flex:0 0 auto;background:transparent;color:#fff;border:0;font-size:20px;cursor:pointer;opacity:.7">&times;</button>'
        );
        bar.querySelector('#ds-x').addEventListener('click', function () { bar.remove(); setDismissed('ds_pwa_ios_dismissed'); });
      }, 2500);
    });
  }
})();
