# Primitive Salvage Compiler — Binding Harness

## Purpose

Define the bindings between rough human intent, salvage skills, capability packets, build atoms, and Twis Holo handoff boundaries.

This is the harness that keeps the idea from becoming vapor, app bloat, or agent chaos.

## Core Binding Chain

```text
Rough Human Signal
  -> Intent Decoder
  -> Primitive Splitter
  -> Search Vector Builder
  -> Source Harvester
  -> License Gate
  -> Security Gate
  -> Runtime Fit Filter
  -> Capability Packet Compressor
  -> Build Atom Compiler
  -> Proof Gate
  -> Twis Holo Handoff
```

## Binding 1 — Human Signal to Intent Packet

Input:

```json
{
  "raw_signal": "I want the smallest fastest free AI image generator thing.",
  "tone": "rough / frustrated / exploratory",
  "constraints": ["free core", "smallest", "fastest", "legal", "not bloated"]
}
```

Output:

```json
{
  "packet_type": "intent_packet",
  "decoded_intent": "Find or assemble a minimal free/open image generation workflow or adapter.",
  "target_domain": "image_generation",
  "hard_constraints": ["free core", "legal sources", "low bloat", "small proof first"],
  "unknowns": ["runtime", "hardware fit", "license", "model/tool choice"]
}
```

## Binding 2 — Intent Packet to Primitive Packet

Output:

```json
{
  "packet_type": "primitive_packet",
  "target_domain": "image_generation",
  "primitives": [
    "text_prompt_input",
    "model_or_external_workflow",
    "generation_runtime",
    "image_output_file",
    "preview_ui",
    "artifact_save",
    "license_safe_model"
  ]
}
```

## Binding 3 — Primitive Packet to Search Packet

Output:

```json
{
  "packet_type": "search_packet",
  "primitive": "license_safe_model",
  "vectors": [
    "open weight text to image model license Apache MIT",
    "ComfyUI low VRAM workflow open model",
    "local text to image model CPU low memory",
    "browser image generation ONNX WebGPU open source"
  ],
  "preferred_sources": ["official docs", "GitHub", "Hugging Face", "model card", "research paper"]
}
```

## Binding 4 — Candidate to Capability Packet

Output:

```json
{
  "packet_type": "capability_packet",
  "primitive": "text_to_speech",
  "candidate": "candidate_name",
  "source": {
    "platform": "github | huggingface | docs | package_registry | paper | asset_library",
    "url": "",
    "officialness": "official | community | unknown"
  },
  "license_status": "permissive | conditional | restricted | unknown | reject",
  "security_status": "low | medium | high | unknown",
  "runtime_fit": ["browser", "local_python", "cloudflare", "manual_handoff"],
  "hardware_fit": {
    "samsung_phone": "yes | fallback | no",
    "hp_2015": "yes | maybe | no",
    "cloudflare_pages": "yes | prompt_export_only | no",
    "future_gpu": "yes | no"
  },
  "adapter_plan": "one-line plan for how Twis Holo can use it",
  "smallest_test": "one tiny proof step",
  "verdict": "use | test | watch | reject | needs_review"
}
```

## Binding 5 — Capability Packet to Build Atom

Output:

```json
{
  "packet_type": "build_atom",
  "atom_id": "atom_tts_one_line_wav",
  "goal": "Generate one WAV from one text line using one legal local TTS option.",
  "files_needed": ["one script or adapter file", "one README/test note"],
  "run_mode": "manual | local_python | browser | cloudflare | external_handoff",
  "success_test": "Given a text line, produce an output file or prompt packet.",
  "integration_boundary": "do not add a full app; add only adapter packet or proof script"
}
```

## Binding 6 — Build Atom to Twis Holo Handoff

Output:

```json
{
  "packet_type": "twis_holo_handoff",
  "handoff_kind": "adapter | registry_entry | prompt_exporter | local_script | docs_only",
  "target_room": "music | images | video | write | build | modules | none",
  "bloat_risk": "low | medium | high",
  "dark_helix_review": true,
  "human_approval_required": true,
  "next_action": "exact smallest commit or manual test"
}
```

## Skill-to-Binding Map

| Skill | Consumes | Produces |
|---|---|---|
| Intent Decoder | raw signal | intent packet |
| Primitive Splitter | intent packet | primitive packet |
| Search Vector Builder | primitive packet | search packet |
| Source Harvester | search packet | candidate records |
| License Gate | candidate records | license status |
| Security Gate | candidate records | security status |
| Runtime Fit Filter | candidate records | runtime/hardware fit |
| Capability Packet Compressor | candidate + gates | capability packet |
| Build Atom Compiler | capability packet | build atom |
| Adapter Planner | build atom | handoff path |
| Proof Gate | all packets | known/assumed/risky notes |
| Twis Holo Handoff | build atom + proof | minimal integration packet |

## Minimal Runtime Modes

### Mode A — Manual AI-Assisted

No automation. The user and assistant run the harness in chat and copy packets into docs/registry.

### Mode B — Static Kernel

Browser-only JavaScript creates packets and handoff text. No scraping. No API keys.

### Mode C — Local Companion

Python companion can search official APIs, read local registry files, and create build atoms after review.

### Mode D — Optional AI Adapter

AI is used only for intent decoding, summarizing docs, comparing candidates, and generating adapters. AI never silently installs or runs unknown code.

## Bloat Guard

Before any integration, ask:

1. Is this a kernel function or a new app?
2. Can it be one adapter instead of a room?
3. Can it be a packet instead of code?
4. Can it be a prompt exporter instead of runtime integration?
5. Does Randy need this now or is it future bait?

If the answer is future bait, store as a packet and stop.

## First Proof Target

Use one domain only first.

Recommended proof target: `text_to_speech`.

Reason:

- User already wants gritty male and female voices.
- Browser fallback exists.
- Local Python path can be tested later.
- Output is easy to verify: one text line -> one audio file or fallback speech.

## Kernel Success Test

Given this raw signal:

> "I need free voices for Road-Signal, gritty male and female reality check."

The harness must output:

- intent packet
- primitive packet
- search packet
- at least three candidate source classes
- license/runtime warnings
- one smallest build atom
- Twis Holo handoff boundary
