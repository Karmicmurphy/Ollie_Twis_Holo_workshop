from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_audit_patch_log_lists_ci_and_cloudflare_docs():
    doc = (ROOT / "docs" / "AUDIT_PATCH_LOG_2026_06_18.md").read_text(encoding="utf-8")
    assert ".github/workflows/static-contract.yml" in doc
    assert "tests/static_output_contract_test.py" in doc
    assert "docs/CLOUDFLARE_PAGES_DASHBOARD_SETTINGS.md" in doc
    assert "npm run build" in doc
    assert "wrangler pages deploy dist" in doc
