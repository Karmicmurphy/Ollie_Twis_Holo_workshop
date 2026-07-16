# FlashRiver Intake API

This is the local-only API route that turns a verified FlashRiver handoff ZIP into Twis Holo source artifacts.

## Route

```text
POST /api/import-flashriver
```

## Body

```json
{
  "path": "C:/path/to/FLASHRIVER_TWIS_WORKSHOP_AGENT_HANDOFF_PACKAGE.zip",
  "expectedSha256": "6ef7317722202769b08d74a434519871736e055d1864fa5eb6c6fb547cb40108",
  "projectId": "flashriver-source-archive",
  "title": "FlashRiver Source Archive"
}
```

## What it does

1. Requires the request to come through the local companion.
2. Verifies the ZIP exists and is a `.zip` file.
3. Calculates SHA-256.
4. Fails if `expectedSha256` does not match.
5. Runs `ZipFile.testzip()`.
6. Copies the raw package into local `data/source_archives/flashriver/<sha-prefix>/`.
7. Extracts public-safe handoff docs into the active project under `sources/flashriver/<sha-prefix>/docs/`.
8. Copies nested source ZIPs into `sources/flashriver/<sha-prefix>/private_source_artifacts/` without indexing their private contents as public text.
9. Copies visuals into `sources/flashriver/<sha-prefix>/visuals/`.
10. Writes `FLASHRIVER_INTAKE_MANIFEST.json`.
11. Creates Twis Holo artifacts and a receipt.
12. Refreshes the portable artifact registry JSON snapshots.

## Boundary

The raw FlashRiver package and nested source ZIPs stay local. They are not committed to GitHub and are not sent to Cloudflare by this route.

## Example PowerShell call

```powershell
$body = @{
  path = "C:\Users\Randy\Downloads\FLASHRIVER_TWIS_WORKSHOP_AGENT_HANDOFF_PACKAGE.zip"
  expectedSha256 = "6ef7317722202769b08d74a434519871736e055d1864fa5eb6c6fb547cb40108"
  projectId = "flashriver-source-archive"
  title = "FlashRiver Source Archive"
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8787/api/import-flashriver" -ContentType "application/json" -Body $body
```

## Expected result

```json
{
  "ok": true,
  "projectId": "flashriver-source-archive",
  "artifactCount": 1,
  "manifest": {
    "zipTest": "PASS",
    "publicSafeDocsImported": 20,
    "privateSourcesCopied": [],
    "visualsCopied": []
  }
}
```

Counts vary with the package contents.

## Next UI step

Add a button in the Recover room:

```text
Import FlashRiver package
```

That button should collect a local path, expected SHA-256, and project ID, then call `/api/import-flashriver`.
