# FlashRiver Source Archive Intake

## Source package received

Package: `FLASHRIVER_TWIS_WORKSHOP_AGENT_HANDOFF_PACKAGE.zip`

SHA-256:

```text
6ef7317722202769b08d74a434519871736e055d1864fa5eb6c6fb547cb40108
```

Size: `7,363,639` bytes.

Receipt result: `PASS`.

## Role in Twis Holo Workshop

This package is a private/local source archive and handoff packet. It should not be dumped wholesale into public GitHub or Cloudflare.

Treat it as:

- source authority for FlashRiver / CERT-RIVER / Twis TalkBox handoff;
- private archive material for local import;
- module seed material for Twis Holo;
- proof/receipt material for CERT-RIVER validation;
- build guidance for Codex and coding agents.

## Integration rule

```text
raw archive -> local import -> source registry -> module extraction -> public-safe repo patch
```

Never:

```text
raw archive -> public GitHub dump
```

## Confirmed package contents

Important handoff files include:

- `README_START_HERE.md`
- `AGENT.md`
- `SKILLS.md`
- `CONTEXT.md`
- `HARNESS.md`
- `BUILD_PLAN.md`
- `ENGINEERING.md`
- `HANDOFF.md`
- `API_PLAN.md`
- `MCP_PLAN.md`
- `SECURITY_MODULE.md`
- `ARTIFACT_COMPASS_20_PASS_SALVAGE.md`
- `PRODUCT_SPEC.md`
- `PLATFORM_MATRIX.md`
- `NEXT_PROMPT_FOR_CODEX.md`
- `starter_code/twis_talkbox/`
- `source_artifacts/`
- `visuals/`
- `receipts/`

## Workshop module mapping

| Package area | Twis Holo destination |
|---|---|
| `Twis TalkBox` | Talk / Build / Local API Worker Kit |
| `CERT-RIVER` | Security Module / receipt validator |
| `Artifact Compass` | My Work / Recover / Search overlay |
| `FlashRiver` | Flow and handoff coordination layer |
| `MCP_PLAN` | Adapter gate docs, not core nervous system |
| `HARNESS.md` | Debug/pass-fail verification workflow |
| `source_artifacts/` | Local-only source archive |
| `visuals/` | Public-safe UI inspiration only after review |

## Immediate promoted work

Promote these public-safe ideas into the repo:

1. FlashRiver source archive intake rules.
2. Twis TalkBox module specification.
3. CERT-RIVER receipt/checker role.
4. Codex prompt for building the next local-first module.
5. Path-containment hardening requirement before TalkBox code promotion.

## Known starter-code issue

The starter worker `files.py` uses string prefix path containment. Before promotion into the main Workshop, replace it with `Path.resolve().relative_to(BASE.resolve())` style containment.

Required rule:

```python
try:
    target.relative_to(base)
except ValueError:
    deny
```

## Next implementation target

Build the FlashRiver/Twis archive importer inside the existing Workshop local companion:

- accept a local ZIP path;
- verify SHA-256;
- inspect files without trusting filenames;
- record a receipt;
- import public-safe docs as artifacts;
- keep nested source ZIPs local-only;
- classify docs into module lanes;
- expose results in My Work / Artifact Compass.
