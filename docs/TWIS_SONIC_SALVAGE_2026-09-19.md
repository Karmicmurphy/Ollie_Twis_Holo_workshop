# TWIS Sonic Salvage — 2026-09-19

## Problem

The unified Loop Deck / Pro Rig passed functional browser proof but failed the human sonic gate. The first PLAY impression sounded like one cheap repeated source; the kick lacked convincing weight, bass/harmonic roles were too one-shot-like, and the default hat pattern read like a background metronome.

## Donor evidence used

### maximecb/groovie
- License: MIT code.
- README states bundled samples are CC0.
- Salvaged mechanisms: sample-manager separation, lazy AudioContext/decode-after-gesture pattern, sample-first drum philosophy, sparse/velocity-shaped groove behavior.
- Salvaged assets used at runtime: `hat_closed_03.wav`, `perc_02.wav`, `crash_01.wav`.
- No Groovie source code copied.

### averagenative/0x808
- License: MIT.
- README states 72 bundled drum samples are CC0.
- Salvaged mechanisms: role-based kits, four-on-floor house/techno probability profiles, velocity variation, independent engine/controller architecture.
- Salvaged asset used at runtime: `samples/909/kick.wav`.
- No C engine code copied.

### Existing TWIS salvage
- Keep the shared Loop Core, AudioContext-backed transport, Loop Deck recorder/import/OPFS, Pro Rig performance surface, current browser proof and STOP gate.
- Replace only the failing sonic layer.

## Repairs

1. Default DEEP scene no longer enables the hat layer on PLAY.
2. Hat/percussion patterns are sparse and velocity-shaped rather than constant off-beat ticks.
3. Performance pack uses a CC0 909 kick and CC0 Groovie hat/percussion/crash samples.
4. Bass, pad and melody stay on the TWIS phrase/pitch engine rather than being collapsed into one sample.
5. Remote sample failure still falls back to local generated sources.

## Acceptance

PLAY must begin as musical foundation (kick + bass + harmonic bed), not a click track. Hats/percussion enter only when a scene or role explicitly calls for them. Functional proof is automated; final sonic preference remains human.
