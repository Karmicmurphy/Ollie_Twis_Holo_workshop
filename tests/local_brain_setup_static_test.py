from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_local_brain_setup_is_wired():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    helper = (ROOT / "app" / "assets" / "local-brain-setup.js").read_text(encoding="utf-8")

    assert "assets/local-brain-setup.js" in index
    assert "Use local Ollama-style brain" in helper
    assert "http://127.0.0.1:11434/v1/chat/completions" in helper
    assert "Probe local brain" in helper
    assert "Reply with OK." in helper


def test_freest_easiest_stack_doc_exists():
    doc = (ROOT / "docs" / "FREEST_EASIEST_POWERHOUSE_STACK.md").read_text(encoding="utf-8")
    assert "Browser voice in" in doc
    assert "OpenAI-compatible local endpoint" in doc
    assert "Ollama or llama.cpp" in doc
    assert "Do not make these the foundation" in doc
