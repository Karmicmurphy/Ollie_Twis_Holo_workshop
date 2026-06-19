# No Paid TTS Plan

Twis Holo Workshop must not require paid text-to-speech.

## Rule

Do not use paid cloud TTS as a core requirement.

No required:

- ElevenLabs
- OpenAI TTS
- Cloudflare paid TTS
- subscription voice APIs
- paid voice clones
- per-character TTS billing

## Away-mode workaround

Use the browser's built-in Web Speech API for spoken replies.

The app already uses:

```text
window.speechSynthesis
SpeechSynthesisUtterance
```

This means the phone/browser can read text aloud without sending the assistant reply to a paid TTS provider.

Current away-mode voice shape:

```text
User speaks
-> browser speech recognition
-> Talk input
-> /api/ai/chat
-> Cloudflare Workers AI text reply
-> browser speechSynthesis reads reply aloud
```

Only the AI text reply uses Cloudflare Workers AI. Spoken output is handled by the browser/device voice system.

## Local-core option later

When Randy is on his own PC, the local companion may optionally use local TTS engines such as:

- Kokoro local runtime
- Piper local runtime
- eSpeak NG fallback
- operating-system voices

These must be optional local modules, not required cloud services.

## Product boundary

Cloudflare is the away-mode field kit.

The private/local Workshop core remains responsible for full private voice experiments, saved audio, narration workflows, and any higher-quality local TTS.

## What to do if browser TTS fails

1. Keep text replies working.
2. Show a clear message: `Browser speech output is unavailable on this device.`
3. Do not silently switch to paid cloud TTS.
4. Suggest Chrome, Edge, or Safari on a device with system voices installed.
5. Keep voice output optional.

## Acceptance checks

- `app/assets/voice-loop.js` uses `speechSynthesis`.
- `app/assets/voice-loop.js` uses `SpeechSynthesisUtterance`.
- No required paid TTS endpoint exists.
- Cloudflare Workers AI endpoint returns text only.
- TTS is not included in Cloudflare billing path.
