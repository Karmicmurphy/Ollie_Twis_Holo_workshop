# Twis Holo Mini Engine Pipeline

Date: 2026-06-18

Twis Holo is built as a giant mini powerhouse, not a single giant agent.

The smooth path is:

```text
Capture or create
  -> artifact
  -> search / relate / review
  -> selected handoff packet
  -> bounded mini engine
  -> output artifact
  -> receipt
  -> human review
  -> source packet or canon candidate only when approved
```

## Why this works

Small engines fail smaller. A chat helper, a search helper, a music sketcher, a code editor, an image canvas, and a generation router can each do one job without owning the whole system.

The permanent layer is the artifact record. Engines are replaceable.

## Current core engines

- Talk Companion: conversation and planning.
- Writing Bench: drafts, scripts, lyrics, notes, mini-app specs.
- Music Mini Engine: beat, melody, notes, WAV export.
- Image Mini Engine: canvas editing and PNG export.
- Video Storyboard Engine: media preview and edit plans.
- Expedition Engine: research notes and question finding.
- Coding Bench: project-bounded text/code files.
- Recovery Importer: local folder salvage with hashes and receipts.
- Artifact Compass: local artifact search with match reasons.
- Receipt Ledger: proof trail for imports, jobs, saves, and adapter outputs.

## Adapter lanes

These exist as lanes, not default powers:

- Generation Router for ComfyUI, LTX-Video, HunyuanVideo, Wan, or future renderers.
- Tiny AI Lane for small local models, browser embeddings, GGUF helpers, and Liquid LFM-style helpers.
- Local Model Socket for approved local/OpenAI-compatible endpoints.
- Cloudflare Remote Hull for public static shell and optional guarded endpoints.
- MCP Gate for tool protocol allowlists and receipts.
- AG-UI Event Lane for future human-facing event streams.
- Signal Desk Pocket for fast capture from phone/browser.

## Non-negotiable boundaries

- Engines receive selected packets, not the whole Workshop by default.
- Canon is never writable by an engine.
- Source promotion requires human review.
- Remote write is disabled by default.
- Hosted AI is disabled by default.
- Tool protocols are deny-by-default.
- Outputs become artifacts with receipts before they become anything more important.

## Next build targets

1. Handoff packet builder from Artifact Compass selected hits.
2. Saved search missions.
3. Receipt viewer in My Work.
4. Companion endpoint for module registry diagnostics.
5. Optional local embedding lane after the basic artifact pipeline proves stable.
