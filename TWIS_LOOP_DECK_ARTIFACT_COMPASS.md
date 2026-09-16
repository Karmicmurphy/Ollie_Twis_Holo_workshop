# TWIS LOOP DECK — Artifact Compass + Artifact Salvage

Date: 2026-09-16
Status: active build evidence for `feature/twis-loop-deck-salvage`
Constraint: zero recurring cost; phone-first; local-first; no paid API; no cloud authority.

## Mission
Build a genuinely useful Android-first looper/sampler/groovebox inside Ollie Twis Holo Workshop by salvaging proven mechanisms instead of rebuilding every hard DSP/audio problem from scratch.

The governing skills are Artifact Compass 1.0.0 and Artifact Salvage 1.0.0 from the Digital Scrapyard salvage suite.

## 10-path Compass

### 1 — Exact mechanism terms
Needed mechanisms: low-latency audio scheduling, loop recording, quantized record in/out, overdub, phase lock, BPM/first-beat detection, transient slicing, waveform editing, time stretch, pitch shift, offline persistence, export, MIDI, optional source separation.

### 2 — Adjacent modern implementations
Loopy Pro, Koala Sampler, BandLab Looper and Ableton-style session workflows establish useful interaction patterns: large performance controls, quantized launch, overdub, scenes, slice-to-pad, momentary performance FX. Proprietary code is NOT copied.

### 3 — Open-source/reference implementations
- Web Audio Samples / AudioWorklet examples — Apache-2.0 — timing/worklet/ring-buffer patterns.
- web-audio-beat-detector — MIT — AudioBuffer BPM plus first-beat offset.
- Meyda — MIT — offline/real-time audio descriptors.
- Signalsmith Stretch — MIT — high-quality pitch/time engine with official WASM/AudioWorklet Web Audio release.
- SoundTouchJS — MPL-2.0 — alternative Web Audio timestretch/pitch path; useful comparison and fallback candidate.
- Soundpipe — MIT, archived — small DSP atoms and old-school synthesis/effect mechanisms.
- Tuna — Web Audio effect reference; useful interaction/effect atoms, but direct vendoring requires a separate current-license confirmation.

### 4 — Standards/protocols
- Web Audio API: sample-timed AudioParam automation and AudioWorklet.
- Media Capture: microphone input.
- OPFS/File System API: local high-throughput media persistence.
- Web MIDI API: optional hardware pad/controller input.
- PWA/service worker: install/offline shell.

### 5 — Academic/research ancestors
Relevant mechanism families: onset-energy novelty, autocorrelation tempo estimation, WSOLA, phase vocoder, STFT-based polyphonic stretching, spectral descriptors, zero-crossing edit boundaries. Prefer established deterministic algorithms over AI calls for core looping.

### 6 — OS/database/compiler/network analogues
- Audio transport behaves like a monotonic event scheduler: schedule ahead against one clock, never trust UI frame timing.
- OPFS is the media object store; localStorage remains metadata only.
- Loop state uses immutable/undo-like snapshots rather than destructive overwrite.
- Audio modules are adapters: the core works if an optional heavy module is absent.

### 7 — Embedded/industrial/control/DSP/game analogues
- AudioWorklet is the real-time control loop; UI is supervisory control only.
- Ring buffers and block processing prevent UI jitter from becoming audio jitter.
- Quantization is a phase-lock problem, not a button-timing problem.
- Latency is measured/compensated as a plant delay, with a user calibration trim where browser input latency cannot be known exactly.

### 8 — Federal/lab/university work
University/research DSP ideas matter mainly as algorithm ancestors; no cloud research service is required. The build favors algorithms that can be proven locally on AudioBuffer/PCM data.

### 9 — Archived/unfashionable artifacts
- Soundpipe: archived but valuable as a catalogue of compact DSP atoms. KEEP patterns; do not inherit the entire framework.
- WAAClock: old scheduling design remains useful as a historical pattern, but legacy ScriptProcessor machinery is obsolete. KEEP scheduling lesson; CUT implementation.
- Old sampler/groovebox workflows: fixed grids, pattern banks, choke groups, ratchets and resampling remain highly effective on a phone despite being unfashionable next to full DAWs.

