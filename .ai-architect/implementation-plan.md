# Architecture-Driven Implementation Plan

## Accepted decisions

Governing contract: `.ai-architect/architecture-contract.yaml` revision 1.

Accepted ADRs: ADR-001 through ADR-010. Baseline repository SHA: `b05809fbaa4db475ab5854041ef6e82361be25bd`.

## Milestones

### M1 — Extract transport and loop state without changing behavior
**Outcome:** `TransportClock` and `LoopStateMachine` exist as DOM-free core modules.
**Scope:** current scheduling math and loop lifecycle from `twis-loop-deck-v2.js`.
**Constraints:** preserve current Simple Perform behavior and AudioContext look-ahead scheduling.
**Depends on:** ADR-002, ADR-003.
**Verification:** deterministic beat/bar/tick tests; legal/illegal loop-transition tests; existing browser regression remains green.

### M2 — One transport for Loop Deck and Pro Rig
**Outcome:** Pro Rig issues commands into Loop Core; Tone.Transport no longer owns musical time.
**Scope:** Pro Rig scene/stem/macro scheduling and Loop Deck transport coordination.
**Constraints:** Tone.js may remain behind an instrument/effect adapter only.
**Depends on:** M1, ADR-001, ADR-002.
**Verification:** both UIs report identical bar/beat/tick; quantized scene and loop boundaries share one clock.

### M3 — Stable track graph and channel strips
**Outcome:** eight loop tracks plus instrument/sample roles route through fixed channel strips, shared sends and one master bus.
**Scope:** audio-engine, track graph, mixer, metering, recorder taps.
**Depends on:** M2, ADR-004.
**Verification:** mute/solo/gain/pan/effect tests affect only intended channels; STOP produces measured silence; clipping guard remains green.

### M4 — Recorder hardening
**Outcome:** record, count-in, overdub, replace, cancel and bounded free recording use the state machine and quantized transport.
**Scope:** repair `loop-recorder-worklet.js` to use bounded/preallocated recording pages.
**Depends on:** M1-M3, ADR-003, ADR-004.
**Verification:** repeated record/overdub/replace cycles remain aligned; no unbounded callback allocation; memory-growth stress test.

### M5 — Transactional project and asset storage
**Outcome:** IndexedDB metadata generations + OPFS immutable audio assets replace localStorage project truth.
**Scope:** ProjectStore, AssetStore, migrations, previous-generation recovery.
**Depends on:** ADR-005.
**Verification:** reload, interrupted save, corrupt latest manifest, missing asset, quota failure and migration tests.

### M6 — Semantic undo/redo
**Outcome:** destructive edits use command/history records referencing immutable assets.
**Scope:** record-over, replace, clear, trim, slice, effect and mixer edits.
**Depends on:** M5, ADR-006.
**Verification:** record -> overdub -> clear -> undo -> redo restores exact state/asset references; bounded history garbage-collects unreachable assets.

### M7 — Import/analysis worker pipeline
**Outcome:** existing BPM/transient/slice logic moves off the main thread; waveform uses decimated peaks.
**Scope:** import controller, analysis worker, waveform worker, slice metadata.
**Depends on:** M3, M5, ADR-007.
**Verification:** large-file analysis while eight loops play does not stall transport; malformed and unsupported imports fail without session loss.

### M8 — Mobile lifecycle authority
**Outcome:** browser interruptions map to explicit application states and recoverable actions.
**Scope:** AudioContext state, visibility/page events, mic-track end, device changes, storage pressure, rotation and optional wake lock.
**Depends on:** M1-M5, ADR-008.
**Verification:** synthetic lifecycle interruption suite plus physical Android proof for suspension/resume, permission and device-change behavior.

### M9 — Offline core dependency closure
**Outcome:** core looping/performance starts and runs without network.
**Scope:** vendor rights-clean required runtime/sample assets; keep optional stretch/AI/network tools degradable.
**Depends on:** M3, M5, ADR-009.
**Verification:** cold/warm offline application shell and local core playback/recording; failed optional resources do not kill the session.

### M10 — Prototype retirement and closeout
**Outcome:** only one Loop Core and one transport remain; obsolete V1/legacy Pro Rig ownership paths are removed after parity.
**Scope:** legacy scripts, duplicate service-worker ownership, dead state/timing paths.
**Depends on:** M1-M9, ADR-010.
**Verification:** static dependency checks, full regression suite, 30-minute stress, deployed-browser proof and physical Android proof.

## Cross-cutting constraints

- Real-time path: no storage, network, DOM work or unbounded allocation.
- Timing: AudioContext-backed time + 960 PPQN integer musical ticks.
- Mobile target: eight concurrent loops, phone touch targets >=44 CSS px, UI response target <50 ms, scheduler p99 event error target <2 ms where measurable.
- Memory: soft decoded-audio budget 160 MB; guard large imports before approximately 256 MB application-owned decoded PCM.
- Storage: query quota before large writes and block a write when remaining capacity is below max(100 MB, 2x expected next write).
- Persistence: keep at least three valid project generations before garbage collection.
- Extensibility: new instruments/effects/MIDI/controllers/stem or AI tools attach through defined adapters/ports; they do not own transport or project truth.
- Governance: Harness Card authority must be updated after each material implementation milestone.

## Explicit non-goals

- No microservices or server database.
- No full native rewrite.
- No new UI redesign during core migration.
- No stem separation or AI feature inside the real-time core.
- No replacement of OPFS, worklets or working Loop Deck interaction solely for cleanliness.
- No retirement of legacy code before parity and regression proof.

## Unresolved questions

None block architecture recording. Physical Android latency/lifecycle measurements remain implementation proof gates rather than architecture-choice blockers.
