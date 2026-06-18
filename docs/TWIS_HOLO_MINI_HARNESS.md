# Twis Holo Mini Harness — UI / Powerhouse Build

Use this harness before every Workshop build pass.

## Mission

Build the smallest useful version of the ugly-powerful Twis Holo Workshop: local private core, phone capture, optional Cloudflare hull, gated tools, light AI helpers, and a dark holo cockpit UI that Randy can actually navigate.

## Active constraints

- Preserve current repo and working app.
- Do not rebuild as a generic AI chat app.
- Do not add paid-required APIs.
- Do not require Docker, GPU, Ollama, Open WebUI, ComfyUI, vector DBs, or big agent frameworks as core.
- Do not make Cloudflare source of truth.
- Do not let AI approve Canon, delete source, publish, spend money, run shell, or handle secrets.
- Do not dump every piece of information in Randy's face at once.
- Keep phone layout usable.
- Respect low-motion mode.
- Prefer Python standard library, browser APIs, SQLite, JSON, and small adapters.

## Current build target

Add power as modules:

1. Deep Sea Salvage — recover/import old work safely.
2. Artifact Compass — map/search artifacts and relationships.
3. Receipt Ledger — prove what happened.
4. Signal Desk Pocket — phone text/photo/audio/link capture.
5. Cloudflare Remote Hull — optional free-tier relay/storage/helper.
6. MCP Gate — safe tool socket layer.
7. Edge AI Helper — tiny summarize/classify/tag jobs.
8. Local Model Socket — detect local OpenAI-compatible endpoints.
9. Voice Bench — presets, read-aloud, future local TTS.
10. Generation Router — send jobs to external/local generators with receipts.

## UI target

Style: dark sci-fi operations room, luminous holo cards, subtle 3D, glass panels, grid floor, portal/depth, amber/cyan/violet signal language.

Behavior: every button/module has hover/tap guidance explaining:

- what it does;
- where output goes;
- whether it touches local/cloud/AI;
- whether it writes a receipt;
- what the next safe action is.

## Safe edit order

1. Add documentation and module config first.
2. Add CSS/JS overlay files instead of rewriting app logic.
3. Link overlay files from `app/index.html`.
4. Add module cards to `app/modules/modules.json` only if schema stays compatible.
5. Add tests that check presence/valid JSON/static contracts.
6. Only then wire actual runtime routes.

## Stop signs

Stop or reduce scope if a change:

- requires paid cloud;
- stores API keys in localStorage;
- breaks the existing sidebar rooms;
- hides existing working features;
- requires heavy dependency installs;
- makes Cloudflare mandatory;
- gives tools broad filesystem/network/shell access;
- introduces autonomous agent loops;
- edits large app files without a reversible reason.

## Build phrase

Local first. Cloud optional. Tools gated. Receipts always. UI explains itself.
