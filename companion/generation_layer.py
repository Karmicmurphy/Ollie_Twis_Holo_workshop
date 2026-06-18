from __future__ import annotations

import json
import os
import time
import uuid
import urllib.parse
from pathlib import Path
from typing import Any

GENERATION_TYPES = {
    "text-to-image",
    "image-to-image",
    "inpaint",
    "upscale",
    "text-to-video",
    "image-to-video",
    "video-to-video",
    "storyboard-to-shots",
    "shot-plan",
    "animation-plan",
}

DANGEROUS_FIELDS = {"apikey", "api_key", "secret", "token", "password", "authorization"}


def _remote_generation_enabled() -> bool:
    return os.environ.get("TWIS_HOLO_ALLOW_REMOTE_GENERATION", "").strip().lower() in {"1", "true", "yes"}


def _remote_generation_hosts() -> set[str]:
    raw = os.environ.get("TWIS_HOLO_REMOTE_GENERATION_HOSTS", "")
    return {h.strip().lower() for h in raw.split(",") if h.strip()}


def load_generation_adapters(root: Path) -> dict[str, Any]:
    p = root / "app" / "modules" / "generation-adapters.json"
    if not p.exists():
        return {"schemaVersion": "0.1", "adapters": []}
    return json.loads(p.read_text(encoding="utf-8"))


def scrub_generation_request(data: Any) -> Any:
    if isinstance(data, dict):
        clean = {}
        for k, v in data.items():
            clean[k] = "[REDACTED]" if str(k).lower() in DANGEROUS_FIELDS else scrub_generation_request(v)
        return clean
    if isinstance(data, list):
        return [scrub_generation_request(v) for v in data]
    return data


def validate_generation_request(data: dict[str, Any]) -> tuple[bool, str]:
    gtype = data.get("type")
    if gtype not in GENERATION_TYPES:
        return False, f"unsupported generation type: {gtype}"
    if not data.get("adapterId"):
        return False, "adapterId required"
    if data.get("confirmed") is not True:
        return False, "human confirmation required"
    return True, "ok"


def endpoint_is_allowed(endpoint: str, data: dict[str, Any] | None = None) -> tuple[bool, str]:
    if not endpoint:
        return True, "no endpoint supplied"
    try:
        u = urllib.parse.urlparse(endpoint)
    except Exception:
        return False, "invalid endpoint"

    if u.hostname in {"127.0.0.1", "localhost"} and u.scheme in {"http", "https"}:
        return True, "local generation endpoint"

    if u.scheme == "https":
        host = (u.hostname or "").lower()
        if not _remote_generation_enabled():
            return False, "remote generation endpoints are disabled by default; set TWIS_HOLO_ALLOW_REMOTE_GENERATION=1 and TWIS_HOLO_REMOTE_GENERATION_HOSTS to allow one"
        allowed_hosts = _remote_generation_hosts()
        if not allowed_hosts or host not in allowed_hosts:
            return False, "remote generation endpoint host is not in TWIS_HOLO_REMOTE_GENERATION_HOSTS"
        if data and data.get("costWarningAccepted") is not True:
            return False, "remote generation requires explicit costWarningAccepted=true"
        return True, "explicitly allowlisted remote generation endpoint"

    return False, "generation endpoint must be localhost HTTP/HTTPS by default"


def create_generation_job(project_id: str, data: dict[str, Any]) -> dict[str, Any]:
    ok, reason = validate_generation_request(data)
    if not ok:
        return {"ok": False, "error": reason}
    endpoint_ok, endpoint_reason = endpoint_is_allowed(data.get("endpoint", ""), data)
    if not endpoint_ok:
        return {"ok": False, "error": endpoint_reason}
    now = int(time.time())
    return {
        "ok": True,
        "job": {
            "id": str(uuid.uuid4()),
            "projectId": project_id,
            "operation": data.get("type"),
            "adapterId": data.get("adapterId"),
            "status": "queued-for-human-controlled-adapter",
            "createdAt": now,
            "updatedAt": now,
            "request": scrub_generation_request(data),
            "result": {},
            "receiptRequired": True,
            "sourceAuthority": False,
        },
    }
