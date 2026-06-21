# FlashRiver / CERT-RIVER Phase 12 ZIP — Harness, Skill, and Restructured Question Extraction

Source ZIP: `FlashRiver_CERT-RIVER_phase12_certified_lineage_clean_working_memory(2).zip`  
ZIP SHA-256: `74d16ddf7769b03d816d32b6aa9bec5c7a8d74ea125d0d1a0600ee633194f2bb`  
Files found in ZIP: `607`  
Inspected extract counts: `{'.md': 110, '.json': 213, '.txt': 84, '.py': 35, '.html': 10, '.pdf': 21, '.zip': 7}`

## Focus

This extraction ignores the normal “what phase are we in?” continuation use and focuses on what Randy asked for:

1. harnesses that can be reused,
2. skills demonstrated by the work,
3. questions Randy was trying to ask, cleaned up into strong reusable wording.

## High-level finding

The ZIP is a proof-discipline system, not just code. Its most valuable salvage is the operating method:

- prove actual file access first;
- make claims narrow;
- certify claims, not tools;
- never broaden a certificate beyond the exact proof;
- treat plans, metadata, cards, UI sketches, and routing sketches as non-executable unless separately implemented and proven;
- quarantine failure honestly;
- repair the smallest proven defect;
- keep working-memory files as authoritative continuity.

## Primary source files used

- `PROJECT_STATE.md` — SHA-256 `2a9a66199844bd296ce1070d8cbeedb1075dfd44cc53d0513db62835584d1e96`
- `RESTART_PACKET.md` — SHA-256 `0b4dfc94d784aa5fa237de2e85c270834394e0380b55e7912429f0d2adc31953`
- `MANIFEST.json` — SHA-256 `a7bb4d4a907fe4b394d76718d4f9f2a37e452f443d2d58d9a1d813323f1c937a`
- `PHASE7_ARTIFACT_COMPASS_PRIOR_ART_COMPARISON.md` — SHA-256 `b38bab3b17b52544b883146669b1f3235435b397bd7ff7ba38cef2686ce3d290`
- `PHASE8_POLICY_GATE_SKETCH.md` — SHA-256 `6c12fd5c14c6575924483159fb3067de9fc2ed004cf587648bd1bc5c2813e998`
- `PHASE9_LEGAL_EXECUTION_SURFACE_ROUTING_REVIEW.md` — SHA-256 `c50d3662493b0ce5b89f472404a72e71277b5faf41a1345ca625224465368ad1`
- `PHASE10A_PROOF_MODE_UI_BOUNDARY_MAP.md` — SHA-256 `42400656ea387d964ea700319e871e4aed4f305875d2aae1aac3bd385fddc988`
- `PHASE11B_TINY_MULTI_STEP_PIPELINE_PROOF_PLAN.md` — SHA-256 `0b612fcbf12b6ad36427373002671f6f719eab342bda487c5a3e38d7d6651e56`
- `PHASE11E_PROOF_FAILURE_REPAIR_AUDIT.md` — SHA-256 `710ef935d8267bf8b74525aa1068a477f938f4657ba87b81fa4753a65050ad37`
- `PHASE11F_COMPARATOR_REPAIR_AND_PIPELINE_PROOF_RERUN.md` — SHA-256 `633b00531187f6935a7008563665361cb078b40aeefb8a449b7ef1a61de885dc`
- `PHASE12_CERTIFIED_LINEAGE_CONSOLIDATION_AUDIT.md` — SHA-256 `4afb5286433d307be1804499c59f858a5c2d3cd80e7bf295043eac96828d78ef`
- `PHASE5_THREE_CONTRACT_KERNEL_ACCEPTANCE_AUDIT.md` — SHA-256 `a54df871c31ee24b860a6bfaa5f1918b5cc313272b5cbd8cb42778e958cd4cd5`

---

# Part 1 — Harnesses pulled from the ZIP

## 1. Actual File Access Proof Harness

**Purpose:** Stop the assistant from pretending it loaded project state.

**Pattern:**
- Before any audit, planning pass, or implementation, list required files as `FOUND / NOT FOUND`.
- Compute SHA-256 receipts.
- If required source files are missing, say so and limit the claim.

