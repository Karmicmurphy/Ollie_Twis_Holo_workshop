# Living Workshop Main Build — Durable Handover

Date: 2026-09-18

## Project identity

Product repository:
`Karmicmurphy/Ollie_Twis_Holo_workshop`

Active build branch:
`living-workshop-main-build`

Baseline commit:
`2ec8b2c080c2e72683a931bbaa5f73217d2e9bb1`

Read-only governance reference:
`Karmicmurphy/Harness-card`

Pinned Harness authority:
`c63091eebf07c2afa25e24a0528a4d77cd3e6977`

The Workshop is the product.
Harness Card governs how AI works on it.
Harness Card is not merged into the Workshop.

The active Windows Workshop is newer than the GitHub repository baseline. This branch is an isolated candidate and must never be treated as a replacement for newer local authority unless an explicit file-by-file reconciliation proves that state.

Do not import private databases, personal biography, recovery archives, model files, credentials, browser data, or private runtime material into GitHub.

AIOS remains optional experimental machinery and is not product authority.

---

## Main build

The project is now the:

**OLLIE_TWIS LIVING WORKSHOP — MAIN BUILD**

The Workshop is a local-first creative, project, software, salvage, and business production environment.

The protected asset is **Human Signal**.

Core loop:

`CAPTURE -> REVIEW -> CONNECT -> DECIDE -> FORGE -> PROVE -> RELEASE -> REUSE`

The Workshop exists to turn human-originated source material into finished work without losing:

- source truth;
- authorship;
- provenance;
- corrections;
- contradictions;
- review state;
- lineage;
- proof;
- human authority.

Do not reinterpret this project as:
- a generic AI assistant;
- an AI operating system;
- a second brain;
- a memory platform;
- a Notion clone;
- a graph demo;
- a cloud-first SaaS;
- an agent swarm.

---

## Repository reuse rule

Do not create a new repo for this build.

Use the existing Workshop as the main body.

Existing Workshop capabilities to preserve and reuse include:
- Python standard-library local companion;
- SQLite;
- FTS5 artifact search;
- artifact/project CRUD;
- receipts;
- SHA-256 hashing;
- folder/source import;
- project capsule export;
- Talk;
- Write;
- Music;
- Images;
- Video/storyboard;
- Explore/research;
- Build/coding room;
- Recover;
- My Work;
- Modules;
- Artifact Compass;
- local/allowlisted AI adapter path;
- generation job gating;
- optional Cloudflare field/public hull;
- tests and security boundaries.

Other repositories are donors, not product authorities:
- `Karmicmurphy/Harness-card` — governance/reference.
- `Karmicmurphy/digital-scrapyard-autopilot` — salvage/business mechanism donor later.
- `Karmicmurphy/Untethered-AIOS` — optional experimental lower-level machinery only.

---

## Architectural invariants

These distinctions are mandatory:

SOURCE != INTERPRETATION

OBSERVATION != PROOF

PATTERN != FACT

CANDIDATE != CANON

AI OUTPUT != HUMAN APPROVAL

DERIVED ART != EVIDENCE OF SOURCE FACT

CURRENT VERIFIED TRUTH > STALE MEMORY OR OLD DOCUMENTATION

Permanent source must not be silently overwritten.

Corrections create history and supersession; they do not erase lineage.

Engines are replaceable.
Artifacts are durable.
Human authority remains final.

---

## Current active work: Phase 1A

### One bounded move

Preserve artifact revisions in the existing SQLite companion.

Add:
- immutable revision snapshots;
- SHA-256 snapshot identities;
- same-project identity checks;
- API history inspection;
- History control in My Work;
- capsule export inclusion for revisions;
- generic-route block on protected source mutation;
- generic-route block on Canon promotion;
- historical snapshot preservation when ordinary drafts are retired.

Keep FTS search over the current projection only.

### Mandatory amendments

1. **No destructive draft deletion**
   - Use tombstone/retirement semantics.
   - Preserve artifact identity, revision chain, receipts, and lineage.

