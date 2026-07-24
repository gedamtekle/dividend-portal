# Dividend Shift Portal — Runbook

## Something is broken?
1. Check https://portal.dividendshift.com/status FIRST. If a system shows DOWN, it is a platform issue — do not debug individual client reports.
2. Client-device boot crashes auto-report to the internal Slack channel with the error and browser.

## Rollback (frontend) — ~30 seconds
1. Vercel dashboard -> dividend-portal project -> Deployments.
2. Find the last good deployment -> "..." menu -> Promote to Production.

## Rollback (edge functions)
Supabase dashboard -> Edge Functions -> pick function -> Deployments -> redeploy a previous version.

## Deployment rules
- All changes go through a pull request. Vercel builds a preview URL per PR — test there.
- The `smoke` check must pass (loads the deployment headless and verifies the app boots + login is wired). Do not merge red.
- Database changes are additive only (add tables/columns; never drop or rename in the same release).
- No schema changes or new edge functions on a client-invite day.
- New edge functions must be hit once with a test call before being considered live.

## Monitoring
- /status runs live checks against every provider (cached ~60s).
- The status-watchdog cron checks every 5 minutes and posts to Slack when anything flips DOWN or recovers.
