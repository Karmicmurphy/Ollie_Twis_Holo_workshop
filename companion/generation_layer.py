from __future__ import annotations

import json
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

DANGEROUS_FIELDS = {"apiKey", "secret", "token", "password"}


def load_generation_adapters(root: Path) -> dict[str, Any]:
    p = root / "app" / "modules" / "generation-adapters.json"
    if not p.exists():
        return {"schemaVersion": "0.1", "adapters": []}
    return json.loads(p.read_text(encoding="utf-8"))


def scrub_generation_request(data: dict[str, Any]) -> dict[str, Any]:
    clean = {}
    for k, v in data.items():
        clean[k] = "[REDACTED]" if k in DANGEROUS_FIELDS else v
    return clean


def validate_generation_request(data: dict[str, Any]) -> tuple[bool, str]:
    gtype = data.get("type")
    if gtype not in GENERATION_TYPES:
        return False, f"unsupported generation type: {gtype}"
    if not data.get("adapterId"):
        return False, "adapterId required"
    if data.get("confirmed") is not True:
        return False, "human confirmation required"
    return True, "ok"


def endpoint_is_allowed(endpoint: str) -> tuple[bool, str]:
    if not endpoint:
        return True, "no endpoint supplied"
    try:
        u = urllib.parse.urlparse(endpoint)
    except Exception:
        return False, "invalid endpoint"
    if u.scheme == "http" and u.hostname in {"127.0.0.1", "localhost"}:
        return True, "local generation endpoint"
    if u.scheme == "https":
        return True, "https generation endpoint"
    return False, "generation endpoint must be localhost HTTP or HTTPS"


def create_generation_job(project_id: str, data: dict[str, Any]) -> dict[str, Any]:
    ok, reason = validate_generation_request(data)
    if not ok:
        return {"ok": False, "error": reason}
    endpoint_ok, endpoint_reason = endpoint_is_allowed(data.get("endpoint", ""))
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
