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
from flashriver_intake import stage_flashriver_package

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
DATA = ROOT / "data"
PROJECTS = DATA / "projects"
IMPORTS = DATA / "imports"
BACKUPS = DATA / "backups"
SOURCE_ARCHIVES = DATA / "source_archives"
REGISTRY = ROOT / "artifact-registry"
DB = Path(os.environ.get("TWIS_HOLO_DB", str(DATA / "workshop.sqlite3")))
HOST = "127.0.0.1"
PORT = int(os.environ.get("TWIS_HOLO_PORT", "8787"))

CAPABILITIES = {
    "name": "Twis Holo Local Companion",
    "version": "1.5.0",
    "authoritative": True,
    "storage": ["local-project-folders", "sqlite", "fts5", "sha256", "artifact-registry-json", "local-source-archives"],
    "rooms": ["talk", "write", "music", "image", "video", "research", "code", "import", "modules"],
    "adapters": {
        "ai": ["built-in-fallback", "approved-openai-compatible-endpoint"],
        "generation": ["builtin-canvas", "builtin-storyboard", "local-comfyui-disabled", "video-generation-bridges-disabled"],
        "protocols": ["mcp-policy-gated", "ag-ui-event-contract", "a2a-card-gated"],
        "cloud": ["cloudflare-remote-hull-optional"],
        "sourceArchive": ["flashriver-intake-local"],
    },
    "permissions": {
        "default": "deny-dangerous-actions",
        "requiresHumanApproval": [
            "delete-permanent-source", "publish", "spend-money", "run-shell-command",
            "invoke-external-tool", "send-private-memory", "approve-canon", "submit-generation-job",
        ],
    },
}

