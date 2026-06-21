# Twis Holo Workshop Architecture

This document defines the current Workshop shape. It is a guardrail, not a new feature plan.

## Operating map

```text
LOCAL = private home base
CLOUD = phone / public field kit
GITHUB = code backup and deploy source
```

The Workshop should stay small enough to understand, test, pull down, and run on Randy's own machine.

## Three authority zones

### Local home base

Local mode is the private authority.

Local owns:

- private project folders;
- local SQLite / FTS artifact index;
- recovered source files;
- Canon candidates and reviewed artifacts;
- receipts that prove what happened on the user's machine;
- companion-only capabilities such as local imports and disk-backed artifact sync.

Local may use browser features, local Python, SQLite, and carefully gated adapters. Local does not become a hidden cloud service.

### Cloud field kit

Cloud mode is the public and phone-friendly shell.

Cloud may provide:

- the Workshop user interface;
- public Pages delivery;
- low-risk remote hull endpoints;
- optional Workers AI calls behind explicit cost and safety guardrails;
- capture, draft, and field notes that can later be reviewed locally.

Cloud must not become the private source authority. Do not store raw private folders, recovered archives, Canon material, or unreviewed personal source dumps in Cloudflare by default.

### GitHub deploy source

GitHub is code backup and deployment source.

GitHub owns:

- app code;
- docs;
- launcher scripts;
- tests;
- static assets that are safe to publish;
- deployment configuration.

GitHub does not own private artifacts, local data, or raw personal folders.

## Room model

Each Workshop room has one bounded job:

- **Home**: return to current work.
- **Talk**: capture conversation and companion responses.
- **Write**: draft and save documents.
- **Music**: build music sketches and Road-Signal prompt artifacts.
- **Images**: edit/import/export local images.
- **Video**: organize media notes and storyboard material.
- **Explore**: run research/salvage notes.
- **Build**: inspect and edit local project files where allowed.
- **Recover**: import old folders through the local companion only.
- **My Work**: search, review, and manage artifacts.
- **Modules**: show engine/adaptor status without making engines authority.
- **Settings**: configure local/browser/cloud adapter choices.

Do not start a new large feature until the existing room workflow is functional and testable.

## Artifact-first rule

The Workshop is not a full DAW, full NLE, model host, or autonomous agent framework.

It should preserve:

1. prompts;
2. drafts;
3. source notes;
4. generated artifacts;
5. receipts;
6. review state;
7. handoff packets.

Engines are replaceable. Artifacts are the permanent record.

## Road-Signal Machine boundary

Road-Signal Machine v3 lives in the Music room.

It may build:

- code-shaped fused packet;
- fused-line prompt;
- full Producer AI prompt;
- lyric block;
- music gear/math prompt artifacts.

The Road-Signal save bridge may save browser artifacts locally and may attempt local companion sync when the companion is available. Browser-only localStorage is not proof of disk/SQLite sync.

## Adapter law

External tools, MCP servers, browser agents, local model sockets, Cloudflare Workers AI, voice engines, and media engines are adapters. They do not become the nervous system.

Every adapter should pass this shape:

```text
selected artifact or prompt
-> permission gate
-> bounded adapter call
-> output artifact
-> receipt
-> human review
```

No adapter gets Canon write access. No external runtime gets private folders by default.

## Current build priority

The next correct sequence is:

1. keep architecture/security/cost guardrails documented;
2. test Windows launchers;
3. test My Work + Artifact Compass;
4. test Road-Signal artifact save;
5. then perform a room-by-room functional pass.

Do not broaden scope before those checks are clean.
