from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_recover_room_has_flashriver_controls():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")

    assert "Import FlashRiver package" in index
    assert 'id="flashriverPath"' in index
    assert 'id="flashriverSha"' in index
    assert 'id="importFlashriver"' in index
    assert 'id="flashriverResult"' in index
    assert "6ef7317722202769b08d74a434519871736e055d1864fa5eb6c6fb547cb40108" in index
    assert 'assets/flashriver-import-ui.js' in index


def test_recover_room_restores_missing_app_controls():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")

    # app/assets/app.js wires these IDs directly. They must exist or the UI can fail during boot.
    assert 'id="micBtn"' in index
    assert 'id="exportProject"' in index


def test_flashriver_ui_posts_to_local_intake_route():
    ui = (ROOT / "app" / "assets" / "flashriver-import-ui.js").read_text(encoding="utf-8")

    assert "/api/import-flashriver" in ui
    assert "expectedSha256" in ui
    assert "projectId" in ui
    assert "Raw source archive stays local" in ui
    assert "GitHub" in ui
    assert "Cloudflare" in ui
    assert "privateSourcesCopied" in ui


def test_flashriver_filters_are_visible_in_my_work():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")

    assert 'value="flashriver-intake-manifest"' in index
    assert 'value="flashriver-core-doc"' in index
    assert 'value="flashriver-support-doc"' in index
