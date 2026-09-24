from __future__ import annotations

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


def test_compile_human_signal_routes_to_compile_job_and_returns_one_job_id(monkeypatch):
    seen={}
    def fake_post(path,payload,timeout=10.0):
        seen["path"]=path
        seen["payload"]=payload
        seen["timeout"]=timeout
        return {
            "job_id":"job:123",
            "signal":{"signal_id":"signal:test","raw_text":payload["raw_text"]},
            "job":{
                "job_id":"job:123",
                "status":"PENDING",
                "capability_key":"temporal_compass.plan",
            },
        }
    monkeypatch.setattr(foundry_bridge,"_post",fake_post)
    result=foundry_bridge.compile_human_signal_job(
        "What's going on?",
        input_data={"workshop_project_id":"test"},
    )
    assert seen["path"]=="/v1/human-signal/compile-job"
    assert seen["payload"]=={
        "raw_text":"What's going on?",
        "input_data":{"workshop_project_id":"test"},
    }
    assert result["job_id"]=="job:123"
    assert result["job"]["job_id"]=="job:123"


def test_compile_human_signal_normalizes_nested_job_identity(monkeypatch):
    monkeypatch.setattr(
        foundry_bridge,
        "_post",
        lambda *args, **kwargs: {
            "signal":{"signal_id":"signal:test"},
            "job":{"job_id":"job:nested","status":"PENDING"},
        },
    )
    result=foundry_bridge.compile_human_signal_job("test")
    assert result["job_id"]=="job:nested"
    assert result["job"]["job_id"]=="job:nested"


def test_compile_human_signal_rejects_split_or_missing_job_identity(monkeypatch):
    monkeypatch.setattr(
        foundry_bridge,
        "_post",
        lambda *args, **kwargs: {"job":{"job_id":"job:a"},"job_id":"job:b"},
    )
    try:
        foundry_bridge.compile_human_signal_job("test")
    except RuntimeError as exc:
        assert "split job identity" in str(exc)
    else:
        raise AssertionError("split job identity must fail closed")
