# Codex Prompt — FlashRiver Integration Pass

Paste this into Codex while working in this repo.

```text
Follow AGENTS.md and docs/CODEX_DEFAULT_PRESET.md.

Mission:
Integrate the uploaded FlashRiver / Twis Workshop Agent Handoff Package as a private/local source archive intake flow, not as a public raw dump.

Read first:
- docs/FLASHRIVER_SOURCE_ARCHIVE_INTAKE.md
- docs/TWIS_TALKBOX_MODULE_SPEC.md
- docs/WORKSHOP_ARCHITECTURE.md
- docs/SECURITY_GATES.md
- docs/CLOUDFLARE_COST_GUARDRAILS.md

Build target:
Add a local companion import route for FlashRiver handoff packages.

Required behavior:
1. Accept a local ZIP path supplied by the user.
2. Calculate SHA-256.
3. Verify optional expected SHA.
4. Run ZIP integrity test.
5. Inventory top-level files.
6. Detect handoff docs: AGENT.md, CONTEXT.md, HARNESS.md, BUILD_PLAN.md, PRODUCT_SPEC.md, KNOWN_LIMITS.md, NEXT_PROMPT_FOR_CODEX.md.
7. Import public-safe handoff docs as Twis Holo artifacts.
8. Keep nested source ZIPs and raw source artifacts local-only.
9. Create receipts for the import.
10. Return a plain JSON summary.
11. Add tests.

Rules:
- Do not upload raw source artifacts to GitHub or Cloudflare.
- Do not add paid dependencies.
- Do not use cloud storage.
- Do not trust filenames as proof.
- Keep local PC + SQLite + project folders as authority.
- Use real Path containment; do not use string-prefix containment.
- If something cannot be proven, mark it referenced or quarantined.

Definition of done:
- Existing tests pass.
- New FlashRiver import tests pass.
- Route returns JSON.
- Imported docs become artifacts.
- Source ZIPs stay local-only.
- Receipts record package SHA, size, imported docs, quarantined items, and known limits.
- Summary explains exactly what changed and what remains manual/private.
```
