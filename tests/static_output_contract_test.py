from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_cloudflare_build_script_points_at_static_app():
    build = (ROOT / "cloudflare" / "pages" / "build.mjs").read_text(encoding="utf-8")
    assert "const sourceDir = resolve(root, 'app')" in build
    assert "const outputDir = resolve(root, 'dist')" in build
    assert "404.html" in build
    assert "_headers" in build


def test_package_scripts_match_cloudflare_pages_path():
    package = (ROOT / "package.json").read_text(encoding="utf-8")
    assert '"build": "node cloudflare/pages/build.mjs"' in package
    assert '"pages:deploy": "wrangler pages deploy dist --project-name ollie-twis-holo-workshop"' in package
    assert '"test:static": "python -m pytest tests"' in package


def test_static_app_has_required_assets_wired():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    required = [
        "assets/app.js",
        "assets/key-safety.js",
        "assets/artifact-compass.js",
        "assets/engine-harness.js",
        "assets/holo-guide.js",
    ]
    for asset in required:
        assert asset in index


def test_free_tool_policy_and_pipeline_docs_exist():
    assert (ROOT / "docs" / "MINI_ENGINE_PIPELINE.md").exists()
    assert (ROOT / "docs" / "FREE_TOOL_FEDERATION_POLICY.md").exists()
    assert (ROOT / "docs" / "POWERHOSE_ENGINE_HARNESS.md").exists()
