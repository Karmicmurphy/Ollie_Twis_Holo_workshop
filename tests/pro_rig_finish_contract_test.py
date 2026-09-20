from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
pro=(ROOT/'app'/'pro-rig.html').read_text()
loop=(ROOT/'app'/'loop-deck.html').read_text()
core=(ROOT/'app'/'assets'/'twis-loop-core.js').read_text()
engine=(ROOT/'app'/'assets'/'twis-loop-deck-v2.js').read_text()
simple=(ROOT/'app'/'assets'/'twis-simple-perform.js').read_text()
sound=(ROOT/'app'/'assets'/'twis-loop-sound-rack.js').read_text()
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
assert "document.querySelectorAll(\'.ld-step.now\').forEach" in engine
assert "stopCount++;$(\'.ld-step.now\').forEach" not in engine
assert "PLAY SET" in simple and "CLEAR EVERYTHING" in simple
assert "loadPerformancePack" in simple
assert "PERFORMANCE_ASSETS" in sound
assert "./assets/samples/twis/909-kick.wav" in sound
assert "./assets/samples/twis/hat-closed-03.wav" in sound
assert "./assets/samples/twis/perc-02.wav" in sound
assert "INTRO:{active:[1,1,0,0,1,0,0,0]" in simple
assert "DEEP:{active:[1,1,0,1,1,1,0,0]" in simple
assert "startProfessionalArc" in simple
assert "HATS:{deep:[0,0,.18,0" in simple
assert "FORMANT VOICE" in sound
assert "performanceRate" in engine
assert "KICK,BASS,HATS,PERC,PAD,MELODY,FX,VOCAL" not in simple  # roles are explicit array, not one collapsed sound
assert sw==sw2
assert '"./assets/twis-loop-core.js"' in sw
assert '"./assets/twis-pro-rig-v4.js"' not in sw
assert "twis-holo-workshop-v19-ephemeral-loops" in sw
assert '"./assets/samples/twis/909-kick.wav"' in sw
print("Unified workstation finish contract PASS")
