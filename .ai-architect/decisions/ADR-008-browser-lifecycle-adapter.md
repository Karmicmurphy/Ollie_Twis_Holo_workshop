---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-008
  title: "Explicit Browser and Mobile Lifecycle Adapter"
  status: accepted
  context: "Audio suspension, page backgrounding, mic loss, device changes and storage pressure currently lack one governing lifecycle state."
  drivers:
    - "Android interruptions are architecture, not post-release compatibility."
    - "Playback should survive optional subsystem failures."
  considered_option_ids:
    - "OPT-018"
    - "OPT-019"
  selected_option_id: OPT-018
  decision: "Centralize AudioContext, page lifecycle, media-device, permission, storage and optional wake-lock events in a BrowserPlatformAdapter with explicit interruption/recovery states."
  positive_consequences:
    - "Makes interruption handling deliberate and testable."
    - "Prevents UI or mic failures from implicitly owning engine state."
  negative_consequences:
    - "Physical-device proof is still required for browser-specific behavior."
  assumptions:
    - "Some lifecycle behavior varies by browser and must remain adapter-specific."
  validation_criteria:
    - "Synthetic lifecycle suite passes and physical Android interruption/resume tests reach defined states."
  supersedes: []
---

# ADR-008: Explicit Browser and Mobile Lifecycle Adapter

## Context
Audio suspension, page backgrounding, mic loss, device changes and storage pressure currently lack one governing lifecycle state.

## Decision
Centralize AudioContext, page lifecycle, media-device, permission, storage and optional wake-lock events in a BrowserPlatformAdapter with explicit interruption/recovery states.

## Consequences
Positive: Makes interruption handling deliberate and testable. Prevents UI or mic failures from implicitly owning engine state.
Negative: Physical-device proof is still required for browser-specific behavior.

## Validation
Synthetic lifecycle suite passes and physical Android interruption/resume tests reach defined states.
