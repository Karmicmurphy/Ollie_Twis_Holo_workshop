# Twis Holo Powerhose Engine Harness

Date: 2026-06-18

Twis Holo can use many local, browser, and optional hosted engines without making any engine the source of truth.

Core rule:

**Engines are replaceable tools. Artifacts are the permanent system.**

## Contract

Every engine adapter must run through this path:

1. Artifact or handoff packet selected by Randy.
2. Adapter receives only the selected packet, not the whole Workshop.
3. Runtime executes in local, browser, or hosted mode.
4. Output returns as a new artifact.
5. Receipt records engine name, time, settings, input summary, output path, and review status.
6. Human review decides whether anything becomes source, packet, or canon candidate.

## Adapter lanes

Local tiny AI:
- Liquid LFM2 small models for fast CPU helper tasks.
- llama.cpp or GGUF models for local chat and summarization.
- small embedding models for local semantic search.

Browser AI:
- Transformers.js embeddings.
- WebGPU model runtimes when stable.
- Web Audio, Canvas, and File APIs for free media work.

Optional hosted AI:
- Cloudflare Workers AI only behind quota checks.
- Z.ai or GLM-style coding models only for optional review and passover tasks.
- NVIDIA open model services only as optional adapters, never as core requirements.

Creative engines:
- ComfyUI bridge.
- LTX-Video bridge.
- HunyuanVideo or Wan bridge when hardware allows.
- Browser DAW or external DAW project links.

## Hard safety rules

- No adapter gets canon write access.
- No adapter gets private folders by default.
- No public arbitrary tool runner.
- No remote write unless explicitly enabled.
- No hosted AI unless explicitly enabled.
- Every output must produce a receipt artifact.

## Artifact Compass path

v0.2 now:
- browser-only artifact search;
- title, kind, path, and payload weighting;
- match reasons;
- related-artifact hints;
- no account, no API key, no dependency.

v0.3 next:
- SQLite FTS5 diagnostics from the local companion;
- import receipts in ranking;
- saved search missions;
- handoff packet builder from selected hits.

v0.4 later:
- local embeddings;
- sqlite-vec or similar local vector index;
- hybrid rank fusion across keyword, vector, and artifact graph signals.
