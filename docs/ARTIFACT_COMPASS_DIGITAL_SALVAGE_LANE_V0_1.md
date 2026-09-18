# Artifact Compass — Digital Salvage Lane V0.1

Status: candidate lane; not deployed to the authoritative local Workshop.

## Purpose

Digital Salvage is a bounded Artifact Compass discovery lane for finding useful technology that has been abandoned, archived, discontinued, under-maintained, superseded, or simply forgotten — while preserving the difference between **publicly visible** and **legally reusable**.

The lane salvages mechanisms, ideas, algorithms, file formats, adapters, tests, documentation patterns, and legally reusable source code. It does **not** claim ownership of abandoned-looking live infrastructure or data.

## Core rule

**Reachable is not ownerless. Forgotten is not permission. Public is not automatically reusable.**

A candidate can be inspected only through a lawful public-read path. Code can be reused only when its license or public-domain status permits that use.

## Hard boundaries

The lane must never:

- probe random live servers, databases, buckets, dashboards, admin panels, or private APIs;
- bypass authentication, rate limits, robots/terms controls, paywalls, or access controls;
- use leaked credentials, tokens, cookies, keys, session material, or exposed secrets;
- enumerate private network ranges or localhost targets;
- treat an exposed database as salvageable property;
- download personal/private datasets merely because they are publicly reachable;
- clone, install, execute, import, or activate candidate code automatically;
- infer that an inactive or archived project has surrendered copyright;
- promote unknown-license code into Workshop code.

If a discovery points at exposed private data or a likely misconfiguration, record only enough metadata to reject/quarantine it and stop.

## Binding into the existing salvage compiler

```text
Rough Human Signal
  -> Intent Decoder
  -> Primitive Splitter
  -> Search Vector Builder
  -> Digital Salvage Source Harvester
  -> Access Basis Gate
  -> License Gate
  -> Security Gate
  -> Runtime Fit Filter
  -> Salvage Score
  -> Capability Packet Compressor
  -> Build Atom Compiler
  -> Proof Gate
  -> Twis Holo Handoff
```

This is a new source-harvesting lane, not a replacement for Artifact Compass or the Primitive Salvage Compiler.

## Allowed source classes

V0.1 may inspect only public/read-only sources from these classes:

1. **Public Git repositories** — GitHub or other openly published source repositories.
2. **Software Heritage** — archived public source origins and snapshots.
3. **Official project sites/docs** — documentation, release notes, migration guides, deprecation notices.
4. **Public package registries** — package metadata and published artifacts subject to registry and package licenses.
5. **Public academic/government archives** — papers, datasets, source releases, and public-domain material.
6. **Internet/web archives** — for historical documentation or source that was lawfully public; original copyright/license still controls reuse.

Unknown hosts are metadata-only until their public-read basis is clear.

## Source adapters

### GitHub public repository adapter

Use repository search and metadata first. Favor license-qualified searches. Capture:

- repository URL;
- archived flag;
- pushed/updated dates;
- license key/SPDX id when detected;
- default branch;
- repository size;
- topics/language;
- release/deprecation signals;
- exact file paths inspected.

GitHub license detection is a convenience signal, not final legal proof. If the detected license conflicts with repository files or documentation, mark `needs_review`.

### Software Heritage adapter

Use Software Heritage origin search/metadata search to locate preserved public source origins. Capture the origin URL and any stable Software Heritage identifiers available for the inspected object.

Software Heritage preservation proves that source was archived; it does not change the original license.

## Access basis gate

Every candidate gets one of:

- `public_read`: intentionally public source/documentation/metadata;
- `public_archive`: preserved copy of material that was lawfully public;
- `public_domain`: verified public-domain material;
- `owner_permission`: explicit permission exists;
- `unknown`: stop at metadata, no content reuse;
- `reject`: exposed/private/credentialed/misconfigured/unclear access path.

Only the first four can proceed beyond metadata review.

## License gate

License status is independent of access basis.

Classify as:

- `permissive`: MIT, Apache-2.0, BSD, ISC, 0BSD and similar permissive licenses;
- `copyleft`: GPL/LGPL/AGPL and similar licenses; reuse is conditional on obligations;
- `file_copyleft`: MPL/EPL-style obligations requiring review of the integration boundary;
- `public_domain`: verified public-domain/CC0-equivalent dedication where applicable;
- `custom`: explicit nonstandard license; manual review required;
- `unknown`: no reliable reuse permission found;
- `reject`: license explicitly forbids the intended use.

