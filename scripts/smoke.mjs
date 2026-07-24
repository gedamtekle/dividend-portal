// Smoke test: loads a deployment of the portal in headless Chrome and verifies
// the app actually BOOTS (all top-level declarations reachable, login wired).
// Usage: node scripts/smoke.mjs <url>
import puppeteer from 'puppeteer';

const url = process.argv[2];
if (!url) { console.error('no url'); process.exit(2); }

const NAMES = ['stages','liveEvents','delivery','targets','notifs','sb'];

function fail(msg, detail) {
  console.error('SMOKE FAIL:', msg, detail || '');
  // best-effort alert to team Slack via the portal's public error reporter
  fetch('https://dehttbxrkeqhsfkfpfwt.functions.supabase.co/client-error', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'CI smoke test FAILED: ' + msg, source: url, ua: 'github-actions smoke' })
  }).catch(() => {}).finally(() => process.exit(1));
}

const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
const pageErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e && e.message || e)));

try {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
} catch (e) { fail('page load failed', String(e)); }
await new Promise((r) => setTimeout(r, 4000));

const probe = await page.evaluate((names) => {
  function alive(n) { try { (0, eval)('typeof ' + n + ';'); return true; } catch (e) { return false; } }
  const dead = names.filter((n) => !alive(n));
  const btn = [...document.querySelectorAll('button')].find((b) => /sign in/i.test(b.textContent || ''));
  return { dead, hasSignIn: !!btn, doSignIn: typeof window.doSignIn, hasAuthCard: !!document.querySelector('.authcard') };
}, NAMES);

console.log('probe:', JSON.stringify(probe), 'pageErrors:', JSON.stringify(pageErrors.slice(0, 5)));

if (probe.dead.length) fail('boot halted; dead declarations: ' + probe.dead.join(','));
if (!probe.hasAuthCard && probe.doSignIn !== 'function') fail('login not wired (no authcard, no doSignIn)');
if (pageErrors.length) fail('uncaught page errors', pageErrors.join(' | ').slice(0, 300));

console.log('SMOKE OK');
await browser.close();
process.exit(0);
