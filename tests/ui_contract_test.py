import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_holo_guide_assets_are_wired():
    html = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    assert "assets/holo-guide.css" in html
    assert "assets/holo-guide.js" in html


def test_holo_guide_assets_exist():
    assert (ROOT / "app" / "assets" / "holo-guide.css").exists()
    assert (ROOT / "app" / "assets" / "holo-guide.js").exists()


def test_scrap_iron_hull_contract_is_valid_json():
    data = json.loads((ROOT / "app" / "modules" / "scrap-iron-hull.json").read_text(encoding="utf-8"))
    assert data["coreRule"] == "Local first. Cloud optional. Tools gated. Receipts always. UI explains itself."
    assert "deep-sea-salvage" in data["firstModules"]
    assert "artifact-compass" in data["firstModules"]
    assert "mcp-gate" in data["firstModules"]


def test_powerhouse_modules_are_registered():
    modules = json.loads((ROOT / "app" / "modules" / "modules.json").read_text(encoding="utf-8"))
    ids = {module["id"] for module in modules}
    required = {
        "deep-sea-salvage",
        "artifact-compass",
        "receipt-ledger",
        "signal-desk-pocket",
        "edge-ai-helper",
        "local-model-socket",
        "generation-router",
        "mcp-gate",
    }
    assert required.issubset(ids)


def test_ui_skill_and_harness_docs_exist():
    assert (ROOT / "docs" / "TWIS_HOLO_UI_SKILL.md").exists()
    assert (ROOT / "docs" / "TWIS_HOLO_MINI_HARNESS.md").exists()
    assert (ROOT / "docs" / "SCRAP_IRON_HOLO_UI_BUILD.md").exists()
