from __future__ import annotations
import base64, hashlib, json, mimetypes, os, shutil, sqlite3, subprocess, sys, threading, time, urllib.parse, urllib.request, uuid, zipfile
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "app"
DATA = ROOT / "data"
PROJECTS = DATA / "projects"
IMPORTS = DATA / "imports"
BACKUPS = DATA / "backups"
DB = DATA / "workshop.sqlite3"
HOST = "127.0.0.1"
PORT = int(os.environ.get("TWIS_HOLO_PORT", "8787"))

CAPABILITIES = {
    "name": "Twis Holo Local Companion",
    "version": "1.1.0",
    "authoritative": True,
    "storage": ["local-project-folders", "sqlite", "fts5", "sha256"],
    "rooms": ["talk", "write", "music", "image", "video", "research", "code", "import", "modules"],
    "adapters": {
        "ai": ["built-in-fallback", "openai-compatible-endpoint"],
        "protocols": ["mcp-policy-gated", "ag-ui-event-contract", "a2ui-surface-contract"],
        "cloud": ["cloudflare-remote-hull-optional"]
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
            "approve-canon"
        ]
    }
}

SECURITY_POLICY = {
    "mcp": {
        "mode": "deny-by-default",
        "toolMetadataTrusted": False,
        "requireStaticReview": True,
        "requireHumanApprovalForInvocation": True,
        "blockedByDefault": ["shell", "network-exfiltration", "credential-read", "filesystem-write-outside-project"],
        "receiptRequired": True
    },
    "cloudflare": {
        "authoritative": False,
        "writesRequireTokenWhenConfigured": True,
        "localProjectRemainsSourceOfTruth": True
    },
    "ai": {
        "advisoryOnly": True,
        "cannotApproveCanon": True,
        "cannotDeletePermanentSource": True,
        "cannotSpendMoney": True
    }
}

for p in (PROJECTS, IMPORTS, BACKUPS):
    p.mkdir(parents=True, exist_ok=True)

def utc() -> str:
    return datetime.now(timezone.utc).isoformat()

def safe_id(value: str) -> str:
    out = "".join(c if c.isalnum() or c in "-_" else "-" for c in value.strip().lower())
    return out.strip("-") or str(uuid.uuid4())

def connect() -> sqlite3.Connection:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    con.executescript("""
    PRAGMA journal_mode=WAL;
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
    """)
    con.commit()
    return con

def json_response(handler, status: int, data: Any):
    body = json.dumps(data, ensure_ascii=False).encode()
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)

def body_json(handler) -> Any:
    n = int(handler.headers.get("Content-Length", "0"))
    raw = handler.rfile.read(n) if n else b"{}"
    return json.loads(raw.decode("utf-8"))

def project_dir(project_id: str) -> Path:
    p = (PROJECTS / safe_id(project_id)).resolve()
    if PROJECTS.resolve() not in p.parents and p != PROJECTS.resolve():
        raise ValueError("unsafe path")
    p.mkdir(parents=True, exist_ok=True)
    for name in ("artifacts","media","sources","drafts","receipts","sessions","code"):
        (p/name).mkdir(exist_ok=True)
    return p

def index_artifact(con, a):
    content = f'{a["title"]} {a["kind"]} {json.dumps(a.get("payload",{}), ensure_ascii=False)}'
    con.execute("DELETE FROM artifact_search WHERE id=?", (a["id"],))
    con.execute("INSERT INTO artifact_search(id,project_id,title,kind,content) VALUES(?,?,?,?,?)",
                (a["id"],a["projectId"],a["title"],a["kind"],content))

def add_receipt(con, project_id, action, actor, details):
    con.execute("INSERT INTO receipts VALUES(?,?,?,?,?,?)",
                (str(uuid.uuid4()),project_id,action,actor,json.dumps(details,ensure_ascii=False),utc()))

