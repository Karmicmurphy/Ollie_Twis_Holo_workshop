# Automation Runbook

This repo now has enough automation to stop guessing whether a push is safe.

## What runs automatically

`Workshop CI` runs on every push and pull request.

It checks:

- Python syntax for the local companion;
- browser app JavaScript syntax;
- Cloudflare Worker JavaScript syntax;
- static Workshop contract tests;
- local companion API end-to-end behavior;
- Cloudflare Worker contract behavior;
- static Pages build output.

## Cloudflare Worker deploy

`Cloudflare Worker Deploy` is guarded.

It only deploys when both GitHub repository secrets exist:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

If those secrets are missing, the deploy job does not run.

## Current Cloudflare split

There are two remote shapes in the repo:

1. **Cloudflare Pages**
   - Uses `npm run build`.
   - Static output goes to `dist/`.
   - Pages Functions live under `functions/`.
   - `/api/ai/chat` can use a Pages Workers AI binding named `AI`.

2. **Cloudflare Worker with Static Assets**
   - Uses `wrangler.worker.jsonc`.
   - Serves the `app/` folder through Workers Static Assets.
   - Handles `/api/health`, `/api/capabilities`, `/api/ai/chat`, and `/api/inbox`.
   - AI remains disabled unless `TWIS_ALLOW_AI=true` and an `AI` binding exists.

## Required manual secrets

I cannot create these from ChatGPT without your Cloudflare authentication:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Those belong in:

```text
GitHub repo -> Settings -> Secrets and variables -> Actions
```

## Local-first rule

GitHub and Cloudflare are deploy/source helpers. The private Workshop home base remains:

```text
local PC -> start-workshop.bat -> companion/server.py -> data/workshop.sqlite3 -> data/projects/
```

Cloudflare is the phone/away-mode field kit, not the private artifact authority.
