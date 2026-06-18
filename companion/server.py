from __future__ import annotations

import hashlib
import json
import os
import shutil
import sqlite3
import time
import urllib.parse
import urllib.request
import uuid
import zipfile
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Any

from security import (
    allowed_ai_endpoint,
    json_response as safe_json_response,
    read_json_body,
    require_local_request,
    safe_fts_query,
    should_skip_import_path,
)
from generation_layer import create_generation_job, load_generation_adapters

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
DATA = ROOT / "data"
PROJECTS = DATA / "projects"
IMPORTS = DATA / "imports"
BACKUPS = DATA / "backups"
REGISTRY = ROOT / "artifact-registry"
DB = DATA / "workshop.sqlite3"
HOST = "127.0.0.1"
PORT = int(os.environ.get("TWIS_HOLO_PORT", "8787"))

CAPABILITIES = {
    "name": "Twis Holo Local Companion",
    "version": "1.2.0",
    "authoritative": True,
    "storage": ["local-project-folders", "sqlite", "fts5", "sha256", "artifact-registry-json"],
    "rooms": ["talk", "write", "music", "image", "video", "research", "code", "import", "modules"],
    "adapters": {
        "ai": ["built-in-fallback", "approved-openai-compatible-endpoint"],
        "generation": ["builtin-canvas", "builtin-storyboard", "local-comfyui-disabled", "video-generation-bridges-disabled"],
        "protocols": ["mcp-policy-gated", "ag-ui-event-contract", "a2a-card-gated"],
        "cloud": ["cloudflare-remote-hull-optional"],
    },
    "permissions": {
        "default": "deny-dangerous-actions",
        "requiresHumanApproval": [
            "delete-permanent-source",
            "publish",
            "spend-money",
            "run-shell-command",
            "invoke-external-tool",
            "send-private-memory",
            "approve-canon",
            "submit-generation-job",
        ],
    },
}

SECURITY_POLICY = {
    "localCompanion": {
        "host": HOST,
        "hostOriginChecks": True,
        "jsonBodyLimit": os.environ.get("TWIS_HOLO_MAX_JSON_BODY", str(2 * 1024 * 1024)),
    },
    "mcp": {
        "mode": "deny-by-default",
        "toolMetadataTrusted": False,
        "requireStaticReview": True,
        "requireHumanApprovalForInvocation": True,
        "blockedByDefault": ["shell", "network-exfiltration", "credential-read", "filesystem-write-outside-project"],
        "receiptRequired": True,
    },
    "cloudflare": {
        "authoritative": False,
        "writesRequireTokenWhenConfigured": True,
        "localProjectRemainsSourceOfTruth": True,
    },
    "ai": {
        "advisoryOnly": True,
        "endpointAllowlist": "localhost-http-or-https-only",
        "cannotApproveCanon": True,
        "cannotDeletePermanentSource": True,
        "cannotSpendMoney": True,
    },
    "generation": {
        "adaptersDisabledByDefault": True,
        "humanConfirmationRequired": True,
        "receiptRequired": True,
        "sourceAuthority": False,
    },
}

for p in (PROJECTS, IMPORTS, BACKUPS, REGISTRY):
    p.mkdir(parents=True, exist_ok=True)


def utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def safe_id(value: str) -> str:
    out = "".join(c if c.isalnum() or c in "-_" else "-" for c in value.strip().lower())
    return out.strip("-") or str(uuid.uuid4())


def connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.executescript(
        """
        PRAGMA journal_mode=WAL;
        PRAGMA user_version=2;
        CREATE TABLE IF NOT EXISTS projects(
          id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
          next_action TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS artifacts(
          id TEXT PRIMARY KEY, project_id TEXT NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL,
          path TEXT NOT NULL DEFAULT '', payload TEXT NOT NULL DEFAULT '{}',
          authority_state TEXT NOT NULL DEFAULT 'DRAFT', sha256 TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE VIRTUAL TABLE IF NOT EXISTS artifact_search USING fts5(
          id UNINDEXED, project_id UNINDEXED, title, kind, content
        );
        CREATE TABLE IF NOT EXISTS sessions(
          id TEXT PRIMARY KEY, project_id TEXT NOT NULL, room TEXT NOT NULL,
          summary TEXT NOT NULL DEFAULT '', active_constraints TEXT NOT NULL DEFAULT '[]',
          next_action TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, closed_at TEXT
        );
        CREATE TABLE IF NOT EXISTS receipts(
          id TEXT PRIMARY KEY, project_id TEXT NOT NULL, action TEXT NOT NULL,
          actor TEXT NOT NULL, details TEXT NOT NULL DEFAULT '{}', created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS modules(
          id TEXT PRIMARY KEY, enabled INTEGER NOT NULL DEFAULT 1, settings TEXT NOT NULL DEFAULT '{}'
        );
        CREATE TABLE IF NOT EXISTS jobs(
          id TEXT PRIMARY KEY, project_id TEXT NOT NULL, operation TEXT NOT NULL,
          status TEXT NOT NULL, payload TEXT NOT NULL DEFAULT '{}', result TEXT NOT NULL DEFAULT '{}',
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        """
    )
    con.commit()
    return con


