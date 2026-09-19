from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'app'/'pro-rig.html').read_text()
js=(ROOT/'app'/'assets'/'twis-pro-rig-v4.js').read_text()
assert 'twis-pro-rig-v4.js?v=4' in html
assert 'same rig on phone + PC' in html
for x in ['PLAY SET','BUILD 4','DROP','ECHO','WASH','VOCAL HIT','LOOPS / IMPORT']:
    assert x in html
for x in ['Boochi44/free-drum-samples','n33kos/kokoro-voices','Tone.start()','Tone.loaded()','queuedScene','buildState','FALLBACK OK']:
    assert x in js
assert "location.href='loop-deck.html'" in js
assert "if(!loopStarted){audio.loop.start(0);loopStarted=true}" in js
print('Pro Rig V4 cross-device sonic contract PASS')
