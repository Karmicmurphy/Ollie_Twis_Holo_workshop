# Next Patch Targets

Date: 2026-06-18

The repo is now aligned enough for static build and contract testing. The next work should increase capability without breaking the local-first habitat.

## 1. Handoff Packet Builder

Goal: let Randy select artifacts from Artifact Compass and build a clean packet for a mini-engine.

Output:

- handoff packet artifact;
- selected source list;
- constraints;
- target engine lane;
- receipt.

## 2. Receipt Viewer

Goal: expose receipts in the UI so Randy can see what changed, what was imported, what was generated, and what adapter did it.

## 3. Saved Search Missions

Goal: let Artifact Compass save search missions such as:

- Thousand-Year Hangover source sweep;
- Cloudflare deployment work;
- video prompt recovery;
- code patch audit.

## 4. Local Model Socket Probe

Goal: test whether a configured localhost model endpoint is reachable without sending private artifacts.

Output:

- model probe receipt;
- supported route notes;
- fail-safe status.

## 5. Cloudflare Deploy Proof

Goal: after Cloudflare login, run:

```bash
npm install
npm run build
npx wrangler pages deploy dist --project-name ollie-twis-holo-workshop
```

Cloudflare remains remote hull only, not source authority.