**Reusable wording:**
> Prove actual file access first with FOUND / NOT FOUND and SHA-256 receipts before making a decision.

**Best files:** `PHASE11B_TINY_MULTI_STEP_PIPELINE_PROOF_PLAN.md`, `PHASE12_CERTIFIED_LINEAGE_CONSOLIDATION_AUDIT.md`.

## 2. Scope Fence / Forbidden-Scope Harness

**Purpose:** Prevent runaway work.

**Pattern:**
- State exactly what is allowed.
- State exactly what is forbidden.
- After the phase, explicitly confirm forbidden work did not start.

**Reusable wording:**
> Execute only the named bounded target. Do not implement, do not run proofs, do not broaden certificates, do not modify the Phase 3 kernel, and do not add unnamed scope unless explicitly authorized.

**Best files:** all phase reports, especially Phase 8–12 docs.

## 3. Claim Boundary Harness

**Purpose:** Make every certificate smaller than the temptation to overclaim.

**Pattern:**
- Contract name.
- Exact provider.
- Exact fixture/input boundary.
- Exact comparator/check.
- Receipt strength.
- Proof debt.
- Certificate boundary.
- No-broadening audit.

**Reusable wording:**
> Certify only the exact claim proven by the fixture, provider, comparator, trace, receipts, and no-broadening audit.

**Best files:** `PHASE12_CERTIFIED_LINEAGE_CONSOLIDATION_AUDIT.md`, proof-run certificate JSONs.

## 4. No-Certificate-No-Use Policy Gate Harness

**Purpose:** Convert proof state into allowed/denied use without pretending it is runtime enforcement.

**Pattern:**
- `CERTIFIED` + matching boundary + honest receipts + named proof debt + valid dirty-key replay if cached = allow inside exact boundary.
- Missing certificate, mismatched boundary, hidden proof debt, weak receipts, or invalid cache = deny/quarantine.

**Reusable wording:**
> Is this requested use allowed by the exact certified boundary?

**Best files:** `PHASE8_POLICY_GATE_SKETCH.md`, `PHASE8B_SCHEMA_ONLY_METADATA_DRAFT.md`.

## 5. Human Decision Gate Harness

**Purpose:** Force architecture choices to pause at decision points instead of sliding into implementation.

**Pattern:**
- Load current state.
- List options.
- Reject tempting but premature options.
- Choose the smallest next useful target.
- Do not implement inside the gate.

**Reusable wording:**
> This is a human decision gate only. Choose the next narrow target and stop.

**Best files:** `PHASE8H_HUMAN_DECISION_GATE.md`, `PHASE9E_HUMAN_DECISION_GATE.md`, `PHASE10E_HUMAN_DECISION_GATE.md`, `PHASE11A_HUMAN_DECISION_GATE.md`, `PHASE11G_HUMAN_DECISION_GATE.md`.

## 6. Plan-Only Before Proof Harness

**Purpose:** Stop proof execution from being rushed.

**Pattern:**
- First define fixture, step boundaries, expected receipts, trace requirements, dirty-key requirements, proof debt, and certificate boundary.
- Do not run proof until a later phase authorizes it.

**Reusable wording:**
> Plan the proof first. Do not run it until the readiness audit says the plan is executable.

**Best file:** `PHASE11B_TINY_MULTI_STEP_PIPELINE_PROOF_PLAN.md`.

## 7. Readiness Audit Harness

**Purpose:** Confirm a plan is ready before executing anything.

**Pattern:**
- Check fixture is narrow.
- Check existing certified lineage exists.
- Check implementation permission exists or does not.
- Check proof execution permission exists or does not.
- Decide `READY_FOR_PROOF_EXECUTION` or not.

**Best file:** `PHASE11C_TINY_PIPELINE_PROOF_READINESS_AUDIT.md`.

## 8. Failure Stop Harness

**Purpose:** Treat a failed proof as evidence, not embarrassment.

**Pattern:**
- Stop immediately.
- Mark result as rejected/quarantined.
- Record exact failing step.
- Preserve trace, output, receipts, dirty-key state, and failure reason.
- Do not silently patch and continue unless authorized.

