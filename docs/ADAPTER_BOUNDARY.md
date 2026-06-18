# Adapter Boundary

Twis Holo Workshop may connect to local models, remote chat endpoints, Cloudflare workers, MCP servers, AG-UI streams, A2A agents, image generators, video generators, or future tools.

None of them are authority.

## Adapter classes

### Safe local adapter

Examples:

- local browser UI
- local Python companion
- SQLite artifact index
- artifact-registry JSON export
- project capsule ZIP

Allowed by default.

### Conditional adapter

Examples:

- OpenAI-compatible local endpoint
- Cloudflare remote hull
- MCP server
- AG-UI backend
- A2A agent
- ComfyUI local bridge
- LTX/Hunyuan/Wan video bridge

Allowed only after capability review and human confirmation.

### Blocked by default

Examples:

- shell execution
- arbitrary filesystem write
- reading secrets
- sending private memory
- publishing
- spending money
- deleting source
- approving Canon
- network exfiltration

Requires explicit human approval for that single action.

## Receipt rule

Every adapter action must create a receipt with:

- time
- project id
- actor
- action
- adapter id
- parameters shown to the human
- result summary
- files touched
- risk level
- approval status

## Tool metadata rule

Tool descriptions, agent cards, MCP tool metadata, AG-UI events, A2A cards, and generation workflow metadata are **untrusted input** until reviewed.
