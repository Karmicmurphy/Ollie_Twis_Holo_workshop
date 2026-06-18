from pathlib import Path
import json, py_compile
ROOT=Path(__file__).resolve().parents[1]
assert (ROOT/"app/index.html").exists()
assert (ROOT/"companion/server.py").exists()
assert (ROOT/"cloudflare/src/worker.js").exists()
assert (ROOT/"docs/PROTOCOL_SECURITY.md").exists()
assert (ROOT/"CURRENT_UPGRADE_PASS_2026-06-18.md").exists()
json.loads((ROOT/"app/modules/modules.json").read_text())
json.loads((ROOT/"skills/skills.json").read_text())
py_compile.compile(str(ROOT/"companion/server.py"),doraise=True)
print("Twis Holo smoke test PASS")
