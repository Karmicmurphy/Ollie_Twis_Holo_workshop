# Twis Holo Workshop — Reinforced Local Build

## Start

Double-click `start-workshop.bat`.

The Workshop opens at `http://127.0.0.1:8787`.

Python 3 is the only required local dependency. The companion uses only Python's standard library.

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
- Optional Cloudflare Durable Object remote hull
- Browser fallback mode
- Local capability and security-policy endpoints
- Portable artifact registry JSON snapshots
- Controlled media generation adapter layer

## Reinforced in this pass

- Local companion Host and Origin checks
- JSON request body size limit
- Safer folder import policy
- Safe FTS query handling with fallback search
- AI endpoint restriction to localhost HTTP or HTTPS
- AI provider raw payloads no longer returned by default
- Browser API key persistence scrubber
- Generation adapter registry
- Human-confirmed generation job endpoint
- Security and generation tests

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
```

## Build rule

Do not add autonomous agents, vector databases, workflow engines, or bundled model stacks until the local core has proven backup/restore, receipts, and project recovery with real Workshop data.
