# Hollow Workshop — Isolated Build State

Date: 2026-09-19

## Authority boundary

Protected product/workshop authority remains outside this branch.

- Protected product repo: `Karmicmurphy/Ollie_Twis_Holo_workshop`
- Protected build branch: `living-workshop-main-build`
- Isolated build/audit branch: `hollow-workshop-audit-reconcile`
- Local Windows Workshop remains newer authority when verified.
- Harness Card remains a separate read-only governance reference.
- Nothing in this branch is permission to overwrite the newer local Workshop.

This branch exists so work can continue without risking the Workshop Randy already has.

## Phase 1A — revision preservation

Evidence state: **PROVEN_IN_TEST**

The previously implemented Phase 1A revision spine is now backed by a successful Workshop CI run on the isolated branch.

Preserved mechanisms include:
- immutable artifact revisions;
- SHA-256 snapshot identity;
- optimistic concurrency with `expectedRevision`;
- same-project artifact identity checks;
- atomic projection + revision + receipt;
- protected-source mutation blocks;
- non-destructive retirement;
- history API and My Work History UI;
- capsule inclusion of revision history;
- immutable SQL triggers;
- rollback proof.

## Phase 1B — Human Signal review spine

Evidence state: **PROVEN_IN_TEST**

Built on the isolated branch only.

### New durable review state

Artifact review is now separate from artifact authority.

Review states:
- `UNREVIEWED`
- `CANDIDATE`
- `APPROVED`
- `REJECTED`

This preserves the invariant that source authority, review status, and Canon status are not the same thing.

### Governed human review route

Added a dedicated review route:

`POST /api/projects/{projectId}/artifacts/{artifactId}/review`

Supported human decisions:
- `candidate`
- `approve`
- `reject`
- `promote_canon`

The route requires the expected current revision. Stale review decisions fail.

Generic artifact mutation cannot set review state.

Generic artifact mutation still cannot promote directly to Canon.

Canon promotion requires an artifact to have already reached `APPROVED` through the governed review route.

Protected `SOURCE` / `PERMANENT_SOURCE` authority cannot be converted into Canon.

### Review evidence

Added append-only `artifact_reviews` records with immutable UPDATE/DELETE triggers.

Each review decision records:
- artifact;
- project;
- revision;
- prior review state;
- next review state;
- decision;
- reason;
- timestamp;
- human actor.

Review decisions also create receipts and immutable artifact revisions.

### Human-visible workflow

My Work now displays both authority and review state and exposes bounded human controls:
- Mark candidate
- Approve
- Reject
- Reopen candidate
- Promote Canon

Artifact History now also shows human review decisions.

### Recovery

Project capsules now include `artifactReviews` alongside artifact revisions and receipts.

### Proof

Added `tests/phase1b_human_review_test.py`.

The proof covers:
- generic review-state bypass rejection;
- candidate transition;
- stale-review rejection;
- human approval;
- governed Canon promotion;
- immutable review history;
- rejection and reopen flow;
- source-to-Canon rejection;
- Canon generic-retirement protection;
- capsule review recovery;
- visible My Work review controls.

Workshop CI on commit `3f2d78eee0583ad81b167749d9f69907699c7938` completed successfully, including Python syntax, JavaScript syntax, smoke tests, Python contract tests, local companion API E2E, Cloudflare Worker contract, and static Pages build.

## Stop / next gate

Do **not** merge this branch into the protected Workshop yet.

Do **not** start relationships yet.

Next gate remains file/mechanism reconciliation against the newer local Windows Workshop. Reconciliation classifies each difference as:

- KEEP LOCAL
- KEEP BRANCH
- MERGE
- OBSOLETE
- NEEDS REVIEW

Only after that reconciliation should later relationship/territory work begin.

## Plain-English result

The invention moved forward without touching the protected Workshop.

The isolated branch now has a tested immutable history spine plus a tested human authority/review spine. The next unsafe mistake would be pretending the GitHub branch is newer than the local Workshop without reconciling them first.
