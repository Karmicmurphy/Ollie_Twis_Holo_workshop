# Free Tool Federation Policy

Date: 2026-06-18

Twis Holo may use many free, open, local, browser, and free-tier tools, but it must not depend on free trials or hidden account credit as core infrastructure.

## Core rule

A tool can be connected only as an adapter lane.

A tool cannot become the Workshop.

## Truly free core-safe tools

A tool is core-safe only when the useful path works without:

- a credit card;
- a paid API key;
- a time-limited trial;
- a cloud account as source authority;
- sending private folders by default;
- terms that block Randy's future use.

## Optional free-tier tools

A tool is optional when it has:

- quota limits;
- paid overflow;
- account login;
- hosted inference;
- provider-specific usage limits.

Free-tier tools must be labeled optional and quota-bound.

## Tool communication pattern

Tools communicate through artifacts, not through raw private Workshop memory.

```text
selected artifact or packet
  -> adapter manifest
  -> permission gate
  -> tool runtime
  -> output artifact
  -> receipt
  -> human review
```

## Discovery catalog

Each candidate tool should be recorded with:

- name;
- category;
- local, browser, cloud, or free-tier;
- license;
- maintenance status;
- data sent;
- quota or limits;
- input types;
- output types;
- sandbox boundary;
- whether it can write anything;
- off switch;
- receipt fields.

## Approved connection styles

- Local runtime for private work.
- Browser runtime for free public shell features.
- Static file artifact as the safest bridge between tools.
- Local HTTP endpoint only on localhost or approved HTTPS.
- Cloudflare remote hull as optional and non-authoritative.
- Protocol bridge only behind gate, allowlist, and receipts.

## Blocked as core

- Time-limited trials.
- Paid API dependency.
- Public arbitrary tool runners.
- Exposed MCP servers.
- Unreviewed browser automation agents.
- Any tool that needs raw access to source folders, secrets, email, GitHub write access, deployment, or Canon.

## Safe scout concept

The Workshop can eventually have a tool scout that reads public catalogs and docs, then proposes adapter manifests.

The scout proposes. Randy approves. The Workshop records receipts.
