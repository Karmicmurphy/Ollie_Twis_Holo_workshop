from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
pro=(ROOT/'app'/'pro-rig.html').read_text()
simple=(ROOT/'app'/'assets'/'twis-simple-perform.js').read_text()
assert "loop-deck.html?mode=pro" in pro
assert "twis-pro-rig-v4.js" not in pro
for label in ['INTRO','DEEP','LIFT','BREAK','PEAK','OUTRO','BUILD 4','DROP','ECHO','WASH','VOCAL HIT']:
    assert label in simple
for stem in ['KICK','BASS','HATS','PERC','PAD','MELODY','FX','VOCAL']:
    assert stem in simple
assert "queueBarAction" in simple
assert "shared Loop Core" in simple
print('Unified amphitheater surface contract PASS')
