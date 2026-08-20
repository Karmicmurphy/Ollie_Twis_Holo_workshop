# Twis Holo Workshop Release Audit — Historical Snapshot

> **Historical record only.** This audit was performed on **2026-06-18** and does not certify later July/August commits. For the current GitHub repository state, read `CURRENT_STATE.md`. A current commit is considered verified only after its own tests/CI actually run and pass.

Audit date: 2026-06-18

## What was checked

- ZIP contents inspected.
- Runtime test data removed from release.
- Python companion syntax checked.
- Browser app JavaScript syntax checked.
- Cloudflare Worker JavaScript syntax checked.
- Smoke test executed.
- Local companion started on a test port.
- `/api/health` verified.
- Project creation verified.
- Artifact creation and retrieval verified.
- Session save verified.
- Project Capsule ZIP creation verified.
- Service worker registration added for HTTP/local companion mode.
- GitHub Actions smoke workflow included.

## Test results at that time

```text
Python syntax: PASS
App JavaScript syntax: PASS
Cloudflare Worker syntax: PASS
Smoke test: PASS
API end-to-end test: PASS
```

## Clean-release corrections made in that release

- Removed accidental runtime database from the repo ZIP.
- Removed accidental `runtime-test` project folder from the repo ZIP.
- Added `tests/e2e_api_test.py`.
- Added service worker registration in `app/assets/app.js`.
- Kept runtime data paths as `.gitkeep` placeholders only.

## Status recorded on 2026-06-18

### Working inside that package

- Local companion server.
- SQLite project/artifact/session/receipt/job schema.
- FTS5 artifact search table.
- Project creation and switching.
- Artifact save/search/delete API.
- Session save API.
- Project Capsule export API.
- Folder import and indexing API.
- Browser Workshop shell.
- Talk, Write, Music, Image, Video Storyboard, Explore, Build, Recover, My Work, Modules, Settings rooms.
- WAV export.
- PNG export.
- Coding bench file read/write through the local companion.
- Cloudflare Worker/Durable Object scaffold.
- GitHub Actions smoke workflow.

### Not bundled in that release

- Cloudflare account login/deployment.
- Liquid LFM model files/runtime.
- llama.cpp model server.
- MCP servers.
- AG-UI/A2UI/A2A external runtimes.
- Private old folders, repositories, conversations, images, audio, and video.
- Full DAW and nonlinear-video-editor engine integrations.

## Run instruction recorded for that release

Double-click `start-workshop.bat`, then open:

```text
http://127.0.0.1:8787
```

## Current Pass Addendum — 2026-06-18

Additional release pass performed after checking platform/protocol direction.

### Added then

- `/api/capabilities` local companion endpoint.
- `/api/security-policy` local companion endpoint.
- Cloudflare `/capabilities` endpoint.
- Optional Cloudflare write-token support via `REMOTE_WRITE_TOKEN`.
- Optional Cloudflare origin restriction via `ALLOWED_ORIGIN`.
- `docs/PROTOCOL_SECURITY.md` with deny-by-default MCP/protocol policy.
- `CURRENT_UPGRADE_PASS_2026-06-18.md` upgrade report.
- Updated Cloudflare README and wrangler comments.
- Expanded smoke/API tests.

### Verified then

- Python syntax: PASS.
- App JavaScript syntax: PASS.
- Cloudflare Worker syntax: PASS.
- Smoke test: PASS.
- API end-to-end test: PASS.

### Clean release check then

Runtime SQLite and e2e test project data were removed after validation. The release contained only `.gitkeep` placeholders under `data/`.
