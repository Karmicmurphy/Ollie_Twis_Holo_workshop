from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
pro=(ROOT/'app'/'pro-rig.html').read_text()
loop=(ROOT/'app'/'loop-deck.html').read_text()
core=(ROOT/'app'/'assets'/'twis-loop-core.js').read_text()
engine=(ROOT/'app'/'assets'/'twis-loop-deck-v2.js').read_text()
assert "loop-deck.html?mode=pro" in pro
assert "assets/twis-loop-core.js" in loop
assert "TransportClock" in core and "LoopStateMachine" in core
assert "TWIS_LOOP_CORE" in engine
assert "Tone.Transport" not in pro
assert "commands:{play,stop:stopAll" in engine
print('Unified Pro Rig / Loop Deck core contract PASS')
