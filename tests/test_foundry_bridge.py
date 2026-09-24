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


def test_route_human_signal_prefers_compiled_job(monkeypatch):
    def fake_post(path,payload,timeout=10.0):
        assert path=="/v1/human-signal/compile-job"
        return {
            "signal":{"signal_id":"signal:test","status":"READY_FOR_ROUTING"},
            "intent":{"intent_id":"intent:test"},
            "job":{"job_id":"job:test","capability_key":"repository.inspect","approval_posture":"NONE"},
        }
    monkeypatch.setattr(foundry_bridge,"_post",fake_post)
    result=foundry_bridge.route_human_signal("Inspect this repo.")
    assert result["mode"]=="JOB_COMPILED"
    assert result["job_id"]=="job:test"
    assert result["signal_id"]=="signal:test"


def test_route_human_signal_falls_back_only_when_model_not_configured(monkeypatch):
    calls=[]
    def fake_post(path,payload,timeout=10.0):
        calls.append(path)
        if path=="/v1/human-signal/compile-job":
            raise foundry_bridge.FoundryResponseError(503,{"status":"MODEL_NOT_CONFIGURED","error":"not configured"})
        assert path=="/v1/human-signal"
        return {"signal_id":"signal:fallback","status":"NEEDS_INTERPRETATION"}
    monkeypatch.setattr(foundry_bridge,"_post",fake_post)
    result=foundry_bridge.route_human_signal("I don't know what I need.")
    assert calls==["/v1/human-signal/compile-job","/v1/human-signal"]
    assert result["mode"]=="SIGNAL_ONLY"
    assert result["job_id"] is None
    assert result["signal_id"]=="signal:fallback"


def test_route_human_signal_does_not_hide_other_foundry_errors(monkeypatch):
    def fake_post(path,payload,timeout=10.0):
        raise foundry_bridge.FoundryResponseError(400,{"error":"bad semantic proposal"})
    monkeypatch.setattr(foundry_bridge,"_post",fake_post)
    try:
        foundry_bridge.route_human_signal("Inspect this repo.")
    except foundry_bridge.FoundryResponseError as exc:
        assert exc.status==400
    else:
        raise AssertionError("non-503 Foundry errors must not silently fall back")
