# Talk AI Debug Now

The Workshop must not silently fail when Talk does not answer.

## Known working pieces

- Cloudflare Pages site loads.
- Browser dictation can place text into fields.
- Browser read-aloud can repeat text already on the page.
- Workers AI binding is visible in Cloudflare as `AI`.

Those do not prove that Talk can call the AI endpoint.

## Truth test 1: endpoint GET

Open:

```text
https://ollie-twis-holo-workshop.pages.dev/api/ai/chat
```

Expected:

```text
bindingPresent: true
defaultModel: @cf/openai/gpt-oss-20b
```

If `bindingPresent` is false, redeploy Production after saving the Workers AI binding.

If the page is 404, the Pages Function is not deployed.

## Truth test 2: smoke-test buttons

After the newest deploy, the app should show:

- Settings: `Run direct AI smoke test`
- Talk: `Direct AI test`

If those buttons are missing, Cloudflare is serving an old deployment.

## Truth test 3: Talk send

In Talk, type:

```text
Say one sentence back so I know AI is working.
```

Expected behavior:

- The user message appears.
- The assistant reply appears.
- If Speak replies is enabled, browser speech reads the assistant reply.

## Current problem

Randy reported that dictation/readback works, but Talk does not reply.

That means this is not a paid TTS problem. It is one of:

1. `/api/ai/chat` not live.
2. Workers AI binding not available to the deployed Production runtime.
3. Cloudflare model call failing.
4. Front-end Talk handler not surfacing the error.
5. Browser has old cached JavaScript.

## Immediate manual checks

1. Redeploy Production.
2. Hard refresh Chrome with Ctrl+F5.
3. Open `/api/ai/chat` directly.
4. Run `Run direct AI smoke test`.
5. If Talk still fails, open Chrome DevTools Console and look for red errors.

## Repo hardening target

Talk must show errors directly in the conversation panel, such as:

```text
AI ERROR: Workers AI binding missing
AI ERROR: Cloudflare AI call failed: [message]
AI ERROR: HTTP 404
```

No silent failure is acceptable.
