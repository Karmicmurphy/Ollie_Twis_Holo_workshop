from pathlib import Path
import shutil
import subprocess
import json

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"


def test_loop_deck_entry_wires_v2_modules():
    html = (APP / "loop-deck.html").read_text(encoding="utf-8")
    assert "assets/twis-loop-deck-v2.js" in html
    assert "assets/twis-loop-deck-modules.js" in html
    assert "TWIS_LOOP_MODULES" in html
    assert "sw.js" in html
    assert 'href="loop-deck.webmanifest"' in html


def test_loop_deck_has_dedicated_phone_install_contract():
    manifest = (APP / "loop-deck.webmanifest").read_text(encoding="utf-8")
    parsed = json.loads(manifest)
    assert '"name": "TWIS LOOP DECK"' in manifest
    assert '"short_name": "Loop Deck"' in manifest
    assert '"start_url": "./loop-deck.html"' in manifest
    assert "twis-loop-deck-icon.svg" in manifest
    assert '"sizes": "192x192"' in manifest
    assert '"sizes": "512x512"' in manifest
    assert parsed["id"] == "/loop-deck.html"
    assert parsed["start_url"] == "./loop-deck.html"
    for icon in parsed["icons"][:2]:
        assert (APP / icon["src"]).is_file()


def test_loop_deck_core_contracts_present():
    core = (APP / "assets" / "twis-loop-deck-v2.js").read_text(encoding="utf-8")
    worklet = (APP / "assets" / "loop-recorder-worklet.js").read_text(encoding="utf-8")
    modules = (APP / "assets" / "twis-loop-deck-modules.js").read_text(encoding="utf-8")
    calibration = (APP / "assets" / "twis-loop-calibration.js").read_text(encoding="utf-8")

    assert "AudioWorkletNode" in core
    assert "navigator.storage?.getDirectory" in core
    assert "requestMIDIAccess" in core
    assert "TRANSIENTS" in core and "EQUAL 16" in core
    assert "ratchets" in core and "overdub" in core
    assert "navigator.storage.persist()" in core
    assert "addEventListener('pointerdown',protectStorage,{once:true,capture:true})" in core
    assert "registerProcessor('twis-loop-recorder'" in worklet
    assert "SignalsmithStretch" in modules
    assert "CAPTURE WAV" in modules
    assert "AUTO CAL" in calibration


def test_loop_deck_service_workers_share_cache_contract():
    sw = (APP / "sw.js").read_text(encoding="utf-8")
    service_worker = (APP / "service-worker.js").read_text(encoding="utf-8")
    assert sw == service_worker
    for asset in (
        "./loop-deck.html",
        "./loop-deck.webmanifest",
        "./assets/twis-loop-deck-v2.js",
        "./assets/twis-loop-deck-modules.js",
        "./assets/loop-recorder-worklet.js",
        "./assets/icons/twis-loop-deck-icon.svg",
        "./assets/icons/twis-loop-deck-icon-192.png",
        "./assets/icons/twis-loop-deck-icon-512.png",
    ):
        assert asset in sw


def test_loop_deck_javascript_parses_when_node_is_available():
    node = shutil.which("node")
    if not node:
        return
    for rel in (
        "app/assets/twis-loop-deck-v2.js",
        "app/assets/twis-loop-deck-modules.js",
        "app/assets/twis-loop-calibration.js",
        "app/assets/loop-recorder-worklet.js",
    ):
        subprocess.run([node, "--check", str(ROOT / rel)], check=True, capture_output=True, text=True)
