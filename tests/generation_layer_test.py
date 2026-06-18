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
PORT = "8797"


def request(path: str, method="GET", data=None):
    body = None
    headers = {}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", data=body, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=10) as r:
        raw = r.read().decode("utf-8")
        return json.loads(raw) if raw else None


def expect_error(path: str, method="GET", data=None):
    try:
        request(path, method, data)
    except urllib.error.HTTPError as e:
        return e.code
    raise AssertionError("expected error")


def wait_for_server(proc):
    for _ in range(50):
        if proc.poll() is not None:
            raise RuntimeError(proc.stderr.read() if proc.stderr else "server exited")
        try:
            return request("/api/health")
        except Exception:
            time.sleep(0.1)
    raise RuntimeError("server did not start")


def main():
    env = os.environ.copy()
    env["TWIS_HOLO_PORT"] = PORT
    proc = subprocess.Popen([sys.executable, "companion/server.py"], cwd=ROOT, env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    try:
        assert wait_for_server(proc)["ok"] is True
        adapters = request("/api/generation/adapters")
        assert "adapters" in adapters
        assert expect_error("/api/generation/jobs", "POST", {
            "projectId": "thousand-year-hangover",
            "adapterId": "local-comfyui",
            "type": "text-to-image",
            "prompt": "rain window"
        }) == 400
        job = request("/api/generation/jobs", "POST", {
            "projectId": "thousand-year-hangover",
            "adapterId": "local-comfyui",
            "type": "text-to-image",
            "prompt": "rain window",
            "endpoint": "http://127.0.0.1:8188",
            "confirmed": True
        })
        assert job["ok"] is True
        assert "queued" in job["status"]
        print("Twis Holo generation layer PASS")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
