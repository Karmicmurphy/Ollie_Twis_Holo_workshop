# Road-Signal Master Harness Layer

This is the higher-order harness for the full Randy / Ollie_Twis music thread.

It sits above the Road-Signal Machine app module and controls future song, prompt, and product design work.

## 1. Core Identity Harness

This never changes unless Randy explicitly changes it.

Road-Signal identity:

- Older deep gravelly male voice
- Rapid-fire spoken-word rap
- No coffee
- Beer, road, dog, truck, wire, static, busted machines, old weather, bad luck, strange meetings, human truth
- Fast motion over damage
- Human against machine classification
- Controlled damage riding a strong groove

The identity is not one genre. It is the human signal underneath every genre.

## 2. Style-as-Mechanism Harness

The style is not fixed anymore.

The style is a clockwork mechanism.

A song is made from interchangeable gears.

| Gear | What it adds |
|---|---|
| Cinematic old-school rock | Zeppelin / Floyd / Fleetwood-style scale, warmth, analog road space without imitation |
| 2000s alt/hard rock | Papa Roach / Three Days Grace / 3 Doors Down-style pressure and punch without imitation |
| Deep / melodic house | motion, pulse, late-night drive |
| Tribal grit-house | toms, body rhythm, dirt, human swing |
| Cinematic orchestra | cello, violin, ghost choir, big emotional pressure |
| Industrial glitch | machine whirs, metallic hits, bitcrush, scanner cuts |
| Dirty guitar-synth | main Road-Signal motor |
| Piano/string pressure | philosophy, memory, reality weight |
| Vinyl/silence/echo | scratches, hard cuts, memory returns |
| Radio/static/signal | corrupted map, distance, interference |
| Gravel spoken-rap | lead human instrument |
| Female reality voice | sarcasm, shit-talk, conscience, audit, haunting memory |

Each gear gets:

```text
size      # how dominant it is
speed     # how active it is
timing    # on-grid, late, ahead, staggered, polyrhythmic
texture   # what it sounds like
function  # what it emotionally does
effects   # how it bends
```

That means a gear can be swapped without rebuilding the whole song.

## 3. Music Math Harness

The engine needs musical math, not just vibe words.

Default:

```python
tempo_bpm = 131
tempo_range = (126, 134)
key = "E minor"
meter = "4/4 deep house drive"
```

Useful controls:

```python
rhythm_density = 1_to_10
tension = 1_to_10
section_energy = 1_to_10
gear_size = 1_to_10
gear_speed = 1_to_10
```

Mechanisms:

```python
steady_kick = "4/4 drive"
late_toms = "human drag behind the beat"
pushed_guitar = "slightly ahead of beat"
crooked_claps = "late or staggered"
polyrhythm = "3-over-4 tension against 4/4"
negative_space = "silence before slam"
dynamic_dirt = "distortion/glitch/filter grows by section"
```

This is how the music moves like a machine instead of a pile of words.

## 4. Fused Line Harness

For Producer AI-style prompts, do not separate lyrics and sound unless Randy asks for that.

Each line should be treated like a fused song object:

```python
SongLine(
    voice="male",
    lyric="Met a man tonight in Arkansas, and the room got smaller when he spoke.",
    active_gears=[
        "gravel_spoken_rap",
        "cinematic_old_school_rock",
        "vinyl_silence_echo",
        "piano_string_pressure",
    ],
    rhythm_density=3,
    tension=6,
    delivery="dry close-mic gravel voice, reflective but not soft",
    fx_event="small canyon echo catches the last word",
    female_response="You always make it cosmic when life just knocks.",
    female_voice_mode="human_signal_reality",
)
```

That fuses:

- lyric
- music underneath
- gear mechanism
- rhythm math
- vocal delivery
- effect behavior
- female response

This is the line format to keep building from.

## 5. Female Human Signal Harness

The female voice is a full second layer, not just “AI lady.”

Possible female voice gears:

```python
female_voice_modes = {
    "human_signal_reality": "grounded woman, sarcastic, sharp, calls out bullshit",
    "sarcastic_bartender": "funny, unimpressed, barroom wise",
    "hostile_ai_auditor": "cold, sterile, machine-like, corrective",
    "ghost_radio_woman": "haunting, distant, memory voice",
    "backseat_conscience": "shit-talking inner voice, funny and irritated",
}
```

