---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-005
  title: "Transactional Local Project Persistence"
  status: accepted
  context: "Current project truth is split between localStorage and OPFS, so metadata and audio can become inconsistent across crashes or interrupted writes."
  drivers:
    - "Projects must restore after reload or interrupted saves."
    - "Core operation should remain local-first."
  considered_option_ids:
    - "OPT-011"
    - "OPT-012"
    - "OPT-013"
  selected_option_id: OPT-011
  decision: "Use IndexedDB for versioned project manifests/history metadata and OPFS for immutable audio assets; commit a new manifest generation only after required assets are written."
  positive_consequences:
    - "Supports recovery to a previous valid generation."
    - "Keeps large binary audio out of metadata storage."
  negative_consequences:
    - "Requires migration from existing localStorage metadata."
  assumptions:
    - "IndexedDB and OPFS are available or can be capability-detected with explicit degraded behavior."
  validation_criteria:
    - "Interrupted-write and corrupt-latest-generation tests recover the previous valid project."
  supersedes: []
---

# ADR-005: Transactional Local Project Persistence

## Context
Current project truth is split between localStorage and OPFS, so metadata and audio can become inconsistent across crashes or interrupted writes.

## Decision
Use IndexedDB for versioned project manifests/history metadata and OPFS for immutable audio assets; commit a new manifest generation only after required assets are written.

## Consequences
Positive: Supports recovery to a previous valid generation. Keeps large binary audio out of metadata storage.
Negative: Requires migration from existing localStorage metadata.

## Validation
Interrupted-write and corrupt-latest-generation tests recover the previous valid project.
