from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
pro=(ROOT/'app'/'pro-rig.html').read_text()
loop=(ROOT/'app'/'loop-deck.html').read_text()
core=(ROOT/'app'/'assets'/'twis-loop-core.js').read_text()
engine=(ROOT/'app'/'assets'/'twis-loop-deck-v2.js').read_text()
simple=(ROOT/'app'/'assets'/'twis-simple-perform.js').read_text()
sw=(ROOT/'app'/'service-worker.js').read_text()
sw2=(ROOT/'app'/'sw.js').read_text()

assert "loop-deck.html?mode=pro" in pro
assert "twis-pro-rig-v4.js" not in pro
assert "assets/twis-loop-core.js" in loop
assert "new core.TransportClock" in engine
assert "new core.LoopStateMachine" in engine
assert "setEcho" in engine and "setWash" in engine
assert "function stopAll(){stop();}" in engine
assert "outputGate" in engine and "outputGate.gain.setTargetAtTime(0" in engine
assert "$(\'.ld-step.now\').forEach" in engine
assert "stopCount++;$(\'.ld-step.now\').forEach" not in engine
assert "PLAY SET" in simple and "STOP / CLEAR" in simple
assert sw==sw2
assert '"./assets/twis-loop-core.js"' in sw
assert '"./assets/twis-pro-rig-v4.js"' not in sw
assert "twis-holo-workshop-v17-one-loop-core" in sw
print("Unified workstation finish contract PASS")
