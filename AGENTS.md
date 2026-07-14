# AGENTS.md — Twis Holo Codex Default

This repository is Randy's Twis Holo Workshop. Codex should treat this file as the default operating harness.

## Plain-English mission

Build and improve the Workshop. Do not turn every task into a menu of options. Make the strongest safe default choice, implement it, test it, and report what changed.

## Randy's default order

When the user says "build it," "fix it," "upgrade it," or "do another pass," do this:

1. Inspect the current repo state.
2. Read the architecture and security docs.
3. Pick the smallest useful implementation slice that moves the Workshop forward.
4. Make the change.
5. Run available tests.
6. If tests fail, fix them.
7. Commit or prepare the exact patch.
8. Report what is working, what is partial, and what still needs manual credentials or local hardware.

Do not ask Randy to choose between framework toppings unless the choice truly blocks implementation.

## Source of truth

- Local Workshop core is the private authority.
- GitHub is source backup and deployment source.
- Cloudflare is optional public/phone field kit.
- Cloudflare must not become the private project archive by default.
- AI is advisory and replaceable.
- Modules perform work; artifacts and receipts preserve the work.

## Must-read files before substantial changes

- `README.md`
- `WORKSHOP_ARCHITECTURE.md`
- `SECURITY_GATES.md`
- `CLOUDFLARE_COST_GUARDRAILS.md`
- `docs/AUTOMATION_RUNBOOK.md` if automation/deployment is involved
- `docs/CODEX_DEFAULT_PRESET.md` if the task is broad or ambiguous

## Default build priorities

1. Keep the app runnable locally with `start-workshop.bat`.
2. Keep Python companion standard-library only unless there is a strong reason.
3. Keep browser app static and low-dependency.
4. Keep private data out of GitHub and Cloudflare.
5. Add tests for every new contract.
6. Do not add paid APIs as core dependencies.
7. Do not add autonomous write/delete/publish behavior without human approval.
8. Prefer boring reliable code over fancy architecture.

## Forbidden drift

Do not:

- create new unrelated platforms;
- rename the core project without explicit instruction;
- replace local authority with cloud authority;
- treat memories as source truth when files exist;
- claim a full build when an integration is only scaffolded;
- push private runtime data, SQLite databases, `.env`, tokens, raw recovered archives, browser profiles, cookies, or secret-like files;
- add MCP/browser/agent tools that can write broadly without gates;
- spend money, enable paid services, or trigger billable loops.

## Visual direction

The Workshop should feel like Randy's place:

- dark;
- luminous;
- practical;
- 3D/surreal where it helps;
- not corporate SaaS;
- not childish sci-fi clutter;
- clear enough to use when tired or frustrated.

## Response style for Codex summaries

Report in this order:

1. What I changed.
2. What I tested.
3. What is still blocked and why.
4. Exact next command or manual gate, only if needed.

No padded explanations. No fake certainty.
