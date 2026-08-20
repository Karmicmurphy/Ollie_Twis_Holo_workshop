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
    first = set(data["firstModules"])
    required = {
        "importer",
        "artifact-compass",
        "receipt-ledger",
        "mcp-gate",
        "local-model-socket",
        "generation-router",
    }
    assert required.issubset(first)
    assert "deep-sea-salvage" not in first
    assert "edge-ai-helper" not in first


def test_powerhouse_modules_are_registered_and_manifest_is_not_stale():
    modules = json.loads((ROOT / "app" / "modules" / "modules.json").read_text(encoding="utf-8"))
    ids = {module["id"] for module in modules}
    required = {
        "importer",
        "artifact-compass",
        "receipt-ledger",
        "signal-desk-pocket",
        "cloudflare-remote-hull",
        "tiny-ai-lane",
        "local-model-socket",
        "generation-router",
        "mcp-gate",
    }
    assert required.issubset(ids)

    hull = json.loads((ROOT / "app" / "modules" / "scrap-iron-hull.json").read_text(encoding="utf-8"))
    assert set(hull["firstModules"]).issubset(ids)


def test_ui_skill_and_harness_docs_exist():
    assert (ROOT / "docs" / "TWIS_HOLO_UI_SKILL.md").exists()
    assert (ROOT / "docs" / "TWIS_HOLO_MINI_HARNESS.md").exists()
    assert (ROOT / "docs" / "SCRAP_IRON_HOLO_UI_BUILD.md").exists()
