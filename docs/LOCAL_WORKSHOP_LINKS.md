# Local Workshop Links and Launcher Setup

This guide explains how to keep a stable local launcher and a stable cloud launcher for Twis Holo Workshop.

## Two launchers

You want two different buttons:

```text
Twis Holo Workshop - LOCAL
Twis Holo Workshop - CLOUD
```

## What each one means

### LOCAL

The local launcher starts the private Workshop from your laptop.

It should run:

```text
start-workshop.bat
```

The local Workshop opens at:

```text
http://127.0.0.1:8787
```

Use local for private work, recovered files, source authority, and anything that should stay on your computer.

### CLOUD

The cloud launcher opens the Cloudflare shell:

```text
https://ollie-twis-holo-workshop.pages.dev/
```

Use cloud for phone/away-mode access. Do not treat Cloudflare as your private vault.

## Files added

These launcher files live in:

```text
launchers/
```

Files:

```text
launchers/open-workshop-local.bat
launchers/open-workshop-cloud.bat
launchers/open-workshop-cloud.url
launchers/create-desktop-shortcuts.bat
launchers/generate-workshop-icon.ps1
```

## Easiest setup on Windows

1. Put the Workshop repo somewhere stable, for example:

```text
C:\Users\Randy\Twis-Holo-Workshop\
```

2. Open that folder.

3. Open the `launchers` folder.

4. Double-click:

```text
create-desktop-shortcuts.bat
```

5. It should create two Desktop shortcuts:

```text
Twis Holo Workshop - LOCAL
Twis Holo Workshop - CLOUD
```

The helper also attempts to create a Windows icon file at:

```text
app\assets\icons\twis-holo-icon.ico
```

using:

```text
launchers\generate-workshop-icon.ps1
```

## If Windows blocks the script

Right-click the file and choose:

```text
Run as administrator
```

Or manually create shortcuts.

## Manual LOCAL shortcut

1. Right-click Desktop.
2. Choose `New > Shortcut`.
3. Browse to your Workshop folder.
4. Select:

```text
start-workshop.bat
```

5. Name it:

```text
Twis Holo Workshop - LOCAL
```

## Manual CLOUD shortcut

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

## How to set a custom icon on Windows

Windows shortcut icons work best with `.ico` files.

The shortcut helper now tries to generate:

```text
app/assets/icons/twis-holo-icon.ico
```

If it exists, the LOCAL and CLOUD shortcuts use it automatically.

To set a custom icon manually:

1. Right-click the Desktop shortcut.
2. Click `Properties`.
3. Click `Change Icon`.
4. Browse to:

```text
app\assets\icons\twis-holo-icon.ico
```

5. Click `OK`, then `Apply`.

If the `.ico` file does not exist, run:

```text
launchers\generate-workshop-icon.ps1
```

or rerun:

```text
launchers\create-desktop-shortcuts.bat
```

## Phone launcher

On Android:

1. Open Chrome.
2. Go to:

```text
https://ollie-twis-holo-workshop.pages.dev/
```

3. Tap the three-dot menu.
4. Tap `Add to Home screen` or `Install app`.
5. Name it `Twis Holo`.

On iPhone:

1. Open Safari.
2. Go to:

```text
https://ollie-twis-holo-workshop.pages.dev/
```

3. Tap Share.
4. Tap `Add to Home Screen`.
5. Name it `Twis Holo`.

## Rule

```text
LOCAL = private home base
CLOUD = phone / away-mode shell
GITHUB = code backup and deploy source
```