**Best file:** `PHASE11D_TINY_PIPELINE_PROOF_EXECUTION_STOP.md`.

## 9. Proof-Failure Repair Audit Harness

**Purpose:** Identify the smallest lawful repair without modifying providers or broadening claims.

**Pattern:**
- Inspect failing trace.
- Classify the failure.
- Identify whether it is provider failure, fixture expectation error, comparator defect, receipt defect, cache defect, or boundary defect.
- Name one minimal patch target.
- Do not rerun proof in the audit.

**Best file:** `PHASE11E_PROOF_FAILURE_REPAIR_AUDIT.md`.

## 10. Comparator Repair and Rerun Harness

**Purpose:** Apply only the named patch and rerun the exact proof.

**Pattern:**
- Record before/after harness hash.
- Patch comparator only.
- Preserve provider, fixture, kernel, step boundaries, and certificate boundary.
- Rerun proof.
- Decide certified/rejected/quarantined.

**Best file:** `PHASE11F_COMPARATOR_REPAIR_AND_PIPELINE_PROOF_RERUN.md`.

## 11. Dirty-Key / Cache Honesty Harness

**Purpose:** Ensure cache replay is lawful and not just convenient.

**Pattern:**
- Cache replay must include dirty-key basis.
- Dirty key must account for provider, comparator, fixture, expected outputs, proof engine, dependency versions, and boundary-affecting code.
- Cache hit without dirty-key basis is not lawful proof replay.

**Best files:** v0.1.4 cache artifacts, v0.2.1 hostile-audit fix artifacts, Phase 11 proof artifacts.

## 12. No-Broadening Audit Harness

**Purpose:** Prevent “it passed once” from becoming “this whole tool is certified.”

**Pattern:**
- Compare certificate claim to exact proof evidence.
- Reject broader wording.
- Keep provider claims fixture-limited.
- Keep UI and metadata from implying enforcement.

**Best files:** `PHASE12_CERTIFIED_LINEAGE_CONSOLIDATION_AUDIT.md`, hostile audit docs.

## 13. Hardened Kernel Boundary Harness

**Purpose:** Separate generic kernel law from contract-specific logic.

**Pattern:**
- The kernel orchestrates claim/provider/comparator/receipt/trace/certificate flow.
- Contract-specific behavior stays in declared harnesses and `ContractSpec` descriptors.
- Do not modify the Phase 3 kernel casually.

**Best file:** `PHASE5_THREE_CONTRACT_KERNEL_ACCEPTANCE_AUDIT.md`.

## 14. Non-Executable Metadata/View Harness

**Purpose:** Let the project design cards, schemas, and UI state without pretending they execute policy.

**Pattern:**
- Schema/card/view may display recorded facts.
- Missing facts must be `UNKNOWN_IN_METADATA`.
- Metadata is not runtime enforcement.
- A card cannot route, execute, certify, or broaden anything.

**Best files:** Phase 8, Phase 9, Phase 10 docs.

## 15. Proof-Mode UI Boundary Harness

**Purpose:** Keep future UI honest.

**Modes salvaged:**
- scout,
- proof,
- certificate,
- receipt,
- trace,
- audit,
- fallback,
- restart packet / handoff.

**Rule:** UI shows recorded facts only. It does not infer, route, rerun, enforce, or certify.

**Best file:** `PHASE10A_PROOF_MODE_UI_BOUNDARY_MAP.md`.

## 16. Legal Execution-Surface Routing Harness

**Purpose:** Decide where work is legally and safely allowed to run.

**Routing logic:**
- Local machine is primary for proof-bearing work.
- Public cloud/GitHub/Cloudflare may be plan candidates only until separately proven.
- No remote route gets certified just because it exists.

**Best file:** `PHASE9_LEGAL_EXECUTION_SURFACE_ROUTING_REVIEW.md`.

## 17. Prior-Art / Artifact Compass Comparison Harness

**Purpose:** Compare the invention against adjacent systems without copying them or overclaiming novelty.

**Pattern:**
- Compare against workflow engines, supply-chain attestation, policy gates, provenance systems, and CI.
- Salvage useful patterns.
- Name what is distinct.
- Do not claim uniqueness beyond evidence.

