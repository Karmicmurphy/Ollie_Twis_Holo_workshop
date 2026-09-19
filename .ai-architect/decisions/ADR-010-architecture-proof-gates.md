---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-010
  title: "Architecture Proof and Performance Gates"
  status: accepted
  context: "Prior iterations reached proxy-success states before real user-path or sonic proof, and production migration can reintroduce timing, persistence or mobile regressions."
  drivers:
    - "Architecture claims require measurable evidence."
    - "Every material bug should leave durable prevention."
  considered_option_ids:
    - "OPT-022"
    - "OPT-023"
  selected_option_id: OPT-022
  decision: "Gate migration milestones with deterministic core tests, runtime/browser failure injection, long-session stress, deployed verification and final physical Android proof."
  positive_consequences:
    - "Prevents prototype architecture from being promoted by build/deploy success alone."
    - "Creates durable regression evidence."
  negative_consequences:
    - "Release work takes longer because proof is part of delivery."
  assumptions:
    - "Physical-device proof remains the only unavoidable human/device gate."
  validation_criteria:
    - "All milestone gates pass before legacy paths are retired and final completion is claimed."
  supersedes: []
---

# ADR-010: Architecture Proof and Performance Gates

## Context
Prior iterations reached proxy-success states before real user-path or sonic proof, and production migration can reintroduce timing, persistence or mobile regressions.

## Decision
Gate migration milestones with deterministic core tests, runtime/browser failure injection, long-session stress, deployed verification and final physical Android proof.

## Consequences
Positive: Prevents prototype architecture from being promoted by build/deploy success alone. Creates durable regression evidence.
Negative: Release work takes longer because proof is part of delivery.

## Validation
All milestone gates pass before legacy paths are retired and final completion is claimed.
