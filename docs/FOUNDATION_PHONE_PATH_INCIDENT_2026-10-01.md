# Foundation phone-path incident — 2026-10-01

Status: **REPO-SIDE REPAIR PROVEN IN CI / LIVE CLOUDFLARE PREVIEW STILL UNPROVEN**

This document records the expensive failure chain around the Android Foundation bounded-job path so the same debugging cost is not paid again.

## Locked outcome

Android Workshop -> Cloudflare Access -> current Pages Preview -> `/api/foundation/jobs` -> approved bounded Foundry job -> AIOS / Builder / Independent Proof -> correlated receipt -> result back on Android under the same Foundation `job_id`.

No automatic activation. No arbitrary natural-language coding. No new Worker, database, queue, or orchestration layer. Production must not be modified while repairing Preview.

## User-visible symptom

The live Android Workshop repeatedly returned:

`BLOCKED: PHONE_JOBS_DISABLED`

The Pages Function gate is:

`if (env.FOUNDATION_PHONE_ENABLED !== 'true') fail(503, 'PHONE_JOBS_DISABLED');`

The Cloudflare Preview dashboard visibly contained `FOUNDATION_PHONE_ENABLED=true` along with the other Foundation bindings, yet the deployed runtime continued to behave as if the variable were absent or not the exact string `"true"`.

## Failure chain

### 1. Preview configuration appeared correct in the dashboard

Preview contained the Foundation configuration needed by the bounded route, including the enable flag, Access settings, reviewed source/dispatcher pins, owner subject, and narrowly scoped GitHub token.

The owner had already completed the manual account work. Repeatedly asking to re-enter the same variables was therefore a false lead.

### 2. Retrying the old Preview deployment did not change the symptom

A successful Cloudflare Pages redeploy of commit:

`0f2f6de0a1b9712592295c50eef4f609fc482baf`

still returned `PHONE_JOBS_DISABLED` on the Android path.

This proved that a generic "redeploy it" instruction was insufficient.

### 3. Build logs exposed split configuration authority

The Cloudflare build log explicitly reported a Wrangler configuration file and listed only:

- `TWIS_REMOTE_HULL_MODE=public-shell`
- `TWIS_ALLOW_AI=false`
- `TWIS_ALLOW_REMOTE_WRITE=false`

The deployed branch contained root `wrangler.jsonc` with exactly those three vars and no Foundation vars.

That file therefore represented a second configuration authority that disagreed with the Cloudflare Preview dashboard.

### 4. Root Pages Wrangler configuration was removed from the Preview branch

Commit:

`003684535b17f99fe61d687f4e05500479704113`

removed the stale root `wrangler.jsonc` from `codex/pages-bounded-job-return` so Pages Preview dashboard configuration could be authoritative again.

Production was not modified.

### 5. The repair exposed stale CI assumptions

Workshop CI then failed even though application syntax and smoke tests passed.

Two Python contracts still required `wrangler.jsonc` to exist:

- `test_cloudflare_worker_scaffold_exists`
- `test_pages_config_stays_non_authoritative`

Observed result: **65 passed, 2 failed**.

This was a stale-test failure caused by the correct configuration-authority repair, not a new application failure.

### 6. CI contracts were updated to match the corrected Pages model

Commit:

`a99b13340c82ac79d7dc7ac883ab202f46770456`

changed the contract so root Pages `wrangler.jsonc` is expected to remain absent while `wrangler.worker.jsonc` continues to govern the separate Worker path.

### 7. An unrelated Worker workflow produced a misleading red GitHub notification

GitHub run:

`36818221673`

failed with **zero jobs created**. It was `.github/workflows/cloudflare-worker.yml`, not the bounded phone job.

The workflow used a job-level `if` expression referencing secrets. GitHub rejected the workflow before job execution. This created high-noise red failure evidence that looked like the Preview repair had failed even though no phone-path job had run.

### 8. Worker workflow validation noise was repaired separately

Commit:

`029ce359b5833f654151a5ba3e4235404d949a54`

repaired the unrelated Worker workflow so it no longer masks Preview work with a zero-job validation failure.

This change is intentionally separate from the phone-path runtime fix.

### 9. Workshop repository side is now green

GitHub Workshop CI run:

`36818614766`

completed successfully for head:

`029ce359b5833f654151a5ba3e4235404d949a54`

Successful gates included:

- checkout/setup
- Python syntax
- JavaScript syntax
- smoke test
- Python contract tests
- local companion API e2e
- Cloudflare Worker contract
- static Pages build
- Pages Functions compile

This proves the repository-side repair is coherent. It does **not** prove the live Cloudflare Preview runtime has received the dashboard Foundation bindings.

## Root cause classification

Primary root cause: **split configuration authority / configuration drift**.

Cloudflare Preview dashboard configuration and root Pages Wrangler configuration described different runtime environments. The build log showed the Wrangler-side values winning the build/deploy configuration path while the phone route required Foundation variables present only in the dashboard configuration.

Secondary failures:

1. stale CI contracts pinned the obsolete Pages config file;
2. an unrelated malformed Worker workflow generated a red zero-job GitHub failure;
3. completion language outran live target-device proof during debugging;
4. repeated manual instructions were given before all repo/account evidence had been exhausted.

## False leads that must not be repeated

- Re-enter the same Preview variables without evidence they are missing.
- Retry an old deployment snapshot repeatedly and expect source/config authority to change.
- Treat any red GitHub Actions notification as evidence that the bounded phone path failed.
- Treat green CI as proof that Cloudflare Preview runtime bindings are correct.
- Reopen architecture or add infrastructure before proving the current Pages deployment state.
- Touch Production while debugging this Preview-only gate.

## Permanent rules from this incident

1. **One configuration authority per deployable surface.** If a Pages Wrangler config exists, explicitly verify whether it owns Pages runtime bindings before trusting dashboard variables.
2. **Build-log variable lists are evidence.** If the provider prints only a subset of expected bindings, investigate authority before re-entering values.
3. **Zero-job Actions failure means workflow validation first.** Do not debug application code until a job exists.
4. **Config-source changes require a fresh deployment generation.** Do not assume retrying an old deployment snapshot will incorporate changed repository authority.
5. **Green CI is PROVEN_IN_TEST only.** Live Preview + Android action + returned receipt are required for PROVEN_LIVE.
6. **After a user-facing failure, inspect sibling failure modes before asking the owner for another manual action.**
7. **Do not expose secrets in public incident records.** Presence and scope may be documented; values may not.

## Current state

Repository branch:

`codex/pages-bounded-job-return`

Current repaired head:

`029ce359b5833f654151a5ba3e4235404d949a54`

Repo evidence state:

`PROVEN_IN_TEST`

Cloudflare Preview runtime evidence state:

`UNKNOWN / NOT YET VERIFIED AFTER CONFIG-AUTHORITY REPAIR`

Android end-to-end evidence state:

`BLOCKED UNTIL CURRENT PREVIEW DEPLOYMENT IS VERIFIED`

## Next proof gate

Cloudflare must verify that the branch alias is serving a fresh Preview deployment built from the repaired branch and that the live Pages Function runtime receives:

`FOUNDATION_PHONE_ENABLED = "true"`

along with the remaining required Foundation bindings.

Only after that should the Android bounded test be run again.

## Definition of done

This incident is not closed by CI or by a successful Pages deploy notification.

It closes only when:

Android Workshop -> authenticated current Preview -> approved bounded job -> correlated Independent Proof receipt -> same job identity -> result visible on Android.