**Best file:** `PHASE7_ARTIFACT_COMPASS_PRIOR_ART_COMPARISON.md`.

## 18. Working-Memory Continuity Harness

**Purpose:** Stop restart drift.

**Canonical files:**
- `PROJECT_STATE.md`
- `RESTART_PACKET.md`
- `MANIFEST.json`
- `NEXT_PHASE_DECISION.md`

**Rule:** ZIPs are release artifacts; working-memory files are continuation truth.

**Best files:** root working-memory files.

---

# Part 2 — Skills pulled from the ZIP

## Skill 1 — Source-First Audit Discipline
Read files and produce hashes before reasoning.

## Skill 2 — Narrow Claim Writing
Convert a big invention idea into a tiny certifiable claim.

## Skill 3 — Boundary Language
Write certificate boundaries that do not overclaim.

## Skill 4 — Proof Debt Naming
Name what remains unproven instead of hiding it.

## Skill 5 — Receipt Strength Classification
Track whether evidence is S0/S1/R2/etc. and whether it supports the claim.

## Skill 6 — Trace-Based Debugging
Use trace artifacts to locate exact failing step and reason.

## Skill 7 — Comparator Design
Create structural comparators that catch real failures without rejecting harmless serialization differences.

## Skill 8 — Failure Classification
Separate provider failure, comparator failure, fixture expectation failure, cache failure, boundary failure, and proof-engine failure.

## Skill 9 — Smallest-Patch Discipline
Patch only the defect proven by the failure audit.

## Skill 10 — Cache Replay Law
Treat cache as lawful only when dirty-key basis is complete.

## Skill 11 — Kernel/Contract Separation
Keep the reusable runner clean while contract logic remains outside the kernel.

## Skill 12 — Metadata Honesty
Design schemas/cards that display facts without turning into fake enforcement.

## Skill 13 — Human-Gate Governance
Use decision gates when the next step could broaden scope.

## Skill 14 — Execution-Surface Risk Sorting
Decide whether work belongs local, cloud, CI, browser, or nowhere yet.

## Skill 15 — Prior-Art Comparison
Compare against outside categories structurally, not emotionally.

## Skill 16 — Release Hygiene
Consolidate certified lineage, receipts, and restart packets without changing runtime behavior.

---

# Part 3 — Questions Randy was trying to ask, restructured

These are not all explicitly listed as questions in the ZIP. The ZIP only contains a few literal question statements. Most are reconstructed from the phase decisions, rejected options, and recurring hard locks.

## 1. Rough question
“Did you actually look at the files?”

**Clean question:**
> Before making any decision, can you prove actual access to every required file with FOUND / NOT FOUND and SHA-256 receipts?

## 2. Rough question
“Are we accidentally making bigger claims than what passed?”

**Clean question:**
> Does this certificate claim anything beyond the exact provider, fixture, comparator, receipt strength, and trace that were actually proven?

## 3. Rough question
“Is this tool certified now?”

**Clean question:**
> Is the tool certified, or is only one narrow claim about one provider and one fixture certified?

## 4. Rough question
“Can we use this result?”

**Clean question:**
> Is this requested use allowed by the exact certified boundary, or does it require a new proof?

## 5. Rough question
“Did the cache cheat?”

**Clean question:**
> Did the cache replay include a dirty-key basis strong enough to prove that no boundary-affecting input changed?

## 6. Rough question
“What broke?”

**Clean question:**
> Which exact proof step failed, what artifact proves the failure, and is the defect in the provider, comparator, fixture expectation, cache, receipt, or claim boundary?

## 7. Rough question
“Can we fix it without messing everything up?”

**Clean question:**
> What is the smallest lawful patch that fixes only the proven defect without modifying the provider, broadening the claim, changing the kernel, or hiding proof debt?

## 8. Rough question
“Can two certified things work together?”

**Clean question:**
> Can two existing proof-bounded transformations be chained while preserving claim boundaries, receipt honesty, trace continuity, cache/dirty-key discipline, and explicit proof debt?

## 9. Rough question
“Should we add another contract?”

