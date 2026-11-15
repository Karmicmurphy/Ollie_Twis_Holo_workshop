import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestGet, onRequestPost } from '../functions/api/ai/chat.js';

const origin = 'https://ollie-twis-holo-workshop.pages.dev';
const env = {
  AI: { run: () => assert.fail('A denied request must never call inference.') },
  FOUNDATION_ACCESS_DOMAIN: 'fixture.cloudflareaccess.com',
  FOUNDATION_ACCESS_AUD: 'fixture',
  FOUNDATION_OWNER_SUB: 'fixture-owner',
};
const request = (target, from = origin) => new Request(target + '/api/ai/chat', {
  method: 'POST', headers: { origin: from, 'content-type': 'application/json' },
  body: JSON.stringify({ messages: [{ role: 'user', content: 'Fixture' }] }),
});

test('an AI binding alone cannot enable inference', async () => {
  for (const flag of [undefined, 'false']) {
    const bindings = { ...env, TWIS_ALLOW_AI: flag };
    assert.equal((await onRequestPost({ request: request(origin), env: bindings })).status, 503);
    assert.equal((await (await onRequestGet({ env: bindings })).json()).status, 'disabled');
  }
});

test('wrong origin and preview deployment are denied before inference', async () => {
  for (const input of [request(origin, 'https://example.com'), request('https://preview.example.com')]) {
    assert.equal((await onRequestPost({ request: input, env: { ...env, TWIS_ALLOW_AI: 'true' } })).status, 403);
  }
});

test('enabled inference still requires the verified owner session', async () => {
  assert.equal((await onRequestPost({
    request: request(origin), env: { ...env, TWIS_ALLOW_AI: 'true' },
  })).status, 401);
});