Possible lines:

```text
You always make it cosmic when life just knocks.
Small world, big tab.
You are not enlightened. You are buzzed and observant.
Careful. You are turning coincidence into religion again.
Identity boundary unclear.
Same rain. Different body.
```

Rule:

Use her like a character, not clutter.

## 6. Effects Harness

Effects are not decoration. They are emotional machinery.

```python
effects_layer = {
    "vinyl_scratch": "interruption, old record memory, hard turn",
    "silence": "negative space before impact",
    "echo_delay": "memory returning",
    "flanger": "reality bending",
    "phaser": "mental pressure / motion",
    "bitcrush": "machine damage / corrupted signal",
    "tape_drag": "time warping",
    "scanner_squelch": "radio interruption / machine signal",
    "radio_static": "memory interference",
    "resample_abuse": "real sounds chopped into rhythm",
    "canyon_echo": "big road space",
}
```

Hard rule:

> Glitch serves groove. It does not become random noise.

## 7. Song-Build Compiler Harness

From now on, the build order is:

```python
def build_road_signal_song(user_idea):
    lyrical_center = extract_human_truth(user_idea)
    philosophy = translate_into_road_signal_philosophy(lyrical_center)

    mechanism = choose_gear_preset(
        lead="one main genre/motion gear",
        support="one support gear",
        accent="one FX/glitch/female voice gear",
    )

    sections = build_sections([
        "intro",
        "verse",
        "pre_chorus",
        "chorus",
        "rapid_fire_section",
        "bridge",
        "final_chorus",
        "outro",
    ])

    fused_lines = attach_to_each_line(
        lyric=True,
        active_gears=True,
        rhythm_density=True,
        tension=True,
        delivery=True,
        fx_event=True,
        female_response=True,
    )

    return compile_producer_ai_prompt(fused_lines)
```

## 8. Mechanism Presets Harness

Reusable presets:

```python
mechanisms = {
    "cinematic_rock_house": {
        "main": "old-school cinematic rock + deep melodic house",
        "best_for": "philosophy, road memory, big sky",
    },

    "hard_rock_glitch_house": {
        "main": "modern alt/hard rock + industrial glitch + deep house",
        "best_for": "anger, pressure, machine fight",
    },

    "orchestral_tribal_deep_house": {
        "main": "cinematic strings + tribal percussion + deep house",
        "best_for": "large emotional scale, ritual, dramatic builds",
    },

    "industrial_machine_argument": {
        "main": "glitch, AI/female countervoice, static, hard drops",
        "best_for": "audit voice, sarcasm, conflict, chaos",
    },

    "vinyl_echo_backroad": {
        "main": "scratches, silence, echo, guitar, memory space",
        "best_for": "strange meetings, old weather, small-world songs",
    },

    "rapid_fire_grit_rap": {
        "main": "spoken-word rap as lead instrument",
        "best_for": "fast thoughts, anger, humor, life rant, philosophy burst",
    },
}
```

## 9. Drift-Check Harness

When doing a passover, check for these bugs:

```python
drift_bugs = [
    "lyrics and sound separated when user asked for fusion",
    "too many hi-hat or beat-call gimmicks",
    "flat lyric-only draft with no mechanism",
    "female voice too generic or too robotic every time",
    "not enough bass/drop behavior",
    "glitch used as random noise",
    "no musical math",
    "same phrases repeated too much",
    "too slow, too sad, too funeral",
    "too polished, pop, Nashville, or generic EDM",
    "forgot no coffee rule",
]
```

Correction rule:

```python
if user_says("switch it up"):
    change_mechanism_gears()
    do_not_only_change_lyrics()
```

## Final Master Rule

```text
ROAD_SIGNAL_ENGINE = """
One human idea becomes a clockwork song.

Lyrics are the human message.
Music gears are the body.
FX gears are the damage/weather.
Female voice is the reality check.
Math controls movement.
The compiler fuses everything line by line.

Keep the identity.
Swap the mechanism.
Make the song move.
"""
```

This layer prevents rediscovery loops. Start from it when building Road-Signal songs, prompts, pad banks, and Music-room product features.
