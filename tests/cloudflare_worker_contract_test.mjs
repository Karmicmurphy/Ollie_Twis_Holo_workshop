import worker from '../cloudflare/worker/src/index.js';

function env(overrides = {}) {
  return {
    ASSETS: { fetch: async () => new Response('asset-ok', { status: 200 }) },
    TWIS_REMOTE_HULL_MODE: 'public-shell',
    TWIS_ALLOW_AI: 'false',
    TWIS_ALLOW_REMOTE_WRITE: 'false',
    ...overrides
  };
}

async function readJson(response) {
  return JSON.parse(await response.text());
}

const health = await worker.fetch(new Request('https://example.test/api/health'), env());
if (health.status !== 200) throw new Error('health status failed');
const healthBody = await readJson(health);
if (!healthBody.localFirst || !healthBody.cloudOptional) throw new Error('health boundary failed');

const caps = await worker.fetch(new Request('https://example.test/api/capabilities'), env());
if (caps.status !== 200) throw new Error('capabilities status failed');
const capBody = await readJson(caps);
if (!capBody.endpoints.includes('/api/ai/chat')) throw new Error('AI chat endpoint not advertised');
if (capBody.gates.localAuthority !== 'local PC and local SQLite remain source of truth') throw new Error('local authority gate missing');

const aiGet = await worker.fetch(new Request('https://example.test/api/ai/chat'), env());
const aiGetBody = await readJson(aiGet);
if (aiGetBody.bindingPresent !== false || aiGetBody.status !== 'binding-missing') throw new Error('AI GET diagnostics failed');

const aiPostDisabled = await worker.fetch(
  new Request('https://example.test/api/ai/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
  }),
  env()
);
if (aiPostDisabled.status !== 403) throw new Error('AI should be disabled by default');

const inboxDisabled = await worker.fetch(
  new Request('https://example.test/api/inbox', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ note: 'test' })
  }),
  env()
);
if (inboxDisabled.status !== 403) throw new Error('remote inbox should be disabled by default');

const asset = await worker.fetch(new Request('https://example.test/'), env());
if ((await asset.text()) !== 'asset-ok') throw new Error('asset fallback failed');

console.log('Cloudflare Worker contract PASS');
