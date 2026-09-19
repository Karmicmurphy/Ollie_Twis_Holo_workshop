---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-004
  title: "Stable Track-oriented Audio Graph"
  status: accepted
  context: "Current routing is largely source-to-master with global processing; future effects and recording taps would make ad-hoc graph mutation fragile."
  drivers:
    - "Live playback must survive UI manipulation."
    - "Per-track effects, sends, mute, solo and metering need predictable ownership."
  considered_option_ids:
    - "OPT-009"
    - "OPT-010"
  selected_option_id: OPT-009
  decision: "Use fixed channel strips per track/instrument, shared send returns, one master chain and explicit recording taps; bypass with parameters/gain instead of graph teardown."
  positive_consequences:
    - "Reduces runtime graph churn and failure coupling."
    - "Provides stable extension points for effects and metering."
  negative_consequences:
    - "Adds a deliberate channel-strip abstraction."
  assumptions:
    - "A fixed practical upper bound on simultaneous tracks/effects is acceptable on mobile."
  validation_criteria:
    - "Routing tests prove channel isolation and long-session stress shows no graph growth."
  supersedes: []
---

# ADR-004: Stable Track-oriented Audio Graph

## Context
Current routing is largely source-to-master with global processing; future effects and recording taps would make ad-hoc graph mutation fragile.

## Decision
Use fixed channel strips per track/instrument, shared send returns, one master chain and explicit recording taps; bypass with parameters/gain instead of graph teardown.

## Consequences
Positive: Reduces runtime graph churn and failure coupling. Provides stable extension points for effects and metering.
Negative: Adds a deliberate channel-strip abstraction.

## Validation
Routing tests prove channel isolation and long-session stress shows no graph growth.
