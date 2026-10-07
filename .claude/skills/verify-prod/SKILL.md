---
name: verify-prod
description: Check that Coach Hub production is healthy after a push — Vercel deployment state for the latest main commit, app and service worker served, edge functions responding, new tables reachable. Use after merging to main or when something "doesn't work in production".
---

# Verify production

Run and report each line as OK / problem:

1. Deployment of the pushed commit (wait until terminal state, poll every 10 s, max ~6 min):
   `gh api "repos/HofinMac/coach-hub-pro-22/deployments?sha=$(git rev-parse origin/main)&environment=Production" --jq '.[0].id'` then
   `gh api repos/HofinMac/coach-hub-pro-22/deployments/<id>/statuses --jq '.[0].state'` → `success`.
2. App: `curl -s -o /dev/null -w "%{http_code}" https://coach-hub-pro-22.vercel.app/login` → 200, and the served `assets/index-*.js` name equals the one from a local `npm run build`.
3. Service worker: `curl -s https://coach-hub-pro-22.vercel.app/sw.js | grep -o 'importScripts("/push-sw.js")'`.
4. Edge functions: `curl -s -X POST https://oqtxwelesrwmvvurzslj.supabase.co/functions/v1/send-push -d '{}'` → `{"sent":…}` (404 = not deployed, 500 "VAPID keys" = secrets missing). `send-invite` without auth → 401 means it is deployed.
5. Tables used by the latest code exist: REST probe with the anon key from `.env` (`[]` = OK, `PGRST205` = migration not applied).
6. CI: `gh run list --branch main --limit 3`.

Previews (`*-treneri.vercel.app`) are behind Vercel login — test them in a logged-in browser, not with curl.
