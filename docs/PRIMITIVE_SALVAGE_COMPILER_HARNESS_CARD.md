# Harness Card — Primitive Salvage Compiler

## Card Name

Primitive Salvage Compiler

## Purpose

Recover the real technical question from rough human intent, split it into smallest capability primitives, salvage legal/free/open candidates, compress findings into capability packets, and compile the smallest working build atom without bloating Twis Holo Workshop.

## When To Use

Use this card when the user says or implies:

- I do not know how to ask the right question.
- How did someone build this for free?
- Find free tools/models/code/assets for this idea.
- I want to invent a new way to do this.
- Build the smallest fastest version.
- Search/salvage/recover what exists.
- Do not make another bloated app.

## Input

Rough human signal. Examples:

- "I need free TTS voices for Road-Signal."
- "How the fuck did this dude build this for free?"
- "I want the smallest AI image generator/editor thing."
- "Can we invent our own way instead of using a huge agent mess?"

## Output

The harness must produce:

1. Translated question
2. Primitive breakdown
3. Search vectors
4. Candidate source classes
5. License/safety/runtime filters
6. Smallest build atom
7. Integration boundary
8. Proof notes

## Required Passovers

### Passover 1 — Drift Guard

Check whether the response is turning into:

- another app
- another platform
- generic AI advice
- giant agent framework
- paid API dependency
- tool list without build path

If yes, stop and return to kernel/mechanism framing.

### Passover 2 — Intent Recovery

Translate rough language into technical intent.

Do not sanitize away the user's actual aim. Preserve urgency and constraints.

### Passover 3 — Primitive Split

Break the need into smallest capability primitives.

Do not search for whole products first.

### Passover 4 — Free/Open Salvage

Generate search vectors and candidate source classes.

Prefer official, open, permissive, local-first, low-hardware paths.

### Passover 5 — Legal/Safety Gate

Mark every candidate as:

- permissive
- conditional
- restricted
- unknown
- reject

Unknown means no automatic integration.

### Passover 6 — Runtime Fit

Score by where it can actually run:

- phone
- old HP laptop
- browser-only
- local Python companion
- Cloudflare Pages
- Cloudflare Worker
- future GPU
- manual handoff only

### Passover 7 — Build Atom

Return one smallest working test/build unit.

Examples:

- one script
- one adapter
- one prompt exporter
- one schema
- one registry entry
- one local command

### Passover 8 — Dark Helix Proof Boundary

Mark:

- known
- assumed
- unverified
- risky
- safe next step

## Forbidden Moves

The harness must not:

- pretend the internet can be blindly scraped and reused
- pull code without license review
- run unknown code directly
- suggest cloning real voices without consent
- create a separate app by default
- bloat Twis Holo with every discovery
- chase novelty without a proof atom
- equate free trial with free core

## Answer Shape

Use this structure:

```text
Decoded question:

Primitive split:

Free salvage vectors:

Candidate classes:

Filters/gates:

Smallest build atom:

Twis Holo boundary:

Proof notes:
```

## Short Invocation

"Run Primitive Salvage Compiler on this."

## Strong Invocation

"I do not know the right words. Decode my rough idea, split it into primitives, find the legal free/open capability paths, compress them into packets, and give me the smallest build atom without bloating Twis Holo."

## Success Criteria

The user should finish with:

- better words for the thing
- a smaller build path
- known free/open source directions
- clear risks
- one next proof step
- no giant new project unless explicitly chosen
