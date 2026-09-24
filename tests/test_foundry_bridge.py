from __future__ import annotations

import os
from pathlib import Path
import sys

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"companion"))

import foundry_bridge


def test_foundry_url_is_loopback_only(monkeypatch):
    assert foundry_bridge.validate_foundry_url("http://127.0.0.1:8791") == "http://127.0.0.1:8791"
    try:
        foundry_bridge.validate_foundry_url("https://example.com")
    except ValueError as exc:
        assert "loopback-only" in str(exc)
    else:
        raise AssertionError("remote Foundry URL must be rejected")


def test_compile_human_signal_posts_raw_text(monkeypatch):
    seen={}
    def fake_post(path,payload,timeout=10.0):
        seen["path"]=path
        seen["payload"]=payload
        return {"signal_id":"signal:test","raw_text":payload["raw_text"],"status":"NEEDS_INTERPRETATION"}
    monkeypatch.setattr(foundry_bridge,"_post",fake_post)
    result=foundry_bridge.compile_human_signal("What's going on?")
    assert seen["path"]=="/v1/human-signal"
    assert seen["payload"]=={"raw_text":"What's going on?"}
    assert result["signal_id"]=="signal:test"
