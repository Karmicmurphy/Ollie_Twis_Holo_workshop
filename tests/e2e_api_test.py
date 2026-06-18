from __future__ import annotations
import json, os, subprocess, sys, time, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = "8799"

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
        health = wait_for_server(proc)
        assert health["ok"] is True
        project = {"id":"e2e-test","title":"E2E Test","description":"runtime test","nextAction":"verify API"}
        created = request("/api/projects", "POST", project)
        assert created["ok"] is True
        artifact = {"kind":"document","title":"Smoke Document","payload":{"body":"Still. Fucking. Here."},"authorityState":"DRAFT"}
        saved = request("/api/projects/e2e-test/artifacts", "POST", artifact)
        assert saved["ok"] is True
        artifacts = request("/api/projects/e2e-test/artifacts")
        assert any(a["title"] == "Smoke Document" for a in artifacts)
        session = request("/api/projects/e2e-test/sessions", "POST", {"room":"write","summary":"tested","nextAction":"ship"})
        assert session["ok"] is True
        capsule = request("/api/projects/e2e-test/capsule", "POST", {})
        assert capsule["ok"] is True and capsule["path"].endswith(".zip")
        print("Twis Holo API E2E PASS")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()

if __name__ == "__main__":
    main()
