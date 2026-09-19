# Loop Deck / Pro Rig Architecture Context

## Authority

- Repository: `Karmicmurphy/Ollie_Twis_Holo_workshop`
- Governing branch: `main`
- Reviewed baseline: `b05809fbaa4db475ab5854041ef6e82361be25bd`
- Harness reference: `Karmicmurphy/Harness-card`
- Product: phone-first local-first looping and live-performance workstation.

## Current system

The repository contains two overlapping music runtimes. `twis-loop-deck-v2.js` owns native Web Audio looping, scheduling, recording, import analysis, OPFS persistence, scenes, MIDI and UI-facing mutable state. `twis-pro-rig-v4.js` independently owns a Tone.js graph and Tone.Transport for the performance surface. Pro Rig navigates to Loop Deck for advanced looping instead of sharing one engine.

Proven mechanisms worth retaining include the AudioContext look-ahead scheduler, AudioWorklet recorder, Ghost ring worklet, OPFS audio persistence, imported-audio analysis/slicing logic, Simple Perform UI, Pro Rig scenes/macros, service-worker shell, optional Signalsmith stretch adapter, and existing browser proof harnesses.

## Architectural forces

1. Real-time audio must remain isolated from UI, storage, network and analysis work.
2. One timing authority must own BPM, beat, bar, quantization, recording boundaries and launches.
3. Loop lifecycle must be explicit rather than inferred from independent booleans.
4. Project state must survive reload, interrupted writes and recoverable corruption.
5. Android-class CPU/RAM/storage are governing constraints.
6. Loop Deck and Pro Rig must become two surfaces over one core rather than two engines.
7. Optional instruments, effects, MIDI, controllers, stem tools and AI audio must attach through interfaces without rewriting the core.

## Static-review evidence

Relevant files inspected include `app/loop-deck.html`, `app/pro-rig.html`, `app/assets/twis-loop-deck-v2.js`, `app/assets/twis-loop-deck-modules.js`, `app/assets/loop-recorder-worklet.js`, `app/assets/ghost-ring-worklet.js`, `app/assets/twis-pro-rig-v4.js`, service-worker/manifest files, salvage metadata and browser proof tests.

This architecture review was static and read-only. Dynamic imports, runtime reflection, omitted files and physical-device behavior were not deterministically verified by the architect role.

## Approved target

Evolve the existing application into one modular browser workstation:

`UI surfaces -> Loop Core -> explicit ports -> Audio/Persistence/Platform adapters`

The single deployment remains a browser/PWA application. Existing working mechanisms are migrated behind boundaries incrementally; there is no wholesale rewrite.
