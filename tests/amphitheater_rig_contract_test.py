from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
pro=(ROOT/'app'/'pro-rig.html').read_text()
simple=(ROOT/'app'/'assets'/'twis-simple-perform.js').read_text()
assert "loop-deck.html?mode=pro" in pro
assert "twis-pro-rig-v4.js" not in pro
for label in ['INTRO','DEEP','LIFT','BREAK','PEAK','OUTRO','BUILD 4','DROP','ECHO','WASH']:
    assert label in simple
for stem in ['KICK','BASS','HATS','CLAP','PAD','MELODY','FX','VOCAL']:
    assert stem in simple
assert "queueBarAction" in simple
assert "prepareRole" in simple
assert "DJ AUTO SET" not in simple
assert "startProfessionalArc" not in simple
assert "PLAY is silent until you add a layer" in simple
print('Explicit sample-first performance surface contract PASS')
