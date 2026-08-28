"""Bounded Artifact Compass Digital Salvage gate/scorer.

This module intentionally performs no network access, cloning, installation, or execution.
It accepts already-discovered public candidate metadata and produces a governed salvage card.
"""

from __future__ import annotations

from copy import deepcopy
from typing import Any, Dict

SCHEMA_VERSION = "twis-digital-salvage-v0.1"

ALLOWED_SOURCE_CLASSES = {
    "public_git_repository",
    "software_heritage",
    "official_project_site",
    "public_package_registry",
    "academic_or_government_archive",
    "web_archive",
}

ALLOWED_ACCESS_BASIS = {
    "public_read",
    "public_archive",
    "public_domain",
    "owner_permission",
}

LICENSE_OK = {
    "permissive",
    "copyleft",
    "file_copyleft",
    "public_domain",
    "custom",
}

SCORE_LIMITS = {
    "capabilityFit": 25,
    "licenseClarity": 20,
    "extractability": 20,
    "runtimeFit": 15,
    "evidenceQuality": 10,
    "salvageValue": 10,
}

PRIVATE_DATA_RISKS = {
    "private_or_exposed_data",
    "credential_required",
}


def _bounded_int(value: Any, maximum: int) -> int:
    try:
        parsed = int(value)
    except (TypeError, ValueError):
        parsed = 0
    return max(0, min(maximum, parsed))


def score_breakdown(raw: Dict[str, Any]) -> Dict[str, int]:
    """Normalize a score breakdown and compute its total deterministically."""
    score = {name: _bounded_int(raw.get(name, 0), limit) for name, limit in SCORE_LIMITS.items()}
    score["total"] = sum(score.values())
    return score


def verdict_for(card: Dict[str, Any]) -> str:
    """Apply hard gates before score-based ranking."""
    source = card.get("source") or {}
    access_basis = card.get("accessBasis")
    license_info = card.get("license") or {}
    risk_flags = set(card.get("riskFlags") or [])

    if risk_flags & PRIVATE_DATA_RISKS:
        return "QUARANTINE"

    if source.get("class") not in ALLOWED_SOURCE_CLASSES or source.get("publicRead") is not True:
        return "REJECT"

    if access_basis not in ALLOWED_ACCESS_BASIS:
        return "REJECT"

    license_status = license_info.get("status", "unknown")
    if license_status not in LICENSE_OK:
        return "REJECT"

    if license_status == "custom" and not license_info.get("evidence"):
        return "TEST"

    total = int((card.get("score") or {}).get("total", 0))
    if total >= 80:
        return "KEEP"
    if total >= 60:
        return "TEST"
    if total >= 40:
        return "WATCH"
    return "DEFER"


def build_salvage_card(candidate: Dict[str, Any]) -> Dict[str, Any]:
    """Return a normalized governed salvage card from discovered public metadata."""
    card = deepcopy(candidate)
    card["schemaVersion"] = SCHEMA_VERSION
    card["score"] = score_breakdown(card.get("score") or {})

    handoff = deepcopy(card.get("handoff") or {})
    handoff.setdefault("kind", "docs_only")
    handoff.setdefault("targetRoom", None)
    handoff["humanApprovalRequired"] = True
    handoff["automaticActivation"] = False
    card["handoff"] = handoff

    card["verdict"] = verdict_for(card)
    return card


def reusable_code_allowed(card: Dict[str, Any]) -> bool:
    """Return True only when access and license gates permit code reuse review.

    This does not mean the code is approved for integration; it only means it may
    proceed to the normal security/runtime/proof gates.
    """
    return (
        card.get("accessBasis") in ALLOWED_ACCESS_BASIS
        and (card.get("license") or {}).get("status") in LICENSE_OK
        and card.get("verdict") not in {"REJECT", "QUARANTINE"}
    )
