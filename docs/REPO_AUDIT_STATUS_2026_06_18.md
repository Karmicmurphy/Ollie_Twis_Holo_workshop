# Repo Audit Status — 2026-06-18

Repository: `Karmicmurphy/Ollie_Twis_Holo_workshop`

## Verdict

The repo is structurally aligned for the current goal: a local-first Workshop with browser fallback, static Cloudflare Pages deployment, local companion services, artifact search, mini-engine registry, and gated adapter lanes.

It is not an unlimited internet agent swarm. It is a Workshop habitat with bounded tools.

## Confirmed working paths by code inspection

- `start-workshop.bat` launches `companion/server.py` on `127.0.0.1:8787`.
- `companion/server.py` serves the static app from `app/` and exposes local API routes under `/api/*`.
- SQLite schema includes projects, artifacts, FTS5 artifact search, sessions, receipts, modules, and jobs.
- The browser app supports Talk, Write, Music, Image, Video, Research, Code, Import, Work, Modules, and Settings rooms.
- `app/modules/modules.json` now defines mini-engine lanes with sandbox, input boundary, output artifact, and receipt fields.
- `app/assets/artifact-compass.js` adds local browser artifact search with match reasons and related hints.
- `app/assets/engine-harness.js` displays the mini-engine pipeline in the Modules room.
- `docs/FREE_TOOL_FEDERATION_POLICY.md` defines how optional free/free-tier tools can be evaluated and connected.

## CI added

`.github/workflows/static-contract.yml` now runs on push and pull request to main.

The workflow:

1. checks out the repo;
2. installs Python 3.12;
3. installs Node 22;
4. runs `npm install`;
5. runs `npm run build`;
6. runs `python -m pytest tests`;
7. verifies the generated `dist/` output contains the required static app files.

## Tests added or confirmed

- `tests/artifact_compass_static_test.py`
- `tests/engine_harness_static_test.py`
- `tests/static_output_contract_test.py`

These tests verify UI wiring, module registry contracts, adapter gating, docs presence, package script alignment, and required static assets.

## Remaining honest caveats

- I inspected and patched through GitHub. I did not run the full test suite inside Randy's PC environment.
- GitHub Actions has been added so the repo can now prove build/test status automatically on future pushes.
- Cloudflare account/project connection still requires Randy's authenticated Cloudflare session or CLI login.
- Optional external engines such as ComfyUI, Liquid/LFM, llama.cpp, MCP bridges, AG-UI, and hosted model providers are adapter-ready, not bundled.
- Free trials must not be treated as core infrastructure.

## Next best engineering target

Build the Handoff Packet Builder:

Artifact Compass selected hits -> packet -> selected mini-engine lane -> output artifact -> receipt -> human review.

That is the next step that turns the habitat from many tools into a smooth tool pipeline.
