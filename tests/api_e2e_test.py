from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = "8799"
BASE = f"http://127.0.0.1:{PORT}"


def request(path: str, method: str = "GET", payload: dict | None = None) -> dict:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", "Origin": BASE},
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        return json.loads(res.read().decode("utf-8"))


def wait_for_server(proc: subprocess.Popen, seconds: float = 10.0) -> None:
    end = time.time() + seconds
    last_error = None
    while time.time() < end:
        if proc.poll() is not None:
            raise RuntimeError(f"server exited early: {proc.returncode}")
        try:
            request("/api/health")
            return
        except Exception as exc:  # noqa: BLE001 - smoke helper
            last_error = exc
            time.sleep(0.25)
    raise RuntimeError(f"server did not become ready: {last_error}")


def test_local_companion_api_end_to_end():
    env = os.environ.copy()
    env["TWIS_HOLO_PORT"] = PORT
    proc = subprocess.Popen(
        [sys.executable, str(ROOT / "companion" / "server.py")],
        cwd=ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        wait_for_server(proc)

        health = request("/api/health")
        assert health["ok"] is True
        assert health["version"]

        capabilities = request("/api/capabilities")
        assert capabilities["authoritative"] is True
        assert "sqlite" in capabilities["storage"]

        policy = request("/api/security-policy")
        assert policy["mcp"]["mode"] == "deny-by-default"
        assert policy["ai"]["advisoryOnly"] is True

        project = request(
            "/api/projects",
            "POST",
            {"id": "ci-runtime-test", "title": "CI Runtime Test", "description": "temporary test project"},
        )
        assert project["ok"] is True

        artifact = request(
            "/api/projects/ci-runtime-test/artifacts",
            "POST",
            {"kind": "document", "title": "CI Artifact", "payload": {"body": "Still here."}},
        )
        assert artifact["ok"] is True

        artifacts = request("/api/projects/ci-runtime-test/artifacts")
        assert any(item["title"] == "CI Artifact" for item in artifacts)

        session = request(
            "/api/projects/ci-runtime-test/sessions",
            "POST",
            {"room": "talk", "summary": "CI session", "nextAction": "keep building"},
        )
        assert session["ok"] is True

        capsule = request("/api/projects/ci-runtime-test/capsule", "POST", {})
        assert capsule["ok"] is True
        assert capsule["path"].endswith(".zip")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
