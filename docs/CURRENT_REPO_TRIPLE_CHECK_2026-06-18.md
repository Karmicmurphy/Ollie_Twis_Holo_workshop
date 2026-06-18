# Twis Holo / Ollie Twis Workshop — Repo Triple Check

Date: 2026-06-18

## Repo checked

- Repository: `Karmicmurphy/Ollie_Twis_Holo_workshop`
- Branch: `main`
- Status: public, active, write access confirmed by connector permissions

## Verified present

- `README.md`
- `start-workshop.bat`
- `companion/server.py`
- `companion/security.py`
- `companion/generation_layer.py`
- `app/index.html`
- `app/assets/app.js`
- `app/assets/key-safety.js`
- `app/modules/modules.json`
- `app/modules/generation-adapters.json`
- `artifact-registry/projects.json`
- `artifact-registry/artifacts.json`
- `artifact-registry/receipts.json`
- `docs/PROTOCOL_SECURITY.md`
- `docs/VOICE_PRESETS.md`
- `tests/e2e_api_test.py`
- `tests/security_policy_test.py`
- `tests/generation_layer_test.py`

## What is working by design

The repo is no longer an empty shell. It has a local Python companion, browser app, SQLite/FTS artifact index, project switching, artifact save/search/delete, folder import, project capsule export, image editing, video planning, music WAV export, optional AI endpoint support, generation adapter scaffolding, module registry, and security policy endpoints.

## Hardening applied in this pass

1. Remote AI endpoint policy tightened.
   - Localhost HTTP/HTTPS remains allowed.
   - Remote HTTPS AI endpoints are blocked by default.
   - Remote AI now requires:
     - `TWIS_HOLO_ALLOW_REMOTE_AI=1`
     - `TWIS_HOLO_REMOTE_AI_HOSTS=<explicit-host>`

2. Remote generation endpoint policy tightened.
   - Local generation endpoints remain allowed.
   - Remote generation endpoints are blocked by default.
   - Remote generation now requires:
     - `TWIS_HOLO_ALLOW_REMOTE_GENERATION=1`
     - `TWIS_HOLO_REMOTE_GENERATION_HOSTS=<explicit-host>`
     - `costWarningAccepted=true`

3. Import skip policy expanded.
   - Added extra browser/profile/cache/credential patterns.
   - Secret-like files and large files stay skipped.

4. Generation request scrubbing improved.
   - Secret fields are scrubbed recursively.
   - API keys, tokens, passwords, authorization fields, and similar values are redacted from queued job payloads.

5. Tests expanded.
   - Security tests now check oversized JSON bodies and remote HTTPS AI blocking.
   - Generation tests now check remote generation blocking and secret redaction.

## Voice presets added

New file:

- `app/modules/voice-presets.json`

Six presets were added:

Female narration presets:

- Velvet Ember
- Honey Smoke
- Neon Satin

Male gritty narration presets:

- Gravel Road
- Midnight Baritone
- Rusted Steel

These are local/browser speech style presets, not paid voices and not bundled models. Actual installed voices depend on the computer/browser. The correct next step is a browser voice preset picker, then a local TTS adapter contract.

## Remaining gaps not hidden

1. The voice presets are registered but not yet exposed as a full picker in the UI.
2. `artifact-registry/artifacts.json` is still an empty seed snapshot.
3. `artifact-registry/receipts.json` is still an empty seed snapshot.
4. The generation layer queues controlled jobs but does not yet invoke ComfyUI/LTX/Hunyuan/Wan.
5. The app is still mostly one large `app.js`; split into room modules only after safety and backup/restore are stable.
6. Full local TTS rendering is not implemented yet.
7. True AI image/video generation is adapter-ready, not bundled.

## Current build rule

Do not turn this into a generic AI app, agent platform, vector database project, Open WebUI clone, ComfyUI clone, or paid-provider workflow. The Workshop remains local-first, free-core, human-authority-first, and artifact/receipt/provenance-driven.