class Handler(SimpleHTTPRequestHandler):
    server_version = "TwisHoloCompanion/1.0"

    def translate_path(self, path):
        clean = urllib.parse.urlparse(path).path
        if clean.startswith("/api/"):
            return str(APP / "__api__")
        if clean == "/":
            clean = "/index.html"
        return str(APP / clean.lstrip("/"))

    def do_GET(self):
        u = urllib.parse.urlparse(self.path)
        q = urllib.parse.parse_qs(u.query)
        if u.path == "/api/health":
            json_response(self,200,{"ok":True,"mode":"local-companion","sqlite":str(DB),"projects":str(PROJECTS),"version":CAPABILITIES["version"]})
            return
        if u.path == "/api/capabilities":
            json_response(self,200,CAPABILITIES)
            return
        if u.path == "/api/security-policy":
            json_response(self,200,SECURITY_POLICY)
            return
        if u.path == "/api/projects":
            con=connect(); rows=con.execute("SELECT * FROM projects ORDER BY updated_at DESC").fetchall(); con.close()
            json_response(self,200,[dict(r) for r in rows]); return
        if u.path.startswith("/api/projects/") and u.path.endswith("/artifacts"):
            pid=u.path.split("/")[3]; search=(q.get("q") or [""])[0].strip()
            con=connect()
            if search:
                rows=con.execute("""SELECT a.* FROM artifacts a JOIN artifact_search s ON s.id=a.id
                                    WHERE a.project_id=? AND artifact_search MATCH ?
                                    ORDER BY a.updated_at DESC""",(pid,search)).fetchall()
            else:
                rows=con.execute("SELECT * FROM artifacts WHERE project_id=? ORDER BY updated_at DESC",(pid,)).fetchall()
            con.close()
            out=[]
            for r in rows:
                d=dict(r); d["payload"]=json.loads(d["payload"]); out.append(d)
            json_response(self,200,out); return
        if u.path.startswith("/api/projects/") and u.path.endswith("/sessions/latest"):
            pid=u.path.split("/")[3]; con=connect()
            r=con.execute("SELECT * FROM sessions WHERE project_id=? ORDER BY created_at DESC LIMIT 1",(pid,)).fetchone(); con.close()
            json_response(self,200,dict(r) if r else None); return
        if u.path.startswith("/api/projects/") and u.path.endswith("/receipts"):
            pid=u.path.split("/")[3]; con=connect()
            rows=con.execute("SELECT * FROM receipts WHERE project_id=? ORDER BY created_at DESC LIMIT 200",(pid,)).fetchall(); con.close()
            json_response(self,200,[dict(r) for r in rows]); return
        if u.path.startswith("/api/files"):
            rel=(q.get("path") or [""])[0]
            p=(PROJECTS/rel).resolve()
            if PROJECTS.resolve() not in p.parents:
                json_response(self,400,{"error":"unsafe path"}); return
            if not p.exists() or not p.is_file():
                json_response(self,404,{"error":"not found"}); return
            try:
                text=p.read_text(encoding="utf-8")
                json_response(self,200,{"path":rel,"content":text})
            except UnicodeDecodeError:
                json_response(self,415,{"error":"not text"}); return
            return
        if u.path == "/api/tree":
            pid=(q.get("projectId") or [""])[0]
            p=project_dir(pid)
            files=[]
            for f in p.rglob("*"):
                if f.is_file():
                    files.append(str(f.relative_to(PROJECTS)).replace("\\","/"))
            json_response(self,200,files); return
        if u.path == "/api/modules":
            p=APP/"modules"/"modules.json"
            json_response(self,200,json.loads(p.read_text(encoding="utf-8"))); return
        if u.path == "/api/jobs":
            con=connect(); rows=con.execute("SELECT * FROM jobs ORDER BY updated_at DESC LIMIT 100").fetchall(); con.close()
            json_response(self,200,[dict(r) for r in rows]); return
        super().do_GET()

    def do_POST(self):
        u=urllib.parse.urlparse(self.path)
        if u.path == "/api/projects":
            x=body_json(self); pid=safe_id(x.get("id") or x.get("title") or str(uuid.uuid4())); now=utc()
            con=connect()
            con.execute("""INSERT INTO projects(id,title,description,next_action,created_at,updated_at)
                           VALUES(?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                           title=excluded.title,description=excluded.description,next_action=excluded.next_action,updated_at=excluded.updated_at""",
                        (pid,x.get("title","Untitled"),x.get("description",""),x.get("nextAction",""),x.get("createdAt",now),now))
            add_receipt(con,pid,"project.upsert","human",x); con.commit(); con.close()
            pd=project_dir(pid)
            (pd/"project.json").write_text(json.dumps({"id":pid,"title":x.get("title","Untitled"),"description":x.get("description",""),"nextAction":x.get("nextAction",""),"updatedAt":now},indent=2),encoding="utf-8")
            json_response(self,200,{"ok":True,"id":pid}); return
        if u.path.startswith("/api/projects/") and u.path.endswith("/artifacts"):
            pid=u.path.split("/")[3]; x=body_json(self); now=utc()
            aid=x.get("id") or str(uuid.uuid4()); payload=x.get("payload",{})
            rel=x.get("path","")
            sha=""
            if rel:
                p=(project_dir(pid)/rel).resolve()
                if p.exists() and p.is_file():
                    sha=hashlib.sha256(p.read_bytes()).hexdigest()
            a={"id":aid,"projectId":pid,"kind":x.get("kind","note"),"title":x.get("title","Untitled"),
               "path":rel,"payload":payload,"authorityState":x.get("authorityState","DRAFT"),
               "hash":sha,"createdAt":x.get("createdAt",now),"updatedAt":now}
            con=connect()
            con.execute("""INSERT INTO artifacts(id,project_id,kind,title,path,payload,authority_state,sha256,created_at,updated_at)
                           VALUES(?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
                           kind=excluded.kind,title=excluded.title,path=excluded.path,payload=excluded.payload,
                           authority_state=excluded.authority_state,sha256=excluded.sha256,updated_at=excluded.updated_at""",
                        (aid,pid,a["kind"],a["title"],rel,json.dumps(payload,ensure_ascii=False),a["authorityState"],sha,a["createdAt"],now))
            index_artifact(con,a); add_receipt(con,pid,"artifact.upsert","human-or-tool",a); con.commit(); con.close()
            json_response(self,200,{"ok":True,"artifact":a}); return
        if u.path.startswith("/api/projects/") and u.path.endswith("/sessions"):
            pid=u.path.split("/")[3]; x=body_json(self); sid=x.get("id") or str(uuid.uuid4()); now=utc()
            con=connect()
            con.execute("INSERT OR REPLACE INTO sessions VALUES(?,?,?,?,?,?,?,?)",
                        (sid,pid,x.get("room","home"),x.get("summary",""),json.dumps(x.get("activeConstraints",[]),ensure_ascii=False),x.get("nextAction",""),x.get("createdAt",now),x.get("closedAt")))
            add_receipt(con,pid,"session.save","human",x); con.commit(); con.close()
            json_response(self,200,{"ok":True,"id":sid}); return
        if u.path == "/api/files":
            x=body_json(self); rel=x.get("path",""); content=x.get("content","")
            p=(PROJECTS/rel).resolve()
            if PROJECTS.resolve() not in p.parents:
                json_response(self,400,{"error":"unsafe path"}); return
            p.parent.mkdir(parents=True,exist_ok=True); p.write_text(content,encoding="utf-8")
            json_response(self,200,{"ok":True,"path":rel}); return
        if u.path == "/api/import-folder":
            x=body_json(self); source=Path(x.get("path","")).expanduser().resolve(); pid=safe_id(x.get("projectId","imported-project"))
            if not source.exists() or not source.is_dir():
                json_response(self,400,{"error":"folder not found"}); return
            dest=project_dir(pid)/"imports"/source.name; dest.parent.mkdir(exist_ok=True)
            if dest.exists(): shutil.rmtree(dest)
            shutil.copytree(source,dest)
            con=connect(); count=0
            for f in dest.rglob("*"):
                if f.is_file():
                    rel=str(f.relative_to(project_dir(pid))).replace("\\","/")
                    aid=str(uuid.uuid4()); now=utc(); kind=f.suffix.lower().lstrip(".") or "file"
                    sha=hashlib.sha256(f.read_bytes()).hexdigest()
                    payload={"size":f.stat().st_size,"sourcePath":str(source),"importedPath":rel}
                    con.execute("INSERT INTO artifacts VALUES(?,?,?,?,?,?,?,?,?,?)",
                                (aid,pid,kind,f.name,rel,json.dumps(payload), "SOURCE",sha,now,now))
                    index_artifact(con,{"id":aid,"projectId":pid,"title":f.name,"kind":kind,"payload":payload})
                    count+=1
            add_receipt(con,pid,"folder.import","human",{"source":str(source),"count":count}); con.commit(); con.close()
            json_response(self,200,{"ok":True,"count":count,"destination":str(dest)}); return
        if u.path.startswith("/api/projects/") and u.path.endswith("/capsule"):
            pid=u.path.split("/")[3]; p=project_dir(pid); out=BACKUPS/f"{pid}-{int(time.time())}.zip"
            with zipfile.ZipFile(out,"w",zipfile.ZIP_DEFLATED) as z:
                for f in p.rglob("*"):
                    if f.is_file(): z.write(f,f.relative_to(p.parent))
                con=connect()
                snapshot={
                    "project":[dict(r) for r in con.execute("SELECT * FROM projects WHERE id=?",(pid,)).fetchall()],
                    "artifacts":[dict(r) for r in con.execute("SELECT * FROM artifacts WHERE project_id=?",(pid,)).fetchall()],
                    "sessions":[dict(r) for r in con.execute("SELECT * FROM sessions WHERE project_id=?",(pid,)).fetchall()],
                    "receipts":[dict(r) for r in con.execute("SELECT * FROM receipts WHERE project_id=?",(pid,)).fetchall()]
                }; con.close()
                z.writestr(f"{pid}/database-snapshot.json",json.dumps(snapshot,indent=2))
            json_response(self,200,{"ok":True,"path":str(out)}); return
        if u.path == "/api/ai/chat":
            x=body_json(self); endpoint=x.get("endpoint",""); model=x.get("model",""); key=x.get("apiKey","")
            if not endpoint or not model:
                json_response(self,400,{"error":"endpoint and model required"}); return
            payload=json.dumps({"model":model,"messages":x.get("messages",[]),"temperature":x.get("temperature",0.8)}).encode()
            req=urllib.request.Request(endpoint,data=payload,headers={"Content-Type":"application/json"})
            if key: req.add_header("Authorization",f"Bearer {key}")
            try:
                with urllib.request.urlopen(req,timeout=120) as r:
                    data=json.loads(r.read().decode())
                text=(data.get("choices") or [{}])[0].get("message",{}).get("content") or data.get("response","")
                json_response(self,200,{"ok":True,"text":text,"raw":data}); return
            except Exception as e:
                json_response(self,502,{"error":str(e)}); return
        if u.path == "/api/jobs":
            x=body_json(self); jid=str(uuid.uuid4()); now=utc()
            con=connect(); con.execute("INSERT INTO jobs VALUES(?,?,?,?,?,?,?,?)",
                (jid,x.get("projectId",""),x.get("operation","unknown"),"queued",json.dumps(x), "{}",now,now)); con.commit(); con.close()
            json_response(self,200,{"ok":True,"id":jid,"status":"queued"}); return
        json_response(self,404,{"error":"not found"})

    def do_DELETE(self):
        u=urllib.parse.urlparse(self.path)
        if u.path.startswith("/api/artifacts/"):
            aid=u.path.rsplit("/",1)[-1]; con=connect()
            r=con.execute("SELECT project_id FROM artifacts WHERE id=?",(aid,)).fetchone()
            if r:
                add_receipt(con,r["project_id"],"artifact.delete","human",{"id":aid})
            con.execute("DELETE FROM artifacts WHERE id=?",(aid,)); con.execute("DELETE FROM artifact_search WHERE id=?",(aid,)); con.commit(); con.close()
            json_response(self,200,{"ok":True}); return
        json_response(self,404,{"error":"not found"})

if __name__ == "__main__":
    connect().close()
    print(f"Twis Holo Workshop: http://{HOST}:{PORT}")
    print(f"Local projects: {PROJECTS}")
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
