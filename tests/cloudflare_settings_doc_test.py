from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_cloudflare_pages_settings_doc_matches_package_scripts():
    doc = (ROOT / "docs" / "CLOUDFLARE_PAGES_DASHBOARD_SETTINGS.md").read_text(encoding="utf-8")
    package = (ROOT / "package.json").read_text(encoding="utf-8")

    assert "ollie-twis-holo-workshop" in doc
    assert "npm run build" in doc
    assert "dist" in doc
    assert "TWIS_ALLOW_AI=false" in doc
    assert "TWIS_ALLOW_REMOTE_WRITE=false" in doc
    assert "wrangler pages deploy dist --project-name ollie-twis-holo-workshop" in doc
    assert '"pages:deploy": "wrangler pages deploy dist --project-name ollie-twis-holo-workshop"' in package
