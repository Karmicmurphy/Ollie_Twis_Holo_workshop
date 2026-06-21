# Windows Setup Checklist — Twis Holo Workshop

## Purpose

Make the Workshop easy to open on Randy's laptop and phone without confusing local/private work with cloud/away-mode access.

## Hard rule

```text
LOCAL = private home base
CLOUD = phone / away-mode shell
GITHUB = code backup and deploy source
```

Do not treat Cloudflare as the private vault.

## Expected local folder

Recommended stable folder:

```text
C:\Users\Randy\Twis-Holo-Workshop\
```

The exact folder can be different, but it should be stable and not buried in Downloads.

## Expected local URL

When local Workshop is running, open:

```text
http://127.0.0.1:8787
```

## Expected cloud URL

Cloud/phone/away-mode shell:

```text
https://ollie-twis-holo-workshop.pages.dev/
```

## Launcher files to verify

These files should exist in the repo:

```text
launchers/open-workshop-local.bat
launchers/open-workshop-cloud.bat
launchers/open-workshop-cloud.url
launchers/create-desktop-shortcuts.bat
launchers/generate-workshop-icon.ps1
```

## Icon support

The shortcut helper now attempts to generate a Windows `.ico` file at:

```text
app\assets\icons\twis-holo-icon.ico
```

The generator script is:

```text
launchers\generate-workshop-icon.ps1
```

It uses built-in Windows/.NET drawing and does not require paid tools.

## One-click setup

From the Workshop folder:

1. Open `launchers`.
2. Double-click:

```text
create-desktop-shortcuts.bat
```

Expected result:

```text
Twis Holo Workshop - LOCAL
Twis Holo Workshop - CLOUD
```

on the Desktop.

## What LOCAL should do

The LOCAL shortcut should run:

```text
start-workshop.bat
```

Expected behavior:

- starts the local companion/server
- opens or supports opening `http://127.0.0.1:8787`
- keeps private work local

## What CLOUD should do

The CLOUD shortcut should open:

```text
https://ollie-twis-holo-workshop.pages.dev/
```

Expected behavior:

- opens the Cloudflare shell
- useful for phone/away-mode
- not treated as private source authority

## If Windows blocks the script

Right-click:

```text
create-desktop-shortcuts.bat
```

Choose:

```text
Run as administrator
```

If PowerShell execution is blocked, the batch uses:

```text
-ExecutionPolicy Bypass
```

for this one setup run.

## Manual fallback

### Manual LOCAL shortcut

1. Right-click Desktop.
2. Choose `New > Shortcut`.
3. Browse to:

```text
start-workshop.bat
```

4. Name it:

```text
Twis Holo Workshop - LOCAL
```

### Manual CLOUD shortcut

1. Right-click Desktop.
2. Choose `New > Shortcut`.
3. Paste:

```text
https://ollie-twis-holo-workshop.pages.dev/
```

4. Name it:

```text
Twis Holo Workshop - CLOUD
```

## Phone setup

Android Chrome:

1. Open `https://ollie-twis-holo-workshop.pages.dev/`.
2. Tap three-dot menu.
3. Tap `Add to Home screen` or `Install app`.
4. Name it `Twis Holo`.

IPhone Safari:

1. Open `https://ollie-twis-holo-workshop.pages.dev/`.
2. Tap Share.
3. Tap `Add to Home Screen`.
4. Name it `Twis Holo`.

## Acceptance check

Windows cleanup is acceptable when:

- LOCAL shortcut exists on Desktop.
- CLOUD shortcut exists on Desktop.
- LOCAL shortcut opens local Workshop path or starts the local server.
- CLOUD shortcut opens Cloudflare shell.
- Icon generation creates `app\assets\icons\twis-holo-icon.ico` or safely falls back to a Windows icon.
- Randy knows which one is private and which one is cloud.

## Next build after Windows setup

After Windows setup is tested, move to:

```text
My Work + Artifact Compass functional test
```

Then:

```text
Music / Road-Signal artifact save test
```

Do not build new big features before those are proven.