**No license = no code salvage.** Public code with no license may still be studied as a reference, but must not be copied into Workshop source.

## Abandonment signals

Abandonment is a ranking signal only. It never changes ownership or license.

Useful signals:

- repository is explicitly archived;
- official project says discontinued/deprecated/end-of-life;
- no meaningful commits/releases for a long period;
- maintainer states project is unmaintained;
- successor project replaced it;
- package is deprecated/yanked;
- original host vanished but a public archive remains.

Record the exact evidence. Do not label a project abandoned solely because it is old.

## Salvage score

Score 0–100 after gates pass:

- **Capability fit — 0–25**: does it solve a real Workshop primitive?
- **License clarity — 0–20**: how confidently can we reuse/adapt it?
- **Primitive extractability — 0–20**: can one mechanism be taken without importing a platform?
- **Runtime fit — 0–15**: local-first, CPU/RAM fit, browser/local companion fit.
- **Evidence quality — 0–10**: official sources, stable archive, exact commit/SWHID, reproducible metadata.
- **Maintenance/abandonment value — 0–10**: useful neglected technology, discontinued implementation, or orphaned mechanism worth preserving.

Penalty flags do not silently lower the score; they force review:

- unknown license;
- unclear provenance;
- plugin/custom-code execution;
- broad filesystem/network access;
- hidden telemetry/upload;
- binary-only dependency;
- credential requirement;
- unclear redistribution rights.

## Verdicts

- `KEEP`: clearly useful, lawful, narrow salvage target; ready for a tiny proof.
- `TEST`: promising but needs bounded runtime/security/license proof.
- `WATCH`: useful idea or source, but not needed now or not sufficiently verified.
- `DEFER`: valid salvage, wrong phase.
- `REJECT`: not lawful, not safe, not useful, or too broad.
- `QUARANTINE`: contains a specific unresolved access/security/licensing risk; do not inspect further until resolved.

## Required salvage card

Every candidate that survives first-pass screening must conform to `schemas/digital-salvage-card.schema.json` and record:

- exact source URL and source class;
- access basis;
- license status and SPDX id when known;
- abandonment evidence, if any;
- exact primitive worth salvaging;
- what **not** to take;
- runtime/security risks;
- provenance anchor (commit/tag/SWHID/archive snapshot when available);
- score breakdown;
- verdict;
- smallest proof step;
- Twis Holo handoff boundary.

## Search modes

### `/salvage-primitive`

Input: one primitive, e.g. `event-sourced agent state`, `offline speech segmentation`, `minimal audio loop scheduler`.

Output: ranked salvage cards only.

### `/salvage-project`

Input: one Workshop project/room.

Output: missing primitives -> search vectors -> candidate cards -> one recommended tiny proof.

### `/salvage-archive`

Input: known dead/discontinued project or URL.

Output: archived-source map, license/access basis, extractable primitives, and KEEP/TEST/WATCH/REJECT decisions.

### `/salvage-dead-tech`

Input: domain.

Purpose: intentionally hunt deprecated, archived, discontinued, superseded, or long-unmaintained open technology for overlooked mechanisms.

This mode must still run license and access gates before content reuse.

## Default five-pass expedition

1. **Landscape pass** — map official/current solutions and historical terminology.
2. **Dead-tech pass** — search archived/deprecated/unmaintained open projects.
3. **Archive pass** — look in Software Heritage and stable public archives for vanished origins.
4. **Primitive pass** — strip candidates down to useful mechanisms, not whole applications.
5. **Proof pass** — choose at most one tiny lawful proof target and stop.

Stop early when another pass is unlikely to change the successor decision.

## V0.1 execution posture

- Browser Artifact Compass remains local-only and performs no network fetches.
- Chat/Codex or a reviewed local companion may run public-read searches.
- Search results become salvage cards; they do not become dependencies.
- No automatic clone/install/run.
- No Canon write.
- No live Workshop deployment without the normal owner approval/release gate.

## Proof condition

Digital Salvage V0.1 is considered proven when one expedition can:

1. find at least three public candidates from approved source classes;
2. reject any no-license/exposed/private-data candidate correctly;
3. preserve exact provenance for each surviving candidate;
4. produce one `KEEP` or `TEST` salvage card;
5. produce one smallest build atom without installing candidate code.
