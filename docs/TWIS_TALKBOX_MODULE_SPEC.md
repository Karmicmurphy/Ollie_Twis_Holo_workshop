# Twis TalkBox Module Spec

## Purpose

Twis TalkBox is the first practical FlashRiver worker inside Twis Holo Workshop.

It is not the whole Workshop. It is the first small local worker lane:

```text
Talk / Build room -> Local API Worker Kit -> Twis TalkBox worker -> artifact + receipt
```

## MVP behavior

Required endpoints from the handoff package:

- `GET /health`
- `GET /tools`
- `GET /workspace`
- `POST /ask`
- `POST /read-file`
- `POST /explain-code`
- `POST /write-note`
- `POST /speak`

## Integration target

Do not run a second competing server unless needed. Prefer merging TalkBox behavior into the existing local companion routes or exposing it as a module under the existing companion.

Current Twis Holo already has:

- local Python companion;
- SQLite project store;
- artifact saving;
- receipts;
- coding bench;
- AI adapter settings;
- local request security checks.

TalkBox should reuse those pieces instead of rebuilding them.

## Required hardening before promotion

### Path containment

Use real path containment, not string prefix matching.

Correct pattern:

```python
base = WORKSPACE.resolve()
target = (base / user_path).resolve()
try:
    target.relative_to(base)
except ValueError:
    return {"ok": False, "error": "Path denied: outside workspace"}
```

### Read-only first

`read-file` is allowed inside workspace.

Writes are allowed only to controlled notes/artifacts folders.

### JSON output

Every route must return a plain JSON object with:

- `ok` or `status`;
- clear error text when failed;
- no raw secrets;
- no hidden provider payload dumps.

### Receipt rule

Any write should create or update a receipt/artifact path in the main Workshop store.

## Promotion stages

### v0.1

- Health route.
- Tool list.
- Workspace listing.
- Safe read-file.
- Explain-code stub.
- Write-note to controlled folder.
- Speak stub.
- Tests.

### v0.2

- Wire to Workshop active project.
- Save outputs as artifacts.
- Add receipts for writes.
- Add UI hooks in Talk and Build rooms.

### v0.3

- Add swappable brain adapter using the existing AI adapter safety gates.
- Add local-only default first.
- Remote/cloud only through allowlisted settings.

## Do not add yet

- autonomous file editing;
- broad filesystem scanning;
- paid API requirement;
- cloud storage;
- hidden background tasks;
- agent swarm behavior;
- private archive upload.
