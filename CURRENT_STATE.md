# Twis Holo Workshop — Current Repository State

Updated: 2026-08-20

This file describes the **GitHub repository snapshot**. It does not override the local Windows Workshop. Local remains the private authority; GitHub is code backup and deployment source; Cloudflare remains an optional non-authoritative field/public shell.

## Authority rule

```text
LOCAL = private authority and working home base
GITHUB = code backup, review history, and deploy source
CLOUD = optional field/public shell, never private source authority
```

If the local Windows Workshop contains newer verified room or runtime work that is not present here, the repository is considered **behind local** until that code is deliberately synchronized and tested. Do not silently reconstruct missing local work from memory or documentation.

## Repository baseline now

The GitHub build contains:

- static browser Workshop shell;
- Python standard-library local companion;
- SQLite project, artifact, session, job, and receipt storage;
- FTS5 artifact search;
- project capsule export;
- controlled folder/source import;
- Talk, Write, Music, Images, Video, Explore, Build, Recover, My Work, Modules, and Settings surfaces;
- Artifact Compass browser layer;
- Road-Signal / music support code;
- local/approved-endpoint AI adapter path;
- generation adapter registry and human-confirmed generation job contract;
- Cloudflare optional remote-hull scaffolding;
- GitHub Actions CI and static contract tests.

## Hardening pass — 2026-08-20

The repository cleanup branch `cleanup-harden-2026-08-20` tightens several contracts that were previously documented more strongly than they were enforced:

- project file read/write paths must remain inside one derived project boundary;
- optional `projectId` on file writes must match the project encoded in the path;
- project file writes create receipts with previous and new SHA-256 hashes;
- artifact file hashing rejects project-path escape attempts;
- import policy skips symbolic links;
- import copy targets are checked against the destination boundary;
- project capsules skip symbolic links;
- both service-worker entry points now share one cache contract;
- local companion capability version advances to 1.4.0;
- hardening contract tests cover file-write receipts, traversal rejection, project mismatch rejection, and symlink skipping.

## Honest capability status

### Working in this repository

- local companion server on loopback;
- local SQLite/FTS artifact core;
- project and artifact CRUD used by the browser shell;
- session and receipt recording for governed operations;
- local project capsule ZIP creation;
- folder/source intake with hashing and skipped-file reporting;
- browser writing/music/image/storyboard/research/code surfaces represented by this repository;
- approved OpenAI-compatible local/allowlisted AI endpoint lane;
- generation job gating contract;
- Cloudflare scaffold and deployment contracts;
- CI configuration and static/runtime tests stored in the repo.

### Adapter-ready or external, not bundled here

- llama.cpp runtime and model weights;
- Liquid/LFM or other local model packages;
- ComfyUI and heavy image/video render runtimes;
- LTX-Video, HunyuanVideo, Wan, or equivalent rendering engines;
- external MCP/AG-UI/A2A runtimes;
- full DAW/NLE integrations;
- private historical folders, conversations, images, audio, video, or other user data.

Do not label these as working merely because adapter manifests or UI controls exist.

## Known synchronization gap

The repository must not be treated as a perfect disaster-recovery image of a newer local Windows build unless the local tree has been compared against GitHub and the differences have been intentionally committed. Until that synchronization is performed, a fresh clone restores **this repository baseline**, not necessarily every newer local Workshop capability.

## Next safe sequence

1. Finish and review the 2026-08-20 cleanup branch.
2. Require CI to pass before merging it to `main`.
3. Compare the authoritative local Windows Workshop against GitHub file-by-file.
4. Bring over newer local room/runtime work without weakening authority, receipts, approvals, rollback, or recovery.
5. Run a room-by-room functional pass after synchronization.
6. Only then resume broad feature expansion.

## Non-negotiable rules

- Do not make Cloudflare authoritative.
- Do not commit private runtime data, SQLite databases, secrets, tokens, raw recovered archives, browser profiles, cookies, or credentials.
- Do not claim scaffolded adapters are finished capabilities.
- Do not let AI approve Canon, silently alter permanent source, publish, spend money, or bypass human approval gates.
- Do not trade recoverability for convenience.
