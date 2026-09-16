# TWIS LOOP DECK — Third-Party Rights Ledger

## Runtime core
The V2 Loop Deck core, AudioWorklet recorder, OPFS storage layer, local analyzer, sequencer, calibration, WAV encoder, synthesis and UI code in this repository are original Workshop code built on browser standards. They do not require a paid service.

## Signalsmith Stretch — optional PITCH LOCK module

Upstream: https://github.com/Signalsmith-Audio/signalsmith-stretch

Pinned researched revision: `57b93f4e9206a089a45387eaa39bdc9f310d3308`

Runtime URL used only when the user explicitly enables PITCH LOCK:
`https://cdn.jsdelivr.net/gh/Signalsmith-Audio/signalsmith-stretch@57b93f4e9206a089a45387eaa39bdc9f310d3308/web/release/SignalsmithStretch.js`

License: MIT License

Copyright (c) 2022 Geraint Luff / Signalsmith Audio Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Dependency rule
PITCH LOCK is optional. If the pinned asset cannot be fetched, TWIS LOOP DECK remains functional using its local REPITCH path. The optional script is not required to open, record, loop, slice, sequence, save or export.

### Future vendoring gate
Before a future release claims fully offline PITCH LOCK on first launch, copy the pinned upstream Web release into the repository (or another controlled local artifact store), retain this license, verify its hash, and pass the target-phone CPU/thermal test. Do not silently switch the pin.

## Research-only / not distributed in core

The following projects informed mechanism selection but are not currently bundled:

- web-audio-beat-detector — MIT — BPM/first-beat reference.
- Meyda — MIT — feature-extraction reference.
- SoundTouchJS — MPL-2.0 — alternative stretch architecture.
- Soundpipe — MIT, archived — compact DSP atom reference.
- Web Audio Samples — Apache-2.0 — AudioWorklet/ring-buffer reference patterns.

Researching a mechanism does not make its code part of the Workshop. Direct code reuse requires a separate provenance/license record.
