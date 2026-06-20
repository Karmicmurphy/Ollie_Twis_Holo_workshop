# Repo Passover — Artifact Compass / Salvage / Road-Signal Update

Date: 2026-06-20

Repo: `Karmicmurphy/Ollie_Twis_Holo_workshop`

## Purpose

Run a bounded passover over the Workshop repository, with special focus on:

- Artifact Compass
- salvage / recovery behavior
- Road-Signal Machine and music compiler work
- current repo truth vs current code reality
- what needs updating next

## Files inspected directly

- `README.md`
- `app/index.html`
- `app/modules/modules.json`
- `app/assets/artifact-compass.js`
- `app/assets/road-signal-machine.js`

## Current repo-level truth

The README still describes the Workshop as a reinforced local build with:

- local project folders
- SQLite + FTS5 artifact index
- project switching
- artifact saving/search/deletion
- session close records
- project ZIP export
- folder import with hashes/source authority/skipped-file reporting
- Talk, Write, Music, Images, Video, Research, Coding, Import, My Work, Modules, Settings
- Artifact Compass browser search overlay
- optional Cloudflare remote hull

This remains directionally correct.

## Artifact Compass passover

### Current implementation

`app/assets/artifact-compass.js` is a no-dependency browser layer over local Workshop state.

It reads:

- `twisHolo.full.v1` localStorage state
- current project id
- saved items/artifacts

It supports:

- keyword tokenization
- stop-word filtering
- title/type/path/body weighting
- match reasons
- related artifact hints by token overlap
- type/kind filtering
- clickable chips from common terms
- local-only operation

### Fix applied

The UI heading said:

`Savage local search`

That was likely a typo/noise artifact. It was corrected to:

`Salvage local search`

Commit:

`f30a0966488fa9c047d1d414e6c8a5af783bb93b`

### Artifact Compass status

PASS for current browser-only layer.

It is small, useful, free, local-first, and does not overreach.

### Artifact Compass next stage

The correct next build is not cloud search.

The correct next build is:

- saved search missions
- handoff packet from selected artifact results
- companion-backed SQLite FTS5 diagnostics
- optional local embeddings later

Artifact Compass should become the bridge between:

```text
found artifacts -> selected packet -> engine/module -> output artifact -> receipt
```

## Salvage / Recovery passover

### Current repo status

The README says Recovery Importer supports:

- folder import
- copy
- hashes
- source authority
- skipped-file reporting
- indexing
- receipt

The module registry says Recovery Importer is:

- local companion based
- SHA-256
- SQLite
- receipt-backed
- human-selected folder only

This is correct as an architecture.

### Salvage risk

Salvage must not become blind ingestion.

Do not allow:

- whole-disk scraping
- hidden secret import
- automatic canonization
- cloud upload of private files
- external runtime access to private folders

### Correct salvage rule

Salvage means:

```text
human-selected source -> copied artifact -> hash -> source authority state -> skipped-file report -> receipt -> human review
```

## Road-Signal passover

### Current implementation status

`app/assets/road-signal-machine.js` is now active and loaded from `app/index.html`.

Current version in code:

`Road-Signal Machine v3`

Current v3 capabilities:

- mechanism presets
- gear size
- gear speed
- rhythm density
- tension
- section energy
- female voice mode
- lead/support/accent engines
- AI behavior
- drop behavior
- mechanism pad banks
- 16-step road loop
- proof loader
- fused-line prompt builder
- code-shaped fused packet builder
- full Producer AI prompt builder
- lyric block builder
- copy output
- local browser save

### Important finding

Road-Signal is further along than the last memory snapshot suggested.

It is no longer only v2.1.

It has already moved to v3 in the active JavaScript.

### v3 value

This is the right direction.

The module now does what the recent research asked for:

```text
lyrics + gears + music math + timing feel + female response + FX event -> code-shaped fused packet
```

This is the strongest current Workshop-specific invention inside the Music room.

### v3 risk

The module is now large and dense.

It is still acceptable as a single file, but v4 should split it before it becomes hard to maintain.

Recommended split:

```text
app/assets/road-signal-machine.js          # UI/render wiring
app/assets/road-signal-data.js             # pads, engines, presets, phrases
app/assets/road-signal-compiler.js         # buildPrompt/buildPacket/buildFusedLinePrompt
```

Do not do this split unless ready to test carefully, because current single-file load is working and simple.

## Module registry drift

`app/modules/modules.json` still lists Music Mini Engine as version `1.1.0` with notes about a free scratchpad for songs before DAW/generation.

That is now incomplete.

The Music room has grown a Road-Signal Machine v3 compiler layer, but the module registry does not mention it yet.

Recommended update:

- Music Mini Engine version should be bumped.
- Notes should mention Road-Signal Machine v3 gear compiler.
- Input boundary should include song notes, gear packet, fused-line prompt, and local pattern data.
- Output artifact should include music sketch, song prompt, and road-signal packet.

## README drift

The README correctly describes the Workshop broadly, but it does not yet mention:

- Road-Signal Machine v3
- gear compiler
- code-shaped fused packet output
- Music room as prompt/song compiler, not only drum/melody scratchpad

Recommended update:

Add a short subsection under Media/Music or What is working:

```text
Road-Signal Machine v3 in the Music room: gear compiler, fused-line prompt builder, code-shaped packet export, local-first prompt artifact layer.
```

## Cloudflare / remote passover

The README still correctly states Cloudflare remote hull is optional and non-authoritative.

Keep this boundary.

Road-Signal can run in browser/cloud shell, but generated prompts and packets should remain user-controlled artifacts.

Do not add server-side music generation yet.

## Artifact Compass + Road-Signal connection

This is the major future opportunity.

Generated Road-Signal packets should become searchable artifacts.

Artifact Compass should later be able to search:

- song packets
- lyric blocks
- gear presets
- proof templates
- generated prompt exports
- Road-Signal phrase pools
- female voice modes

Then Compass can produce:

```text
selected Road-Signal packet -> handoff packet -> prompt compiler -> output prompt artifact
```

## Best next repo updates

### Immediate

1. Update README to mention Road-Signal Machine v3.
2. Update module registry Music engine entry.
3. Add a Road-Signal artifact-save button later.

### Near next

4. Save Road-Signal code-shaped packets into My Work/localStorage.
5. Make Artifact Compass find Road-Signal artifacts by type.
6. Add handoff packet builder from Artifact Compass selected results.

### Later

7. Split Road-Signal code into data/compiler/UI files.
8. Add local companion Python compiler.
9. Add optional MIDI sketch export from Road-Signal packet.

## Hard no-build boundaries

Do not:

- turn Music into a full DAW yet
- add paid music APIs
- make Road-Signal depend on Suno/Udio/Lyria/etc.
- upload private local files to Cloudflare
- let Artifact Compass become cloud search
- let any engine write Canon directly

## Final verdict

KEEP and continue.

The Workshop is coherent:

- Artifact Compass = find/recover/relate artifacts
- Recovery Importer = bring old work in with receipts
- Road-Signal Machine = compile music ideas into gear/math/prompt artifacts
- Engine Harness = keep tools replaceable and bounded
- Cloudflare = optional non-authoritative shell

The next correct update is not another big invention.

The next correct update is integration discipline:

```text
Road-Signal output should become a saved artifact that Artifact Compass can find.
```