### 10 — Cross-domain analogues
- PLC/control-loop phase locking -> loop launch/record quantization.
- Write-ahead/append-only storage -> non-destructive overdub + undo.
- Cache/object-store separation -> metadata in lightweight state, audio blobs in OPFS.
- Capability adapters -> optional timestretch/stem/MIDI modules cannot become core boot dependencies.

## Internal Workshop classification

- Canonical: Workshop authority model; GitHub repo structure; PWA shell; local-first rules.
- Active supporting: Music room, Road-Signal support, service worker, artifact/module registry.
- Candidate for consolidation: old simple Music sketch and new Loop Deck can eventually share export/synthesis helpers.
- Historical: V1 `twis-loop-deck.js` after V2 proves stable.
- Unverified: phone-specific microphone round-trip latency on each Android device.
- Obsolete for Loop Deck timing: main-thread-only setTimeout loop recorder logic.
- Missing/next proof: real-device latency calibration test, vendored pitch-lock module, optional local stem proof.

## Salvage cards

### AudioWorklet recorder
Source: Web Audio standard + Chrome/Web Audio sample patterns.
State: modern/browser-native.
Mechanism: record PCM on render thread controlled by sample-timed AudioParam automation.
License: browser standard/original clean-room implementation in this repo.
Useful atoms: frame-accurate record boundaries, PCM capture independent of UI jitter.
Rot: AudioWorklet requires secure context.
Dependencies: browser only.
Security: microphone permission only.
Integration burden: low.
Verdict: KEEP — implemented V2.

### OPFS media vault
Source: File System API / Origin Private File System.
State: broadly available modern browser primitive.
Mechanism: high-performance origin-private file storage for large local media.
License: web standard.
Useful atoms: imported-track and loop persistence without stuffing binary media into localStorage.
Rot: origin storage can be cleared by the user/browser and is quota-limited.
Dependencies: secure-context browser support.
Security: origin-private, no user file-system exposure.
Integration burden: low.
Verdict: KEEP — implemented V2 with graceful absence.

### web-audio-beat-detector
Source: https://github.com/chrisguttandin/web-audio-beat-detector
State: active.
Mechanism: inexpensive AudioBuffer tempo analysis and first-beat offset.
License: MIT.
Useful atoms: BPM + beat-grid origin.
Rot: tuned especially well for beat-driven/electronic material, not infallible on rubato/live music.
Dependencies: modest package/build dependency if directly vendored.
Security: local AudioBuffer only.
Integration burden: low-medium.
Verdict: KEEP mechanism. V2 currently uses a clean local onset/autocorrelation implementation; direct vendoring remains optional after proof comparison.

### Meyda
Source: https://github.com/meyda/meyda
State: maintained reference library.
Mechanism: standardized audio feature extraction.
License: MIT.
Useful atoms: RMS/energy, spectral/perceptual descriptors for Loop DNA.
Rot: adds dependency mass for descriptors that can be computed cheaply in-house.
Dependencies: JS package.
Security: local PCM.
Integration burden: medium.
Verdict: SALVAGE PATTERNS, not required dependency. V2 computes deterministic RMS/crest/transient-density locally.

### Signalsmith Stretch Web
Source: https://github.com/Signalsmith-Audio/signalsmith-stretch
Pinned upstream revision researched: `57b93f4e9206a089a45387eaa39bdc9f310d3308`.
State: active.
Mechanism: high-quality polyphonic pitch/time stretch; official Web Audio WASM/AudioWorklet release; scheduled rate/semitone/loop control; reports its own latency.
License: MIT, copyright Signalsmith Audio Ltd / Geraint Luff.
Useful atoms: pitch-preserving tempo fit and transposition without GPL baggage.
Rot: WASM CPU/memory cost must be measured on target Android phone.
Dependencies: one self-contained Web release file with embedded WASM.
Security: local DSP only.
Integration burden: medium.
Verdict: KEEP / TEST ON PHONE. Do not make core boot depend on it. V2 honestly remains REPITCH until this module is vendored and proven.

