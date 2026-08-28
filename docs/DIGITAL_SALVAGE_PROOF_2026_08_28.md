# Digital Salvage V0.1 — First Proof Expedition

Date: 2026-08-28

Mission: prove the new Artifact Compass Digital Salvage lane against one Workshop-relevant primitive without cloning, installing, or executing candidate code.

Target primitive: **small local workflow/state machinery** — deterministic transitions, state invariants, event-driven flow, and resumable state patterns suitable for bounded Workshop orchestration.

## Search posture

- Public GitHub repository metadata and public repository files only.
- Archived/deprecated + MIT-qualified searches.
- No live infrastructure probing.
- No credentials.
- No cloning/installing/running.
- License and access gates applied before reuse consideration.

## Candidate 1 — dominictarr/fsm

```json
{
  "schemaVersion": "twis-digital-salvage-v0.1",
  "candidate": {
    "name": "dominictarr/fsm",
    "description": "Tiny JavaScript finite-state-machine property checker.",
    "abandonmentSignals": [
      "GitHub repository explicitly archived",
      "last repository push 2017-06-20"
    ]
  },
  "source": {
    "class": "public_git_repository",
    "url": "https://github.com/dominictarr/fsm",
    "publicRead": true,
    "provenanceAnchor": "commit:ec9d71cc690324af90835074f2daef8478aefab8",
    "inspectedPaths": ["README.md", "LICENSE", "repository metadata"]
  },
  "accessBasis": "public_read",
  "license": {
    "status": "permissive",
    "spdxId": "MIT",
    "evidence": "GitHub license metadata plus repository README/LICENSE",
    "obligations": ["preserve copyright and MIT permission notice for copied/substantial code"]
  },
  "primitive": {
    "take": "State-spec preflight concepts: validate transition targets, compute reachability, identify terminal/deadlock states, and identify livelock states.",
    "doNotTake": [
      "old package/runtime as a dependency",
      "stream-specific assumptions",
      "automatic execution behavior"
    ]
  },
  "runtimeFit": ["local_python", "browser"],
  "riskFlags": ["none"],
  "score": {
    "capabilityFit": 22,
    "licenseClarity": 20,
    "extractability": 20,
    "runtimeFit": 15,
    "evidenceQuality": 9,
    "salvageValue": 10,
    "total": 96
  },
  "verdict": "KEEP",
  "smallestProof": "Clean-room implement a tiny Workshop state-spec checker for undefined transitions, unreachable states, terminal states, and non-terminating regions; test only against synthetic state maps.",
  "handoff": {
    "kind": "local_script",
    "targetRoom": "build",
    "humanApprovalRequired": true,
    "automaticActivation": false
  }
}
```

Why it matters: this is exactly the kind of digital scrap worth taking apart. The repository is tiny, explicitly archived, MIT-licensed, and the useful part is a handful of general state-graph invariants rather than an application.

## Candidate 2 — run-llama/workflows-ts

```json
{
  "schemaVersion": "twis-digital-salvage-v0.1",
  "candidate": {
    "name": "run-llama/workflows-ts",
    "description": "Deprecated TypeScript event-driven, stream-oriented workflow engine.",
    "abandonmentSignals": [
      "GitHub repository explicitly archived",
      "README explicitly states DEPRECATED and no longer maintained"
    ]
  },
  "source": {
    "class": "public_git_repository",
    "url": "https://github.com/run-llama/workflows-ts",
    "publicRead": true,
    "provenanceAnchor": "commit:0a1090f41a7e47137bdf7ac0e305eddcec6c9f1d",
    "inspectedPaths": ["README.md", "repository metadata"]
  },
  "accessBasis": "public_read",
  "license": {
    "status": "permissive",
    "spdxId": "MIT",
    "evidence": "GitHub repository license metadata",
    "obligations": ["preserve copyright and MIT permission notice for copied/substantial code"]
  },
  "primitive": {
    "take": "Design patterns only at first: typed events, per-run context, event streams, state snapshot/resume, runtime transition validation, and traceable handler graphs.",
    "doNotTake": [
      "full LlamaIndex package stack",
      "agent framework",
      "server middleware",
      "network-facing endpoints",
      "package dependency tree"
    ]
  },
  "runtimeFit": ["browser", "local_native", "manual_handoff"],
  "riskFlags": ["none"],
  "score": {
    "capabilityFit": 25,
    "licenseClarity": 20,
    "extractability": 10,
    "runtimeFit": 10,
    "evidenceQuality": 8,
    "salvageValue": 6,
    "total": 79
  },
  "verdict": "TEST",
  "smallestProof": "Compare its event/context/snapshot concepts against the Workshop's existing orchestration contracts; do not import the package.",
  "handoff": {
    "kind": "docs_only",
    "targetRoom": "build",
    "humanApprovalRequired": true,
    "automaticActivation": false
  }
}
```

