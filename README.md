# Twis Holo Workshop — Reinforced Local Build

## Start

Double-click `start-workshop.bat`.

The Workshop opens at `http://127.0.0.1:8787`.

Python 3 is the only required local dependency. The companion uses only Python's standard library.

## Architecture and guardrails

- `WORKSHOP_ARCHITECTURE.md` — defines LOCAL / CLOUD / GITHUB authority boundaries and the room-by-room architecture.
- `SECURITY_GATES.md` — defines MCP, browser-agent, local-tool, candidate-tool, and artifact-write gates.
- `CLOUDFLARE_COST_GUARDRAILS.md` — defines Cloudflare Pages / Workers AI cost and data-safety boundaries.

Current operating rule:

```text
LOCAL = private home base
CLOUD = phone / public field kit
GITHUB = code backup and deploy source
```

Do not change runtime behavior until the current rooms, launchers, My Work, Artifact Compass, and Road-Signal artifact save path are tested.

## What is working

- Local project folders
- SQLite + FTS5 artifact index
- Project switching
- Artifact saving/search/deletion
- Session close records
- Project capsule ZIP export
- Folder import with copy, hashes, source authority, skipped-file reporting, indexing, and receipt
- Talk with built-in companion or compatible approved AI endpoint
- Project-aware AI prompt context
- Writing, snapshots, saved documents
- Drum/melody sequencer and WAV export
- Image editing and PNG export
- Media bin, preview, storyboard, video project save
- Research expedition records
- Coding bench file tree and text editor
- Module registry/status
- Engine Harness dashboard in the Modules room
- Optional Cloudflare remote hull scaffold
- Browser fallback mode
- Local capability and security-policy endpoints
- Portable artifact registry JSON snapshots
- Controlled media generation adapter layer
- Holo Guide UI layer with hover/tap explanations
- Artifact Compass browser search overlay with match reasons and related-artifact hints

## Reinforced in recent passes

- Local companion Host and Origin checks
- JSON request body size limit
- Safer folder import policy
- Safe FTS query handling with fallback search
- AI endpoint restriction to localhost HTTP or HTTPS unless explicitly allowed
- AI provider raw payloads no longer returned by default
- Browser API key persistence scrubber
- Generation adapter registry
- Human-confirmed generation job endpoint
- Remote AI/generation endpoints blocked by default
- Narration voice preset registry
- Holo cockpit guide layer
- Scrap-Iron Cloud Hull module map
- Cloudflare Workers Static Assets scaffold
- Security, generation, UI, and Cloudflare contract tests
- Powerhose Engine Harness contract for sandboxed local/browser/hosted engine adapters
- Mini-engine registry hardened with sandbox, input boundary, output artifact, and receipt rules
- Free Tool Federation policy for safe optional tool discovery and classification

## Mini Engine Pipeline

The repo includes `docs/MINI_ENGINE_PIPELINE.md` and a browser dashboard in `app/assets/engine-harness.js`.

The flow is:

```text
capture/create -> artifact -> search/review -> handoff packet -> bounded engine -> output artifact -> receipt -> human review
```

The registry lives in `app/modules/modules.json`.

Core enabled engines include Talk, Write, Music, Image, Video Storyboard, Research, Coding, Recovery Importer, Artifact Compass, Receipt Ledger, and MCP Gate policy.

Adapter lanes are present but disabled by default for generation, tiny AI, local model sockets, Cloudflare remote hull, AG-UI events, and Signal Desk Pocket.

## Free Tool Federation

The repo includes `docs/FREE_TOOL_FEDERATION_POLICY.md`.

Free and free-tier tools are adapter lanes, not core authority. The safe connection path is selected packet, adapter manifest, permission gate, tool runtime, output artifact, receipt, and human review.

## Artifact Compass

Artifact Compass now has a no-dependency browser layer in `app/assets/artifact-compass.js`.

It runs over the local Workshop state and adds:

- artifact search from the My Work room;
- weighted matches across title, kind, path, authority state, and payload;
- visible match reasons;
- related-artifact hints by local token overlap;
- zero API keys, zero accounts, and zero hosted dependency.

Next planned stages:

- companion-backed SQLite FTS5 diagnostics;
- saved search missions;
- handoff packet builder from selected results;
- optional local embeddings using sqlite-vec or equivalent local vector storage.

## Powerhose Engine Harness

The repo includes `docs/POWERHOSE_ENGINE_HARNESS.md`.

The rule is:

**Engines are replaceable tools. Artifacts are the permanent system.**

Local, browser, and optional hosted engines must pass through adapter contracts, permission gates, and receipt artifacts. No engine gets Canon write access. No external runtime gets private folders by default.

## Cloudflare remote hull

Cloudflare is optional and non-authoritative.

The repo now includes:

- `wrangler.jsonc`
- `package.json`
- `cloudflare/worker/src/index.js`
- `docs/CLOUDFLARE_REMOTE_HULL_SETUP.md`

The Worker serves static assets from `app/` and reserves `/api/*` for remote hull endpoints.

Default remote hull endpoints:

- `/api/health`
- `/api/capabilities`
- `/api/inbox` — disabled by default
- `/api/ai/summarize` — disabled by default

Default safety vars:

```json
{
  "TWIS_REMOTE_HULL_MODE": "public-shell",
  "TWIS_ALLOW_AI": "false",
  "TWIS_ALLOW_REMOTE_WRITE": "false"
}
```

Cloudflare setup notes live in `docs/CLOUDFLARE_REMOTE_HULL_SETUP.md`.

## Media generation status

Built in now:

- image opening, drawing, text, basic filters, PNG export
- video/media bin, preview, storyboard/edit notes, project save
- simple music sequencer and WAV export

Adapter-ready but not bundled:

- text-to-image
- image-to-image
- inpaint/upscale
- text-to-video
- image-to-video
- video-to-video
- animation rendering

Recommended adapter direction:

- ComfyUI local bridge first
- LTX-Video bridge later
- HunyuanVideo bridge later
- optional cloud generation provider only with explicit human approval

The Workshop owns prompts, artifacts, storyboards, receipts, and provenance. Generation engines are replaceable tools, not source authority.

## Honest remaining external dependencies

The package cannot silently install or authenticate external systems. These remain adapter-ready rather than bundled:

- Liquid LFM model weights/runtime
- llama.cpp or other local model server
- MCP servers
- AG-UI/A2UI/A2A external runtimes
- image/video generation runtimes such as ComfyUI, LTX-Video, HunyuanVideo, or Wan
- full external DAW/NLE integrations
- Cloudflare deployment and account authentication
- Randy's old folders, repositories, conversations, images, audio, and video

Those require either installation on Randy's computer, account authentication, stronger hardware, or access to the actual data.

## Data

Authoritative local data lives in:

- `data/workshop.sqlite3`
- `data/projects/<project-id>/`
- `data/backups/`
- `artifact-registry/*.json`

Cloudflare is optional and non-authoritative.

## Tests

```bash
python tests/e2e_api_test.py
python tests/security_policy_test.py
python tests/generation_layer_test.py
python -m pytest tests
```

## Build rule

Do not add autonomous agents, vector databases, workflow engines, or bundled model stacks until the local core has proven backup/restore, receipts, and project recovery with real Workshop data.
