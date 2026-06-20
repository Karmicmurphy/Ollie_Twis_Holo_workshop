# Python Fused Song Compiler Research

## Question

Randy noticed that when lyrics, style, effects, layers, and soundscape instructions are written as Python-like code, the result often becomes stronger than a plain lyric block plus a plain style paragraph.

This pass investigates why that works and how it should become part of the Workshop.

## Verdict

The instinct is correct.

The best next layer is not only a web UI prompt builder. It is a Python-shaped song compiler model.

Not because Python itself is magic, but because Python forces structure:

- data objects
- named fields
- reusable presets
- section order
- math controls
- line-level metadata
- deterministic compilation

That makes AI music prompts clearer, less mushy, and less likely to drift.

## Why this works

A normal prompt says:

```text
Make a gritty road song with guitar, house drums, static, and fast gravel rap.
```

A fused compiler prompt says:

```python
SongLine(
    lyric="Dog by the threshold while the bass counts debt.",
    active_gears=["gravel_spoken_rap", "deep_house_drive", "dirty_guitar_synth"],
    rhythm_density=7,
    tension=8,
    delivery="dry close-mic gravel voice, fast and half-growled",
    fx_event="radio static slices after the word debt",
    female_response="Small world, big tab.",
    drop_behavior="half-bar negative space before kick/sub slam",
)
```

That tells the AI what the line means, what instruments are active, what rhythm is doing, what the voice does, what effect happens, and where the female voice enters.

This is exactly the Road-Signal architecture.

## Research grounding

### Python is already strong for symbolic music

The Python music ecosystem already supports symbolic music, MIDI, music analysis, and data-shaped composition.

Useful research / tooling signals:

- music21 provides a Python toolkit/documentation for symbolic music work, including notes, streams, keys, time signatures, lyrics, and advanced corpus/metadata searching.
- pretty_midi provides Python utilities for handling, modifying, analyzing, creating, and synthesizing MIDI data.
- Mido is a Python library for MIDI 1.0 ports, messages, and files.
- miditoolkit is a Python package for MIDI files with tempo changes, key signatures, time signatures, lyrics, markers, instrument data, pitch bend, piano-rolls, and visualization-oriented features.
- Jinja is a Python templating engine where templates receive data and render final documents.

Road-Signal does not need all of these immediately.

But the direction is validated: structure the song as data first, then render/export it.

## The right Workshop interpretation

This is not about generating final audio with Python yet.

The first useful Workshop layer should be:

> Python-shaped prompt compiler.

That means the Workshop stores song ideas as structured objects, then exports:

- full Producer AI prompt
- fused-line prompt
- lyrics-only draft
- style block
- platform-adapted prompt later
- MIDI sketch later

## Proposed object model

### RoadSignalSong

```python
RoadSignalSong(
    title="WHEN THE ROOM COMES BACK",
    tempo_bpm=132,
    key="D minor",
    meter="4/4 deep house drive",
    identity="road_signal",
    mechanism_preset="hard_rock_glitch_house",
    lead_gear=Gear(...),
    support_gear=Gear(...),
    accent_gear=Gear(...),
    female_voice_mode="hostile_ai_auditor",
    drop_behavior="ai_insult_to_door_kick_bass",
    sections=[...],
)
```

### Gear

```python
Gear(
    name="dirty_guitar_synth",
    size=9,
    speed=7,
    timing="slightly ahead",
    texture="dirty electric guitar fused with analog synth growl",
    function="anger and pressure",
    effects=["flanger", "distortion", "delay_throw"],
)
```

### SongSection

```python
SongSection(
    name="chorus",
    energy=9,
    tension=8,
    rhythm_density=7,
    lines=[...],
)
```

### SongLine

```python
SongLine(
    voice="male",
    lyric="Dog by the threshold while the bass counts debt.",
    active_gears=["gravel_spoken_rap", "deep_house_drive", "dirty_guitar_synth"],
    rhythm_density=7,
    tension=8,
    delivery="dry close-mic gravel voice, fast and half-growled",
    fx_event="radio static slices after the word debt",
    female_response="Small world, big tab.",
    female_voice_mode="human_signal_reality",
)
```

