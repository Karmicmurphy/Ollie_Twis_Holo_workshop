from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'app'/'pro-rig.html').read_text()
js=(ROOT/'app'/'assets'/'twis-pro-rig-v4.js').read_text()
assert 'twis-pro-rig-v4.js?v=4' in html
assert 'Tap PLAY SET' in html
for label in ['INTRO','DEEP','LIFT','BREAK','PEAK','OUTRO','BUILD','DROP','ECHO','WASH','VOCAL HIT']:
    assert label in html
for stem in ['KICK','BASS','PERC','CHORDS','MELODY','ATMOS','VOCAL','FX']:
    assert stem in js
assert 'await Tone.start()' in js
assert "Tone.Transport.start('+0.05')" in js
assert 'Tone.loaded()' in js
assert 'function duck(time)' in js
print('Amphitheater rig V4 contract PASS')
