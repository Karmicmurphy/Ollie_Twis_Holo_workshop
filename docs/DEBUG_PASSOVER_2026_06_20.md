# Debug Passover Report — 2026-06-20

Repo: `Karmicmurphy/Ollie_Twis_Holo_workshop`

## Scope

This passover reviewed the current Workshop shell, PWA/install wiring, Road-Signal v3 module, Cloudflare Pages/Worker documentation, and recent commit chain.

The local execution sandbox could not clone GitHub directly because DNS resolution failed, so this report is based on connected GitHub file/commit inspection rather than a full local `npm`/Python test run.

## Current state

The repo now includes:

- Installable app metadata through `app/manifest.webmanifest`.
- App icon at `app/assets/icons/twis-holo-icon.svg`.
- Service worker at `app/sw.js`.
- One-tap installer helper at `app/assets/install-workshop.js`.
- Installer script wired into `app/index.html`.
- Road-Signal Machine v3 in `app/assets/road-signal-machine.js`.
- Cloudflare Pages guidance in `docs/CLOUDFLARE_REMOTE_HULL_SETUP.md`.

## Passover results

### App shell

Status: PASS, with manual verification still needed after Cloudflare redeploy.

`index.html` links the manifest, favicon/app icon, CSS, core scripts, Road-Signal module, installer helper, and service worker registration.

### PWA/install flow

Status: PASS for wiring.

The install helper creates:

- Home-room `Install Twis Holo` card.
- Floating install button.
- `beforeinstallprompt` capture for Android/Chrome/Edge.
- Standalone detection to hide installer once installed.
- Fallback instructions for iPhone/iPad, Android, and PC browsers.

Known caveat: actual install prompt behavior is browser-controlled. Safari/iPhone may not fire a one-tap prompt and will require Share → Add to Home Screen.

### Service worker

Status: PASS for shell cache list.

`app/sw.js` cache version is now `twis-holo-workshop-v2` and includes the installer helper.

### Manifest

Status: PASS for basic web app manifest.

Known caveat: SVG icon is valid as an app icon reference in the current repo, but some devices/platforms behave better with PNG `192x192` and `512x512` icons. A PNG icon pack was generated outside the repo for that future hardening step.

### Road-Signal Machine v3

Status: PASS for feature wiring.

Road-Signal v3 adds:

- Mechanism presets.
- Gear size.
- Gear speed.
- Rhythm density.
- Tension.
- Section energy.
- Female voice modes.
- Code-shaped fused packet output.
- Fused-line prompt output.
- Full Producer AI prompt output.

The module remains inside the Music room and does not bloat into a DAW.

### Cloudflare path

Status: PASS for documentation direction.

The repo documentation now separates:

- Cloudflare Pages static shell path.
- Optional Worker remote hull path.

Pages recommendation remains:

- Framework preset: None.
- Build command: `npm run build`.
- Output directory: `dist`.
- Root directory: `/`.

### CI/tests

Status: WARNING.

No GitHub Actions/check statuses were found for the latest inspected commit. That means there is no automatic repo-side proof that tests ran after the latest patches.

## Issues found

1. No configured GitHub Actions/CI status checks were found.
2. Full local clone/test could not be performed from this environment because direct GitHub DNS failed.
3. Best future icon hardening is to commit PNG icons (`192`, `512`, Apple touch icon) into `app/assets/icons/` and point the manifest to them.

## Verdict

The repo is structurally good enough to redeploy and test manually.

No blocking static issue was found in the installer wiring, manifest wiring, service worker cache list, or Road-Signal v3 module wiring from connected GitHub inspection.

Manual smoke test after Cloudflare redeploy:

1. Open `https://ollie-twis-holo-workshop.pages.dev/`.
2. Hard refresh.
3. Confirm Home room shows `Install Twis Holo` card and floating install button.
4. Open Music room.
5. Confirm Road-Signal Machine v3 appears.
6. Click `Build code-shaped fused packet`.
7. Confirm output appears and can be copied.
8. On Android/Chrome/Edge, hit Install and confirm the app icon appears.

## Next recommended hardening

Add a tiny GitHub Actions workflow that runs static checks on every push:

- Confirm required files exist.
- Validate JSON manifest.
- Run JS syntax checks with Node.
- Confirm `index.html` script references resolve.
- Confirm service worker cache files exist.