SECURITY_POLICY = {
    "localCompanion": {
        "host": HOST,
        "hostOriginChecks": True,
        "jsonBodyLimit": os.environ.get("TWIS_HOLO_MAX_JSON_BODY", str(2 * 1024 * 1024)),
        "projectFileWrites": "project-derived-path-only-with-receipt",
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
    "sourceArchives": {
        "rawArchivesStayLocal": True,
        "nestedSourceZipsStayLocal": True,
        "publicGitHubGetsOnlySafeCodeDocsTests": True,
        "cloudflareAuthority": False,
        "receiptRequired": True,
        "symlinksSkipped": True,
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

for p in (PROJECTS, IMPORTS, BACKUPS, SOURCE_ARCHIVES, REGISTRY):
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
          created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          revision_number INTEGER NOT NULL DEFAULT 0,
          current_revision_id TEXT NOT NULL DEFAULT '',
          review_state TEXT NOT NULL DEFAULT 'UNREVIEWED',
          retired_at TEXT
        );
        CREATE TABLE IF NOT EXISTS artifact_revisions(
          id TEXT PRIMARY KEY,
          artifact_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          revision_number INTEGER NOT NULL,
          parent_revision_id TEXT,
          snapshot_sha256 TEXT NOT NULL,
          title TEXT NOT NULL,
          kind TEXT NOT NULL,
          authority_state TEXT NOT NULL,
          review_state TEXT NOT NULL DEFAULT 'UNREVIEWED',
          path TEXT NOT NULL DEFAULT '',
          payload TEXT NOT NULL DEFAULT '{}',
          snapshot_json TEXT NOT NULL,
          created_at TEXT NOT NULL,
          actor TEXT NOT NULL DEFAULT 'human-or-tool',
          UNIQUE(artifact_id, revision_number)
        );
        CREATE TABLE IF NOT EXISTS artifact_reviews(
          id TEXT PRIMARY KEY,
          artifact_id TEXT NOT NULL,
          project_id TEXT NOT NULL,
          revision_number INTEGER NOT NULL,
          from_review_state TEXT NOT NULL,
          to_review_state TEXT NOT NULL,
          decision TEXT NOT NULL,
          reason TEXT NOT NULL DEFAULT '',
          created_at TEXT NOT NULL,
          actor TEXT NOT NULL DEFAULT 'human'
        );
        CREATE TRIGGER IF NOT EXISTS artifact_reviews_no_update
        BEFORE UPDATE ON artifact_reviews BEGIN
          SELECT RAISE(ABORT, 'artifact reviews are immutable');
        END;
        CREATE TRIGGER IF NOT EXISTS artifact_reviews_no_delete
        BEFORE DELETE ON artifact_reviews BEGIN
          SELECT RAISE(ABORT, 'artifact reviews are immutable');
        END;
        CREATE TRIGGER IF NOT EXISTS artifact_revisions_no_update
        BEFORE UPDATE ON artifact_revisions BEGIN
          SELECT RAISE(ABORT, 'artifact revisions are immutable');
        END;
        CREATE TRIGGER IF NOT EXISTS artifact_revisions_no_delete
        BEFORE DELETE ON artifact_revisions BEGIN
          SELECT RAISE(ABORT, 'artifact revisions are immutable');
        END;
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
    # Older databases need additive columns because CREATE TABLE IF NOT EXISTS
    # does not alter an existing table.
    cols = {r["name"] for r in con.execute("PRAGMA table_info(artifacts)").fetchall()}
    if "revision_number" not in cols:
        con.execute("ALTER TABLE artifacts ADD COLUMN revision_number INTEGER NOT NULL DEFAULT 0")
    if "current_revision_id" not in cols:
        con.execute("ALTER TABLE artifacts ADD COLUMN current_revision_id TEXT NOT NULL DEFAULT ''")
    if "review_state" not in cols:
        con.execute("ALTER TABLE artifacts ADD COLUMN review_state TEXT NOT NULL DEFAULT 'UNREVIEWED'")
    if "retired_at" not in cols:
        con.execute("ALTER TABLE artifacts ADD COLUMN retired_at TEXT")
    rev_cols = {r["name"] for r in con.execute("PRAGMA table_info(artifact_revisions)").fetchall()}
    if "review_state" not in rev_cols:
        con.execute("ALTER TABLE artifact_revisions ADD COLUMN review_state TEXT NOT NULL DEFAULT 'UNREVIEWED'")
    con.commit()
    backfill_artifact_revisions(con)
    return con


def json_response(handler, status: int, data: Any):
    safe_json_response(handler, status, data)


def body_json(handler) -> Any:
    return read_json_body(handler)


def project_dir(project_id: str) -> Path:
    pid = safe_id(project_id)
    p = (PROJECTS / pid).resolve()
    if PROJECTS.resolve() not in p.parents:
        raise ValueError("unsafe project path")
    p.mkdir(parents=True, exist_ok=True)
    for name in ("artifacts", "media", "sources", "drafts", "receipts", "sessions", "code", "imports"):
        (p / name).mkdir(exist_ok=True)
    return p


def resolve_project_relative(project_id: str, rel: str) -> Path:
    if not rel or Path(rel).is_absolute():
        raise ValueError("project-relative path required")
    root = project_dir(project_id).resolve()
    p = (root / rel).resolve()
    if p == root or root not in p.parents:
        raise ValueError("unsafe project-relative path")
    return p


def resolve_projects_path(rel: str) -> tuple[str, Path]:
    if not rel or Path(rel).is_absolute():
        raise ValueError("project path required")
    parts = Path(rel).parts
    if len(parts) < 2 or parts[0] in {"", ".", ".."}:
        raise ValueError("path must include project id and a file path")
    pid = safe_id(parts[0])
    if pid != parts[0]:
        raise ValueError("invalid project id in path")
    root = project_dir(pid).resolve()
    p = (PROJECTS / rel).resolve()
    if p == root or root not in p.parents:
        raise ValueError("path escapes project boundary")
    return pid, p


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def index_artifact(con, a):
    content = f'{a["title"]} {a["kind"]} {json.dumps(a.get("payload", {}), ensure_ascii=False)}'
    con.execute("DELETE FROM artifact_search WHERE id=?", (a["id"],))
    if not a.get("retiredAt"):
        con.execute(
            "INSERT INTO artifact_search(id,project_id,title,kind,content) VALUES(?,?,?,?,?)",
            (a["id"], a["projectId"], a["title"], a["kind"], content),
        )


def normalized_artifact_snapshot(a: dict[str, Any]) -> dict[str, Any]:
    return {
        "artifactId": a["id"],
        "projectId": a["projectId"],
        "title": a["title"],
        "kind": a["kind"],
        "path": a.get("path", ""),
        "payload": a.get("payload", {}),
        "authorityState": a.get("authorityState", "DRAFT"),
        "reviewState": a.get("reviewState", "UNREVIEWED"),
        "retiredAt": a.get("retiredAt"),
    }


def snapshot_sha256(snapshot: dict[str, Any]) -> str:
    raw = json.dumps(snapshot, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def insert_revision(con, artifact: dict[str, Any], revision_number: int, parent_revision_id: str | None, actor: str) -> dict[str, Any]:
    rid = str(uuid.uuid4())
    snapshot = normalized_artifact_snapshot(artifact)
    digest = snapshot_sha256(snapshot)
    con.execute(
        """INSERT INTO artifact_revisions(
             id,artifact_id,project_id,revision_number,parent_revision_id,snapshot_sha256,
             title,kind,authority_state,review_state,path,payload,snapshot_json,created_at,actor
           ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            rid, artifact["id"], artifact["projectId"], revision_number, parent_revision_id, digest,
            artifact["title"], artifact["kind"], artifact.get("authorityState", "DRAFT"),
            artifact.get("reviewState", "UNREVIEWED"),
            artifact.get("path", ""), json.dumps(artifact.get("payload", {}), ensure_ascii=False),
            json.dumps(snapshot, ensure_ascii=False, sort_keys=True), utc(), actor,
        ),
    )
    return {"id": rid, "revisionNumber": revision_number, "snapshotSha256": digest}


def backfill_artifact_revisions(con) -> None:
    rows = con.execute("SELECT * FROM artifacts WHERE revision_number=0 OR current_revision_id=''").fetchall()
    if not rows:
        return
    try:
        con.execute("BEGIN")
        for r in rows:
            d = dict(r)
            artifact = {
                "id": d["id"], "projectId": d["project_id"], "kind": d["kind"], "title": d["title"],
                "path": d["path"], "payload": json.loads(d["payload"]), "authorityState": d["authority_state"],
                "reviewState": d.get("review_state") or "UNREVIEWED", "retiredAt": d.get("retired_at"),
            }
            rev = insert_revision(con, artifact, 1, None, "migration")
            con.execute(
                "UPDATE artifacts SET revision_number=1,current_revision_id=? WHERE id=?",
                (rev["id"], d["id"]),
            )
            add_receipt(con, d["project_id"], "artifact.revision.backfill", "system", {
                "artifactId": d["id"], "revisionNumber": 1, "snapshotSha256": rev["snapshotSha256"]
            })
        con.commit()
    except Exception:
        con.rollback()
        raise


def add_receipt(con, project_id, action, actor, details):
    con.execute(
        "INSERT INTO receipts VALUES(?,?,?,?,?,?)",
        (str(uuid.uuid4()), project_id, action, actor, json.dumps(details, ensure_ascii=False), utc()),
    )


def upsert_project(con, pid: str, title: str, description: str = "", next_action: str = "") -> None:
    now = utc()
    con.execute(
        """INSERT INTO projects(id,title,description,next_action,created_at,updated_at)
           VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
           title=excluded.title, description=excluded.description, next_action=excluded.next_action, updated_at=excluded.updated_at""",
        (pid, title, description, next_action, now, now),
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


def save_artifact_row(
    con,
    artifact: dict[str, Any],
    expected_revision: int = 0,
    actor: str = "human-or-tool",
    action: str = "artifact.upsert",
    inject_failure: bool = False,
) -> dict[str, Any]:
    existing = con.execute("SELECT * FROM artifacts WHERE id=?", (artifact["id"],)).fetchone()
    if existing and existing["project_id"] != artifact["projectId"]:
        raise ValueError("artifact id belongs to a different project")
    if existing:
        current_revision = int(existing["revision_number"])
        if expected_revision != current_revision:
            raise ValueError(f"stale artifact revision: expected {expected_revision}, current {current_revision}")
        revision_number = current_revision + 1
        parent_revision_id = existing["current_revision_id"] or None
        created_at = existing["created_at"]
    else:
        if expected_revision != 0:
            raise ValueError("new artifact expectedRevision must be 0")
        revision_number = 1
        parent_revision_id = None
        created_at = artifact.get("createdAt", utc())

    rev = insert_revision(con, artifact, revision_number, parent_revision_id, actor)
    if inject_failure:
        raise RuntimeError("injected artifact transaction failure")

    con.execute(
        """INSERT INTO artifacts(
             id,project_id,kind,title,path,payload,authority_state,sha256,created_at,updated_at,
             revision_number,current_revision_id,review_state,retired_at
           ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)
           ON CONFLICT(id) DO UPDATE SET
             kind=excluded.kind,title=excluded.title,path=excluded.path,payload=excluded.payload,
             authority_state=excluded.authority_state,sha256=excluded.sha256,updated_at=excluded.updated_at,
             revision_number=excluded.revision_number,current_revision_id=excluded.current_revision_id,
             review_state=excluded.review_state,retired_at=excluded.retired_at""",
        (
            artifact["id"], artifact["projectId"], artifact["kind"], artifact["title"], artifact.get("path", ""),
            json.dumps(artifact.get("payload", {}), ensure_ascii=False), artifact.get("authorityState", "DRAFT"),
            artifact.get("hash", ""), created_at, artifact.get("updatedAt", utc()),
            revision_number, rev["id"], artifact.get("reviewState", "UNREVIEWED"), artifact.get("retiredAt"),
        ),
    )
    index_artifact(con, artifact)
    add_receipt(con, artifact["projectId"], action, actor, {
        "artifactId": artifact["id"], "revisionNumber": revision_number,
        "revisionId": rev["id"], "snapshotSha256": rev["snapshotSha256"],
    })
    return {**rev, "createdAt": created_at}


class Handler(SimpleHTTPRequestHandler):
    server_version = "TwisHoloCompanion/1.5"

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
                pid = safe_id(u.path.split("/")[3]); search = (q.get("q") or [""])[0].strip()
                con = connect()
                if search:
                    try:
                        fts = safe_fts_query(search)
                        rows = con.execute("""SELECT a.* FROM artifacts a JOIN artifact_search s ON s.id=a.id
                                            WHERE a.project_id=? AND a.retired_at IS NULL AND artifact_search MATCH ?
                                            ORDER BY a.updated_at DESC""", (pid, fts)).fetchall() if fts else []
                    except sqlite3.Error:
                        like = f"%{search}%"
                        rows = con.execute("SELECT * FROM artifacts WHERE project_id=? AND retired_at IS NULL AND (title LIKE ? OR kind LIKE ? OR payload LIKE ?) ORDER BY updated_at DESC", (pid, like, like, like)).fetchall()
                else:
                    rows = con.execute("SELECT * FROM artifacts WHERE project_id=? AND retired_at IS NULL ORDER BY updated_at DESC", (pid,)).fetchall()
                con.close()
                out = []
                for r in rows:
                    d = dict(r); d["payload"] = json.loads(d["payload"]); out.append(d)
                json_response(self, 200, out); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/history"):
                parts = u.path.strip("/").split("/")
                if len(parts) == 6 and parts[0] == "api" and parts[1] == "projects" and parts[3] == "artifacts":
                    pid = safe_id(parts[2]); aid = parts[4]
                    con = connect()
                    owner = con.execute("SELECT project_id FROM artifacts WHERE id=?", (aid,)).fetchone()
                    if not owner:
                        con.close(); json_response(self, 404, {"error": "artifact not found"}); return
                    if owner["project_id"] != pid:
                        con.close(); json_response(self, 400, {"error": "artifact does not belong to project"}); return
                    revisions = [dict(r) for r in con.execute(
                        "SELECT * FROM artifact_revisions WHERE artifact_id=? AND project_id=? ORDER BY revision_number DESC",
                        (aid, pid),
                    ).fetchall()]
                    receipts = [dict(r) for r in con.execute(
                        "SELECT * FROM receipts WHERE project_id=? AND details LIKE ? ORDER BY created_at DESC",
                        (pid, f'%"artifactId": "{aid}"%'),
                    ).fetchall()]
                    reviews = [dict(r) for r in con.execute(
                        "SELECT * FROM artifact_reviews WHERE artifact_id=? AND project_id=? ORDER BY created_at DESC",
                        (aid, pid),
                    ).fetchall()]
                    con.close()
                    for rev in revisions:
                        rev["payload"] = json.loads(rev["payload"])
                        rev["snapshot"] = json.loads(rev["snapshot_json"])
                    json_response(self, 200, {"artifactId": aid, "projectId": pid, "revisions": revisions, "receipts": receipts, "reviews": reviews}); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/sessions/latest"):
                pid = safe_id(u.path.split("/")[3]); con = connect()
                r = con.execute("SELECT * FROM sessions WHERE project_id=? ORDER BY created_at DESC LIMIT 1", (pid,)).fetchone(); con.close()
                json_response(self, 200, dict(r) if r else None); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/receipts"):
                pid = safe_id(u.path.split("/")[3]); con = connect()
                rows = con.execute("SELECT * FROM receipts WHERE project_id=? ORDER BY created_at DESC LIMIT 200", (pid,)).fetchall(); con.close()
                json_response(self, 200, [dict(r) for r in rows]); return
            if u.path == "/api/files":
                rel = (q.get("path") or [""])[0]
                _pid, p = resolve_projects_path(rel)
                if not p.exists() or not p.is_file():
                    json_response(self, 404, {"error": "not found"}); return
                try:
                    text = p.read_text(encoding="utf-8")
                    json_response(self, 200, {"path": rel, "content": text})
                except UnicodeDecodeError:
                    json_response(self, 415, {"error": "not text"})
                return
            if u.path == "/api/tree":
                pid = safe_id((q.get("projectId") or [""])[0])
                p = project_dir(pid); files = []
                for f in p.rglob("*"):
                    if f.is_file() and not f.is_symlink():
                        files.append(str(f.relative_to(PROJECTS)).replace("\\", "/"))
                json_response(self, 200, files); return
            if u.path == "/api/modules":
                p = APP / "modules" / "modules.json"
                json_response(self, 200, json.loads(p.read_text(encoding="utf-8"))); return
            if u.path == "/api/jobs":
                con = connect(); rows = con.execute("SELECT * FROM jobs ORDER BY updated_at DESC LIMIT 100").fetchall(); con.close()
                json_response(self, 200, [dict(r) for r in rows]); return
            super().do_GET()
        except ValueError as e:
            json_response(self, 400, {"error": str(e)})
        except Exception as e:
            json_response(self, 500, {"error": str(e)})

    def do_POST(self):
        if not require_local_request(self):
            return
        u = urllib.parse.urlparse(self.path)
        try:
            if u.path == "/api/projects":
                x = body_json(self); pid = safe_id(x.get("id") or x.get("title") or str(uuid.uuid4())); now = utc()
                con = connect(); upsert_project(con, pid, x.get("title", "Untitled"), x.get("description", ""), x.get("nextAction", ""))
                add_receipt(con, pid, "project.upsert", "human", x); con.commit(); con.close()
                pd = project_dir(pid)
                (pd / "project.json").write_text(json.dumps({"id": pid, "title": x.get("title", "Untitled"), "description": x.get("description", ""), "nextAction": x.get("nextAction", ""), "updatedAt": now}, indent=2), encoding="utf-8")
                write_registry_snapshot()
                json_response(self, 200, {"ok": True, "id": pid}); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/artifacts"):
                pid = safe_id(u.path.split("/")[3]); x = body_json(self); now = utc()
                aid = x.get("id") or str(uuid.uuid4()); payload = x.get("payload", {}); rel = x.get("path", ""); sha = ""
                if rel:
                    p = resolve_project_relative(pid, rel)
                    if p.exists() and p.is_file():
                        sha = sha256_file(p)
                requested_authority = x.get("authorityState", "DRAFT")
                if "reviewState" in x:
                    json_response(self, 409, {"error": "review state requires the governed human review route"}); return
                con = connect()
                existing = con.execute("SELECT project_id,authority_state,revision_number FROM artifacts WHERE id=?", (aid,)).fetchone()
                if existing and existing["project_id"] != pid:
                    con.close(); json_response(self, 400, {"error": "artifact id belongs to a different project"}); return
                protected_states = {"SOURCE", "PERMANENT_SOURCE", "CANON"}
                if existing and existing["authority_state"] in protected_states:
                    con.close(); json_response(self, 409, {"error": "protected source/canon cannot be changed through the generic artifact route"}); return
                if requested_authority == "CANON":
                    con.close(); json_response(self, 409, {"error": "Canon promotion requires a governed review route"}); return
                if "expectedRevision" not in x:
                    con.close(); json_response(self, 428, {"error": "expectedRevision is required"}); return
                a = {"id": aid, "projectId": pid, "kind": x.get("kind", "note"), "title": x.get("title", "Untitled"), "path": rel, "payload": payload, "authorityState": requested_authority, "reviewState": (existing["review_state"] if existing and "review_state" in existing.keys() else "UNREVIEWED"), "hash": sha, "createdAt": x.get("createdAt", now), "updatedAt": now, "retiredAt": None}
                try:
                    con.execute("BEGIN")
                    rev = save_artifact_row(
                        con, a, int(x.get("expectedRevision", 0)), "human-or-tool", "artifact.upsert",
                        bool(x.get("_testInjectFailure")) and os.environ.get("TWIS_HOLO_TEST_INJECT_FAILURE") == "1",
                    )
                    con.commit()
                except ValueError as e:
                    con.rollback(); con.close(); json_response(self, 409, {"error": str(e)}); return
                except Exception:
                    con.rollback(); con.close(); raise
                con.close()
                a["revisionNumber"] = rev["revisionNumber"]; a["currentRevisionId"] = rev["id"]; a["snapshotSha256"] = rev["snapshotSha256"]
                write_registry_snapshot()
                json_response(self, 200, {"ok": True, "artifact": a}); return
            if "/artifacts/" in u.path and u.path.endswith("/review"):
                parts = u.path.strip("/").split("/")
                if len(parts) == 6 and parts[0] == "api" and parts[1] == "projects" and parts[3] == "artifacts":
                    pid = safe_id(parts[2]); aid = parts[4]; x = body_json(self)
                    if "expectedRevision" not in x:
                        json_response(self, 428, {"error": "expectedRevision is required"}); return
                    decision = str(x.get("decision", "")).strip().lower()
                    reason = str(x.get("reason", "")).strip()
                    transitions = {
                        ("UNREVIEWED", "candidate"): "CANDIDATE",
                        ("REJECTED", "candidate"): "CANDIDATE",
                        ("APPROVED", "candidate"): "CANDIDATE",
                        ("CANDIDATE", "approve"): "APPROVED",
                        ("CANDIDATE", "reject"): "REJECTED",
                    }
                    con = connect()
                    row = con.execute("SELECT * FROM artifacts WHERE id=?", (aid,)).fetchone()
                    if not row:
                        con.close(); json_response(self, 404, {"error": "artifact not found"}); return
                    if row["project_id"] != pid:
                        con.close(); json_response(self, 400, {"error": "artifact does not belong to project"}); return
                    current_revision = int(row["revision_number"])
                    if int(x.get("expectedRevision")) != current_revision:
                        con.close(); json_response(self, 409, {"error": f"stale artifact revision: expected {x.get('expectedRevision')}, current {current_revision}"}); return
                    from_review = row["review_state"] or "UNREVIEWED"
                    authority_state = row["authority_state"]
                    if decision == "promote_canon":
                        if from_review != "APPROVED":
                            con.close(); json_response(self, 409, {"error": "Canon promotion requires APPROVED human review"}); return
                        if authority_state in {"SOURCE", "PERMANENT_SOURCE"}:
                            con.close(); json_response(self, 409, {"error": "source authority cannot be converted to Canon"}); return
                        to_review = "APPROVED"
                        next_authority = "CANON"
                    else:
                        to_review = transitions.get((from_review, decision))
                        if not to_review:
                            con.close(); json_response(self, 409, {"error": f"invalid review transition: {from_review} -> {decision}"}); return
                        next_authority = authority_state
                    artifact = {
                        "id": row["id"], "projectId": row["project_id"], "kind": row["kind"], "title": row["title"],
                        "path": row["path"], "payload": json.loads(row["payload"]), "authorityState": next_authority,
                        "reviewState": to_review, "hash": row["sha256"], "createdAt": row["created_at"], "updatedAt": utc(),
                        "retiredAt": row["retired_at"],
                    }
                    try:
                        con.execute("BEGIN")
                        rev = save_artifact_row(con, artifact, current_revision, "human", "artifact.review")
                        con.execute(
                            """INSERT INTO artifact_reviews(
                                 id,artifact_id,project_id,revision_number,from_review_state,to_review_state,
                                 decision,reason,created_at,actor
                               ) VALUES(?,?,?,?,?,?,?,?,?,?)""",
                            (str(uuid.uuid4()), aid, pid, rev["revisionNumber"], from_review, to_review,
                             decision, reason, utc(), "human"),
                        )
                        add_receipt(con, pid, "artifact.review.decision", "human", {
                            "artifactId": aid, "decision": decision, "fromReviewState": from_review,
                            "toReviewState": to_review, "authorityState": next_authority,
                            "revisionNumber": rev["revisionNumber"], "reason": reason,
                        })
                        con.commit()
                    except Exception:
                        con.rollback(); con.close(); raise
                    con.close()
                    write_registry_snapshot()
                    json_response(self, 200, {
                        "ok": True, "artifactId": aid, "decision": decision,
                        "reviewState": to_review, "authorityState": next_authority,
                        "revisionNumber": rev["revisionNumber"], "currentRevisionId": rev["id"],
                        "snapshotSha256": rev["snapshotSha256"],
                    }); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/sessions"):
                pid = safe_id(u.path.split("/")[3]); x = body_json(self); sid = x.get("id") or str(uuid.uuid4()); now = utc()
                con = connect()
                con.execute("INSERT OR REPLACE INTO sessions VALUES(?,?,?,?,?,?,?,?)", (sid, pid, x.get("room", "home"), x.get("summary", ""), json.dumps(x.get("activeConstraints", []), ensure_ascii=False), x.get("nextAction", ""), x.get("createdAt", now), x.get("closedAt")))
                add_receipt(con, pid, "session.save", "human", x); con.commit(); con.close()
                json_response(self, 200, {"ok": True, "id": sid}); return
            if u.path == "/api/files":
                x = body_json(self); rel = x.get("path", ""); content = x.get("content", "")
                pid, p = resolve_projects_path(rel)
                requested_pid = x.get("projectId")
                if requested_pid and safe_id(requested_pid) != pid:
                    json_response(self, 400, {"error": "projectId does not match file path"}); return
                old_hash = sha256_file(p) if p.exists() and p.is_file() else ""
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(content, encoding="utf-8")
                new_hash = sha256_file(p)
                con = connect()
                add_receipt(con, pid, "project.file.write", "human", {
                    "path": rel,
                    "oldSha256": old_hash,
                    "newSha256": new_hash,
                    "bytes": len(content.encode("utf-8")),
                })
                con.commit(); con.close()
                write_registry_snapshot()
                json_response(self, 200, {"ok": True, "path": rel, "sha256": new_hash}); return
            if u.path == "/api/import-flashriver":
                x = body_json(self)
                source = Path(x.get("path", "")).expanduser().resolve()
                pid = safe_id(x.get("projectId") or "flashriver-source-archive")
                title = x.get("title") or "FlashRiver Source Archive"
                expected = x.get("expectedSha256") or x.get("expected_sha256") or ""
                pd = project_dir(pid)
                now = utc()
                result = stage_flashriver_package(
                    zip_path=source,
                    project_id=pid,
                    project_root=pd,
                    archive_root=SOURCE_ARCHIVES,
                    expected_sha256=expected or None,
                    now=now,
                )
                con = connect()
                upsert_project(con, pid, title, "Private/local FlashRiver source archive intake", "Review imported source docs in My Work and Artifact Compass")
                for artifact in result["artifacts"]:
                    save_artifact_row(con, artifact)
                add_receipt(con, pid, "flashriver.package.import", "human", {
                    "sourcePath": str(source),
                    "sha256": result["manifest"]["sha256"],
                    "zipTest": result["manifest"]["zipTest"],
                    "publicSafeDocsImported": result["manifest"]["publicSafeDocsImported"],
                    "privateSourcesCopied": len(result["manifest"]["privateSourcesCopied"]),
                    "visualsCopied": len(result["manifest"]["visualsCopied"]),
                    "rawPackageCommittedToGitHub": False,
                    "cloudflareAuthority": False,
                })
                con.commit(); con.close()
                write_registry_snapshot()
                json_response(self, 200, {"ok": True, "projectId": pid, "manifest": result["manifest"], "artifactCount": len(result["artifacts"])}); return
            if u.path == "/api/import-folder":
                x = body_json(self); source = Path(x.get("path", "")).expanduser().resolve(); pid = safe_id(x.get("projectId", "imported-project"))
                if not source.exists() or not source.is_dir():
                    json_response(self, 400, {"error": "folder not found"}); return
                dest = project_dir(pid) / "imports" / f"{source.name}-{int(time.time())}"
                dest.parent.mkdir(exist_ok=True); skipped = []; con = connect(); count = 0
                for f in source.rglob("*"):
                    skip, reason = should_skip_import_path(f)
                    if skip:
                        skipped.append({"path": str(f), "reason": reason})
                        continue
                    if f.is_file():
                        rel_source = f.relative_to(source)
                        target = (dest / rel_source).resolve()
                        if dest.resolve() not in target.parents:
                            skipped.append({"path": str(f), "reason": "resolved target escapes import destination"})
                            continue
                        target.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(f, target)
                        rel = str(target.relative_to(project_dir(pid))).replace("\\", "/")
                        aid = str(uuid.uuid4()); now = utc(); kind = f.suffix.lower().lstrip(".") or "file"
                        sha = sha256_file(target)
                        payload = {"size": target.stat().st_size, "sourcePath": str(f), "importedPath": rel}
                        artifact = {"id": aid, "projectId": pid, "kind": kind, "title": target.name, "path": rel, "payload": payload, "authorityState": "SOURCE", "hash": sha, "createdAt": now, "updatedAt": now}
                        save_artifact_row(con, artifact, 0, "importer", "artifact.import")
                        count += 1
                add_receipt(con, pid, "folder.import", "human", {"source": str(source), "count": count, "skipped": skipped[:500]}); con.commit(); con.close()
                write_registry_snapshot()
                json_response(self, 200, {"ok": True, "count": count, "skipped": skipped, "destination": str(dest)}); return
            if u.path.startswith("/api/projects/") and u.path.endswith("/capsule"):
                pid = safe_id(u.path.split("/")[3]); p = project_dir(pid); out = BACKUPS / f"{pid}-{int(time.time())}.zip"
                write_registry_snapshot()
                with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
                    for f in p.rglob("*"):
                        if f.is_file() and not f.is_symlink():
                            z.write(f, f.relative_to(p.parent))
                    for f in REGISTRY.glob("*.json"):
                        z.write(f, Path("artifact-registry") / f.name)
                    con = connect()
                    snapshot = {
                        "project": [dict(r) for r in con.execute("SELECT * FROM projects WHERE id=?", (pid,)).fetchall()],
                        "artifacts": [dict(r) for r in con.execute("SELECT * FROM artifacts WHERE project_id=?", (pid,)).fetchall()],
                        "artifactRevisions": [dict(r) for r in con.execute("SELECT * FROM artifact_revisions WHERE project_id=? ORDER BY artifact_id,revision_number", (pid,)).fetchall()],
                        "artifactReviews": [dict(r) for r in con.execute("SELECT * FROM artifact_reviews WHERE project_id=? ORDER BY created_at", (pid,)).fetchall()],
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
                x = body_json(self); pid = safe_id(x.get("projectId", ""))
                out = create_generation_job(pid, x)
                if not out.get("ok"):
                    json_response(self, 400, out); return
                job = out["job"]; now = utc(); con = connect()
                con.execute("INSERT INTO jobs VALUES(?,?,?,?,?,?,?,?)", (job["id"], pid, job["operation"], job["status"], json.dumps(job["request"], ensure_ascii=False), json.dumps(job["result"], ensure_ascii=False), now, now))
                add_receipt(con, pid, "generation.job.queued", "human", job); con.commit(); con.close()
                json_response(self, 200, {"ok": True, "id": job["id"], "status": job["status"]}); return
            if u.path == "/api/jobs":
                x = body_json(self); jid = str(uuid.uuid4()); now = utc(); pid = safe_id(x.get("projectId", "unassigned"))
                con = connect(); con.execute("INSERT INTO jobs VALUES(?,?,?,?,?,?,?,?)", (jid, pid, x.get("operation", "unknown"), "queued", json.dumps(x), "{}", now, now))
                add_receipt(con, pid, "job.queued", "human-or-tool", {"id": jid, "operation": x.get("operation", "unknown")})
                con.commit(); con.close()
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
                aid = u.path.rsplit("/", 1)[-1]
                q = urllib.parse.parse_qs(u.query)
                raw_expected = (q.get("expectedRevision") or [None])[0]
                if raw_expected is None:
                    json_response(self, 428, {"error": "expectedRevision is required"}); return
                con = connect()
                r = con.execute("SELECT * FROM artifacts WHERE id=?", (aid,)).fetchone()
                if not r:
                    con.close(); json_response(self, 404, {"error": "artifact not found"}); return
                if r["authority_state"] in {"SOURCE", "PERMANENT_SOURCE", "CANON"}:
                    con.close(); json_response(self, 409, {"error": "protected source/canon cannot be retired through the generic route"}); return
                artifact = {
                    "id": r["id"], "projectId": r["project_id"], "kind": r["kind"], "title": r["title"],
                    "path": r["path"], "payload": json.loads(r["payload"]), "authorityState": "RETIRED",
                    "reviewState": r["review_state"] or "UNREVIEWED",
                    "hash": r["sha256"], "createdAt": r["created_at"], "updatedAt": utc(), "retiredAt": utc(),
                }
                try:
                    con.execute("BEGIN")
                    rev = save_artifact_row(con, artifact, int(raw_expected), "human", "artifact.retire")
                    con.commit()
                except ValueError as e:
                    con.rollback(); con.close(); json_response(self, 409, {"error": str(e)}); return
                except Exception:
                    con.rollback(); con.close(); raise
                con.close()
                write_registry_snapshot()
                json_response(self, 200, {"ok": True, "revisionNumber": rev["revisionNumber"], "retired": True}); return
            json_response(self, 404, {"error": "not found"})
        except Exception as e:
            json_response(self, 500, {"error": str(e)})


if __name__ == "__main__":
    connect().close()
    print(f"Twis Holo Workshop: http://{HOST}:{PORT}")
    print(f"Local projects: {PROJECTS}")
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
