# Cloudflare AI Setup Now

This is the minimum setup for using the Workshop away from Randy's computer.

## What is already in the repo

- `functions/api/ai/chat.js`
- `app/assets/cloudflare-ai-setup.js`
- Settings button: `Use Cloudflare AI`
- Probe button: `Probe Cloudflare AI`

## Cloudflare dashboard steps

1. Open Cloudflare.
2. Go to `Workers & Pages`.
3. Open the Pages project:

```text
ollie-twis-holo-workshop
```

4. Go to `Settings`.
5. Go to `Bindings`.
6. Add a binding.
7. Choose `Workers AI`.
8. Set variable name exactly:

```text
AI
```

9. Save.
10. Redeploy the Pages project.

## App steps after redeploy

Open:

```text
https://ollie-twis-holo-workshop.pages.dev/
```

Then:

1. Open `Settings`.
2. Press `Use Cloudflare AI`.
3. Press `Probe Cloudflare AI`.
4. If it says reachable, open `Talk`.
5. Use text or `Start voice conversation`.

## What this gives you

Away mode:

```text
phone browser
-> Cloudflare Pages
-> /api/ai/chat
-> Workers AI binding named AI
-> spoken/browser reply
```

## What this does not do yet

- It does not sync your private PC files.
- It does not import folders from your phone.
- It does not use your local SQLite database.
- It does not replace the local Workshop core.

This is the remote field kit brain, not the private home base.

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

check the binding, redeploy, then try again.
