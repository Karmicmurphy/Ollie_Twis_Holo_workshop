# TWIS PRO RIG — ARTIFACT COMPASS + SALVAGE FOR PROFESSIONAL SOUND

Date: 2026-09-18
Purpose: find mechanisms that close the gap between "working browser controls" and "professional live electronic performance".

## First principle

The current failure is not lack of features. It is that musical content, arrangement and mix quality were treated as consequences of UI/engine mechanisms.

The next engine must be built around:
1. source quality;
2. phrase/arrangement logic;
3. mix translation;
4. live-control mapping;
5. Android-safe execution.

## Professional workflow evidence

### Cassian
Public interviews describe Ableton as the heart of the live setup, with sample-trigger pads, reverb/delay performance control, hardware synths, and track triggering. He also emphasizes tightly controlled kick/sub translation and simple low-end decisions.

Mechanisms to salvage:
- complete musical parts before exposing performance controls;
- sample-trigger roles;
- dedicated send FX;
- deliberate kick/sub targets;
- minimal but high-character sound sources.

### Agents of Time
Current Tomorrowland Academy material describes building melodic house in Ableton, hardware instruments, live melody recording, mixing/mastering, then converting the material into a stage setup with DJM-V10, pads, FX and synths.

Mechanisms to salvage:
- studio-quality source material first;
- stage layer = performance representation of produced stems;
- scenes/macros operate on already musical content;
- live rig should not be responsible for inventing all musical quality from zero.

### Hozho
Published interviews list FL Studio plus Omnisphere, Trilian, Serum, Sylenth1 and extensive mixing/effect tools. His path began as a producer before DJ performance.

Mechanisms to salvage:
- strong curated sound palette matters more than number of controls;
- bass, pads, aggressive leads and spatial effects use different synthesis/sample strategies;
- identity comes from patch/source design plus arrangement, not generic oscillator presets.

## Artifact Compass ranking

### A. Tone.js
State: mature open-source Web Audio framework.
License: MIT.
Useful atoms:
- sample-accurate transport;
- Player/Sampler;
- synth/effect graph;
- scheduling;
- mobile Web Audio support.

Verdict: KEEP as orchestration/runtime layer.

Reason it is insufficient alone:
Tone.js is infrastructure. Its default/basic synths do not create professional sound automatically.

### B. Signalsmith Stretch
State: active.
License: MIT.
Useful atoms:
- pitch-preserving time stretch;
- tempo-fitting imported loops/stems;
- key/tempo adaptation without cheap repitch artifacts.

Verdict: KEEP / vendor after Android benchmark.

### C. Faust / FaustWasm
State: active audio-DSP ecosystem.
License: compiler/runtime licensing must be handled carefully per bundled DSP.
Useful atoms:
- efficient WebAssembly DSP;
- better custom compressors, filters, saturation, reverbs and modulation than hand-building everything in simple JS;
- AudioWorklet integration.

Verdict: SALVAGE SELECTED DSP ONLY after rights review. Do not import a giant modular framework.

### D. FaustMod
State: 2026 browser modular DSP project.
License: GPLv3+ for application; mixed third-party DSP licensing.
Useful atoms:
- precompiled DSP catalog;
- granular sampler;
- lazy AudioContext initialization;
- AudioWorklet/WASM graph architecture;
- audio-health instrumentation.

Verdict: SALVAGE ARCHITECTURAL PATTERNS, not code into permissive core unless license decision changes.

### E. Modal-16
State: open browser sequencer/synth.
License: MIT.
Useful atoms:
- key/scale-aware melody/chord/bass generation;
- pattern density;
- harmonic drift;
- track-specific FX;
- snapshots/chain arrangements;
- musical randomness rather than raw random notes.

Verdict: HIGH-VALUE SALVAGE. Reimplement the useful musical logic cleanly inside TWIS.

### F. CC0 sample packs
Known current sources include CC0 drum kits such as Boochi44/free-drum-samples and the Libre Sample Pack.

Useful atoms:
- real sampled kick/clap/hat/percussion instead of primitive browser synth drums;
- no attribution burden for CC0 sources;
- local vendoring makes performance deterministic/offline.

Verdict: KEEP, but curate specifically for melodic house/techno rather than using arbitrary trap/808 material.

### G. User audio / imported loops
TWIS already has local import, slicing, looping, OPFS and optional stretch mechanisms.

Useful atoms:
- user can bring any legally owned loop, texture, vocal or track;
- strongest path to personal identity;
- existing loop infrastructure already solves much of persistence/launch.

Verdict: CORE.

## Key design decision

Do not synthesize every musical role in real time.

Use a hybrid source model:

- KICK/PERC: curated local samples.
- BASS: carefully designed synth patch + optional sampled attack/transient.
- CHORDS/PADS: multisample or richer wavetable/FM/subtractive patch with 4/8-bar voicing logic.
- MELODY: phrase generator driving a higher-quality synth/sampler.
- ATMOS: field/noise/sample layers with slow modulation.
- VOCAL: real human CC0/user-provided vocal fragments; never fake-vocal oscillator as default.
- FX: rendered/local risers, impacts, reverse tails plus live delay/reverb/filter throws.
- USER LOOPS: imported material, quantized and stretchable.

## Arrangement engine

Musical state must operate above individual notes.

Required structures:
- 4-bar phrase;
- 8-bar variation;
- 16/32-bar scene arc;
- fill probability only near phrase boundaries;
- melody rests;
- bass variations tied to chord/scene;
- transition preparation before scene change;
- quantized scene change.

Scene semantics:
- INTRO = atmosphere/harmony, restrained transient energy.
- DEEP = stable groove and bass.
- LIFT = new melody/percussion/brightness.
- BREAK = remove kick/sub, feature vocal/pad/motif.
- BUILD = tension automation over 4/8 bars.
- PEAK/DROP = controlled full-spectrum return.
- OUTRO = subtractive release.

## Mix engine

Minimum professional chain:
- per-role gain trim;
- high-pass where appropriate;
- kick-triggered sidechain ducking;
- bass/sub mono control;
- send reverb;
- tempo-synced delay;
- saturation/soft clipping before final limiter;
- master compressor/limiter with conservative gain;
- scene-aware gain compensation.

Do not use one global filter/reverb as the entire "professional FX" story.

## Phone performance rule

The phone UI exposes only musical decisions:
- layer on/off;
- scene;
- energy;
- space;
- filter/tension;
- build/drop/echo/wash;
- ghost/catch;
- import/save.

It must not expose the underlying dozens of DSP parameters by default.

## Immediate build order after this research

1. Curate and vendor a small rights-clean sound pack.
2. Build phrase/scene engine against SONIC_ACCEPTANCE.md.
3. Replace fake vocal synthesis with real vocal sample/user-vocal path.
4. Add mix bus architecture and loudness guard.
5. Add transition engine tied to bar boundaries.
6. Blind-render 30 seconds and judge sonic contract.
7. Only then reconnect full phone performance surface.
8. Prove on Android.

## Stop condition

Do not add more UI until a 30-second audio render from the engine alone passes the sonic acceptance contract.
