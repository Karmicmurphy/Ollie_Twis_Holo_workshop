"""Disposable local HTTP/storage proof, not authenticated hosted commissioning."""
import concurrent.futures
from contextlib import closing
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
import uuid
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "companion"))
import server
from project_context import ContextConflict, append_event, empty_context


class QuietHandler(server.Handler):
    def log_message(self, *args):
        pass


class ProjectContextTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name in ("PROJECTS", "IMPORTS", "BACKUPS", "SOURCE_ARCHIVES", "REGISTRY"):
            directory = self.root / name.lower()
            directory.mkdir()
            p = patch.object(server, name, directory)
            p.start()
            self.addCleanup(p.stop)
        p = patch.object(server, "DB", self.root / "context.sqlite")
        p.start()
        self.addCleanup(p.stop)
        self.http = server.ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
        self.port = self.http.server_port
        p = patch.dict(os.environ, {"TWIS_HOLO_PORT": str(self.port)})
        p.start()
        self.addCleanup(p.stop)
        threading.Thread(target=self.http.serve_forever, daemon=True).start()
        self.addCleanup(self.http.server_close)
        self.addCleanup(self.http.shutdown)
        for pid in ("project-one", "project-two"):
            self.assertEqual(self.request("/api/projects", {"id": pid, "title": pid})[0], 200)
        self.path = "/api/projects/project-one/foundation/context"

    def request(self, path, body=None, method=None, origin=None):
        headers = {"Content-Type": "application/json"}
        if origin:
            headers["Origin"] = origin
        data = None if body is None else json.dumps(body).encode("utf-8")
        req = urllib.request.Request(f"http://127.0.0.1:{self.port}" + path,
            data=data, method=method or ("POST" if body is not None else "GET"), headers=headers)
        try:
            response = urllib.request.urlopen(req, timeout=10)
        except urllib.error.HTTPError as exc:
            response = exc
        with response:
            return response.status, json.loads(response.read().decode("utf-8"))

    def event(self, kind="goal", text="Recover the existing architecture", revision=0, **fields):
        return {"eventId": str(uuid.uuid4()), "kind": kind, "text": text,
                "expectedRevision": revision, **fields}

    def test_goal_correction_decision_preserve_history_and_receipt(self):
        goal = self.event(text="Recover caf\u00e9 architecture \u2014 source first")
        code, first = self.request(self.path, goal)
        self.assertEqual(code, 200)
        self.assertEqual(first["revision"], 1)
        self.assertEqual(first["executionAuthority"], "NOT_GRANTED")
        self.assertEqual(len(first["contextReceipt"]["snapshotSha256"]), 64)
        code, corrected = self.request(self.path, self.event("correction", "Preserve originals", 1, goalId=goal["eventId"]))
        self.assertEqual(code, 200)
        self.assertEqual(corrected["goal"]["text"], "Preserve originals")
        self.assertEqual(corrected["events"][0]["text"], goal["text"])
        code, view = self.request(self.path, self.event("decision", "Use the existing adapter", 2, goalId=goal["eventId"]))
        self.assertEqual(code, 200)
        self.assertEqual(view["revision"], 3)
        self.assertEqual(len(view["events"]), 3)
        self.assertFalse(view["cancellationConfirmed"])

    def test_stale_writer_cannot_overwrite_newer_goal(self):
        self.assertEqual(self.request(self.path, self.event())[0], 200)
        self.assertEqual(self.request(self.path, self.event(text="stale", revision=0))[0], 409)
        self.assertEqual(self.request(self.path)[1]["revision"], 1)

    def test_duplicate_is_idempotent_and_changed_duplicate_denied(self):
        event = self.event()
        first = self.request(self.path, event)[1]
        code, replay = self.request(self.path, event)
        self.assertEqual(code, 200)
        self.assertTrue(replay["duplicate"])
        self.assertEqual(replay["revisionId"], first["revisionId"])
        self.assertEqual(self.request(self.path, {**event, "text": "different"})[0], 409)

    def test_concurrent_writers_have_one_revision_winner(self):
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            futures = [pool.submit(self.request, self.path, self.event()) for _ in range(2)]
        self.assertEqual(sorted(f.result()[0] for f in futures), [200, 409])
        self.assertEqual(self.request(self.path)[1]["revision"], 1)

    def test_pause_blocks_local_admission_without_invoking_adapters(self):
        self.assertEqual(self.request(self.path, self.event("stop", "Pause local work"))[0], 200)
        with patch.object(server, "foundry_compile_human_signal_job") as foundry, \
                patch.object(server, "create_generation_job") as generation:
            for path, body in (("/api/foundry/human-signal", {"projectId": "project-one", "rawText": "work"}),
                               ("/api/generation/jobs", {"projectId": "project-one"}),
                               ("/api/jobs", {"projectId": "project-one", "operation": "fixture"})):
                code, result = self.request(path, body)
                self.assertEqual(code, 409)
                self.assertEqual(result["error"], "NEW_LOCAL_WORK_STOPPED")
                self.assertFalse(result["cancellationConfirmed"])
            foundry.assert_not_called()
            generation.assert_not_called()
        code, resumed = self.request(self.path, self.event("resume", "Allow local work", 1))
        self.assertEqual(code, 200)
        self.assertTrue(resumed["newLocalWorkEnabled"])
        self.assertEqual(resumed["jobs"], [])

    def test_restart_read_and_database_restore_do_not_execute(self):
        self.request(self.path, self.event("stop", "Remain paused across restarts"))
        original = self.request(self.path)[1]
        code = "import sys,json;from pathlib import Path;sys.path.insert(0,sys.argv[1]);import server;server.DB=Path(sys.argv[2]);c=server.connect();print(json.dumps(server.foundation_context(c,'project-one')[1],ensure_ascii=False));c.close()"
        child = subprocess.run([sys.executable, "-X", "utf8", "-B", "-c", code,
            str(ROOT / "companion"), str(server.DB)], capture_output=True, encoding="utf-8", timeout=30)
        self.assertEqual(child.returncode, 0, child.stderr)
        self.assertEqual(json.loads(child.stdout), original)
        restored = self.root / "restored.sqlite"
        with closing(server.connect()) as source, closing(sqlite3.connect(restored)) as target:
            source.backup(target)
        self.request(self.path, self.event("resume", "Later state", 1))
        with patch.object(server, "DB", restored), \
                patch.object(server, "foundry_compile_human_signal_job") as worker:
            self.assertEqual(self.request(self.path)[1], original)
            self.assertEqual(self.request(self.path)[1], original)
            worker.assert_not_called()
            with closing(server.connect()) as con:
                self.assertEqual(con.execute("PRAGMA integrity_check").fetchone()[0], "ok")
                self.assertEqual(con.execute("SELECT count(*) FROM jobs").fetchone()[0], 0)

    def test_storage_failure_rolls_back_revision_projection_and_receipt(self):
        self.request(self.path, self.event())
        first = self.request(self.path)[1]
        original = server.save_artifact_row
        def broken(*args, **kwargs):
            return original(*args, **kwargs, inject_failure=True)
        with patch.object(server, "save_artifact_row", side_effect=broken):
            self.assertEqual(self.request(self.path, self.event("note", "rollback", 1))[0], 500)
        self.assertEqual(self.request(self.path)[1], first)

    def test_context_cannot_be_overwritten_or_retired_by_generic_routes(self):
        self.request(self.path, self.event())
        aid = "foundation-context:project-one"
        code, _ = self.request("/api/projects/project-one/artifacts", {
            "id": aid, "kind": "note", "title": "bypass", "expectedRevision": 1})
        self.assertEqual(code, 409)
        code, _ = self.request(f"/api/artifacts/{aid}?expectedRevision=1", method="DELETE")
        self.assertEqual(code, 409)
        self.assertEqual(self.request(self.path)[1]["revision"], 1)

    def test_wrong_project_origin_and_unexpected_authority_fields_denied(self):
        self.request(self.path, self.event())
        other = self.request("/api/projects/project-two/foundation/context")[1]
        self.assertEqual(other["events"], [])
        self.assertEqual(self.request(self.path, self.event(), origin="https://unrelated.invalid")[0], 403)
        self.assertEqual(self.request(self.path, {**self.event(), "authority": "approve-anything"})[0], 400)
        self.assertEqual(self.request(self.path, self.event(revision=True))[0], 400)

    def test_tampered_context_projection_fails_integrity_check(self):
        self.request(self.path, self.event())
        with closing(server.connect()) as con:
            con.execute("UPDATE artifacts SET payload='{}' WHERE id='foundation-context:project-one'")
            con.commit()
        code, _ = self.request(self.path)
        self.assertNotEqual(code, 200)

    def test_invalid_events_and_context_size_fail_closed(self):
        for bad in (self.event(kind=[]), self.event(text="x" * 4097),
                    self.event(revision=-1), self.event("correction", goalId="missing-goal")):
            self.assertIn(self.request(self.path, bad)[0], (400, 409))
        self.assertEqual(self.request(self.path)[1]["revision"], 0)
        document = empty_context("project-one")
        for i in range(63):
            document["events"].append({"eventId": f"event-{i:08d}", "kind": "note",
                "text": "x" * 4096, "goalId": "", "createdAt": "2026-11-07T00:00:00Z"})
        with self.assertRaises(ContextConflict):
            append_event(document, self.event("note", "x" * 4096), "2026-11-07T00:00:00Z")

    def test_private_context_and_result_never_enter_git_registry_projection(self):
        marker = "PRIVATE_OWNER_GOAL_DO_NOT_PROJECT"
        self.assertEqual(self.request(self.path, self.event(text=marker))[0], 200)
        self.assertEqual(self.request('/api/projects/project-one/artifacts', {
            'id': 'private-result', 'kind': 'foundation-job-result', 'title': 'Retained result',
            'payload': {'private': 'PRIVATE_RESULT_DO_NOT_PROJECT'}, 'expectedRevision': 0})[0], 200)
        published = ''.join(p.read_text(encoding='utf-8') for p in server.REGISTRY.glob('*.json'))
        self.assertNotIn(marker, published)
        self.assertNotIn('PRIVATE_RESULT_DO_NOT_PROJECT', published)
        self.assertEqual(self.request(self.path)[1]['goal']['text'], marker)


if __name__ == "__main__":
    unittest.main()
