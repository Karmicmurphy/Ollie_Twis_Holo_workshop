from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def test_friday_browser_voice_is_explicit_and_free_first():
    source = (ROOT / "app" / "assets" / "voice-loop.js").read_text(encoding="utf-8")
    assert "FEMALE_VOICE_NAMES" in source
    assert "function fridayVoice()" in source
    assert "speechSynthesis.getVoices()" in source
    assert "u.voice = selectedVoice" in source
    assert '"Jenny"' in source and '"Samantha"' in source
    assert "fetch(" not in source
    assert "speechSynthesis.speak(u)" in source
    assert "Talk to FRIDAY" in source
