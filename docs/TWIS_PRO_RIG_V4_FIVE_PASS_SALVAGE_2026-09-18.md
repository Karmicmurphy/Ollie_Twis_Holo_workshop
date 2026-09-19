# TWIS PRO RIG V4 — Five-Pass Compass / Salvage Record

Date: 2026-09-18

## Pass 1 — Professional workflow
Finding: professional live electronic rigs perform prepared musical material; performance controls reshape stems/scenes/FX rather than asking raw oscillators to create production quality on stage.
Decision: build musical source/phrase quality before UI growth.

## Pass 2 — Open-source DSP
- Tone.js: keep for scheduling/routing and browser musical abstractions.
- Signalsmith Stretch: keep optional for future user-loop pitch/time adaptation.
- Faust/FaustWasm: salvage DSP architecture selectively later; avoid framework bloat now.
Decision: no new heavy DSP dependency in V4.

## Pass 3 — Rights-clean source material
- Boochi44/free-drum-samples: CC0 one-shots; use selected kick/clap/hat/open-hat/FX.
- n33kos/kokoro-voices samples: CC0 synthetic voice previews; use one dark voice preview as optional texture.
Decision: network-loaded samples with deterministic local synthesis fallback.

## Pass 4 — Phone + PC runtime
- AudioContext created/resumed only from user gesture.
- one browser app, responsive layout, pointer-friendly controls.
- sample load failure cannot break the engine.
- no device-specific fork.
Decision: same URL and engine for Android Chrome and desktop Chromium/Firefox-class browsers.

## Pass 5 — Internal salvage
Keep from prior TWIS Loop Deck:
- AudioContext as timing authority.
- bar/phrase quantization.
- local import/loop deck available as advanced surface.
- OPFS/AudioWorklet loop machinery remains separate and reusable.
- no fake controls.
Decision: V4 Pro Rig links directly to the proven Loop Deck for import/record/advanced looping instead of duplicating that subsystem.

## V4 rebuild
- real CC0 drum one-shots where available;
- real CC0 voice sample where available;
- fallback synthesis if any asset fails;
- sub + character bass layers;
- 4-bar chord voicing;
- phrase-based melody with rests;
- bar-quantized scenes;
- 4-bar build;
- impact/drop;
- delay/reverb throws;
- sidechain-style ducking;
- master compression/saturation/limiting;
- same interface on phone and PC.

## Proof boundary
Automated tests can prove syntax, wiring, fallback presence and build integrity.
Target-device listening must still prove sonic quality and runtime behavior.
