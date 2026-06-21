# Twis Holo Workshop Security Gates

This document defines the gates that protect the Workshop from turning into an unsafe agent host, private-data leak, or trust-by-default tool stack.

## Core rule

Do not trust a tool because it is free, open source, popular, local, or already installed.

A tool becomes usable only after it has a narrow role, a clear permission boundary, and an artifact/receipt path.

## Hard no-go boundaries

Do not add:

- paid APIs as default dependencies;
- cloud private storage for raw local data;
- hosted raw ComfyUI/custom-node servers;
- browser agents that can touch localhost/private tools by default;
- MCP as the Workshop nervous system;
- autonomous agents that can write private files or Canon;
- full DAW/NLE scope inside the Workshop;
- new big feature lanes before current rooms are functional.

## Localhost and private tools

Localhost is private territory. Browser code must not assume it can reach local tools safely.

Any browser-to-local capability needs:

1. explicit user action;
2. known local endpoint;
3. same-origin/host checks where applicable;
4. narrow request body;
5. no secret echoing;
6. visible success/failure result;
7. receipt or artifact record when data changes.

## MCP gate

MCP is an adapter lane, not the central nervous system.

An MCP server must be treated as untrusted until reviewed. A candidate MCP integration needs:

- server identity and source;
- local vs remote classification;
- exact tools exposed;
- exact folders/network paths reachable;
- read/write capability map;
- default disabled state;
- user approval before use;
- output captured as an artifact;
- no Canon write permission.

Reject or quarantine MCP candidates that request broad filesystem access, uncontrolled command execution, hidden network calls, or unclear provenance.

## Browser-agent gate

Browser agents must not receive default access to localhost, private project files, local companion endpoints, or private cloud dashboards.

Before enabling a browser agent, document:

- what page or app it can operate in;
- what it can click or read;
- whether it can submit forms;
- whether it can call local endpoints;
- whether it can export or upload data;
- how the user stops it.

Default posture: view-only or disabled.

## Free/open-source candidate gate

Free and open-source tools still need review.

Before promotion, record:

- license and repository/source link;
- maintenance status;
- install footprint;
- network behavior;
- model/data download behavior;
- local folder access;
- whether it runs code from plugins or custom nodes;
- uninstall/disable path;
- expected artifact output;
- failure mode.

A candidate can remain listed without becoming a dependency.

## Voice and media candidate gate

Flue, Voxtral, Whisper, VoxCPM2, Chatterbox, html-video, local TTS/STT engines, and similar tools are candidates only until tested.

Do not promote them by default until they pass:

- local install feasibility;
- no paid requirement for core use;
- acceptable CPU/RAM behavior on Randy's machine;
- no hidden upload of private audio/text;
- clear artifact output;
- user-controlled start/stop.

## Cloudflare gate

Cloudflare is public field kit, not private authority.

Cloudflare endpoints must not expose:

- local filesystem paths;
- raw recovered folders;
- SQLite data dumps;
- private Canon source material;
- secret keys;
- unrestricted write APIs;
- unlimited Workers AI usage.

Cloudflare can serve public UI and bounded API helpers. Anything private must be reviewed locally before it becomes authoritative.

## Artifact write gate

Any write path must answer:

1. What is being written?
2. Where is it written?
3. Which project owns it?
4. Is it browser-only, local companion, or cloud?
5. Is it private, draft, reviewed, or public?
6. Can the user find it in My Work / Artifact Compass?
7. Is there a receipt or visible confirmation?

If those answers are not clear, the write path is not trusted.

## Current safe default

- Browser-only mode may save drafts to localStorage.
- Local companion mode may write to local disk/SQLite through tested local endpoints.
- Cloud mode may capture public/field-kit work but must not claim private authority.
- GitHub stores code and safe docs, not private project data.

## Promotion labels

Use simple labels when reviewing tools:

- **candidate**: interesting but not trusted;
- **adapter-ready**: boundary is understood, but not default;
- **approved-local**: safe for local use in a narrow role;
- **approved-cloud**: safe for public/cloud use in a narrow role;
- **quarantined**: do not use until specific risk is resolved;
- **rejected**: do not use for this Workshop.
