# Road-Signal Artifact Save Bridge

## Status

Road-Signal Machine now has an artifact-save bridge.

This finishes the missing connection:

```text
Road-Signal output -> Workshop artifact -> My Work / Artifact Compass search
```

## Files added / changed

Added:

```text
app/assets/road-signal-artifact-save.js
```

Wired into:

```text
app/index.html
```

## What the bridge does

The bridge watches for Road-Signal Machine in the Music room and adds artifact-save buttons:

```text
Save current output as artifact
Save packet artifact
Save fused prompt artifact
Save Producer prompt artifact
Save lyric artifact
```

## Artifact types

Saved outputs use Road-Signal-specific artifact types:

```text
road-signal-packet
road-signal-fused-prompt
road-signal-producer-prompt
road-signal-lyrics
road-signal-artifact
```

## Saved artifact payload

Each saved artifact includes:

- output/body text
- Road-Signal settings
- source: Road-Signal Machine
- Artifact Compass tags
- next action
- project id
- DRAFT authority state
- created/updated timestamps

## Local-first behavior

The bridge saves to:

```text
twisHolo.full.v1
```

It also tries to sync to the local companion endpoint when available:

```text
/api/projects/:projectId/artifacts
```

If the local companion is unavailable, the artifact still saves in browser localStorage.

## Test path

1. Open Workshop.
2. Go to Music.
3. Find Road-Signal Machine v3.
4. Click `Build code-shaped fused packet`.
5. Click `Save packet artifact`.
6. Go to My Work.
7. Search for `road-signal` or `packet`.
8. Open Artifact Compass and search `gear compiler`, `fused-line`, or `code-shaped-packet`.

## Important limitation

In browser-only fallback mode, the artifact is saved locally in the browser. It is not the same as a file on disk until local companion/SQLite sync is active or export is added.

## Next Windows cleanup step

After this bridge, the next practical build is Windows setup cleanup:

- launcher shortcuts
- icon `.ico` file
- local folder convention
- cloud/local toggle docs
- one-click desktop workflow

Do not build more Road-Signal features until this save bridge is tested in the live/local app.
