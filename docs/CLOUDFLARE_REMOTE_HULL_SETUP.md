# Cloudflare Remote Hull Setup

This repo supports two Cloudflare deployment paths:

1. Cloudflare Pages for the public static Workshop shell.
2. Cloudflare Workers for the optional `/api/*` remote hull.

The local Workshop remains the source of truth. Cloudflare is optional and non-authoritative.

## Current recommended path: Cloudflare Pages

Use this when connecting the GitHub repo through Cloudflare Pages.

### Pages dashboard settings

Repository:

```text
Karmicmurphy/Ollie_Twis_Holo_workshop
```

Framework preset:

```text
None
```

Build command:

```text
npm run build
```

Build output directory:

```text
dist
```

Root directory:

```text
/
```

Do not use:

```text
npx next build
```

This project is not a Next.js app. The browser app lives in `app/`, and the build script copies it into `dist/` for Pages.

## Pages config file

The default `wrangler.jsonc` is now a Pages-compatible config and contains:

```json
{
  "name": "ollie-twis-holo-workshop",
  "pages_build_output_dir": "./dist"
}
```

Cloudflare Pages requires `pages_build_output_dir` when it uses a Wrangler configuration file.

## Optional Worker remote hull path

Use this later if deploying the Worker API hull separately.

Worker config file:

```text
wrangler.worker.jsonc
```

Local commands:

```bash
npm install
npm run cf:dry
npm run cf:dev
npm run cf:deploy
```

The Worker serves static assets from `app/` and reserves `/api/*` for remote hull endpoints.

## What the Worker deploys

- Static assets from `app/`.
- Worker API from `cloudflare/worker/src/index.js`.
- Health endpoint: `/api/health`.
- Capabilities endpoint: `/api/capabilities`.
- Disabled-by-default inbox endpoint: `/api/inbox`.
- Disabled-by-default AI helper stub: `/api/ai/summarize`.

## What neither path deploys

- No local private archive.
- No Canon authority.
- No delete/publish/spend/shell tools.
- No saved API keys.
- No required paid AI.
- No Cloudflare D1/R2/KV bindings yet.

## Safety defaults

```json
{
  "TWIS_REMOTE_HULL_MODE": "public-shell",
  "TWIS_ALLOW_AI": "false",
  "TWIS_ALLOW_REMOTE_WRITE": "false"
}
```

That means the remote hull can load and report status, but it will not accept inbox writes or AI calls yet.

## Smoke checks after Pages deployment

Open:

```text
https://YOUR-PROJECT.pages.dev/
```

Expected:

- `/` loads the Workshop shell.
- Direct browser routes fall back to the shell through `404.html`.

## Smoke checks after Worker deployment

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
