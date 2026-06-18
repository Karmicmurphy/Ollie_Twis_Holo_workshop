# Twis Holo Workshop — Narration Voice Presets

Date: 2026-06-18

## Purpose

The Workshop now includes six narration voice presets in:

- `app/modules/voice-presets.json`

These presets are local style settings for browser speech or a future local text-to-speech adapter. They are not paid voices, not downloaded models, and not cloud services.

## Presets

### Female narration presets

1. **Velvet Ember** — warm, close, confident narration.
2. **Honey Smoke** — smooth, relaxed character narration.
3. **Neon Satin** — clear, cinematic chapter or trailer narration.

### Male narration presets

1. **Gravel Road** — rough, road-worn narration.
2. **Midnight Baritone** — deep, heavy narration.
3. **Rusted Steel** — blunt, scarred survivor narration.

## Safety and authority boundary

The presets do not:

- install any models;
- call a remote provider;
- save API keys;
- create a paid dependency;
- approve Canon;
- become source authority.

Future rendered narration should be saved as a Workshop artifact with a receipt.

## Future upgrade order

1. Add a browser voice preset picker.
2. Add a local TTS adapter contract.
3. Add render receipts.
4. Add WAV/MP3 export.
5. Add optional remote TTS only with explicit human approval, cost warning, and no saved key.
