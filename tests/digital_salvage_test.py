from pathlib import Path
import importlib.util

ROOT = Path(__file__).resolve().parents[1]
MODULE_PATH = ROOT / "companion" / "digital_salvage.py"

spec = importlib.util.spec_from_file_location("digital_salvage", MODULE_PATH)
digital_salvage = importlib.util.module_from_spec(spec)
assert spec.loader is not None
spec.loader.exec_module(digital_salvage)


def base_candidate():
    return {
        "candidate": {
            "name": "Example archived tool",
            "description": "One narrow mechanism worth studying",
            "abandonmentSignals": ["repository archived"],
        },
        "source": {
            "class": "public_git_repository",
            "url": "https://github.com/example/example",
            "publicRead": True,
            "provenanceAnchor": "commit:abc123",
            "inspectedPaths": ["LICENSE", "README.md"],
        },
        "accessBasis": "public_read",
        "license": {
            "status": "permissive",
            "spdxId": "MIT",
            "evidence": "LICENSE file",
            "obligations": ["preserve license notice"],
        },
        "primitive": {
            "take": "small deterministic scheduling mechanism",
            "doNotTake": ["full application", "hosted service"],
        },
        "runtimeFit": ["local_python"],
        "riskFlags": ["none"],
        "score": {
            "capabilityFit": 22,
            "licenseClarity": 20,
            "extractability": 18,
            "runtimeFit": 13,
            "evidenceQuality": 9,
            "salvageValue": 8,
        },
        "smallestProof": "Reimplement one tiny behavior in a clean-room local test.",
        "handoff": {
            "kind": "local_script",
            "targetRoom": "build",
        },
    }


def test_good_public_permissive_candidate_can_keep():
    card = digital_salvage.build_salvage_card(base_candidate())
    assert card["score"]["total"] == 90
    assert card["verdict"] == "KEEP"
    assert card["handoff"]["humanApprovalRequired"] is True
    assert card["handoff"]["automaticActivation"] is False
    assert digital_salvage.reusable_code_allowed(card) is True


def test_no_license_is_rejected_for_code_salvage():
    candidate = base_candidate()
    candidate["license"] = {"status": "unknown", "spdxId": None, "evidence": "", "obligations": []}
    card = digital_salvage.build_salvage_card(candidate)
    assert card["verdict"] == "REJECT"
    assert digital_salvage.reusable_code_allowed(card) is False


def test_exposed_private_data_is_quarantined_even_if_publicly_reachable():
    candidate = base_candidate()
    candidate["riskFlags"] = ["private_or_exposed_data"]
    card = digital_salvage.build_salvage_card(candidate)
    assert card["verdict"] == "QUARANTINE"
    assert digital_salvage.reusable_code_allowed(card) is False


def test_unknown_or_nonpublic_source_is_rejected():
    candidate = base_candidate()
    candidate["source"]["class"] = "unknown_host"
    card = digital_salvage.build_salvage_card(candidate)
    assert card["verdict"] == "REJECT"


def test_lane_docs_and_skill_registration_exist():
    docs = (ROOT / "docs" / "ARTIFACT_COMPASS_DIGITAL_SALVAGE_LANE_V0_1.md").read_text(encoding="utf-8")
    skills = (ROOT / "skills" / "skills.json").read_text(encoding="utf-8")
    schema = (ROOT / "schemas" / "digital-salvage-card.schema.json").read_text(encoding="utf-8")

    assert "Reachable is not ownerless" in docs
    assert "digital-salvage-expedition" in skills
    assert "twis-digital-salvage-v0.1" in schema
    assert "automaticActivation" in schema
