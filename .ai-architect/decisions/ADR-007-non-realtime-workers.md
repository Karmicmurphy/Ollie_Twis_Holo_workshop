---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-007
  title: "Move Expensive Analysis off Critical Paths"
  status: accepted
  context: "Imported-audio BPM/transient analysis currently executes main-thread CPU work and waveform work can compete with live interaction."
  drivers:
    - "Analysis must not disrupt active playback."
    - "Existing algorithms are salvageable."
  considered_option_ids:
    - "OPT-016"
    - "OPT-017"
  selected_option_id: OPT-016
  decision: "Move BPM, transient, waveform-peak, hashing and similar expensive jobs into dedicated Workers; keep current algorithms initially."
  positive_consequences:
    - "Protects UI and real-time scheduling without discarding proven analysis logic."
  negative_consequences:
    - "Requires message contracts and transferable-buffer handling."
  assumptions:
    - "Worker APIs are available on target browsers."
  validation_criteria:
    - "Large-file analysis while eight loops play does not stall transport or kill audio."
  supersedes: []
---

# ADR-007: Move Expensive Analysis off Critical Paths

## Context
Imported-audio BPM/transient analysis currently executes main-thread CPU work and waveform work can compete with live interaction.

## Decision
Move BPM, transient, waveform-peak, hashing and similar expensive jobs into dedicated Workers; keep current algorithms initially.

## Consequences
Positive: Protects UI and real-time scheduling without discarding proven analysis logic.
Negative: Requires message contracts and transferable-buffer handling.

## Validation
Large-file analysis while eight loops play does not stall transport or kill audio.
