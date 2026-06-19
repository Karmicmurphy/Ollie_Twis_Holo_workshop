# Cloudflare Artifacts Watch

Date recorded: 2026-06-18
Material watch date: 2026-06-17

## Status

Cloudflare Artifacts is worth testing, but not trusting as the main Workshop vault.

Treat it as beta / watch-list infrastructure until access, durability, pricing, quotas, and operational boundaries are proven.

## Reported change

Cloudflare added dashboard management for Artifacts, described as a beta Git-compatible storage system with support for repos, namespaces, forks, search, and scoped read/write tokens.

## Why it matters

This touches Twis Holo Workshop in two useful areas:

1. Edge Git mirror for selected non-private Workshop artifacts.
2. Deploy staging area for public or shareable code/artifact packages.

It may become useful for repo-backed memory, portable public artifacts, and deployment handoffs.

## Architecture rule

Cloudflare Artifacts must not become the private Workshop source of truth.

The local PC companion remains authority for:

- private Workshop vault
- local folders
- local SQLite
- Canon decisions
- source review
- recovery imports
- full artifact memory
- private creative corpus

Cloudflare Artifacts can only be optional edge infrastructure.

## Allowed first tests

Use Cloudflare Artifacts only for:

- public demo artifacts
- deployable code snapshots
- sanitized handoff packets
- non-private sample data
- release candidates
- edge mirror experiments

Do not upload private source folders, Canon, personal records, raw recovery imports, or private creative source material.

## Safe first implementation shape

```text
Local PC companion / private Workshop core
-> selected sanitized export
-> Cloudflare Artifacts optional edge Git mirror
-> Cloudflare Pages / preview / handoff
```

The flow is one-way at first. Cloudflare may mirror or stage selected artifacts, but it does not write back into Canon or local source authority automatically.

## Not allowed yet

Do not add Cloudflare Artifacts as:

- primary vault
- Canon store
- private memory store
- automatic sync authority
- replacement for local SQLite
- replacement for GitHub
- required dependency for away mode

## Decision gate before deeper adoption

Before using Cloudflare Artifacts for anything important, verify:

- beta access status
- pricing / free-tier limits
- storage limits
- repo size limits
- token scopes
- audit/logging behavior
- export path
- delete/recovery behavior
- whether it is stable enough for public handoffs

## Current plan

Add Cloudflare Artifacts to the roadmap as:

```text
Optional edge Git mirror / deploy staging area
```

Do not wire it into the live Workshop until the manual Cloudflare Workers AI away-mode brain is proven.

Priority remains:

1. Cloudflare Workers AI binding named `AI`.
2. Redeploy Pages.
3. Confirm `/api/ai/chat` works.
4. Test Talk and voice mode.
5. Only then consider edge artifact mirror experiments.
