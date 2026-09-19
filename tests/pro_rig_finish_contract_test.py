from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
js=(ROOT/'app'/'assets'/'twis-pro-rig-v4.js').read_text()
html=(ROOT/'app'/'pro-rig.html').read_text()
sw=(ROOT/'app'/'service-worker.js').read_text()
sw2=(ROOT/'app'/'sw.js').read_text()

# Current finished entrypoints and resilience.
assert "twis-pro-rig-v4.js?v=4-finish" in html
assert "unpkg.com/tone@14.8.49/build/Tone.js" in html
assert "serviceWorker.register" in html
assert "raw.githubusercontent.com/Boochi44/free-drum-samples" in js
assert "raw.githubusercontent.com/n33kos/kokoro-voices" in js

# Every audible role must pass through a stem gate.
for role in ["KICK","PERC","CHORDS","MELODY","VOCAL","FX"]:
    assert f"gate.{role}" in js
assert "duckBus[n]=new Tone.Gain(1).connect(gate[n])" in js
assert "if(audio?.gate[n])audio.gate[n].gain.rampTo" in js

# STOP must silence the entire graph, including continuous atmosphere.
assert "const runGate=new Tone.Gain(0).toDestination()" in js
assert "audio?.runGate?.gain.rampTo(0,.02)" in js
assert "audio.runGate.gain.rampTo(1,.025)" in js

# Concurrency / duplicate-start guard and runtime proof instrumentation.
assert "if(startPromise)return startPromise" in js
assert "if(initPromise)return initPromise" in js
assert "window.__TWIS_PRO_RIG__" in js
assert "maxTickJitter" in js
assert "loadedSamples" in js

# Both worker copies must cache the same finished Pro Rig shell.
assert sw==sw2
for item in ['"./pro-rig.html"','"./assets/twis-pro-rig-v4.js"',"twis-holo-workshop-v16-pro-rig-finish"]:
    assert item in sw

print("Pro Rig finish contract PASS")