def json_response(handler, status: int, data: Any):
    safe_json_response(handler, status, data)


def body_json(handler) -> Any:
    return read_json_body(handler)


def project_dir(project_id: str) -> Path:
    p = (PROJECTS / safe_id(project_id)).resolve()
    if PROJECTS.resolve() not in p.parents and p != PROJECTS.resolve():
        raise ValueError("unsafe path")
    p.mkdir(parents=True, exist_ok=True)
    for name in ("artifacts", "media", "sources", "drafts", "receipts", "sessions", "code", "imports"):
        (p / name).mkdir(exist_ok=True)
    return p


def index_artifact(con, a):
    content = f'{a["title"]} {a["kind"]} {json.dumps(a.get("payload", {}), ensure_ascii=False)}'
    con.execute("DELETE FROM artifact_search WHERE id=?", (a["id"],))
    con.execute(
        "INSERT INTO artifact_search(id,project_id,title,kind,content) VALUES(?,?,?,?,?)",
        (a["id"], a["projectId"], a["title"], a["kind"], content),
    )


def add_receipt(con, project_id, action, actor, details):
    con.execute(
        "INSERT INTO receipts VALUES(?,?,?,?,?,?)",
        (str(uuid.uuid4()), project_id, action, actor, json.dumps(details, ensure_ascii=False), utc()),
    )


def write_registry_snapshot() -> None:
    con = connect()
    projects = [dict(r) for r in con.execute("SELECT * FROM projects ORDER BY updated_at DESC").fetchall()]
    artifacts = [dict(r) for r in con.execute("SELECT * FROM artifacts ORDER BY updated_at DESC").fetchall()]
    receipts = [dict(r) for r in con.execute("SELECT * FROM receipts ORDER BY created_at DESC LIMIT 1000").fetchall()]
    con.close()
    now = utc()
    (REGISTRY / "projects.json").write_text(json.dumps({"schemaVersion": "0.1", "exportedAt": now, "projects": projects}, indent=2), encoding="utf-8")
    (REGISTRY / "artifacts.json").write_text(json.dumps({"schemaVersion": "0.1", "exportedAt": now, "items": artifacts}, indent=2), encoding="utf-8")
    (REGISTRY / "receipts.json").write_text(json.dumps({"schemaVersion": "0.1", "exportedAt": now, "receipts": receipts}, indent=2), encoding="utf-8")


