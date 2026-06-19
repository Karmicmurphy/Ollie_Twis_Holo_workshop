from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_local_brain_helper_is_wired():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    helper = (ROOT / "app" / "assets" / "local-brain-setup.js").read_text(encoding="utf-8")

    assert "assets/local-brain-setup.js" in index
    assert "Use local Ollama-style brain" in helper
    assert "Probe local brain" in helper
    assert "http://127.0.0.1:11434/v1/chat/completions" in helper
    assert "Reply with OK." in helper


def test_local_brain_probe_is_localhost_only():
    helper = (ROOT / "app" / "assets" / "local-brain-setup.js").read_text(encoding="utf-8")

    assert "Probe blocked: localhost only." in helper
    assert "127.0.0.1" in helper
    assert "localhost" in helper


def test_api_key_safety_helper_is_wired():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    safety = (ROOT / "app" / "assets" / "key-safety.js").read_text(encoding="utf-8")

    assert "assets/key-safety.js" in index
    assert "scrubStoredApiKey" in safety
    assert "Session only" in safety
    assert "not saved" in safety
