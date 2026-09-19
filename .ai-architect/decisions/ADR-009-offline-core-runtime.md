---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-009
  title: "Offline-capable Core Runtime"
  status: accepted
  context: "Current Pro Rig can load runtime/sample assets from remote hosts, while the target product is local-first and performance-critical."
  drivers:
    - "Core looping and playback must not depend on network availability."
    - "Optional capabilities may degrade independently."
  considered_option_ids:
    - "OPT-020"
    - "OPT-021"
  selected_option_id: OPT-020
  decision: "Serve all assets required for core looping/performance locally where licensing allows; network-loaded stretch, AI or enrichment remains optional with explicit fallback."
  positive_consequences:
    - "Improves reliability, startup predictability and offline use."
  negative_consequences:
    - "Repository/package size increases and asset licensing/provenance must be maintained."
  assumptions:
    - "Required third-party runtime assets can be lawfully vendored or replaced with local equivalents."
  validation_criteria:
    - "Offline core playback/recording works after install and optional-network failures do not end the session."
  supersedes: []
---

# ADR-009: Offline-capable Core Runtime

## Context
Current Pro Rig can load runtime/sample assets from remote hosts, while the target product is local-first and performance-critical.

## Decision
Serve all assets required for core looping/performance locally where licensing allows; network-loaded stretch, AI or enrichment remains optional with explicit fallback.

## Consequences
Positive: Improves reliability, startup predictability and offline use.
Negative: Repository/package size increases and asset licensing/provenance must be maintained.

## Validation
Offline core playback/recording works after install and optional-network failures do not end the session.
