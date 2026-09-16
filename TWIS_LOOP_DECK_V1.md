# TWIS LOOP DECK V1

Status: working browser-first prototype on `feature/twis-loop-deck-salvage`.

Entry point: `app/loop-deck.html`

## What works now

- fullscreen phone-first looper UI
- single local Web Audio graph
- 16 synthesized starter pads
- 16-step sequencer
- 8 microphone loop slots
- local audio import
- waveform preview
- local BPM estimation
- bar-based slicing
- one-tap build-kit mapping from imported slices to pads
- master low-pass filter performance control
- stutter-style master gating
- master mix capture/export to browser-supported WebM audio
- local persistence of BPM, pattern, pad labels, cutoff, and scene selection
- no cloud audio upload required
- no paid runtime required

## Honest limits of V1

This is not yet the final low-latency engine. Timing-critical recording still runs through browser APIs rather than a dedicated AudioWorklet scheduler. Imported audio blobs and recorded loop blobs are not yet persisted across reloads. Independent pitch-preserving time-stretch and local stem separation are deferred. Per-device latency calibration currently reports browser base latency but does not yet compensate recorded loop placement.

## Next engineering pass

1. AudioWorklet scheduling and quantized record boundaries.
2. Loop phase locking and latency compensation.
3. OPFS persistence for imported tracks and recordings.
4. Rights-reviewed permissive time-stretch module.
5. Better beat/downbeat confidence and transient slicing.
6. Workshop Music-room launcher integration after V1 behavior review.
