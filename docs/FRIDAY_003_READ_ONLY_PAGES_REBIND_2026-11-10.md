# FRIDAY 003 — read-only Pages binding refresh

- Scope: rebuild the already reviewed Workshop 003 source after Cloudflare Production received new `FRIDAY_THIRD_*` environment variables.
- Prior deployed Workshop source SHA: `d2daf8e84b929b3dbf0536cd43b5f434fb3d81af` (approved Workshop PR #33); no application source or workflow logic changed by this file.
- Authorized Foundry control SHA: `6e37d786b5f73ea8de03f95ed99ec21cf09113b8`.
- Required Production bindings: `FRIDAY_THIRD_READ_ENABLED=true`, `FRIDAY_THIRD_SUBMIT_ENABLED=false`, `FRIDAY_THIRD_CONTROL_SHA=<exact Foundry control SHA>`.
- Keep existing encrypted Access/GitHub bindings; keep Production and Preview `fail_open=false`.
- Request `request-commissioning-003` is **NOT DISPATCHED** by this commit. No workflow_dispatch, repair worker, merging of other repositories, credential replacement, or permission broadening.
- Live owner Access GET remains a separate required proof. A successful deployment alone is not an authenticated connection or commissioning success.
- If the new deployment does not contain the `FRIDAY_THIRD_*` bindings, stop and do not enable submission.
