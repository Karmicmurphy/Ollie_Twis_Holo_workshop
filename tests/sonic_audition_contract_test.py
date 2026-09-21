import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
simple = (ROOT / "app" / "assets" / "twis-simple-perform.js").read_text()
audition = (ROOT / "app" / "sonic-audition.html").read_text()

arc = simple.split("function startProfessionalArc(){", 1)[1].split("async function playSet()", 1)[0]
bars = [int(x) for x in re.findall(r"scheduleBars\((\d+),", arc)]
assert bars == [2, 4, 4, 2, 2], bars
assert "buildBarsLeft=2;" in arc
assert "applySceneNow('PEAK')" in arc

bpm = 124
peak_seconds = sum(bars) * 4 * 60 / bpm
assert 26 <= peak_seconds < 30, peak_seconds

assert "30-SECOND SONIC AUDITION" in audition
assert "TWIS_SIMPLE_PERFORM.playSet()" in audition
assert "TWIS_SIMPLE_PERFORM.startDjSet()" in audition
assert "TWIS_SIMPLE_PERFORM.stop()" in audition
for boundary in ("4000", "12000", "20000", "26000", "30000"):
    assert boundary in audition
assert "serviceWorker.register" not in audition

print(f"Sonic audition contract PASS · PEAK begins at ~{peak_seconds:.1f}s")
