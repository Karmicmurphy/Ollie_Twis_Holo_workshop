---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-003
  title: "Explicit Loop State Machine"
  status: accepted
  context: "Current loops combine independent booleans for playing, recording and armed state, allowing ambiguous combinations."
  drivers:
    - "Record, overdub, replace, undo and loading need legal transitions."
    - "UI must not be the source of truth."
  considered_option_ids:
    - "OPT-007"
    - "OPT-008"
  selected_option_id: OPT-007
  decision: "Represent loop lifecycle with explicit stable/action states and command-driven legal transitions; mute/solo remain orthogonal mix state."
  positive_consequences:
    - "Illegal states become rejectable and testable."
    - "UI becomes a projection of core state."
  negative_consequences:
    - "Existing toggle handlers must be migrated to commands."
  assumptions:
    - "Track count remains small enough for explicit per-track machines."
  validation_criteria:
    - "Transition-table tests cover every legal state and reject illegal transitions."
  supersedes: []
---

# ADR-003: Explicit Loop State Machine

## Context
Current loops combine independent booleans for playing, recording and armed state, allowing ambiguous combinations.

## Decision
Represent loop lifecycle with explicit stable/action states and command-driven legal transitions; mute/solo remain orthogonal mix state.

## Consequences
Positive: Illegal states become rejectable and testable. UI becomes a projection of core state.
Negative: Existing toggle handlers must be migrated to commands.

## Validation
Transition-table tests cover every legal state and reject illegal transitions.
