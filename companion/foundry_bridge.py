from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from typing import Any

DEFAULT_FOUNDRY_URL = "http://127.0.0.1:8791"


def foundry_base_url() -> str:
    return os.environ.get("TWIS_FOUNDRY_URL", DEFAULT_FOUNDRY_URL).rstrip("/")


def validate_foundry_url(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Foundry URL must use http or https")
    if parsed.hostname not in {"127.0.0.1", "localhost", "::1"}:
        raise ValueError("Foundry bridge v0 is loopback-only")
    if parsed.username or parsed.password:
        raise ValueError("credentials are not allowed in Foundry URL")
    return url.rstrip("/")


def _post(path: str, payload: dict[str, Any], *, timeout: float = 10.0) -> dict[str, Any]:
    base = validate_foundry_url(foundry_base_url())
    req = urllib.request.Request(
        f"{base}{path}",
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "twis-holo-workshop-foundry-bridge/0.1",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as response:
            data = json.loads(response.read().decode("utf-8"))
    except Exception as exc:
        raise RuntimeError(f"Foundry service unavailable: {exc}") from exc
    if not isinstance(data, dict):
        raise RuntimeError("Foundry service returned non-object JSON")
    return data


def compile_human_signal(raw_text: str) -> dict[str, Any]:
    if not isinstance(raw_text, str) or not raw_text.strip():
        raise ValueError("rawText is required")
    return _post("/v1/human-signal", {"raw_text": raw_text})
