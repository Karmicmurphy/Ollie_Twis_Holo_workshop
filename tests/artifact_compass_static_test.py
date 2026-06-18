from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_artifact_compass_is_wired_into_static_app():
    index = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
    script = (ROOT / "app" / "assets" / "artifact-compass.js").read_text(encoding="utf-8")

    assert 'assets/artifact-compass.js' in index
    assert 'Artifact Compass' in script
    assert 'twisHolo.full.v1' in script
    assert 'match reasons' not in script.lower() or 'Matched:' in script
    assert 'fetch(' not in script
    assert 'localStorage' in script


def test_artifact_compass_has_no_network_or_secret_dependency():
    script = (ROOT / "app" / "assets" / "artifact-compass.js").read_text(encoding="utf-8")
    forbidden = ["Authorization", "apiKey", "Bearer ", "XMLHttpRequest", "WebSocket"]

    for token in forbidden:
        assert token not in script
