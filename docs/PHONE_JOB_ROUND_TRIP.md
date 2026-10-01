# Bounded phone-job candidate

Status: IMPLEMENTED_NOT_FIELD_PROVEN. No phone arrival or live Pages return is
claimed. Nothing in this change replaces private Windows Workshop authority.

## Existing path and change

Open Door already lives in `app/index.html` and `app/assets/app.js`. Local
`companion/foundry_bridge.py` remains loopback-only and unchanged. The optional
fixed-check control uses `app/assets/foundation-phone.js` and the separate
Pages route `functions/api/foundation/jobs.js`. The implementation is in
`cloudflare/pages/foundation.js`; no standalone Worker or database is added.

One Workshop UUID becomes `job:phone-<32 hex>` before dispatch. It is carried
unchanged into the existing default-branch `foundation-bounded-job.yml`, its
bounded runner, Builder, AIOS, Independent Proof and receipt. The runner change
is reviewed separately in Foundry PR #32. The dispatcher pin update must be
reviewed separately; latest branch head never becomes authority automatically.

Only `aios-path-containment` is admitted. Natural-language text remains on the
device in bounded mode. This is not arbitrary coding or semantic interpretation.

## State and return

SUBMITTED/PENDING/RUNNING are transport observations. PASSED requires both a
successful workflow and the exact attempt's correlated independent certificate.
Missing proof is PROOF_PENDING, not success. Failed execution is FAILED;
invalid requests are REJECTED. Configuration, authentication and integrity
errors are BLOCKED. No status triggers learning, activation or approval.

The URL fragment preserves only job and run identity for reload recovery.
Check result refreshes real state; it does not continuously poll. A retry uses
an explicit linked child run, preserving the same job ID and earlier artifacts,
limited to three attempts. Native GitHub reruns removed old artifacts in the
actual candidate test and are therefore not used. The proposed dispatcher serializes matching job IDs
and rejects later duplicate runs before execution. Pages preflight alone is
not an atomic lock. Dispatch transport timeouts are ambiguous; never blindly
resubmit as a new identity. Investigate the existing run history first.

## Security and activation gate

All routes default disabled. Authentication validates the Access JWT signature,
issuer, audience, expiry, issue time and exact owner subject using pinned jose.
POST also requires same Origin and bounded JSON. No arbitrary paths, commands,
providers, refs or text enter dispatch. GitHub is the execution ledger. Polling
requires the expected repository, workflow, exact dispatcher SHA and job ID.
Artifact bytes must match GitHub's SHA-256; receipt identities, source pin,
attempt and inner independent proof correlation are separately checked.

Use server-side Pages settings only:

- `FOUNDATION_PHONE_ENABLED`: remains absent/false until reviewed activation.
- `FOUNDATION_ACCESS_DOMAIN`, `FOUNDATION_ACCESS_AUD`, `FOUNDATION_OWNER_SUB`:
  actual owner Access policy, not browser-supplied identity.
- `FOUNDATION_GITHUB_TOKEN`: fine-grained token restricted to Foundry; Actions
  write, Contents read and metadata read only. Never reuse a broad CLI token.
- `FOUNDATION_DISPATCH_SHA`: explicitly reviewed default-branch commit.
- `FOUNDATION_SOURCE_SHA`: explicitly reviewed bounded-runner source commit.

No secrets belong in source, browser storage or logs. No D1, queue, new Worker,
remote AI, generic remote writes or local source upload is enabled. Existing
Pages build settings and local companion security remain unchanged.

Admission is intentionally small: three observed new jobs per hour, no new
job while another is active, three attempts maximum. This is a conservative
authenticated preflight, not a distributed rate-limiter guarantee. GitHub
eventual consistency, artifact expiration and failed dispatch responses are
explicit fail-closed limitations. Test the existing account's Access policy
and GitHub limits before enabling production.

## Verification scope

`npm run test:phone`: actual JWT signatures, denied inputs, receipt ZIP digest,
inner proof mismatch, fixed dispatch payload, retries and API cache exclusion.
Mocks stand in for the GitHub account in these unit tests; these are not field
proof. Compile with `wrangler pages functions build functions` and build the
existing Pages app. Existing Python/API checks must continue to pass.

Real acceptance still requires authenticated Android arrival, approved run,
negative case, retry/reload, same identity and returned proof. Only then may
Harness record phone-path success. Optional model routing is deferred.

References: [Access origin JWT validation](https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/application-token/)
and [GitHub workflow dispatch API](https://docs.github.com/en/rest/actions/workflows#create-a-workflow-dispatch-event).
