import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_cloudflare_worker_scaffold_exists():
    assert (ROOT / "wrangler.jsonc").exists()
    assert (ROOT / "package.json").exists()
    assert (ROOT / "cloudflare" / "worker" / "src" / "index.js").exists()


def test_wrangler_config_points_to_app_assets_and_worker():
    raw = (ROOT / "wrangler.jsonc").read_text(encoding="utf-8")
    assert '"main": "cloudflare/worker/src/index.js"' in raw
    assert '"directory": "./app"' in raw
    assert '"binding": "ASSETS"' in raw
    assert '"not_found_handling": "single-page-application"' in raw
    assert '"TWIS_ALLOW_AI": "false"' in raw
    assert '"TWIS_ALLOW_REMOTE_WRITE": "false"' in raw


def test_package_has_cloudflare_scripts():
    data = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    scripts = data.get("scripts", {})
    assert scripts.get("cf:dev") == "wrangler dev"
    assert scripts.get("cf:deploy") == "wrangler deploy"
    assert scripts.get("cf:dry") == "wrangler deploy --dry-run"


def test_worker_keeps_risky_routes_disabled_by_default():
    worker = (ROOT / "cloudflare" / "worker" / "src" / "index.js").read_text(encoding="utf-8")
    assert "remote inbox writes disabled by default" in worker
    assert "remote AI helper disabled by default" in worker
    assert "env.ASSETS.fetch(request)" in worker
    for blocked in ["canon-approval", "source-delete", "publish", "spend-money", "shell-execution", "secret-access"]:
        assert blocked in worker
