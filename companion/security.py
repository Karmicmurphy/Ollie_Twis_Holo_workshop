from __future__ import annotations

import json
import os
import re
import urllib.parse
from pathlib import Path
from typing import Any

MAX_JSON_BODY_BYTES = int(os.environ.get("TWIS_HOLO_MAX_JSON_BODY", str(2 * 1024 * 1024)))
MAX_IMPORT_FILE_BYTES = int(os.environ.get("TWIS_HOLO_MAX_IMPORT_FILE", str(50 * 1024 * 1024)))

SKIP_DIR_NAMES = {
    ".git", ".hg", ".svn",
    "node_modules", ".venv", "venv", "__pycache__",
    ".cache", ".pytest_cache", ".mypy_cache", ".ruff_cache",
    ".idea", ".vscode",
    ".ssh", ".aws", ".azure", ".config", ".gnupg",
    "AppData", "Application Data",
    "Chrome", "Chromium", "Edge", "Firefox", "BraveSoftware",
}

SECRET_NAME_PATTERNS = [
    re.compile(r"^\.env(\..*)?$", re.I),
    re.compile(r".*secret.*", re.I),
    re.compile(r".*token.*", re.I),
    re.compile(r".*credential.*", re.I),
    re.compile(r".*password.*", re.I),
    re.compile(r".*private.*key.*", re.I),
    re.compile(r".*id_rsa.*", re.I),
    re.compile(r".*id_ed25519.*", re.I),
    re.compile(r".*login data.*", re.I),
    re.compile(r".*cookies.*", re.I),
]


def _expected_port() -> str:
    return os.environ.get("TWIS_HOLO_PORT", "8787")


def _remote_ai_enabled() -> bool:
    return os.environ.get("TWIS_HOLO_ALLOW_REMOTE_AI", "").strip().lower() in {"1", "true", "yes"}


def _remote_ai_hosts() -> set[str]:
    raw = os.environ.get("TWIS_HOLO_REMOTE_AI_HOSTS", "")
    return {h.strip().lower() for h in raw.split(",") if h.strip()}


def json_response(handler, status: int, data: Any) -> None:
    body = json.dumps(data, ensure_ascii=False).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Content-Length", str(len(body)))
    handler.send_header("Cache-Control", "no-store")
    handler.end_headers()
    handler.wfile.write(body)


def allowed_host(host_header: str | None) -> bool:
    if not host_header:
        return True
    host = host_header.split("@")[-1].split(":")[0].strip("[]").lower()
    return host in {"127.0.0.1", "localhost"}


def allowed_origin(origin_header: str | None) -> bool:
    if not origin_header:
        return True
    try:
        u = urllib.parse.urlparse(origin_header)
    except Exception:
        return False
    if u.scheme not in {"http", "https"}:
        return False
    if u.hostname not in {"127.0.0.1", "localhost"}:
        return False
    port = str(u.port or ("443" if u.scheme == "https" else "80"))
    return port in {_expected_port(), "80", "443"}


def require_local_request(handler) -> bool:
    if not allowed_host(handler.headers.get("Host")):
        json_response(handler, 403, {"error": "blocked host"})
        return False
    if handler.command in {"POST", "PUT", "PATCH", "DELETE"} and not allowed_origin(handler.headers.get("Origin")):
        json_response(handler, 403, {"error": "blocked origin"})
        return False
    return True


def read_json_body(handler, limit: int = MAX_JSON_BODY_BYTES) -> Any:
    raw_len = handler.headers.get("Content-Length", "0")
    try:
        n = int(raw_len)
    except ValueError as exc:
        raise ValueError("invalid content length") from exc
    if n > limit:
        raise ValueError(f"request body too large; max {limit} bytes")
    raw = handler.rfile.read(n) if n else b"{}"
    if not raw:
        return {}
    return json.loads(raw.decode("utf-8"))


def is_secret_like(path: Path) -> bool:
    name = path.name
    return any(p.match(name) for p in SECRET_NAME_PATTERNS)


def should_skip_import_path(path: Path) -> tuple[bool, str]:
    parts = set(path.parts)
    for d in SKIP_DIR_NAMES:
        if d in parts:
            return True, f"skipped directory policy: {d}"
    if is_secret_like(path):
        return True, "skipped secret-like filename"
    try:
        if path.is_file() and path.stat().st_size > MAX_IMPORT_FILE_BYTES:
            return True, f"skipped oversized file > {MAX_IMPORT_FILE_BYTES} bytes"
    except OSError:
        return True, "skipped unreadable file"
    return False, ""


def safe_fts_query(text: str) -> str:
    words = re.findall(r"[\w\-]+", text, flags=re.UNICODE)
    return " OR ".join(f'"{w}"' for w in words[:20])


def allowed_ai_endpoint(endpoint: str) -> tuple[bool, str]:
    if not endpoint:
        return False, "empty endpoint"
    try:
        u = urllib.parse.urlparse(endpoint)
    except Exception:
        return False, "invalid endpoint"

    if u.hostname in {"127.0.0.1", "localhost"} and u.scheme in {"http", "https"}:
        return True, "local endpoint"

    if u.scheme == "https":
        host = (u.hostname or "").lower()
        if not _remote_ai_enabled():
            return False, "remote HTTPS AI endpoints are disabled by default; set TWIS_HOLO_ALLOW_REMOTE_AI=1 and TWIS_HOLO_REMOTE_AI_HOSTS to allow one"
        allowed_hosts = _remote_ai_hosts()
        if not allowed_hosts or host not in allowed_hosts:
            return False, "remote AI endpoint host is not in TWIS_HOLO_REMOTE_AI_HOSTS"
        return True, "explicitly allowlisted remote endpoint"

    return False, "only localhost HTTP/HTTPS endpoints are allowed by default"