### SoundTouchJS
Source: https://github.com/cutterbl/SoundTouchJS
State: active modern rewrite.
Mechanism: Web Audio time/pitch with AudioWorklet/WSOLA/phase-vocoder/formant paths.
License: MPL-2.0.
Useful atoms: alternate lower-cost stretch path and parameter ideas.
Rot: larger architecture and license obligations are heavier than MIT Signalsmith.
Dependencies: package/worklet modules.
Security: local DSP.
Integration burden: medium-high.
Verdict: TEST/ALTERNATE, not primary.

### Soundpipe
Source: https://github.com/PaulBatchelor/Soundpipe
State: archived 2024.
Mechanism: small C DSP building blocks, generators, filters, delays, physical models, granular/Paulstretch-style ideas.
License: MIT.
Useful atoms: compact deterministic DSP recipes and synthesis/effect designs.
Rot: archived; whole framework is unnecessary.
Dependencies: C toolchain if directly compiled.
Security: local DSP.
Integration burden: high if whole library, low for clean-room atoms.
Verdict: SALVAGE ATOMS ONLY.

### Web MIDI
Source: Web MIDI standard.
State: available on Chrome-family Android; not universal browser support.
Mechanism: map hardware note/CC messages to pads and performance controls.
License: web standard.
Useful atoms: notes 36–51 -> pads; CC/mod wheel -> filter.
Rot: browser permission/support variability.
Dependencies: optional browser API.
Security: explicit permission.
Integration burden: low.
Verdict: KEEP OPTIONAL — implemented V2.

### Local source separation
Source families: ONNX Runtime Web + permissively distributed separation models.
State: technically possible with WASM/WebGPU; model rights and Android memory are the gating facts.
Mechanism: optional vocals/drums/bass/other stems locally.
License: runtime permissive, but each model must pass its own rights gate.
Useful atoms: user-requested split-to-loops workflow.
Rot: model weight, RAM, thermals and mobile WebGPU availability.
Dependencies: heavy optional runtime/model files.
Security: can remain local.
Integration burden: high.
Verdict: DEFER AS OPTIONAL MODULE. Core looper must never depend on stems.

### GPL/AGPL DSP candidates
Examples encountered in wider research include strong libraries whose distribution terms are unsuitable for the default Workshop core without an intentional licensing decision.
Verdict: REJECT from distributed core when a permissive mechanism exists. Do not silently introduce copyleft obligations.

## V2 decisions now implemented

1. AudioContext remains single authority for musical time.
2. Web Worker performs frequent scheduler wakeups; events are scheduled ahead in AudioContext time.
3. AudioWorklet records raw PCM on sample-frame boundaries using a k-rate recording AudioParam.
4. Loop recording is quantized to next bar; fixed 1/2/4/8/16-bar and FREE modes exist.
5. Existing loop + new capture becomes an overdub; previous buffer remains undoable.
6. Loop playback launches on a bar boundary and phase-aligns when rejoined.
7. User-adjustable record offset provides honest device calibration instead of claiming unknowable microphone latency is solved automatically.
8. Step cells cycle velocity; long-hold cycles ratchet 1x/2x/4x.
9. Imported audio is analyzed locally for BPM, first-beat candidate and transients.
10. Slice boundaries are nudged toward zero crossings and micro-faded to reduce clicks.
11. Loop DNA records beats, RMS energy, transient density and PUNCHY/SMOOTH/BUSY/SPARSE character.
12. BUILD KIT chooses diverse slices rather than merely the first 16.
13. OPFS stores recorded loop WAVs and the current imported source where supported.
14. Web MIDI is optional and does not affect core boot.
15. PWA cache includes the Loop Deck V2 and AudioWorklet module.

## Honest open gates

- Real Android hardware test for microphone timing/round-trip calibration.
- Compare local BPM detector against the MIT reference on a varied test corpus; replace/augment only if proof improves.
- Vendor and benchmark Signalsmith Stretch on the target phone before enabling a PITCH LOCK control.
- Add a waveform region editor only if touch interaction remains fast on mid-range Android.
- Optional stem module requires a separately verified model license plus RAM/thermal benchmark.
- WAV master rendering remains preferable to WebM capture and should be added as an offline render path.

## Definition of success
The Loop Deck is successful when the user can install it on Android, open it without an account, make a beat immediately, import a track, extract useful loops, record/overdub in phase, save the audio locally, reopen it, perform with pads/FX/MIDI, and export a result without paying for a service or sending private audio to a server.