## Compiler behavior

The compiler should render from structured song objects into text prompts.

### Export modes

```python
export_modes = [
    "full_producer_ai_prompt",
    "fused_line_prompt",
    "lyrics_only",
    "style_block",
    "negative_prompt",
    "platform_prompt_suno_later",
    "platform_prompt_udio_later",
    "platform_prompt_lyria_later",
]
```

### Core function

```python
def compile_road_signal(song, mode="full_producer_ai_prompt"):
    validate_identity(song)
    validate_gears(song)
    validate_music_math(song)
    validate_fused_lines(song)
    return render_template(song, mode)
```

## Why Python-shaped code beats plain prompt text

### 1. It keeps the layers separated while still fused

Plain writing easily collapses into mush.

Python-shaped objects force:

- identity
- gears
- timing
- effect
- line
- female response
- export mode

### 2. It prevents drift

The compiler can check:

- no coffee
- tempo in range
- gear selected
- rhythm density exists
- not too many bracket commands
- female voice not generic
- drop behavior defined

### 3. It makes evolution safe

Adding a new gear does not require rewriting the whole system.

Add:

```python
GearPreset("vinyl_echo_backroad", ...)
```

Then compile again.

### 4. It creates Workshop artifacts

A song becomes a reusable data artifact, not just a chat response.

## Recommended Workshop build path

### Phase 1: JavaScript version in Cloudflare UI

Since the live Workshop is browser/Cloudflare Pages, first implement the model in JavaScript:

- data objects as JSON
- compiler as JS function
- output as text prompt
- localStorage save
- copy to clipboard

This keeps it phone-friendly and deployable now.

### Phase 2: Python companion later

When local companion returns, build Python scripts for:

- `.road_signal.json` files
- `compile_prompt.py`
- `export_markdown.py`
- optional MIDI sketch generation
- optional WAV/sample experiments later

### Phase 3: MIDI / audio sketch later

Use Python MIDI libraries only after the prompt compiler is stable.

Possible uses:

- create 16-step MIDI sketches
- export rough drum/pattern MIDI
- test polyrhythm math
- map pad patterns to MIDI notes

Do not start with full audio rendering.

## Library map

### Prompt compiler layer

Use:

- Python dataclasses or plain dictionaries
- Jinja templates for rendering prompts
- JSON for saved artifacts

### MIDI sketch layer later

Use one of:

- pretty_midi for easier MIDI creation/manipulation and basic synth output
- Mido for lower-level MIDI message/file control
- miditoolkit for tick-based MIDI/pianoroll work
- music21 if score/music-theory analysis becomes important

### Audio/sound layer later

Use later only if needed:

- pydub for simple audio manipulation / cutting / overlaying
- librosa for analysis, not first-generation songwriting

## New Road-Signal compiler rule

From now on, a strong Road-Signal prompt should be compiled, not merely written.

The minimum compiler packet is:

```python
song_packet = {
    "identity": "road_signal",
    "lyrical_center": "the room comes back",
    "tempo_bpm": 132,
    "key": "D minor",
    "lead_gear": "dirty_guitar_synth",
    "support_gear": "polyrhythm_tribal_house",
    "accent_gear": "negative_space_resample_abuse",
    "female_voice_mode": "hostile_ai_auditor",
    "drop_behavior": "ai_insult_to_door_kick_bass",
    "sections": [...],
}
```

## Debug verdict

This belongs in the Workshop.

But build it carefully:

1. Do not add Python runtime to Cloudflare Pages.
2. Do not make users paste actual Python into the web app yet.
3. Use Python-shaped JSON/objects in the browser first.
4. Add a Python companion/compiler later for local-first power.
5. Keep the product goal: better fused prompts, not full audio generation.

## Next app target

Road-Signal Machine v3 should become:

> Gear Compiler + Fused-Line Compiler

Add buttons:

- Build full prompt
- Build fused-line prompt
- Build Python-shaped packet
- Copy packet

The Python-shaped packet is the important new artifact.