**Clean question:**
> Is a fourth contract justified now, or should we first prove composition of the existing certified/kept contracts?

## 10. Rough question
“Is the UI allowed?”

**Clean question:**
> Is this UI only showing recorded proof facts, or is it implying runtime enforcement, routing, certification, or broader trust?

## 11. Rough question
“Can a dashboard route things?”

**Clean question:**
> Does this metadata/card/view merely display facts, or does it execute, route, enforce, or approve work without a separate certified runtime proof?

## 12. Rough question
“Where can we run proofs?”

**Clean question:**
> Which execution surfaces are legally and technically allowed for proof-bearing work right now, and which are only plan candidates?

## 13. Rough question
“Is Cloudflare/GitHub/CI okay?”

**Clean question:**
> Has this remote execution surface itself been proven for the exact claim, receipt, trace, sandbox, and boundary required, or is it only an untrusted candidate?

## 14. Rough question
“What should the next phase be?”

**Clean question:**
> What is the smallest directly implied successor phase that preserves the current certified boundary without implementation drift?

## 15. Rough question
“Are we done with this phase?”

**Clean question:**
> Does this phase close cleanly with updated `PROJECT_STATE.md`, `RESTART_PACKET.md`, `MANIFEST.json`, receipts, and no forbidden scope started?

## 16. Rough question
“Is this a real invention or just the same as other stuff?”

**Clean question:**
> Compared with workflow engines, policy gates, supply-chain attestations, and CI systems, what is structurally distinct here and what is only borrowed prior-art pattern?

## 17. Rough question
“Can we make it look nice?”

**Clean question:**
> What is the smallest read-only proof-status view that can display current contract, claim, provider, proof result, certificate boundary, receipt strength, proof debt, cache/replay status, trace path, and next allowed action without implying more?

## 18. Rough question
“Are we drifting?”

**Clean question:**
> Did this step modify the Phase 3 kernel, add a provider, add a contract, run an unauthorized proof, broaden a certificate, or start UI/dashboard/routing/cloud/public package work outside the named target?

## 19. Rough question
“How do we keep the next chat from losing everything?”

**Clean question:**
> Are `PROJECT_STATE.md`, `RESTART_PACKET.md`, `MANIFEST.json`, and `NEXT_PHASE_DECISION.md` updated enough for another chat to continue without guessing?

## 20. Rough question
“What is the exact thing we proved?”

**Clean question:**
> State the exact certified runtime boundary, including contract, provider, fixture/input, output, comparator, receipt strength, trace, certificate ID, and proof debt.

## 21. Rough question
“What should not be trusted yet?”

**Clean question:**
> Which artifacts are plans, sketches, metadata, examples, cached results, quarantined providers, or rejected proof runs that must not be treated as certification?

## 22. Rough question
“Did this pass because the comparator was weak?”

**Clean question:**
> Could the comparator normalize away a real failure, or does it check the structure and semantics required by the claim?

## 23. Rough question
“Did the provider write outside where it was allowed?”

**Clean question:**
> Do receipts and traces prove the provider only read/wrote the declared fixture and output paths?

## 24. Rough question
“How do we choose between options without getting lost?”

**Clean question:**
> Which option is the narrowest scientific next question that strengthens the existing lineage without expanding the product surface?

## 25. Rough question
“Is this release clean?”

**Clean question:**
> Does the release bundle preserve certified lineage, hashes, receipts, trace paths, decisions, and working-memory files without silently changing runtime behavior?

---

# Part 4 — What this gives Randy going forward

## Use this as a command prefix

> Use the FlashRiver Phase 12 Harness Extraction: prove file access first; preserve narrow claim boundaries; classify the step as plan, audit, proof, repair, gate, or release; extract the exact question; do not implement or broaden unless explicitly authorized.

## Use this as the anti-drift question

> What exact claim are we making, what exact evidence supports it, and what are we forbidden to assume?

## Use this as the next-task generator

1. Load working-memory files.
2. Prove access.
3. Name phase type.
4. State allowed scope.
5. State forbidden scope.
6. Execute only that scope.
7. Write decision.
8. Update working memory.
9. Stop or continue only to a directly implied bounded successor.
