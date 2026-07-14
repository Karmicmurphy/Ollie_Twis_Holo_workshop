# Cloudflare Worker AI Chat Contract

The Worker remote hull now exposes the same core AI chat endpoint expected by the Workshop browser helper:

```text
GET  /api/ai/chat
POST /api/ai/chat
```

## GET behavior

GET is diagnostic only. It reports:

- whether the `AI` binding exists;
- the default model;
- the optional workshop-agent model;
- whether the endpoint is ready to probe.

## POST behavior

POST is disabled unless:

```text
TWIS_ALLOW_AI=true
```

and the Worker has a Workers AI binding named:

```text
AI
```

The endpoint accepts bounded OpenAI-style messages and returns an OpenAI-style response shape:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "..."
      }
    }
  ],
  "text": "..."
}
```

## Boundary

This does not make Cloudflare the Workshop authority. It is only away-mode inference.

Cloudflare must not store raw recovered folders, local SQLite dumps, private Canon material, or unreviewed source archives by default.
