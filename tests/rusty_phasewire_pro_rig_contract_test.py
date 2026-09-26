from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "app" / "pro-rig.html").read_text(encoding="utf-8")
JS = (ROOT / "app" / "assets" / "twis-pro-rig.js").read_text(encoding="utf-8")


def test_rusty_phasewire_surface_is_explicit():
    assert "RUSTY PHASEWIRE" in HTML
    assert "cue → tease → loop → cut → fade → bass swap" in HTML
    assert 'id="liveDecks"' in HTML
    assert 'id="micToggle"' in HTML
    assert 'id="answerLoad"' in HTML
    assert 'id="silenceReturn"' in HTML
    assert 'id="midiEnable"' in HTML


def test_four_independent_deck_contract_exists():
    assert "const deckLetters=['A','B','C','D']" in JS
    assert "new Tone.Player" in JS
    assert "new Tone.EQ3" in JS
    assert "makeDeck(letter,dry,delay)" in JS
    assert "LOAD / RELOAD" in JS
    assert "toggleDeckPlayback" in JS
    assert "toggleLoop" in JS
    assert "takeBass" in JS
    assert "echoThrow" in JS


def test_live_voice_and_answer_paths_are_real_controls():
    assert "new Tone.UserMedia" in JS
    assert "audio.mic.open" in JS
    assert "loadAnswer" in JS
    assert "triggerAnswer" in JS
    assert "answerPlayer" in JS


def test_performance_actions_are_exposed_for_controller_mapping():
    assert "window.TWIS_RUSTY_PHASEWIRE" in JS
    assert "navigator.requestMIDIAccess" in JS
    assert "notes 36–39 play A–D" in JS
    assert "toggleSilenceReturn" in JS


def test_local_audio_boundary_is_preserved():
    assert "URL.createObjectURL(file)" in JS
    assert "fetch(" not in JS
    assert "No cloud audio upload" in HTML
    assert "PFL/headphone routing remains browser/device dependent" in HTML
