# Optional Cloudflare Remote Hull

This is the optional remote adapter. It is **not** the authoritative Workshop store.

## Current endpoints

- `GET /health`
- `GET /capabilities`
- `GET /projects/:id/state`
- `POST /projects/:id/state`

## Security

Writes can be protected with a Worker secret:

```bash
npx wrangler secret put REMOTE_WRITE_TOKEN
```

Then send either:

```text
X-Twis-Holo-Token: <token>
```

or:

```text
Authorization: Bearer <token>
```

You can also restrict browsers with:

```toml
[vars]
ALLOWED_ORIGIN = "https://your-workshop-domain.example"
```

## Deploy

```bash
npm install
npx wrangler login
npx wrangler deploy
```

## Still intentionally not included

- R2 media staging
- Queues / Render Tickets
- Workflows approval jobs
- Browser Rendering / research automation
- Workers AI routing
- Cloudflare Artifacts mirror

Add those as isolated adapters only after the local Workshop is stable.
