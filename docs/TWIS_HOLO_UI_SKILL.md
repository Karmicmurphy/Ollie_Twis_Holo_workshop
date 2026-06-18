# Twis Holo UI Skill — Scrap-Iron Holo Cockpit

Purpose: preserve the current local-first Workshop while making the interface feel like Randy's own dark sci-fi operations room: useful, luminous, spatial, explainable, and fast enough for an old PC and a phone.

This is a build skill for future passes. Use it before editing UI, modules, Cloudflare hull, MCP tools, agents, or artifact workflows.

## Non-negotiable product boundary

Twis Holo Workshop is not a generic AI chat app, not an agent swarm, not a SaaS dashboard, and not a paid-cloud dependency.

The local Workshop remains the boss:

- local files stay local unless Randy exports or syncs them;
- SQLite/local registry remains source of truth;
- Cloudflare is optional hull, relay, inbox, storage, and light helper;
- GitHub is code/deploy spine, not personal archive;
- AI is helper only;
- Canon/source/publish/delete/spend/secrets/shell require human authority.

## UI personality

Build for Randy's actual orientation style:

- dark sci-fi, brutalist minimalism, luminous holo-panel feel;
- charcoal/black base, cyan/amber/violet signal accents;
- subtle 3D depth, portal/floor/grid/hologram effects;
- cards that feel like instruments, not corporate tiles;
- hover/tap explanation built in;
- sidebars and panels over giant info dumps;
- everything visible enough to navigate without remembering where it lives;
- low-motion mode must remain respected;
- phone layout must stay usable.

Avoid:

- childish onboarding;
- giant pop-up tutorials;
- fake dummy UI;
- decorative-only 3D;
- hiding core rooms;
- corporate SaaS dashboard look;
- rewriting the working app just for aesthetics.

## User-end rule

Every room, button, and module should answer these questions quickly:

1. What is this?
2. What does it do?
3. Where does it send things?
4. Does it touch local files, cloud, AI, or exports?
5. Does it write a receipt?
6. Is it safe/free/local/optional?

Use hover/tap guide cards, small helper chips, and side panels instead of walls of text.

## Visual system

Recommended tokens:

- background: near-black with blue/charcoal radial depth;
- panels: glassy dark layers with 1px luminous borders;
- primary signal: cyan;
- warning/approval: amber;
- creative/surreal: violet/pink;
- danger/delete: red;
- source/canon: gold/amber;
- local/private: green/teal;
- cloud/remote: blue;
- optional/adapter: violet.

Use 3D by layering:

- perspective hover on cards;
- grid floor/backdrop;
- holo rings/portal;
- card tilt and glow;
- status beacons;
- depth shadows;
- no heavy libraries.

No dependency should be required for the 3D feel.

## Interaction rules

- Hover on desktop shows a compact guide card.
- Tap/focus on phone also shows the guide card.
- Escape closes guide overlays.
- Guide layer must not block normal use.
- Buttons must still be real buttons/links.
- Tooltips must be accessible through `aria-label`, `title`, or focus behavior.
- Low-motion mode disables animations and tilt.

## Layout rules

Use rooms, not chaos:

- Home: orientation and next action.
- Talk: conversation and planning.
- Write: stories, lyrics, drafts, documents.
- Music: beat/lyric sketching.
- Images: image edit/generation router later.
- Video: media bin/storyboard/router later.
- Explore: research/source capture.
- Build: code/workshop files.
- Recover: Deep Sea Salvage.
- My Work: Artifact Compass.
- Modules: engine bay/tool sockets.
- Settings: adapters and boundaries.

Add new power through modules around these rooms; do not replace the shell.

## Module card requirements

Each module card should show:

- name;
- status: working / scaffolded / adapter-ready / disabled;
- execution: browser / local companion / Cloudflare / external optional;
- cost: free-core / free-tier-optional / adapter-only / model-dependent;
- permissions;
- what it creates;
- where output lands;
- whether it writes receipts.

## The powerhouse principle

Do not build one giant smart thing. Build many small dumb tools with smart receipts.

Useful tool atoms:

- classify artifact;
- create title;
- summarize artifact;
- tag artifact;
- hash file;
- detect duplicate;
- build capsule manifest;
- create receipt;
- prepare source packet;
- queue generation job;
- capture phone note;
- sync approved capsule;
- test local model endpoint.

## Cloudflare boundary

Cloudflare should provide:

- phone capture page;
- selected inbox/capsules;
- D1 metadata mirror;
- R2 object storage for approved capsules/media;
- KV config/cache;
- Workers AI for small helper jobs;
- optional Agent/MCP later.

Cloudflare must not become:

- primary private archive;
- Canon authority;
- autonomous tool runner;
- paid required backend;
- uncontrolled crawler;
- secret store in client code.

## MCP boundary

MCP is a gated tool rack.

Allowed first tools:

- `twis.search_artifacts`
- `twis.get_artifact`
- `twis.create_receipt`
- `twis.export_capsule`
- `twis.prepare_source_packet`
- `twis.summarize_artifact`
- `twis.queue_generation_job`

Blocked without explicit human approval:

- delete;
- publish;
- spend;
- approve Canon;
- shell;
- read secrets;
- write outside active project;
- send private archive to remote model.

## Build strategy

Safe order:

1. Add docs/config/tests.
2. Add UI guide layer that does not break app logic.
3. Add local-only modules.
4. Add Cloudflare scaffold disabled by default.
5. Add phone capture inbox.
6. Add MCP gate manifest.
7. Add light AI helpers behind receipt/budget rules.
8. Add agent orchestration only after the tool boundary works.

## Definition of done for UI passes

A UI pass is acceptable only if:

- existing start flow still works;
- existing rooms still exist;
- low-motion still works;
- phone layout does not collapse;
- no API key is stored in browser localStorage;
- no cloud service is required to open the app;
- hover/tap guide text explains what actions do;
- new modules are additive and reversible;
- the change can be understood from docs and module cards.
