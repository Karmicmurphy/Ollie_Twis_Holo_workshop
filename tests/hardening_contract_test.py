from __future__ import annotations

import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = "8803"
BASE = f"http://127.0.0.1:{PORT}"


def request(path: str, method: str = "GET", payload: dict | None = None) -> tuple[int, dict]:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        BASE + path,
        data=data,
        method=method,
        headers={"Content-Type": "application/json", "Origin": BASE},
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        return exc.code, json.loads(exc.read().decode("utf-8"))


def wait_for_server(proc: subprocess.Popen, seconds: float = 10.0) -> None:
    end = time.time() + seconds
    while time.time() < end:
        if proc.poll() is not None:
            raise RuntimeError(f"server exited early: {proc.returncode}")
        try:
            status, body = request("/api/health")
            if status == 200 and body.get("ok"):
                return
        except Exception:
            pass
        time.sleep(0.25)
    raise RuntimeError("server did not become ready")


def test_file_writes_are_project_scoped_and_receipted():
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
        status, _ = request(
            "/api/projects",
            "POST",
            {"id": "hardening-test", "title": "Hardening Test"},
        )
        assert status == 200

        status, body = request(
            "/api/files",
            "POST",
            {
                "projectId": "hardening-test",
                "path": "hardening-test/code/hello.txt",
                "content": "first version",
            },
        )
        assert status == 200
        assert len(body["sha256"]) == 64

        status, receipts = request("/api/projects/hardening-test/receipts")
        assert status == 200
        file_receipts = [r for r in receipts if r["action"] == "project.file.write"]
        assert file_receipts
        details = json.loads(file_receipts[0]["details"])
        assert details["path"] == "hardening-test/code/hello.txt"
        assert len(details["newSha256"]) == 64

        status, _ = request(
            "/api/files",
            "POST",
            {
                "projectId": "hardening-test",
                "path": "hardening-test/../../escape.txt",
                "content": "nope",
            },
        )
        assert status == 400

        status, _ = request(
            "/api/files",
            "POST",
            {
                "projectId": "other-project",
                "path": "hardening-test/code/mismatch.txt",
                "content": "nope",
            },
        )
        assert status == 400
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()


def test_import_policy_skips_symlinks(tmp_path: Path):
    sys.path.insert(0, str(ROOT / "companion"))
    from security import should_skip_import_path

    target = tmp_path / "target.txt"
    target.write_text("private", encoding="utf-8")
    link = tmp_path / "link.txt"
    try:
        link.symlink_to(target)
    except (OSError, NotImplementedError):
        return
    skip, reason = should_skip_import_path(link)
    assert skip is True
    assert "symbolic link" in reason
