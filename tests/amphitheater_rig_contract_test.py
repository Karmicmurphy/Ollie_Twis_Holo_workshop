from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'app'/'pro-rig.html').read_text()
js=(ROOT/'app'/'assets'/'twis-amphitheater-rig.js').read_text()
assert 'twis-amphitheater-rig.js?v=3' in html
assert 'Tap PLAY SET' in html
for label in ['INTRO','DEEP','LIFT','BREAK','PEAK','OUTRO','BUILD','DROP','ECHO','WASH']:
    assert label in html
for stem in ['KICK','BASS','PERC','CHORDS','MELODY','ATMOS','VOCAL','FX']:
    assert stem in js
assert 'await Tone.start()' in js
assert "Tone.Transport.start('+0.05')" in js
assert 'audio.riserNoise.start()' in js
assert 'function duck(time)' in js
print('Amphitheater rig contract PASS')
