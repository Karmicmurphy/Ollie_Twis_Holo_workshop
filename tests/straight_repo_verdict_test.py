from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_straight_repo_verdict_has_build_and_deploy_proof_steps():
    doc = (ROOT / "docs" / "STRAIGHT_REPO_VERDICT.md").read_text(encoding="utf-8")
    assert "npm install" in doc
    assert "npm run build" in doc
    assert "python -m pytest tests" in doc
    assert "wrangler pages deploy dist" in doc
    assert "Not magically solved" in doc
