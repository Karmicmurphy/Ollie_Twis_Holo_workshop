from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
import urllib.error
from typing import Any

DEFAULT_FOUNDRY_URL = "http://127.0.0.1:8791"


class FoundryResponseError(RuntimeError):
    def __init__(self, status: int, payload: dict[str, Any]):
        self.status = status
        self.payload = payload
        super().__init__(payload.get("error") or f"Foundry HTTP {status}")


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
    except urllib.error.HTTPError as exc:
        try:
            payload = json.loads(exc.read().decode("utf-8"))
        except Exception:
            payload = {"error": f"Foundry HTTP {exc.code}"}
        if not isinstance(payload, dict):
            payload = {"error": f"Foundry HTTP {exc.code}"}
        raise FoundryResponseError(exc.code, payload) from exc
    except Exception as exc:
        raise RuntimeError(f"Foundry service unavailable: {exc}") from exc
    if not isinstance(data, dict):
        raise RuntimeError("Foundry service returned non-object JSON")
    return data


def compile_human_signal(raw_text: str) -> dict[str, Any]:
    if not isinstance(raw_text, str) or not raw_text.strip():
        raise ValueError("rawText is required")
    return _post("/v1/human-signal", {"raw_text": raw_text})


def route_human_signal(raw_text: str) -> dict[str, Any]:
    """Try the full local semantic route; fall back only when the model is unconfigured."""
    if not isinstance(raw_text, str) or not raw_text.strip():
        raise ValueError("rawText is required")
    try:
        result = _post("/v1/human-signal/compile-job", {"raw_text": raw_text}, timeout=35.0)
        signal = result.get("signal") or {}
        job = result.get("job") or {}
        intent = result.get("intent") or {}
        return {
            "mode": "JOB_COMPILED",
            "signal_id": signal.get("signal_id"),
            "status": signal.get("status"),
            "intent_id": intent.get("intent_id"),
            "job_id": job.get("job_id"),
            "capability_key": job.get("capability_key"),
            "approval_posture": job.get("approval_posture"),
            "detail": result,
        }
    except FoundryResponseError as exc:
        if exc.status != 503 or exc.payload.get("status") != "MODEL_NOT_CONFIGURED":
            raise
        signal = compile_human_signal(raw_text)
        return {
            "mode": "SIGNAL_ONLY",
            "signal_id": signal.get("signal_id"),
            "status": signal.get("status"),
            "intent_id": None,
            "job_id": None,
            "capability_key": None,
            "approval_posture": None,
            "detail": signal,
        }
