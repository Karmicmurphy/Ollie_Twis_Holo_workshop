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
import urllib.request
import uuid
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PORT = "8812"


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
    db_path = Path(temp.name) / "phase1b.sqlite3"
    pid = f"phase1b-{uuid.uuid4().hex[:8]}"
    project_dir = ROOT / "data" / "projects" / pid
    capsule_path = None
    proc = start_server(db_path)
    try:
        status, out = request("/api/projects", "POST", {
            "id": pid, "title": pid, "description": "Human Signal review proof", "nextAction": "prove governed review"
        })
        assert status == 200 and out["ok"]

        aid = str(uuid.uuid4())
        status, created = request(f"/api/projects/{pid}/artifacts", "POST", {
            "id": aid, "kind": "document", "title": "Human Signal candidate",
            "payload": {"body": "human-originated work"}, "authorityState": "DRAFT", "expectedRevision": 0,
        })
        assert status == 200
        assert created["artifact"]["revisionNumber"] == 1

        status, blocked = request(f"/api/projects/{pid}/artifacts", "POST", {
            "id": aid, "kind": "document", "title": "Bypass review",
            "payload": {}, "authorityState": "DRAFT", "reviewState": "APPROVED", "expectedRevision": 1,
        })
        assert status == 409 and "governed human review route" in blocked["error"]

        status, candidate = request(f"/api/projects/{pid}/artifacts/{aid}/review", "POST", {
            "decision": "candidate", "reason": "Ready for human review", "expectedRevision": 1,
        })
        assert status == 200
        assert candidate["reviewState"] == "CANDIDATE"
        assert candidate["authorityState"] == "DRAFT"
        assert candidate["revisionNumber"] == 2

        status, stale = request(f"/api/projects/{pid}/artifacts/{aid}/review", "POST", {
            "decision": "approve", "expectedRevision": 1,
        })
        assert status == 409 and "stale artifact revision" in stale["error"]

        status, approved = request(f"/api/projects/{pid}/artifacts/{aid}/review", "POST", {
            "decision": "approve", "reason": "Human approved", "expectedRevision": 2,
        })
        assert status == 200
        assert approved["reviewState"] == "APPROVED"
        assert approved["authorityState"] == "DRAFT"
        assert approved["revisionNumber"] == 3

        status, canon = request(f"/api/projects/{pid}/artifacts/{aid}/review", "POST", {
            "decision": "promote_canon", "reason": "Human chose Canon", "expectedRevision": 3,
        })
        assert status == 200
        assert canon["reviewState"] == "APPROVED"
        assert canon["authorityState"] == "CANON"
        assert canon["revisionNumber"] == 4

        status, history = request(f"/api/projects/{pid}/artifacts/{aid}/history")
        assert status == 200
        assert [r["revision_number"] for r in history["revisions"]] == [4, 3, 2, 1]
        assert [r["decision"] for r in reversed(history["reviews"])] == ["candidate", "approve", "promote_canon"]
        assert history["revisions"][0]["authority_state"] == "CANON"
        assert history["revisions"][0]["review_state"] == "APPROVED"

        status, retire_block = request(f"/api/artifacts/{aid}?expectedRevision=4", "DELETE")
        assert status == 409 and "protected" in retire_block["error"]

        reject_id = str(uuid.uuid4())
        status, _ = request(f"/api/projects/{pid}/artifacts", "POST", {
            "id": reject_id, "kind": "note", "title": "Reject path", "payload": {},
            "authorityState": "DRAFT", "expectedRevision": 0,
        })
        assert status == 200
        status, _ = request(f"/api/projects/{pid}/artifacts/{reject_id}/review", "POST", {
            "decision": "candidate", "expectedRevision": 1,
        })
        assert status == 200
        status, rejected = request(f"/api/projects/{pid}/artifacts/{reject_id}/review", "POST", {
            "decision": "reject", "reason": "Needs work", "expectedRevision": 2,
        })
        assert status == 200 and rejected["reviewState"] == "REJECTED"
        status, reopened = request(f"/api/projects/{pid}/artifacts/{reject_id}/review", "POST", {
            "decision": "candidate", "reason": "Reworked", "expectedRevision": 3,
        })
        assert status == 200 and reopened["reviewState"] == "CANDIDATE"

        source_id = str(uuid.uuid4())
        status, _ = request(f"/api/projects/{pid}/artifacts", "POST", {
            "id": source_id, "kind": "source", "title": "Protected source", "payload": {"body": "source truth"},
            "authorityState": "SOURCE", "expectedRevision": 0,
        })
        assert status == 200
        status, _ = request(f"/api/projects/{pid}/artifacts/{source_id}/review", "POST", {
            "decision": "candidate", "expectedRevision": 1,
        })
        assert status == 200
        status, _ = request(f"/api/projects/{pid}/artifacts/{source_id}/review", "POST", {
            "decision": "approve", "expectedRevision": 2,
        })
        assert status == 200
        status, source_canon = request(f"/api/projects/{pid}/artifacts/{source_id}/review", "POST", {
            "decision": "promote_canon", "expectedRevision": 3,
        })
        assert status == 409 and "source authority cannot be converted" in source_canon["error"]

        status, capsule = request(f"/api/projects/{pid}/capsule", "POST", {})
        assert status == 200 and capsule["ok"]
        capsule_path = Path(capsule["path"])
        with zipfile.ZipFile(capsule_path) as z:
            snap = json.loads(z.read(f"{pid}/database-snapshot.json"))
            assert "artifactReviews" in snap
            assert any(r["artifact_id"] == aid and r["decision"] == "promote_canon" for r in snap["artifactReviews"])

        con = sqlite3.connect(db_path)
        try:
            try:
                con.execute("UPDATE artifact_reviews SET reason='tampered' WHERE artifact_id=?", (aid,))
                con.commit()
                raise AssertionError("immutable review UPDATE unexpectedly succeeded")
            except sqlite3.DatabaseError as exc:
                assert "immutable" in str(exc).lower()
                con.rollback()
            try:
                con.execute("DELETE FROM artifact_reviews WHERE artifact_id=?", (aid,))
                con.commit()
                raise AssertionError("immutable review DELETE unexpectedly succeeded")
            except sqlite3.DatabaseError as exc:
                assert "immutable" in str(exc).lower()
                con.rollback()
        finally:
            con.close()

        js = (ROOT / "app" / "assets" / "app.js").read_text(encoding="utf-8")
        assert "data-review=" in js
        assert "Promote Canon" in js
        assert "Human review decisions" in js

        print("Living Workshop Phase 1B Human Signal review proof PASS")
    finally:
        if proc.poll() is None:
            stop_server(proc)
        if capsule_path and capsule_path.exists():
            capsule_path.unlink()
        shutil.rmtree(project_dir, ignore_errors=True)
        temp.cleanup()


def test_phase1b_human_review_matrix():
    main()


if __name__ == "__main__":
    main()
