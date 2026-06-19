from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

PAID_TTS_MARKERS = [
    "elevenlabs",
    "openai.audio.speech",
    "/v1/audio/speech",
    "tts-1",
    "tts-1-hd",
    "text-to-speech.googleapis.com",
    "azure.cognitiveservices.com/sts",
]


def test_voice_loop_uses_browser_speech_synthesis():
    voice = (ROOT / "app" / "assets" / "voice-loop.js").read_text(encoding="utf-8")

    assert "speechSynthesis" in voice
    assert "SpeechSynthesisUtterance" in voice
    assert "Uses browser speech input and browser speech output" in voice


def test_cloudflare_ai_endpoint_is_text_only_not_tts():
    fn = (ROOT / "functions" / "api" / "ai" / "chat.js").read_text(encoding="utf-8").lower()

    for marker in PAID_TTS_MARKERS:
        assert marker not in fn


def test_no_paid_tts_plan_exists():
    doc = (ROOT / "docs" / "NO_PAID_TTS_PLAN.md").read_text(encoding="utf-8")

    assert "Do not use paid cloud TTS" in doc
    assert "speechSynthesis" in doc
    assert "SpeechSynthesisUtterance" in doc
    assert "Do not silently switch to paid cloud TTS" in doc
