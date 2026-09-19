---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-006
  title: "Semantic Undo and Redo over Immutable Assets"
  status: accepted
  context: "Current undo retains only one prior AudioBuffer, which cannot support workstation editing or efficient multi-step recovery."
  drivers:
    - "Record-over, replace, clear, trim and slice must be reversible."
    - "Large audio blobs should not be duplicated unnecessarily."
  considered_option_ids:
    - "OPT-014"
    - "OPT-015"
  selected_option_id: OPT-014
  decision: "Use semantic command history referencing immutable/content-addressed assets and non-destructive region metadata; bound history and garbage-collect unreachable assets."
  positive_consequences:
    - "Multi-step undo/redo becomes durable and storage-efficient."
    - "Edits remain explainable and testable."
  negative_consequences:
    - "Asset reachability and history compaction must be implemented."
  assumptions:
    - "Destructive audio rendering creates new asset versions rather than mutating old assets."
  validation_criteria:
    - "Undo/redo sequences restore exact asset IDs and project state across save/restore."
  supersedes: []
---

# ADR-006: Semantic Undo and Redo over Immutable Assets

## Context
Current undo retains only one prior AudioBuffer, which cannot support workstation editing or efficient multi-step recovery.

## Decision
Use semantic command history referencing immutable/content-addressed assets and non-destructive region metadata; bound history and garbage-collect unreachable assets.

## Consequences
Positive: Multi-step undo/redo becomes durable and storage-efficient. Edits remain explainable and testable.
Negative: Asset reachability and history compaction must be implemented.

## Validation
Undo/redo sequences restore exact asset IDs and project state across save/restore.
