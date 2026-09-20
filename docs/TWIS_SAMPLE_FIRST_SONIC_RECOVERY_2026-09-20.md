# TWIS Sample-First Sonic Recovery — 2026-09-20

## Locked outcome

The Loop Deck / Pro Rig must behave like a professional workstation, not a demo generator.

**PLAY means transport.** If no loop, pad role, scene, or imported audio was explicitly activated, PLAY is silent.

The application must not invent an arrangement, randomize a beat, resurrect old audio, or start a hidden musical layer merely because transport started.

## Recovery method

This repair follows the canonical Harness / Temporal Foundry chain:

Intent Recovery Compass -> Rabbit-Hole Governor -> Artifact Compass -> Artifact Salvage / Deep-Sea Salvage -> Recombination Forge -> Proof Gate.

The failure was perceptual, not architectural: browser proof showed that audio ran, but the built-in demo material still sounded cheap and automatic. More controls were explicitly rejected as a solution.

## Salvaged mechanisms

### danigb/smplr

- Project license: MIT.
- Useful pattern: sampled instruments share an existing AudioContext, schedule notes against audio-clock time, decode source samples only when required, and route to a supplied destination.
- TWIS does **not** depend on smplr at runtime.
- TWIS implements a small clean-room adapter containing only the needed mechanism for three roles.

### FluidR3_GM / MIDI.js soundfonts

Source: gleitz/midi-js-soundfonts, FluidR3_GM collection.

- FluidR3_GM sample content is published under Creative Commons Attribution 3.0.
- TWIS currently loads three instrument files on demand:
  - synth_bass_1
  - pad_2_warm
  - lead_2_sawtooth
- Only a bounded set of notes needed by the active D-minor performance vocabulary is decoded.
- First tonal-instrument use therefore needs network access. If it cannot load, the layer stays off; TWIS does not substitute a toy oscillator.

Attribution: FluidR3_GM / FluidSynth SoundFont material, CC BY 3.0, distributed through the MIDI.js soundfont project by Benjamin Gleitzman and contributors.

### smpldsnds/drum-machines

The repository describes its drum-machine sample collection as public domain.

TWIS vendors:
- TR-808 closed hat
- TR-808 clap

### Existing TWIS donor assets

Existing vendored 909 kick and crash assets remain from previously documented permissive/CC0 donor sources. Their provenance remains in TWIS_SONIC_SALVAGE_2026-09-19.md.

## Resulting performance architecture

One AudioContext and one transport remain authoritative.

Local drum roles:
- KICK
- HATS
- CLAP
- FX

Sampled tonal roles:
- BASS -> FluidR3 synth_bass_1
- PAD -> FluidR3 pad_2_warm
- MELODY -> FluidR3 lead_2_sawtooth

VOCAL is reserved for user content and does not auto-generate a fake voice.

The sampled tonal engine routes into the existing TWIS master chain. Kick events apply bounded gain ducking to the tonal bus so the low end has space without creating a second transport or engine.

## Controls removed from the simple surface

Removed because they caused the program to act instead of the musician:
- DJ AUTO SET
- automatic scene progression
- FUCK IT randomizer
- fake VOCAL HIT

Scenes remain explicit user actions. BUILD, DROP, ECHO, and WASH remain explicit performance actions.

## Mobile / desktop constraint

Professional mobile DAWs compensate for device behavior instead of pretending all devices have identical audio paths. BandLab, for example, exposes Android latency calibration and an Audio Safe Mode, and recommends avoiding Bluetooth for latency-sensitive recording.

TWIS keeps its existing calibration path and one AudioContext. This repair changes source quality and control semantics; it does not claim browser audio can magically equal a native low-latency engine on every phone.

## Proof contract

Automated proof must establish:
1. PLAY alone is silent.
2. No layer, scene, or loop self-starts.
3. KICK is audible only after explicit activation.
4. BASS/PAD/MELODY load sampled instruments before activation.
5. No oscillator fallback is used for performance tonal roles.
6. No DJ AUTO / randomizer control exists on the simple surface.
7. STOP silences active voices.
8. CLEAR EVERYTHING still destroys stale session state.
9. Advanced loop controls remain usable.
10. Local drums still work from a warm offline cache.

Automated proof cannot certify taste. Final sonic acceptance on Randy's actual phone/headphones remains a human proof gate.
