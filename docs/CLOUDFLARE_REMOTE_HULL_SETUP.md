# Cloudflare Remote Hull Setup

This repo is prepared for a small Cloudflare Workers deployment that serves the Workshop shell and exposes a locked-down `/api/*` remote hull.

The remote hull is optional. The local Workshop remains the source of truth.

## What this deploys

- Static assets from `app/`.
- Worker API from `cloudflare/worker/src/index.js`.
- Health endpoint: `/api/health`.
- Capabilities endpoint: `/api/capabilities`.
- Disabled-by-default inbox endpoint: `/api/inbox`.
- Disabled-by-default AI helper stub: `/api/ai/summarize`.

## What it does not deploy

- No local private archive.
- No Canon authority.
- No delete/publish/spend/shell tools.
- No saved API keys.
- No required paid AI.
- No Cloudflare D1/R2/KV bindings yet.

## Cloudflare project choice

Use Cloudflare Workers, not a heavy framework project.

Reason: this repo already has a static browser app in `app/` and the remote hull needs `/api/*` routes. Workers Static Assets can serve the app and route API requests from one Worker.

## Dashboard setup

1. Open Cloudflare dashboard.
2. Go to Workers & Pages.
3. Create a Worker / Import Git repository.
4. Choose GitHub account/repo:
   - `Karmicmurphy/Ollie_Twis_Holo_workshop`
5. Use the repo's `wrangler.jsonc`.
6. Build command:
   - `npm install`
7. Deploy command:
   - `npm run cf:deploy`
8. Output directory:
   - leave blank if using Workers config.

If Cloudflare asks for a project name, use:

```text
ollie-twis-holo-workshop
```

## Local command path

If running from your own computer later:

```bash
npm install
npm run cf:dry
npm run cf:dev
npm run cf:deploy
```

## Safety defaults

`wrangler.jsonc` starts with:

```json
{
  "TWIS_REMOTE_HULL_MODE": "public-shell",
  "TWIS_ALLOW_AI": "false",
  "TWIS_ALLOW_REMOTE_WRITE": "false"
}
```

That means the remote hull can load and report status, but it will not accept inbox writes or AI calls yet.

## First smoke checks after deployment

Open:

```text
https://YOUR-WORKER.workers.dev/
https://YOUR-WORKER.workers.dev/api/health
https://YOUR-WORKER.workers.dev/api/capabilities
```

Expected:

- `/` loads the Workshop shell.
- `/api/health` returns `ok: true`.
- `/api/capabilities` lists blocked actions.
- `/api/inbox` returns disabled unless explicitly enabled later.

## Later bindings

Add these only after the shell deploys:

- D1: receipt/index metadata mirror.
- R2: capsule/object storage.
- KV: tiny config/cache.
- Workers AI: small summarize/classify/tag helpers.

Do not add all bindings at once. Add one, test one, receipt one.
