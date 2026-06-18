# Twis Holo Workshop — Full Build Pass

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
- Folder import with copy, hashes, source authority, indexing, and receipt
- Talk with built-in companion or compatible AI endpoint
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

## Honest remaining external dependencies
The package cannot silently install or authenticate external systems. These remain adapter-ready rather than bundled:
- Liquid LFM model weights/runtime
- llama.cpp or other local model server
- MCP servers
- AG-UI/A2UI/A2A external runtimes
- full external DAW/NLE integrations
- Cloudflare deployment and account authentication
- Randy's old folders, repositories, conversations, images, audio, and video

Those require either installation on Randy's computer, account authentication, or access to the actual data.

## Data
Authoritative local data lives in:
- `data/workshop.sqlite3`
- `data/projects/<project-id>/`
- `data/backups/`

Cloudflare is optional and non-authoritative.

## Release audit

This package has been re-audited. See `RELEASE_AUDIT.md`.

Additional verified test:

```bash
python tests/e2e_api_test.py
```


## Current upgrade pass

See `CURRENT_UPGRADE_PASS_2026-06-18.md` and `docs/PROTOCOL_SECURITY.md`. This release adds safer Cloudflare remote defaults, local capability discovery, and a deny-by-default protocol security posture for MCP-style adapters.