class Handler(SimpleHTTPRequestHandler):
    server_version = "TwisHoloCompanion/1.2"

    def translate_path(self, path):
        clean = urllib.parse.urlparse(path).path
        if clean.startswith("/api/"):
            return str(APP / "__api__")
        if clean == "/":
            clean = "/index.html"
        return str(APP / clean.lstrip("/"))

    def do_GET(self):
        if not require_local_request(self):
            return
        u = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(u.query)
        try:
            if u.path == "/api/health":
                json_response(self, 200, {"ok": True, "mode": "local-companion", "sqlite": str(DB), "projects": str(PROJECTS), "version": CAPABILITIES["version"]}); return
            if u.path == "/api/capabilities":
                json_response(self, 200, CAPABILITIES); return
            if u.path == "/api/security-policy":
                json_response(self, 200, SECURITY_POLICY); return
            if u.path == "/api/generation/adapters":
                json_response(self, 200, load_generation_adapters(ROOT)); return
            if u.path == "/api/projects":
                con = connect(); rows = con.execute("SELECT * FROM projects ORDER BY updated_at DESC").fetchall(); con.close()
                json_response(self, 200, [dict(r) for r in rows]); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/artifacts"):
                pid = u.path.split("/")[3]; search = (q.get("q") or [""])[0].strip()
                con = connect()
                if search:
                    try:
                        fts = safe_fts_query(search)
                        rows = con.execute("""SELECT a.* FROM artifacts a JOIN artifact_search s ON s.id=a.id
                                            WHERE a.project_id=? AND artifact_search MATCH ?
                                            ORDER BY a.updated_at DESC""", (pid, fts)).fetchall() if fts else []
                    except sqlite3.Error:
                        like = f"%{search}%"
                        rows = con.execute("SELECT * FROM artifacts WHERE project_id=? AND (title LIKE ? OR kind LIKE ? OR payload LIKE ?) ORDER BY updated_at DESC", (pid, like, like, like)).fetchall()
                else:
                    rows = con.execute("SELECT * FROM artifacts WHERE project_id=? ORDER BY updated_at DESC", (pid,)).fetchall()
                con.close()
                out = []
                for r in rows:
                    d = dict(r); d["payload"] = json.loads(d["payload"]); out.append(d)
                json_response(self, 200, out); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/sessions/latest"):
                pid = u.path.split("/")[3]; con = connect()
                r = con.execute("SELECT * FROM sessions WHERE project_id=? ORDER BY created_at DESC LIMIT 1", (pid,)).fetchone(); con.close()
                json_response(self, 200, dict(r) if r else None); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/receipts"):
                pid = u.path.split("/")[3]; con = connect()
                rows = con.execute("SELECT * FROM receipts WHERE project_id=? ORDER BY created_at DESC LIMIT 200", (pid,)).fetchall(); con.close()
                json_response(self, 200, [dict(r) for r in rows]); return
            if u.path.startswith("/api/files"):
                rel = (q.get("path") or [""])[0]
                p = (PROJECTS / rel).resolve()
                if PROJECTS.resolve() not in p.parents:
                    json_response(self, 400, {"error": "unsafe path"}); return
                if not p.exists() or not p.is_file():
                    json_response(self, 404, {"error": "not found"}); return
                try:
                    text = p.read_text(encoding="utf-8")
                    json_response(self, 200, {"path": rel, "content": text})
                except UnicodeDecodeError:
                    json_response(self, 415, {"error": "not text"})
                return
            if u.path == "/api/tree":
                pid = (q.get("projectId") or [""])[0]
                p = project_dir(pid); files = []
                for f in p.rglob("*"):
                    if f.is_file():
                        files.append(str(f.relative_to(PROJECTS)).replace("\\", "/"))
                json_response(self, 200, files); return
            if u.path == "/api/modules":
                p = APP / "modules" / "modules.json"
                json_response(self, 200, json.loads(p.read_text(encoding="utf-8"))); return
            if u.path == "/api/jobs":
                con = connect(); rows = con.execute("SELECT * FROM jobs ORDER BY updated_at DESC LIMIT 100").fetchall(); con.close()
                json_response(self, 200, [dict(r) for r in rows]); return
            super().do_GET()
        except Exception as e:
            json_response(self, 500, {"error": str(e)})

    def do_POST(self):
        if not require_local_request(self):
            return
        u = urllib.parse.urlparse(self.path)
        try:
            if u.path == "/api/projects":
                x = body_json(self); pid = safe_id(x.get("id") or x.get("title") or str(uuid.uuid4())); now = utc()
                con = connect()
                con.execute("""INSERT INTO projects(id,title,description,next_action,created_at,updated_at)
                               VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                               title=excluded.title,description=excluded.description,next_action=excluded.next_action,updated_at=excluded.updated_at""",
                            (pid, x.get("title", "Untitled"), x.get("description", ""), x.get("nextAction", ""), x.get("createdAt", now), now))
                add_receipt(con, pid, "project.upsert", "human", x); con.commit(); con.close()
                pd = project_dir(pid)
                (pd / "project.json").write_text(json.dumps({"id": pid, "title": x.get("title", "Untitled"), "description": x.get("description", ""), "nextAction": x.get("nextAction", ""), "updatedAt": now}, indent=2), encoding="utf-8")
                write_registry_snapshot()
                json_response(self, 200, {"ok": True, "id": pid}); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/artifacts"):
                pid = u.path.split("/")[3]; x = body_json(self); now = utc()
                aid = x.get("id") or str(uuid.uuid4()); payload = x.get("payload", {}); rel = x.get("path", ""); sha = ""
                if rel:
                    p = (project_dir(pid) / rel).resolve()
                    if p.exists() and p.is_file():
                        sha = hashlib.sha256(p.read_bytes()).hexdigest()
                a = {"id": aid, "projectId": pid, "kind": x.get("kind", "note"), "title": x.get("title", "Untitled"), "path": rel, "payload": payload, "authorityState": x.get("authorityState", "DRAFT"), "hash": sha, "createdAt": x.get("createdAt", now), "updatedAt": now}
                con = connect()
                con.execute("""INSERT INTO artifacts(id,project_id,kind,title,path,payload,authority_state,sha256,created_at,updated_at)
                               VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                               kind=excluded.kind,title=excluded.title,path=excluded.path,payload=excluded.payload,
                               authority_state=excluded.authority_state,sha256=excluded.sha256,updated_at=excluded.updated_at""",
                            (aid, pid, a["kind"], a["title"], rel, json.dumps(payload, ensure_ascii=False), a["authorityState"], sha, a["createdAt"], now))
                index_artifact(con, a); add_receipt(con, pid, "artifact.upsert", "human-or-tool", a); con.commit(); con.close()
                write_registry_snapshot()
                json_response(self, 200, {"ok": True, "artifact": a}); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/sessions"):
                pid = u.path.split("/")[3]; x = body_json(self); sid = x.get("id") or str(uuid.uuid4()); now = utc()
                con = connect()
                con.execute("INSERT OR REPLACE INTO sessions VALUES(?,?,?,?,?,?,?,?)", (sid, pid, x.get("room", "home"), x.get("summary", ""), json.dumps(x.get("activeConstraints", []), ensure_ascii=False), x.get("nextAction", ""), x.get("createdAt", now), x.get("closedAt")))
                add_receipt(con, pid, "session.save", "human", x); con.commit(); con.close()
                json_response(self, 200, {"ok": True, "id": sid}); return
            if u.path == "/api/files":
                x = body_json(self); rel = x.get("path", ""); content = x.get("content", "")
                p = (PROJECTS / rel).resolve()
                if PROJECTS.resolve() not in p.parents:
                    json_response(self, 400, {"error": "unsafe path"}); return
                p.parent.mkdir(parents=True, exist_ok=True); p.write_text(content, encoding="utf-8")
                json_response(self, 200, {"ok": True, "path": rel}); return
            if u.path == "/api/import-folder":
                x = body_json(self); source = Path(x.get("path", "")).expanduser().resolve(); pid = safe_id(x.get("projectId", "imported-project"))
                if not source.exists() or not source.is_dir():
                    json_response(self, 400, {"error": "folder not found"}); return
                dest = project_dir(pid) / "imports" / f"{source.name}-{int(time.time())}"
                dest.parent.mkdir(exist_ok=True); skipped = []; con = connect(); count = 0
                for f in source.rglob("*"):
                    skip, reason = should_skip_import_path(f)
                    if skip:
                        if f.is_file():
                            skipped.append({"path": str(f), "reason": reason})
                        continue
                    if f.is_file():
                        rel_source = f.relative_to(source)
                        target = dest / rel_source; target.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(f, target)
                        rel = str(target.relative_to(project_dir(pid))).replace("\\", "/")
                        aid = str(uuid.uuid4()); now = utc(); kind = f.suffix.lower().lstrip(".") or "file"
                        sha = hashlib.sha256(target.read_bytes()).hexdigest()
                        payload = {"size": target.stat().st_size, "sourcePath": str(f), "importedPath": rel}
                        con.execute("INSERT INTO artifacts VALUES(?,?,?,?,?,?,?,?,?,?)", (aid, pid, kind, target.name, rel, json.dumps(payload), "SOURCE", sha, now, now))
                        index_artifact(con, {"id": aid, "projectId": pid, "title": target.name, "kind": kind, "payload": payload})
                        count += 1
                add_receipt(con, pid, "folder.import", "human", {"source": str(source), "count": count, "skipped": skipped[:500]}); con.commit(); con.close()
                write_registry_snapshot()
                json_response(self, 200, {"ok": True, "count": count, "skipped": skipped, "destination": str(dest)}); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/capsule"):
                pid = u.path.split("/")[3]; p = project_dir(pid); out = BACKUPS / f"{pid}-{int(time.time())}.zip"
                write_registry_snapshot()
                with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
                    for f in p.rglob("*"):
                        if f.is_file(): z.write(f, f.relative_to(p.parent))
                    for f in REGISTRY.glob("*.json"):
                        z.write(f, Path("artifact-registry") / f.name)
                    con = connect()
                    snapshot = {
                        "project": [dict(r) for r in con.execute("SELECT * FROM projects WHERE id=?", (pid,)).fetchall()],
                        "artifacts": [dict(r) for r in con.execute("SELECT * FROM artifacts WHERE project_id=?", (pid,)).fetchall()],
                        "sessions": [dict(r) for r in con.execute("SELECT * FROM sessions WHERE project_id=?", (pid,)).fetchall()],
                        "receipts": [dict(r) for r in con.execute("SELECT * FROM receipts WHERE project_id=?", (pid,)).fetchall()],
                    }; con.close()
                    z.writestr(f"{pid}/database-snapshot.json", json.dumps(snapshot, indent=2))
                    z.writestr(f"{pid}/RESTORE.md", "Restore by copying project files back under data/projects and importing artifact-registry JSON if needed.\n")
                json_response(self, 200, {"ok": True, "path": str(out)}); return
            if u.path == "/api/ai/chat":
                x = body_json(self); endpoint = x.get("endpoint", ""); model = x.get("model", ""); key = x.get("apiKey", "")
                ok, reason = allowed_ai_endpoint(endpoint)
                if not ok:
                    json_response(self, 400, {"error": reason}); return
                if not endpoint or not model:
                    json_response(self, 400, {"error": "endpoint and model required"}); return
                payload = json.dumps({"model": model, "messages": x.get("messages", []), "temperature": x.get("temperature", 0.8)}).encode()
                req = urllib.request.Request(endpoint, data=payload, headers={"Content-Type": "application/json"})
                if key: req.add_header("Authorization", f"Bearer {key}")
                try:
                    with urllib.request.urlopen(req, timeout=120) as r:
                        data = json.loads(r.read().decode())
                    text = (data.get("choices") or [{}])[0].get("message", {}).get("content") or data.get("response", "")
                    json_response(self, 200, {"ok": True, "text": text}); return
                except Exception as e:
                    json_response(self, 502, {"error": str(e)}); return
            if u.path == "/api/generation/jobs":
                x = body_json(self); pid = x.get("projectId", "")
                out = create_generation_job(pid, x)
                if not out.get("ok"):
                    json_response(self, 400, out); return
                job = out["job"]; now = utc(); con = connect()
                con.execute("INSERT INTO jobs VALUES(?,?,?,?,?,?,?,?)", (job["id"], pid, job["operation"], job["status"], json.dumps(job["request"], ensure_ascii=False), json.dumps(job["result"], ensure_ascii=False), now, now))
                add_receipt(con, pid, "generation.job.queued", "human", job); con.commit(); con.close()
                json_response(self, 200, {"ok": True, "id": job["id"], "status": job["status"]}); return
            if u.path == "/api/jobs":
                x = body_json(self); jid = str(uuid.uuid4()); now = utc()
                con = connect(); con.execute("INSERT INTO jobs VALUES(?,?,?,?,?,?,?,?)", (jid, x.get("projectId", ""), x.get("operation", "unknown"), "queued", json.dumps(x), "{}", now, now)); con.commit(); con.close()
                json_response(self, 200, {"ok": True, "id": jid, "status": "queued"}); return
            json_response(self, 404, {"error": "not found"})
        except ValueError as e:
            json_response(self, 400, {"error": str(e)})
        except Exception as e:
            json_response(self, 500, {"error": str(e)})

    def do_DELETE(self):
        if not require_local_request(self):
            return
        u = urllib.parse.urlparse(self.path)
        try:
            if u.path.startswith("/api/artifacts/"):
                aid = u.path.rsplit("/", 1)[-1]; con = connect()
                r = con.execute("SELECT project_id FROM artifacts WHERE id=?", (aid,)).fetchone()
                if r:
                    add_receipt(con, r["project_id"], "artifact.delete", "human", {"id": aid})
                con.execute("DELETE FROM artifacts WHERE id=?", (aid,)); con.execute("DELETE FROM artifact_search WHERE id=?", (aid,)); con.commit(); con.close()
                write_registry_snapshot()
                json_response(self, 200, {"ok": True}); return
            json_response(self, 404, {"error": "not found"})
        except Exception as e:
            json_response(self, 500, {"error": str(e)})


if __name__ == "__main__":
    connect().close()
    print(f"Twis Holo Workshop: http://{HOST}:{PORT}")
    print(f"Local projects: {PROJECTS}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
