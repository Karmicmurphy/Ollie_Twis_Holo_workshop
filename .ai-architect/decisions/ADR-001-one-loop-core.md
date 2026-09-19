---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-001
  title: "One Loop Core for Loop Deck and Pro Rig"
  status: accepted
  context: "Loop Deck and Pro Rig currently own separate musical runtimes and transports, creating duplicated timing and state authority."
  drivers:
    - "One finished workstation must have one authoritative engine."
    - "Existing Loop Deck and Pro Rig surfaces should be preserved."
  considered_option_ids:
    - "OPT-001"
    - "OPT-002"
    - "OPT-003"
  selected_option_id: OPT-001
  decision: "Use one modular Loop Core and AudioEngine; Loop Deck and Pro Rig become UI surfaces issuing commands to that core."
  positive_consequences:
    - "Eliminates split-brain transport/state ownership."
    - "Preserves both user-facing surfaces."
  negative_consequences:
    - "Requires incremental migration of Pro Rig audio ownership."
  assumptions:
    - "Current browser/PWA deployment remains the product platform."
  validation_criteria:
    - "Only one authoritative transport/audio core remains after parity migration."
  supersedes: []
---

# ADR-001: One Loop Core for Loop Deck and Pro Rig

## Context
Loop Deck and Pro Rig currently own separate musical runtimes and transports, creating duplicated timing and state authority.

## Decision
Use one modular Loop Core and AudioEngine; Loop Deck and Pro Rig become UI surfaces issuing commands to that core.

## Consequences
Positive: Eliminates split-brain transport/state ownership. Preserves both user-facing surfaces.
Negative: Requires incremental migration of Pro Rig audio ownership.

## Validation
Only one authoritative transport/audio core remains after parity migration.
