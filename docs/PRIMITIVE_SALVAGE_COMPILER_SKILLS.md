# Primitive Salvage Compiler — Skills List

Purpose: define the working skills needed for a kernel that turns rough human intent into legal, free/open capability primitives and smallest build atoms.

This is not a new app and not a new room. It is a kernel/harness layer that Twis Holo can call.

## Prime Rule

Do not harvest blindly. Decode first, split into primitives, verify legality/security/runtime, then compile the smallest useful build atom.

## Skill 1 — Intent Decoder

Input: rough human language.

Output: clear technical intent without erasing the user's actual goal.

Example:

> "How the fuck do they build this for free?"

Becomes:

- free-stack reverse architecture
- open-source alternatives
- smallest viable implementation
- local-first replacement path
- no paid API dependency

## Skill 2 — Primitive Splitter

Input: decoded intent.

Output: smallest capability primitives.

Example target: free voice machine.

Primitives:

- text input
- voice selection
- speech synthesis
- audio export
- playback
- artifact save
- license-safe voice source
- local runtime option

## Skill 3 — Search Vector Builder

Input: primitives.

Output: search terms the user did not know how to say.

Required vectors:

- plain-English vector
- developer vector
- open-source vector
- model/research vector
- local-first vector
- low-hardware vector
- license/safety vector

## Skill 4 — Source Harvester

Input: search vectors.

Output: candidate source records only. Do not ingest code yet.

Preferred source types:

- official docs
- GitHub repositories
- Hugging Face models/datasets/spaces
- npm / PyPI / package registries
- arXiv / papers with code
- browser API docs
- Cloudflare docs
- Creative Commons/public-domain asset libraries

## Skill 5 — License Gate

Input: candidate source records.

Output: license status.

License classes:

- permissive: MIT, Apache-2.0, BSD, CC0
- conditional: GPL, LGPL, MPL, CC-BY
- restricted: non-commercial, source-available, custom terms
- unknown: reject or hold for review

Rule: unknown license is not free enough for automatic integration.

## Skill 6 — Security Gate

Input: candidate source records and metadata.

Output: safety risk.

Check:

- suspicious repo age/star pattern
- missing license
- binary blobs
- install scripts
- dependency sprawl
- unmaintained packages
- issues mentioning malware, token theft, miner, spyware
- unknown model weights

Rule: unknown code is never executed outside a sandbox.

## Skill 7 — Runtime Fit Filter

Input: candidate + user hardware constraints.

Output: where it can actually run.

Targets:

- Samsung phone
- 2015 HP laptop
- browser-only / static PWA
- local Python companion
- Cloudflare Pages
- Cloudflare Worker
- future GPU machine
- manual handoff workflow

## Skill 8 — Capability Packet Compressor

Input: vetted candidate.

Output: small reusable packet.

Packet fields:

- primitive
- candidate
- source
- license_status
- runtime_fit
- hardware_fit
- adapter_plan
- smallest_test
- verdict
- proof_notes

## Skill 9 — Build Atom Compiler

Input: primitive packet + source packet + adapter packet.

Output: smallest useful build atom.

A build atom may be:

- one script
- one JSON schema
- one prompt compiler
- one adapter
- one UI widget
- one command
- one local test
- one handoff packet

Rule: never start with a giant app.

## Skill 10 — Adapter Planner

Input: build atom.

Output: integration path.

Adapter types:

- browser API adapter
- local Python adapter
- manual copy/paste adapter
- Cloudflare Worker adapter
- prompt export adapter
- local file import adapter
- external tool handoff adapter

## Skill 11 — Proof Gate

Input: output plan.

Output: truth boundary.

Every output must mark:

- known
- assumed
- unverified
- risky
- rejected
- safe next test

## Skill 12 — Twis Holo Handoff

Input: approved build atom.

Output: clean Twis Holo packet.

The handoff must not bloat the Workshop. It should add either:

- a packet
- a registry entry
- a single adapter
- a documented build recipe
- a tiny UI hook

## Anti-Skills

The kernel must not:

- scrape paywalled/pirated content
- clone voices without consent
- execute unknown code directly
- treat source-available as automatically open source
- pull giant dependencies without review
- add a new room/app for every idea
- confuse discovery with integration
- pretend a model/tool is free without license proof

## Success Test

Given a rough idea the user cannot phrase correctly, the kernel should return:

1. decoded intent
2. primitive list
3. search vectors
4. candidate map
5. license/security/runtime notes
6. smallest build atom
7. Twis Holo handoff packet
