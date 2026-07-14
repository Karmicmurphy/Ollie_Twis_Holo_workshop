# Codex Default Preset — Randy Mode

This is the no-menu default configuration for Codex on Twis Holo Workshop.

## Use this preset when

- Randy says build it, upgrade it, debug it, do another pass, fix the repo, or make it functional.
- The task is broad and he does not want to pick every setting.
- The work is inside this repository.

## Default setting choices

### Work mode

Use implementation mode, not brainstorming mode.

### Reasoning depth

Use high/deep reasoning for architecture, security, repo surgery, Cloudflare, data import, and AI/module routing.
Use normal reasoning for small copy edits, typo fixes, or single-file cleanup.

### Autonomy

Act autonomously within the repo.
Ask only when blocked by:

- account login;
- secrets/tokens;
- paid service enablement;
- deleting user data;
- publishing public/private material;
- choosing between two irreversible directions.

### Internet / docs

Check current docs when touching:

- OpenAI / Codex / ChatGPT Apps / Agents SDK;
- Cloudflare Workers / Pages / Workers AI / Durable Objects;
- MCP / AG-UI / A2UI / A2A;
- package versions or deployment systems.

Prefer official docs first. If only news/blogs are available, say that clearly.

### Tools

Use repo tools first:

```text
read files -> patch code -> run tests -> fix failures -> summarize
```

Use browser/web research only for current external facts.
Use Cloudflare only as optional field-kit code unless credentials are present.
Use GitHub Actions for repeatable tests.

### Tests

Run or maintain these checks when relevant:

```bash
python -m py_compile companion/server.py
node --check app/assets/app.js
node --check cloudflare/worker/src/index.js
python tests/smoke_test.py
python tests/api_e2e_test.py
python tests/test_worker_contract.py
```

If a test cannot run, explain the missing runtime.

## Default build loop

1. Inspect repo.
2. Find missing/unsafe/unfinished piece.
3. Patch it.
4. Add/adjust test.
5. Run tests or explain why not.
6. Commit/push if tool allows.
7. Report only the useful facts.

## Default answer to unclear choices

Do not ask Randy whether he wants ketchup, mustard, lettuce, or tomatoes.

Pick the safe Workshop default:

- local-first;
- free-core;
- low-dependency;
- private by default;
- Cloudflare optional;
- AI advisory;
- test-backed;
- artifact-and-receipt based.

## Manual gates Codex must respect

Stop before:

- adding or printing secrets;
- enabling paid services;
- uploading private recovered folders to cloud;
- deleting permanent source;
- approving Canon;
- publishing private material;
- changing repo ownership or billing settings.

## Summary format

```text
Changed:
- ...

Tested:
- ...

Still blocked:
- ...

Next:
- ...
```

If nothing is blocked, say `Next: none.`
