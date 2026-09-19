---
schema_version: 1.0.0
revision: 1
decision:
  id: ADR-002
  title: "AudioContext-backed Master Transport"
  status: accepted
  context: "Loop Deck uses AudioContext scheduling while Pro Rig uses Tone.Transport; worker and UI timers also participate in scheduling."
  drivers:
    - "Quantized recording and playback require deterministic shared timing."
    - "Worker wakeups must not become musical time authority."
  considered_option_ids:
    - "OPT-004"
    - "OPT-005"
    - "OPT-006"
  selected_option_id: OPT-004
  decision: "Use AudioContext-backed time as physical authority and 960 PPQN integer musical ticks as musical position; workers only wake the look-ahead scheduler."
  positive_consequences:
    - "One timing model covers loops, count-in, scenes and automation."
    - "Core transport math can be tested without UI."
  negative_consequences:
    - "Tone.Transport-based Pro Rig scheduling must be removed or adapted."
  assumptions:
    - "Web Audio remains available on supported browsers."
  validation_criteria:
    - "Transport tests show no accumulated tick drift and both UIs report the same bar/beat/tick."
  supersedes: []
---

# ADR-002: AudioContext-backed Master Transport

## Context
Loop Deck uses AudioContext scheduling while Pro Rig uses Tone.Transport; worker and UI timers also participate in scheduling.

## Decision
Use AudioContext-backed time as physical authority and 960 PPQN integer musical ticks as musical position; workers only wake the look-ahead scheduler.

## Consequences
Positive: One timing model covers loops, count-in, scenes and automation. Core transport math can be tested without UI.
Negative: Tone.Transport-based Pro Rig scheduling must be removed or adapted.

## Validation
Transport tests show no accumulated tick drift and both UIs report the same bar/beat/tick.
