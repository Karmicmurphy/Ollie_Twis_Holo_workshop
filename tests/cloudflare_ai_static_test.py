from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_cloudflare_ai_function_exists_and_requires_binding():
    fn = (ROOT / "functions" / "api" / "ai" / "chat.js").read_text(encoding="utf-8")
    assert "export async function onRequestPost" in fn
    assert "export async function onRequestGet" in fn
    assert "export async function onRequestOptions" in fn
    assert "env.AI" in fn
    assert "AI.run" in fn
    assert "Workers AI binding missing" in fn
    assert "Cloudflare AI call failed" in fn
    assert "bindingPresent" in fn
    assert "@cf/meta/llama-3.1-8b-instruct" in fn


def test_cloudflare_ai_setup_helper_is_wired():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    helper = (ROOT / "app" / "assets" / "cloudflare-ai-setup.js").read_text(encoding="utf-8")
    assert "assets/cloudflare-ai-setup.js" in index
    assert "Use Cloudflare AI" in helper
    assert "Probe Cloudflare AI" in helper
    assert "/api/ai/chat" in helper
    assert "Reply with OK." in helper


def test_cloudflare_ai_setup_doc_exists():
    doc = (ROOT / "docs" / "CLOUDFLARE_AI_SETUP_NOW.md").read_text(encoding="utf-8")
    assert "Workers AI" in doc
    assert "AI" in doc
    assert "Use Cloudflare AI" in doc
    assert "Probe Cloudflare AI" in doc
    assert "Workers AI binding missing" in doc
    assert "bindingPresent" in doc
