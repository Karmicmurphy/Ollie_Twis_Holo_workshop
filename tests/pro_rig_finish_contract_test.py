from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
pro=(ROOT/'app'/'pro-rig.html').read_text()
loop=(ROOT/'app'/'loop-deck.html').read_text()
core=(ROOT/'app'/'assets'/'twis-loop-core.js').read_text()
engine=(ROOT/'app'/'assets'/'twis-loop-deck-v2.js').read_text()
sampled=(ROOT/'app'/'assets'/'twis-sampled-role-engine.js').read_text()
simple=(ROOT/'app'/'assets'/'twis-simple-perform.js').read_text()
sound=(ROOT/'app'/'assets'/'twis-loop-sound-rack.js').read_text()
sw=(ROOT/'app'/'service-worker.js').read_text()
sw2=(ROOT/'app'/'sw.js').read_text()

assert "loop-deck.html?mode=pro" in pro
assert "twis-pro-rig-v4.js" not in pro
assert "assets/twis-loop-core.js" in loop
assert "assets/twis-sampled-role-engine.js" in loop
assert "new core.TransportClock" in engine
assert "new core.LoopStateMachine" in engine
assert "TWIS_SAMPLED_ROLE_ENGINE" in engine
assert "function stopAll(){stop();}" in engine
assert "outputGate" in engine and "outputGate.gain.setTargetAtTime(0" in engine
assert "function proBass" not in engine
assert "function proPad" not in engine
assert "function proLead" not in engine
assert "triggerPerformanceSynth" not in engine
assert "synth_bass_1" in sampled
assert "pad_2_warm" in sampled
assert "lead_2_sawtooth" in sampled
assert "FluidR3_GM" in sampled
assert "DJ AUTO SET" not in simple
assert "startProfessionalArc" not in simple
assert "simpleFuck" not in simple
assert "simpleVocalHit" not in simple
assert "PLAY is silent until you add a layer" in simple
assert "CLEAR EVERYTHING" in simple
assert "loadPerformancePack" in simple
assert "PERFORMANCE_ASSETS" in sound
assert "./assets/samples/twis/909-kick.wav" in sound
assert "./assets/samples/twis/808-hat-closed.m4a" in sound
assert "./assets/samples/twis/808-clap.m4a" in sound
assert "KICK','BASS','HATS','CLAP','PAD','MELODY','FX','VOCAL" in simple
assert sw==sw2
assert '"./assets/twis-loop-core.js"' in sw
assert '"./assets/twis-sampled-role-engine.js"' in sw
assert '"./assets/twis-pro-rig-v4.js"' not in sw
assert "twis-holo-workshop-v20-sample-first" in sw
assert '"./assets/samples/twis/808-hat-closed.m4a"' in sw
assert '"./assets/samples/twis/808-clap.m4a"' in sw
print("Sample-first workstation finish contract PASS")
