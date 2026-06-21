# Cloudflare Cost Guardrails

Cloudflare is the Workshop field kit. It is not the private home base and it is not an unlimited AI budget.

## Current Cloudflare role

Cloudflare may provide:

- public Pages hosting for the Workshop shell;
- phone/away-mode access;
- small bounded API helpers;
- optional Workers AI calls through explicit endpoints;
- static app delivery.

Cloudflare must not provide default private storage for raw project data.

## Cost posture

The default cost posture is:

```text
free-first
bounded use
visible failures
no surprise upgrades
no paid API dependency for core workflow
```

If a feature cannot run without paid APIs, it is not a core Workshop feature.

## Workers AI boundary

The current Pages function `functions/api/ai/chat.js` uses the Workers AI binding named `AI` and defaults to `@cf/openai/gpt-oss-20b` unless overridden by `TWIS_CF_AI_MODEL`.

Do not duplicate that patch.

Workers AI calls must stay bounded by:

- limited request body size;
- limited message history;
- capped output tokens;
- explicit model selection only for `@cf/...` model IDs;
- no private folder upload;
- no hidden background loops;
- no autonomous retry storms.

## Environment variables

Recommended Cloudflare posture:

```text
TWIS_REMOTE_HULL_MODE=public-shell
TWIS_ALLOW_AI=false unless intentionally testing AI
TWIS_ALLOW_REMOTE_WRITE=false
TWIS_CF_AI_MODEL=@cf/openai/gpt-oss-20b only when needed
```

A missing AI binding should fail visibly and safely. It should not cause the app to invent local proof or claim the cloud AI is working.

## No cloud private storage by default

Do not add Cloudflare KV, D1, R2, Queues, Durable Objects, or Vectorize as private artifact storage unless a separate design pass proves:

1. what data is stored;
2. why local storage is not enough;
3. what private information is excluded;
4. how data can be exported/deleted;
5. how costs are capped;
6. how the user can disable it;
7. how local remains authority.

Cloud storage may be useful later, but it is not the current default.

## Usage gates before enabling cloud AI

Before turning on cloud AI in a room, answer:

- What exact endpoint calls Workers AI?
- What prompt and artifacts are sent?
- What private fields are stripped?
- What max token limit is enforced?
- What happens when the free allowance is exhausted?
- Where is the result saved?
- Is the result marked draft/unreviewed?

If the answers are unclear, leave it disabled.

## Safe failure behavior

Cloud features should fail like this:

- show clear status;
- explain missing binding/config;
- keep local/browser workflow usable;
- do not loop retries;
- do not ask for payment automatically;
- do not silently send private data elsewhere.

## Disallowed cost patterns

Do not add:

- background agents that call Workers AI on intervals;
- auto-summarizers that process every artifact by default;
- cloud embeddings over private data;
- hosted media generation by default;
- paid LLM fallbacks;
- automatic model upgrades;
- cloud sync that writes private project data without review.

## Field-kit examples that are acceptable

Acceptable cloud use:

- open the Workshop shell on a phone;
- draft a short public-safe prompt;
- run a bounded AI response when explicitly requested;
- save browser-only field notes for later local review;
- expose health/capability endpoints that reveal no private data.

Not acceptable by default:

- uploading recovered folders;
- storing Canon source files;
- giving remote agents access to local companion endpoints;
- using Cloudflare as the only copy of private work;
- treating Workers AI output as reviewed truth.

## Review cadence

Any Cloudflare feature that can increase cost or expose private data needs a separate bounded review before implementation.

The current sequence remains:

1. test Windows launchers;
2. test My Work + Artifact Compass;
3. test Road-Signal artifact save;
4. then begin room-by-room functional pass.
