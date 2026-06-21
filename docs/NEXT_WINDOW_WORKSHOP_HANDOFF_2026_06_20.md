# Next Window Workshop Handoff — 2026-06-20

## Current repo

```text
Karmicmurphy/Ollie_Twis_Holo_workshop
```

## Current live cloud shell

```text
https://ollie-twis-holo-workshop.pages.dev/
```

## Current local rule

```text
LOCAL = private home base
CLOUD = phone / away-mode shell
GITHUB = code backup and deploy source
```

## Current status

The current build window finished the Road-Signal / Music-room pass and moved the Workshop into a clean next-build boundary.

The most recent meaningful completed build is:

```text
Road-Signal artifact-save bridge
```

This means Road-Signal Machine outputs can now become Workshop artifacts, not just text-box output.

## Important files changed recently

### Road-Signal Machine v3

```text
app/assets/road-signal-machine.js
```

Status:

- active Music-room module
- gear compiler
- code-shaped fused packet output
- fused-line prompt output
- full Producer AI prompt output
- lyric block output
- mechanism presets
- music math controls
- female voice modes
- timing feel
- proof loader

### Road-Signal artifact save bridge

```text
app/assets/road-signal-artifact-save.js
```

Commit:

```text
7f33082578110745e34e0405ff902862ce8274cb
```

Purpose:

Adds save buttons to Road-Signal Machine:

```text
Save current output as artifact
Save packet artifact
Save fused prompt artifact
Save Producer prompt artifact
Save lyric artifact
```

Saved artifact types:

```text
road-signal-packet
road-signal-fused-prompt
road-signal-producer-prompt
road-signal-lyrics
road-signal-artifact
```

### App shell wiring

```text
app/index.html
```

Commit:

```text
40c1dcdfd06c32e286afe1cc04fe736d190a92f0
```

Purpose:

Wired:

```text
assets/road-signal-artifact-save.js
```

immediately after:

```text
assets/road-signal-machine.js
```

### Artifact save proof doc

```text
docs/ROAD_SIGNAL_ARTIFACT_SAVE_BRIDGE.md
```

Commit:

```text
36349c267f543575b05090a18a297e2a88f344a4
```

### Launcher / Windows helper files

```text
launchers/open-workshop-local.bat
launchers/open-workshop-cloud.bat
launchers/open-workshop-cloud.url
launchers/create-desktop-shortcuts.bat
docs/LOCAL_WORKSHOP_LINKS.md
```

Purpose:

Create LOCAL and CLOUD launchers for Windows desktop use.

## What is ready to test

### Road-Signal artifact bridge test

1. Open the Workshop.
2. Go to Music.
3. Open Road-Signal Machine v3.
4. Click `Build code-shaped fused packet`.
5. Click `Save packet artifact`.
6. Go to My Work.
7. Search `road-signal` or `packet`.
8. Use Artifact Compass and search `gear compiler`, `fused-line`, or `code-shaped-packet`.

Expected result:

A saved Road-Signal artifact appears in My Work / Artifact Compass.

## Important limitation

In browser-only mode, Road-Signal artifacts save into browser localStorage.

In local companion mode, the bridge attempts to sync to:

```text
/api/projects/:projectId/artifacts
```

Do not claim disk/SQLite sync is proven until tested locally.

## Artifact Compass status

Artifact Compass is working as browser/localStorage search.

Recent typo fix:

```text
Savage local search -> Salvage local search
```

Commit:

```text
f30a0966488fa9c047d1d414e6c8a5af783bb93b
```

## Current cleanup boundary

Road-Signal feature work should pause until the save bridge is tested.

Next work should be Windows/local workflow cleanup.

## Next build: Windows cleanup

Build focus:

```text
Make the Workshop easy to launch and understand on Randy's laptop and phone.
```

Recommended next build steps:

1. Verify launcher files exist and are documented.
2. Add or generate a proper Windows `.ico` file.
3. Update launcher helper to use the `.ico` icon.
4. Add a simple `WINDOWS_SETUP_CHECKLIST.md`.
5. Add clear local folder convention:

```text
C:\Users\Randy\Twis-Holo-Workshop\
```

6. Confirm local launcher opens:

```text
http://127.0.0.1:8787
```

7. Confirm cloud launcher opens:

```text
https://ollie-twis-holo-workshop.pages.dev/
```

8. Add phone home-screen install steps if not already enough.

## Do not build next

Do not start:

- full DAW
- paid music APIs
- more Road-Signal feature expansion
- cloud storage for private files
- automatic import of whole computer
- Canon write automation

## Current repo truth in one sentence

Twis Holo Workshop is a local-first creative/salvage workspace; Road-Signal Machine v3 now compiles music ideas into code-shaped prompt artifacts, Artifact Compass finds saved work, and the next build is Windows/local launcher cleanup.
