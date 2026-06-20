# Road-Signal Machine v0.2 Report

## Purpose

Make the Music room evolutionary instead of static.

v0.1 proved the first pad/prompt machine idea.
v0.2 adds the Road-Signal Evolution Skills layer directly into the UI.

## Changed file

- `app/assets/road-signal-machine.js`

## Commit

- `ec875b8b3827249fb88ce44509c66260bbe0467d`

## What v0.2 adds

### Engine selector

The Music room now supports:

- Lead engine
- Support engine
- Accent engine
- BPM
- Key
- Core object
- Swing

Default values:

- Lead: Guitar-Synth Motor
- Support: Off-Time Tribal Engine
- Accent: Radio-Rhythm Engine
- BPM: 130
- Key: D minor

### Evolution mechanisms

Available engine choices include:

- Guitar-Synth Motor
- Off-Time Tribal Engine
- Polyrhythm / Off-Time Tribal
- Radio-Rhythm Engine
- Stutter-Grid Engine
- Gravel-Grain Engine
- Banjo-Wire Tension Engine
- FX-Mutation Engine
- Resample-Abuse Engine
- Negative-Space Drop
- Instrument Handoff Engine
- Dynamic Dirt Automation
- Velocity-Ghost Engine

### Pad banks

Pads are now grouped by meaning:

- Drum / Timing
- Glitch
- Guitar / Synth
- Backroad
- AI / Voice

This aligns with the harness rule that pads should represent sound mechanisms, not only lyric objects.

### Proof loader

Added button:

`Load proof: Room Comes Back`

This loads:

- BPM: 132
- Key: D minor
- Core object: the room after the party, when reality comes back
- Lead: Guitar-Synth Motor
- Support: Polyrhythm / Off-Time Tribal
- Accent: Negative-Space Drop
- Proof pad set based on `WHEN THE ROOM COMES BACK`

### Prompt builder

The generated prompt now separates:

1. Identity
2. Core object
3. Tempo/key
4. Lead instrumental engine
5. Support engine
6. Accent engine
7. Pad language
8. Production tags
9. Section behavior
10. Vocal behavior
11. Lyric block
12. Avoid list

## Passover finding

v0.1 had:

- 16 pads
- 8 tracks
- 16-step sequencer
- prompt export
- phone-friendly layout

But v0.1 did not yet expose the evolutionary mechanism selection. It could still drift toward pad-object prompting instead of lead/support/accent engine design.

v0.2 fixes that.

## Manual test after Cloudflare deploy

Open:

`https://ollie-twis-holo-workshop.pages.dev/`

Go to:

`Music`

Confirm:

- Road-Signal Machine v0.2 appears.
- Lead/support/accent engine selectors are visible.
- Pad banks are grouped by Drum/Timing, Glitch, Guitar/Synth, Backroad, AI/Voice.
- `Load proof: Room Comes Back` fills the proof setup.
- `Build full prompt` outputs a layered Road-Signal prompt.
- `Copy prompt` copies the output.
- Pads make simple Web Audio sound after a tap.
- Layout works on phone.

## Next likely v0.3

- Track timing-offset controls per sequencer lane.
- Humanize / probability per track.
- Negative-space drop sequencer button.
- Export prompt presets for Suno, Udio, Lyria/Flow.
- Save Road-Signal prompt as Workshop artifact.
