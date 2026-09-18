from __future__ import annotations

import json
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = "8811"


def request(path: str, method="GET", data=None):
    body = None
    headers = {}
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", data=body, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            raw = r.read().decode("utf-8")
            return r.status, json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8")
        return exc.code, json.loads(raw) if raw else None


def wait_for_server(proc):
    for _ in range(80):
        if proc.poll() is not None:
            raise RuntimeError(proc.stderr.read() if proc.stderr else "server exited")
        try:
            status, data = request("/api/health")
            if status == 200 and data["ok"]:
                return
        except Exception:
            pass
        time.sleep(0.1)
    raise RuntimeError("server did not start")


def start_server(db_path: Path):
    env = os.environ.copy()
    env["TWIS_HOLO_PORT"] = PORT
    env["TWIS_HOLO_DB"] = str(db_path)
    env["TWIS_HOLO_TEST_INJECT_FAILURE"] = "1"
    proc = subprocess.Popen(
        [sys.executable, "companion/server.py"],
        cwd=ROOT,
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    wait_for_server(proc)
    return proc


def stop_server(proc):
    proc.terminate()
    try:
        proc.wait(timeout=5)
    except subprocess.TimeoutExpired:
        proc.kill()


def main():
    temp = tempfile.TemporaryDirectory()
    db_path = Path(temp.name) / "phase1a.sqlite3"
    pid = f"phase1a-{uuid.uuid4().hex[:8]}"
    other = f"{pid}-other"
    project_dir = ROOT / "data" / "projects" / pid
    other_dir = ROOT / "data" / "projects" / other
    capsule_path = None
    proc = start_server(db_path)
    try:
        for project in (pid, other):
            status, out = request("/api/projects", "POST", {
                "id": project, "title": project, "description": "Phase 1A proof", "nextAction": "prove revisions"
            })
            assert status == 200 and out["ok"]

        kinds = ["document", "conversation", "music", "image", "video", "research", "note", "code", "plan", "prompt"]
        ids = []
        for i, kind in enumerate(kinds):
            aid = str(uuid.uuid4())
            ids.append(aid)
            status, out = request(f"/api/projects/{pid}/artifacts", "POST", {
                "id": aid,
                "kind": kind,
                "title": f"Phase1A {kind} {i}",
                "payload": {"body": f"proof-token-{i}", "ordinal": i},
                "authorityState": "DRAFT",
                "expectedRevision": 0,
            })
            assert status == 200, out
            assert out["artifact"]["revisionNumber"] == 1
            assert len(out["artifact"]["snapshotSha256"]) == 64

        status, rows = request(f"/api/projects/{pid}/artifacts?q=proof-token-7")
        assert status == 200 and len(rows) == 1 and rows[0]["id"] == ids[7]

        target = ids[0]
        status, out = request(f"/api/projects/{pid}/artifacts", "POST", {
            "id": target, "kind": "document", "title": "Phase1A document edited",
            "payload": {"body": "first writer"}, "authorityState": "DRAFT", "expectedRevision": 1,
        })
        assert status == 200 and out["artifact"]["revisionNumber"] == 2

        status, stale = request(f"/api/projects/{pid}/artifacts", "POST", {
            "id": target, "kind": "document", "title": "stale writer",
            "payload": {"body": "must fail"}, "authorityState": "DRAFT", "expectedRevision": 1,
        })
        assert status == 409 and "stale artifact revision" in stale["error"]

        status, cross = request(f"/api/projects/{other}/artifacts", "POST", {
            "id": target, "kind": "document", "title": "wrong project",
            "payload": {}, "authorityState": "DRAFT", "expectedRevision": 0,
        })
        assert status in (400, 409) and "different project" in cross["error"]

        source_id = str(uuid.uuid4())
        status, source = request(f"/api/projects/{pid}/artifacts", "POST", {
            "id": source_id, "kind": "txt", "title": "Protected Source",
            "payload": {"body": "source truth"}, "authorityState": "SOURCE", "expectedRevision": 0,
        })
        assert status == 200
        status, blocked = request(f"/api/projects/{pid}/artifacts", "POST", {
            "id": source_id, "kind": "txt", "title": "Mutated Source",
            "payload": {"body": "should not land"}, "authorityState": "SOURCE", "expectedRevision": 1,
        })
        assert status == 409 and "protected" in blocked["error"]

        canon_id = str(uuid.uuid4())
        status, canon = request(f"/api/projects/{pid}/artifacts", "POST", {
            "id": canon_id, "kind": "document", "title": "No Generic Canon",
            "payload": {}, "authorityState": "CANON", "expectedRevision": 0,
        })
        assert status == 409 and "Canon promotion" in canon["error"]

        before_status, before_history = request(f"/api/projects/{pid}/artifacts/{target}/history")
        assert before_status == 200 and len(before_history["revisions"]) == 2
        status, failed = request(f"/api/projects/{pid}/artifacts", "POST", {
            "id": target, "kind": "document", "title": "Injected failure",
            "payload": {"body": "rollback me"}, "authorityState": "DRAFT",
            "expectedRevision": 2, "_testInjectFailure": True,
        })
        assert status == 500
        after_status, after_history = request(f"/api/projects/{pid}/artifacts/{target}/history")
        assert after_status == 200 and len(after_history["revisions"]) == 2

        status, capsule = request(f"/api/projects/{pid}/capsule", "POST", {})
        assert status == 200 and capsule["ok"]
        capsule_path = Path(capsule["path"])
        with zipfile.ZipFile(capsule_path) as z:
            snap_name = f"{pid}/database-snapshot.json"
            snap = json.loads(z.read(snap_name))
            assert "artifactRevisions" in snap
            assert any(r["artifact_id"] == target for r in snap["artifactRevisions"])

        stop_server(proc)
        proc = start_server(db_path)
        status, rows = request(f"/api/projects/{pid}/artifacts")
        assert status == 200 and any(r["id"] == target and r["revision_number"] == 2 for r in rows)

        status, retired = request(f"/api/artifacts/{target}?expectedRevision=2", "DELETE")
        assert status == 200 and retired["retired"] and retired["revisionNumber"] == 3
        status, rows = request(f"/api/projects/{pid}/artifacts")
        assert all(r["id"] != target for r in rows)
        status, history = request(f"/api/projects/{pid}/artifacts/{target}/history")
        assert status == 200 and [r["revision_number"] for r in history["revisions"]] == [3, 2, 1]
        assert history["revisions"][0]["authority_state"] == "RETIRED"

        con = sqlite3.connect(db_path)
        try:
            try:
                con.execute("UPDATE artifact_revisions SET title='tampered' WHERE artifact_id=?", (target,))
                con.commit()
                raise AssertionError("immutable revision UPDATE unexpectedly succeeded")
            except sqlite3.DatabaseError as exc:
                assert "immutable" in str(exc).lower()
                con.rollback()
            try:
                con.execute("DELETE FROM artifact_revisions WHERE artifact_id=?", (target,))
                con.commit()
                raise AssertionError("immutable revision DELETE unexpectedly succeeded")
            except sqlite3.DatabaseError as exc:
                assert "immutable" in str(exc).lower()
                con.rollback()
        finally:
            con.close()

        html = (ROOT / "app" / "index.html").read_text(encoding="utf-8")
        js = (ROOT / "app" / "assets" / "app.js").read_text(encoding="utf-8")
        assert 'id="historyPanel"' in html and 'data-history=' in js and "Artifact History" in html

        print("Living Workshop Phase 1A revision proof PASS")
    finally:
        if proc.poll() is None:
            stop_server(proc)
        if capsule_path and capsule_path.exists():
            capsule_path.unlink()
        shutil.rmtree(project_dir, ignore_errors=True)
        shutil.rmtree(other_dir, ignore_errors=True)
        temp.cleanup()


if __name__ == "__main__":
    main()
