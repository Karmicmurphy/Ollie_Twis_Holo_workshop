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
PORT = "8798"


def request(path: str, method="GET", data=None, headers=None):
    body = None
    h = headers or {}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        h.setdefault("Content-Type", "application/json")
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", data=body, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=10) as r:
        raw = r.read().decode("utf-8")
        return json.loads(raw) if raw else None


def expect_http_error(path: str, method="GET", data=None, headers=None):
    try:
        request(path, method, data, headers)
    except urllib.error.HTTPError as e:
        return e.code
    raise AssertionError("expected HTTP error")


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
        assert expect_http_error("/api/health", headers={"Host": "evil.example"}) == 403
        assert expect_http_error("/api/projects", "POST", {"title": "Blocked"}, headers={"Origin": "https://evil.example"}) == 403
        assert expect_http_error("/api/files", "POST", {"path": "../outside.txt", "content": "bad"}) == 400
        request("/api/projects", "POST", {"id": "security-test", "title": "Security Test"})
        request("/api/projects/security-test/artifacts", "POST", {"kind": "document", "title": "Alpha", "payload": {"body": "hello"}})
        got = request('/api/projects/security-test/artifacts?q=" OR * :')
        assert isinstance(got, list)
        assert expect_http_error("/api/ai/chat", "POST", {"endpoint": "http://192.168.1.5:11434/v1/chat/completions", "model": "x", "messages": []}) == 400
        print("Twis Holo security policy PASS")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
