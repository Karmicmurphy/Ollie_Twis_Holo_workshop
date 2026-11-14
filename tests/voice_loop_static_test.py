from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_voice_loop_is_wired_into_static_app():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    voice = (ROOT / "app" / "assets" / "voice-loop.js").read_text(encoding="utf-8")

    assert "assets/voice-loop.js" in index
    assert "Talk to FRIDAY" in voice
    assert "SpeechSynthesisUtterance" in voice
    assert "SpeechRecognition" in voice
    assert "#chatForm" in voice
    assert "#messages" in voice


def test_cloudflare_pages_allows_microphone_for_voice_mode():
    build = (ROOT / "cloudflare" / "pages" / "build.mjs").read_text(encoding="utf-8")
    assert "Permissions-Policy: microphone=(self), camera=(), geolocation=()" in build
    assert "microphone=()" not in build


def test_mobile_friday_buttons_are_visible_and_accessible():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    voice = (ROOT / "app" / "assets" / "voice-loop.js").read_text(encoding="utf-8")
    style = (ROOT / "app" / "assets" / "style.css").read_text(encoding="utf-8")
    assert 'id="fridayHomeTalk"' in index
    assert 'id="fridayTalkToggle"' in index
    assert 'id="fridayReadReply"' in index
    assert 'role="status" aria-live="polite"' in index
    assert 'addEventListener("click", toggle)' in voice
    assert 'addEventListener("click", readLastReply)' in voice
    assert '.friday-voice-button' in style
