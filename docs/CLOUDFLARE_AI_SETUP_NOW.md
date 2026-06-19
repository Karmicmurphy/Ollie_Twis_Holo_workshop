# Cloudflare AI Setup Now

This is the minimum setup for using the Workshop away from Randy's computer.

Cloudflare is the remote field kit. The local PC remains the private core and source authority.

## Current model defaults

Casual away-mode Talk default:

```text
@cf/openai/gpt-oss-20b
```

Optional stronger coding/workshop-agent model:

```text
@cf/zai-org/glm-5.2
```

Previous default, now deprecated in Cloudflare's model catalog:

```text
@cf/meta/llama-3.1-8b-instruct
```

Do not use the deprecated Llama 3.1 model as the repo default.

## What is already in the repo

- `functions/api/ai/chat.js`
- `app/assets/cloudflare-ai-setup.js`
- Settings button: `Use Cloudflare AI`
- Settings button: `Use coding/agent AI`
- Probe button: `Probe Cloudflare AI`
- GET check: `/api/ai/chat`
- POST chat endpoint: `/api/ai/chat`

## Cloudflare dashboard steps

1. Open Cloudflare.
2. Go to `Workers & Pages`.
3. Open the Pages project:

```text
ollie-twis-holo-workshop
```

4. Go to `Settings`.
5. Go to `Bindings`.
6. Select the Pages environment you are using, usually `Production`.
7. Add a binding.
8. Choose `Workers AI`.
9. Set variable name exactly:

```text
AI
```

10. Save.
11. Redeploy the Pages project.

The binding does not fully take effect until after redeploy.

## App steps after redeploy

Open:

```text
https://ollie-twis-holo-workshop.pages.dev/
```

Then:

1. Open `Settings`.
2. Press `Use Cloudflare AI` for normal Talk.
3. Press `Probe Cloudflare AI`.
4. If it says reachable, open `Talk`.
5. Use text or `Start voice conversation`.

For coding/build experiments only:

1. Open `Settings`.
2. Press `Use coding/agent AI`.
3. Press `Probe Cloudflare AI`.
4. Use it for Build/workshop-agent style work, not casual Talk by default.

## Browser endpoint check

Open this directly:

```text
https://ollie-twis-holo-workshop.pages.dev/api/ai/chat
```

Good result should include:

```json
{
  "ok": true,
  "endpoint": "/api/ai/chat",
  "bindingRequired": "AI",
  "bindingPresent": true,
  "defaultModel": "@cf/openai/gpt-oss-20b",
  "optionalWorkshopAgentModel": "@cf/zai-org/glm-5.2",
  "deprecatedPreviousDefault": "@cf/meta/llama-3.1-8b-instruct",
  "status": "ready-to-probe"
}
```

If `bindingPresent` is `false`, the repo code is deployed but the Cloudflare Workers AI binding is still missing or not redeployed.

If `defaultModel` still says `@cf/meta/llama-3.1-8b-instruct`, Cloudflare is still serving an old deployment.

## What this gives you

Away mode:

```text
phone browser
-> Cloudflare Pages
-> /api/ai/chat
-> Workers AI binding named AI
-> Cloudflare model reply
-> spoken/browser reply when voice mode is on
```

## What this does not do yet

- It does not sync your private PC files.
- It does not import folders from your phone.
- It does not use your local SQLite database.
- It does not replace the local Workshop core.
- It does not require KV, D1, R2, or Vectorize for the first working away-mode brain.

This is the remote field kit brain, not the private home base.

## Cost boundary

Workers AI may have a free daily allowance, but it is not an unlimited-free foundation. Keep core Workshop ownership local-first and treat Workers AI as the away-mode field kit.

## Fail messages

If the app says:

```text
Workers AI binding missing
```

then the binding named `AI` is not set on the Pages project or the project has not redeployed after saving it.

If the app says:

```text
Cloudflare AI not ready
```

check the binding name, redeploy, then try again.

If the direct endpoint returns:

```text
bindingPresent: false
```

Cloudflare is running the function, but Workers AI is not attached to that Pages environment yet.

If the buttons do not show, Cloudflare is still serving an older deployment.

If text works but voice does not, the AI path is fine and the problem is browser speech or microphone permission.
