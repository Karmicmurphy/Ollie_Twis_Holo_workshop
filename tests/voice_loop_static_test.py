from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_voice_loop_is_wired_into_static_app():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    voice = (ROOT / "app" / "assets" / "voice-loop.js").read_text(encoding="utf-8")

    assert "assets/voice-loop.js" in index
    for control in ("fridayPushTalk", "fridayLiveVoice", "fridayStopVoice", "fridayTestVoice"):
        assert f'id="{control}"' in index
        assert f'$("{control}")?.addEventListener("click",' in voice
    assert "SpeechSynthesisUtterance" in voice
    assert "SpeechRecognition" in voice
    assert "window.workshopVoiceReply(text, controller.signal)" in voice
    assert 'new Event("submit"' not in voice
    assert "MutationObserver" not in voice


def test_cloudflare_pages_allows_microphone_for_voice_mode():
    build = (ROOT / "cloudflare" / "pages" / "build.mjs").read_text(encoding="utf-8")
    assert "Permissions-Policy: microphone=(self), camera=(), geolocation=()" in build
    assert "microphone=()" not in build