Why it matters: it is a very recent example of exactly what Digital Salvage should catch — a capable system that is already deprecated. The useful salvage is not the framework; it is the compact event/context/snapshot model.

## Candidate 3 — ggoodman/ts-statemachine

```json
{
  "schemaVersion": "twis-digital-salvage-v0.1",
  "candidate": {
    "name": "ggoodman/ts-statemachine",
    "description": "Archived typed TypeScript state-machine implementation with guards and final states.",
    "abandonmentSignals": [
      "GitHub repository explicitly archived",
      "last repository push 2020-03-10"
    ]
  },
  "source": {
    "class": "public_git_repository",
    "url": "https://github.com/ggoodman/ts-statemachine",
    "publicRead": true,
    "provenanceAnchor": "commit:a844c53d59531bd6dc384e9236865200b93d6605",
    "inspectedPaths": ["README.md", "repository metadata"]
  },
  "accessBasis": "public_read",
  "license": {
    "status": "permissive",
    "spdxId": "MIT",
    "evidence": "GitHub metadata and MIT license text in README",
    "obligations": ["preserve copyright and MIT permission notice for copied/substantial code"]
  },
  "primitive": {
    "take": "Typed transition-table pattern with guards/conditions, explicit final states, send(event), and done-state semantics.",
    "doNotTake": [
      "package as a dependency",
      "unfinished/WIP implementation assumptions"
    ]
  },
  "runtimeFit": ["browser", "local_native"],
  "riskFlags": ["none"],
  "score": {
    "capabilityFit": 12,
    "licenseClarity": 20,
    "extractability": 10,
    "runtimeFit": 8,
    "evidenceQuality": 5,
    "salvageValue": 4,
    "total": 59
  },
  "verdict": "WATCH",
  "smallestProof": "Keep the typed-guard/final-state pattern as comparison evidence; no implementation needed while the smaller FSM invariant proof covers the immediate gap.",
  "handoff": {
    "kind": "docs_only",
    "targetRoom": "build",
    "humanApprovalRequired": true,
    "automaticActivation": false
  }
}
```

## Successor decision

**KEEP `dominictarr/fsm` as the first mechanism-level salvage target.**

Not the package. Not the old runtime. Salvage the four graph checks:

1. undefined transition target detection;
2. reachability/unreachable-state detection;
3. terminal/deadlock-state detection;
4. livelock/non-terminal-region detection.

These checks can become a tiny clean-room Workshop preflight primitive for validating future orchestration/state specs before anything is activated.

## Smallest build atom

```json
{
  "packet_type": "build_atom",
  "atom_id": "atom_workshop_state_spec_preflight_v0_1",
  "goal": "Validate one synthetic Workshop state map without importing third-party runtime code.",
  "files_needed": [
    "one small pure state-graph checker",
    "one focused test file",
    "one provenance note referencing the salvage card"
  ],
  "run_mode": "local_python",
  "success_test": "Given synthetic valid, unreachable, deadlock, and livelock state maps, return deterministic findings without filesystem writes, network calls, package installation, or state mutation.",
  "integration_boundary": "candidate proof only; no autonomous activation and no live Workshop wiring until separately reviewed"
}
```

## Proof verdict

Digital Salvage V0.1 passed its first discovery proof at the candidate level:

- three lawful public-read candidates found;
- licenses identified before reuse consideration;
- abandonment/deprecation evidence preserved;
- exact commit provenance recorded;
- candidates reduced to primitives instead of imported as platforms;
- one KEEP successor selected;
- one smallest proof atom defined;
- zero candidate code cloned, installed, executed, or activated.

This report does not deploy the lane to the authoritative local Workshop and does not certify the build atom as implemented.
