import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def modules():
    return json.loads((ROOT / "app" / "modules" / "modules.json").read_text(encoding="utf-8"))


def test_engine_harness_is_wired():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    harness = (ROOT / "app" / "assets" / "engine-harness.js").read_text(encoding="utf-8")
    assert "assets/engine-harness.js" in index
    assert "modules/modules.json" in harness
    assert "Mini-engine pipeline" in harness


def test_modules_have_contract_fields():
    required = ["id", "name", "room", "execution", "permissions", "sandbox", "inputBoundary", "outputArtifact", "receiptRequired", "enabledByDefault", "status"]
    for module in modules():
        for field in required:
            assert field in module
        assert isinstance(module["execution"], list)
        assert isinstance(module["permissions"], list)
        assert isinstance(module["receiptRequired"], bool)
        assert isinstance(module["enabledByDefault"], bool)


def test_adapter_lanes_start_off_and_keep_receipts():
    adapter_ids = ["generation-router", "tiny-ai-lane", "local-model-socket", "cloudflare-remote-hull", "ag-ui-event-lane", "signal-desk-pocket"]
    indexed = {m["id"]: m for m in modules()}
    for module_id in adapter_ids:
        assert indexed[module_id]["enabledByDefault"] is False
        assert indexed[module_id]["receiptRequired"] is True
