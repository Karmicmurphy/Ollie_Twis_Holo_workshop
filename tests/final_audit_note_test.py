from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_final_audit_note_contains_required_proof_commands():
    doc = (ROOT / "docs" / "FINAL_AUDIT_NOTE_2026_06_18.md").read_text(encoding="utf-8")
    for phrase in ["npm install", "npm run build", "python -m pytest tests", "wrangler pages deploy dist"]:
        assert phrase in doc
