# Freest Easiest Powerhouse Stack

Date: 2026-06-18

## Verdict

The freest and easiest stack is:

```text
Browser voice in
-> Workshop Talk
-> OpenAI-compatible local endpoint when available
-> browser voice out
-> artifacts and receipts
```

## Why this is the best base

- It works on a normal HTTPS website.
- It does not require a paid key for the public shell.
- It does not require training a speech model.
- It does not require a cloud database.
- It does not make one provider the boss.
- It can run simple fallback replies on Cloudflare Pages.
- It can connect to a local model on Randy's PC when available.

## Public Cloudflare hull

Use:

- Web Speech API style browser speech recognition when the browser supports it.
- Browser speech synthesis for replies.
- Built-in Workshop fallback replies when no AI endpoint is configured.
- Static files only.

This is the cheapest public version.

## Full local PC Workshop

Use:

- Browser voice loop for input and output.
- Local companion server.
- SQLite artifact registry.
- Local project folders.
- Optional local AI endpoint.

Preferred first local brain adapter:

```text
Ollama or llama.cpp compatible localhost chat endpoint
```

The Workshop already supports an endpoint/model/key style adapter. The ideal next patch is to make localhost model discovery easier and safer.

## Not the foundation

Do not make these the foundation:

- paid API keys;
- time-limited free trials;
- random hosted agents;
- exposed local AI servers;
- cloud storage as source authority;
- custom-trained models before the pipeline works.

## Free powerhouse rule

Every engine is optional and replaceable.

The Workshop keeps:

- artifacts;
- project state;
- source packets;
- receipts;
- human review;
- voice loop;
- adapter manifests.

The engine only does a bounded job.

## Next patch target

Add a local model quick setup lane:

1. Settings button: `Use local Ollama`.
2. Auto-fill endpoint: `http://127.0.0.1:11434/v1/chat/completions`.
3. Auto-fill suggested model name field.
4. Probe endpoint without sending private artifacts.
5. Show status: reachable, blocked, or not installed.
6. Keep all remote hosted endpoints optional.
