# Road-Signal Workshop Salvage Pass

## Mission

Debug, salvage, and structure the Road-Signal idea as a real Workshop build.

This is not only a music style. It is a Workshop subsystem.

The subsystem is:

> Road-Signal Engine: a clockwork song builder where one human idea becomes identity, gears, musical math, fused lines, effects, female response, and exportable prompt artifacts.

## Current repo artifacts recovered

### Harness documents

- `docs/ROAD_SIGNAL_MACHINE_HARNESS.md`
- `docs/ROAD_SIGNAL_SYSTEM_DEBUG_V2.md`
- `docs/ROAD_SIGNAL_MASTER_HARNESS_LAYER.md`
- `docs/ROAD_SIGNAL_PROOF_WHEN_THE_ROOM_COMES_BACK.md`
- `docs/ROAD_SIGNAL_MACHINE_V0_2_REPORT.md`

### Active Workshop module

- `app/assets/road-signal-machine.js`

Current active UI status:

- Road-Signal Machine v2.1
- Music room module
- Lead/support/accent engine controls
- AI behavior control
- Drop behavior control
- pad banks grouped by function
- proof loader for `When the Room Comes Back`
- prompt export
- phone-friendly layout
- local browser save

## Salvage verdict

The core idea is valid and strong.

The danger is not weakness. The danger is sprawl.

Road-Signal can easily become:

- too many pads
- too many prompt knobs
- too much lyric text
- too much fake DAW ambition
- too much AI-provider dependency
- too many disconnected documents

The correct shape is smaller and sharper:

> A gear-based song compiler inside the Music room.

Not a full DAW.
Not a random drum pad toy.
Not another generic AI prompt box.

## Stable architecture

Road-Signal has four layers:

1. Core Identity
2. Swappable Music Gears
3. Fused Line Compiler
4. Workshop Product Layer

### 1. Core Identity

Identity never changes unless Randy explicitly changes it.

- older deep gravelly male voice
- rapid-fire spoken-word rap
- no coffee
- beer / road / dog / truck / wire / static / busted machines
- fast motion over damage
- human against machine classification
- controlled damage riding a strong groove

### 2. Swappable Music Gears

Style is not fixed. Style is a mechanism.

A song is built from gears with:

- size
- speed
- timing
- texture
- function
- effects

Current gear families:

- cinematic old-school rock
- 2000s alt/hard rock
- deep / melodic house
- tribal grit-house
- cinematic orchestra
- industrial glitch
- dirty guitar-synth
- piano/string pressure
- vinyl/silence/echo
- radio/static/signal
- gravel spoken-rap
- female reality voice

### 3. Fused Line Compiler

A good Road-Signal line should carry:

- voice
- lyric
- active gears
- rhythm density
- tension
- delivery
- FX event
- female response
- female voice mode

This is the most important future product behavior.

### 4. Workshop Product Layer

The product must live in the Music room as:

- Road-Signal Machine
- Gear-based prompt builder
- Fused-line compiler
- Proof-template loader
- Prompt export
- Local save

## Debug findings

### Finding 1: v2.1 fixed the first major bug

Old bug:

> It drifted toward lyrics when the missing layer was the instrumental engine.

Fixed by:

- lead engine selector
- support engine selector
- accent engine selector
- AI behavior selector
- drop behavior selector

### Finding 2: master harness reveals next major missing piece

New missing layer:

> gear size / speed / timing / tension / rhythm-density controls.

The app currently chooses engines, but does not yet let Randy shape how dominant, active, tense, or rhythmically dense each gear is.

### Finding 3: the prompt output is still block-level, not fused-line-level

Current prompt builder outputs structured sections.

Next needed behavior:

- generate fused song lines
- each line carries gear metadata
- each line can include female response and FX event

### Finding 4: female voice needs mode switching

v2.1 has AI behavior modes.

Next layer should include broader female voice modes:

- human signal reality
- sarcastic bartender
- hostile AI auditor
- ghost radio woman
- backseat conscience

### Finding 5: the system needs artifact output

Road-Signal prompts should not only be copied.

They should become Workshop artifacts:

- prompt artifact
- lyric artifact
- gear preset artifact
- proof song artifact
- fused-line artifact

## Artifact Compass map

### Permanent artifacts

These should be treated as long-lived Road-Signal artifacts:

- master harness
- debug harness
- proof song prompt
- gear presets
- pad banks
- fused line format
- generated prompt exports

### Working artifacts

These may evolve:

- active Road-Signal Machine JavaScript
- pad labels
- gear presets
- proof templates
- phrase pools
- AI/female voice modes

### Do not preserve as permanent truth

- one-off prompt experiments
- failed style attempts
- generic AI music advice
- copied platform-specific metatag guesses unless proven useful

## Build target: Road-Signal Machine v3

### Goal

Make the Music room behave like a gear-based song compiler.

### Required controls

1. Lyrical center
2. Mechanism preset
3. Lead gear
4. Support gear
5. Accent gear
6. Female voice mode
7. Tempo
8. Key
9. Rhythm density
10. Tension
11. Section energy
12. Gear size
13. Gear speed
14. Timing feel
15. FX behavior
16. Drop behavior

### Required output modes

- Short style prompt
- Full Producer AI prompt
- Fused-line prompt
- Lyrics-only draft
- Platform-adapted prompt later

### Required proof templates

- When the Room Comes Back
- Beer Before the Sun Kit
- Small World / strange meeting template later
- Machine Argument template later
- Road Memory template later

## v3 implementation plan

### Step 1: Add gear presets to the module

Add preset choices:

- cinematic_rock_house
- hard_rock_glitch_house
- orchestral_tribal_deep_house
- industrial_machine_argument
- vinyl_echo_backroad
- rapid_fire_grit_rap

### Step 2: Add music math controls

Add sliders or number inputs:

- rhythm density: 1-10
- tension: 1-10
- section energy: 1-10
- lead gear size: 1-10
- lead gear speed: 1-10

Keep it simple. Do not add a huge control panel yet.

### Step 3: Add female voice mode selector

Add:

- human_signal_reality
- sarcastic_bartender
- hostile_ai_auditor
- ghost_radio_woman
- backseat_conscience

### Step 4: Add fused-line output

Add a button:

`Build fused-line prompt`

It should output 6-10 fused lines in a producer-friendly format.

### Step 5: Keep copy/export first

Do not build account storage, database, cloud storage, or model hosting yet.

Use localStorage and clipboard export.

## Hard boundaries

Do not turn this into a full DAW yet.

Do not add paid music APIs.

Do not add AI music generation as a core feature.

Do not depend on Suno, Udio, Lyria, or any single platform.

Do not put private vault/source/canon into Cloudflare.

Do not let Road-Signal eat the whole Workshop. It belongs in Music.

## Success test

Road-Signal v3 succeeds if Randy can:

1. Pick a human idea.
2. Pick a mechanism preset.
3. Adjust gear size, speed, timing, rhythm density, and tension.
4. Pick a female voice mode.
5. Generate a fused Producer AI prompt.
6. Copy it.
7. Keep the identity intact while swapping the mechanism.

## Final salvage verdict

Build v3 next.

The next necessary jump is not more pads.

The next jump is:

> gear controls + music math + fused-line compiler.

That is the real Workshop-quality version of Road-Signal Machine.
