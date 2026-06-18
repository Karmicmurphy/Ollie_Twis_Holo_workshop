# Scrap-Iron Holo UI Build

This document defines the user-end build shape for the Twis Holo Workshop cockpit.

## What Randy should experience

Open the Workshop. Land in a dark, luminous operations room. Nothing should feel like a corporate dashboard. The interface should feel like a practical sci-fi workbench: salvage bay, artifact map, writing bench, signal desk, voice bench, engine bay, and cloud hull.

The UI should answer questions before Randy gets stuck:

- Hover over a room: see what it is for.
- Hover over a module: see what it touches and what it creates.
- Hover over a risky feature: see local/cloud/AI/cost/receipt boundary.
- Tap on phone: get the same guidance.
- Click a room: go there without losing orientation.

## Main rooms

| Room | User meaning | Build meaning |
|---|---|---|
| Home | What do I do next? | Orientation, continue, recent artifacts, big cards |
| Talk | Think out loud | Chat/session capture, optional AI helper |
| Write | Make words | Drafts, lyrics, stories, snapshots, read-aloud |
| Music | Build sound ideas | Sequencer, notes, WAV export |
| Images | Visual work | Canvas, edits, prompt packets, future router |
| Video | Scene work | Media bin, storyboard, generation router later |
| Explore | Research | Expedition notes, source capture, question finder |
| Build | Code | Project files and safe editor |
| Recover | Deep Sea Salvage | Folder/zip/repo import, hash, skip secrets, receipt |
| My Work | Artifact Compass | Search/map artifacts, status, relations |
| Modules | Engine bay | Tool cards, adapters, status, safety boundaries |
| Settings | Boundaries | Name, speech, AI adapter, Cloudflare URL |

## Hover guide system

The guide system is intentionally small and dependency-free.

It attaches guidance to existing controls and cards by selector:

- sidebar nav buttons;
- home room cards;
- major action buttons;
- module cards;
- risky settings;
- Cloudflare/AI controls.

Guide card fields:

- title;
- what it does;
- where output goes;
- safety/cost boundary;
- next action.

## 3D style without heavy libraries

Use CSS only:

- perspective card hover;
- glow rings;
- backdrop grid;
- glass panels;
- scanline overlays;
- status beacons;
- subtle tilt.

No Three.js. No large graphics bundle. No dependency tax.

## Information density

Information should be layered:

1. card label;
2. short card subtitle;
3. hover/tap guide;
4. side panel/details;
5. docs/harness for full explanation.

Do not put everything on the landing page.

## Safety language in the UI

Use simple state badges:

- LOCAL — only this computer/browser;
- CLOUD OPTIONAL — uses remote only when configured;
- AI OPTIONAL — helper, not authority;
- RECEIPT — action is logged;
- ADAPTER — socket, not required core;
- HUMAN GATE — approval needed.

## Initial implementation

The first pass adds:

- `app/assets/holo-guide.css`
- `app/assets/holo-guide.js`
- guide data for existing rooms/buttons/settings;
- new docs and harness;
- module registry additions for the powerhouse build.

This is additive. It does not replace the app core.

## Later implementation

After the guide layer proves stable:

1. Build Receipt Ledger view.
2. Upgrade Recover into Deep Sea Salvage.
3. Upgrade My Work into Artifact Compass.
4. Add Signal Desk Pocket capture page.
5. Add Cloudflare Remote Hull scaffold.
6. Add MCP Gate manifest.
7. Add Edge AI Helper routes.
8. Add Local Model Socket probe.
9. Add Voice Bench picker.
10. Add Generation Router tickets.