2. **Lost-update prevention**
   - Every mutation must carry an expected revision/version.
   - If two writers start from revision N, only the first valid mutation may advance it.
   - A stale writer must fail cleanly.

3. **Atomic transaction invariant**
   - Current projection + immutable revision + receipt must succeed together or none of them happen.
   - No orphan revision.
   - No half-updated projection.
   - No orphan receipt.

### Conceptual Phase 1A shape

```
artifact
   |
   | current_revision_id
   v
current projection
   |
   +----------------------+
   |                      |
   v                      v
artifact_revision      receipt
append-only            append-only
```

A revision snapshot should preserve enough immutable identity to reconstruct what existed, conceptually:

- artifact_id;
- project_id;
- revision_number;
- parent_revision_id;
- snapshot_sha256;
- title;
- kind;
- authority_state;
- normalized snapshot/payload;
- created_at;
- actor lane if already supported.

Exact schema may differ if the existing implementation provides a better normalized design.

The contract may not.

### Protected source rule

Generic artifact edit routes must not mutate protected source states.

A correction to source will later be a governed correction/supersession operation, not a silent historical rewrite.

### Human path

`open candidate Workshop -> My Work -> History -> inspect original and later snapshots with dates, authority labels, hashes, and receipts`

Target environment:
- local Windows;
- existing browser shell;
- mouse/keyboard;
- no account;
- no cloud;
- no model;
- no microphone permission;
- no new runtime dependency.

---

## Phase 1A proof matrix

Run baseline tests first.

Then prove using the actual HTTP/application path:

- ten synthetic mixed artifacts;
- saves;
- edits;
- FTS search;
- restart recovery;
- history inspection;
- capsule recovery;
- rejected protected-source mutation;
- rejected cross-project ID reuse;
- stale concurrent revision rejection;
- SQL history tampering detection/behavior as designed;
- transaction rollback on injected failure;
- visible History workflow in browser.

The rollback proof must demonstrate:

`projection + revision + receipt`

either all commit or all roll back.

Update `CURRENT_STATE.md` with exact evidence, limitations, and remaining gates.

### Phase 1A stop condition

Stop after this slice.

Do not start Phase 1B or Phase 2 automatically.

The full Phase 1 gate remains open until later slices implement:
- explicit artifact relationships;
- governed review transitions;
- correction/supersession semantics;
- broader source-file/capsule restore workflows.

---

## Deliberately deferred

Do not build yet:
- graph UI;
- THY import;
- Forge engine;
- commerce;
- AIOS integration;
- production deployment;
- wholesale GitHub/local reconciliation;
- Canon approval;
- autonomous publishing;
- paid-provider dependencies.

The source freeze is an application boundary, not protection against a local administrator directly editing SQLite or files.

Snapshot hashes establish byte identity only.
They do not establish truth, authorship, approval, or an independently signed audit trail.

---

## Future build sequence

After Phase 1A is proven:

1. Human Signal authority/review spine.
2. Explicit relationships and territory model.
3. THY/Canon lane.
4. Provider-neutral Forge job contracts.
5. Artifact Salvage Yard.
6. Software Factory.
7. Business Factory.
8. Automation of only proven repetitive paths.

Phase 2 must not start because Phase 1A alone exists.

---

## Required working style

Use Harness Card behavior automatically.

Randy should not have to:
- choose skills;
- choose frameworks;
- translate normal speech into engineering instructions;
- restate exclusions;
- manually orchestrate proof.

Recover current truth.
Make one bounded move.
Prove it.
Record the lesson.
Stop.

No fake finishes.

If the human cannot open, recognize, and use the thing claimed to be built, it is not done.

---

## New-chat bootstrap

In a new chat, the user should say:

**Open Karmicmurphy/Ollie_Twis_Holo_workshop on branch living-workshop-main-build. Read docs/LIVING_WORKSHOP_MAIN_BUILD_HANDOVER_2026-09-18.md first, then read Karmicmurphy/Harness-card as the read-only governing reference. Recover current repo truth before planning. Continue only from the first unproven gate. Do not redesign the project, create a new repo, or start a later phase.**

That handover file is the durable continuity point for the Main Build.
