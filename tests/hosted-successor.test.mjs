import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { generateKeyPair, SignJWT } from 'jose';
import { zipSync } from 'fflate';
import { handle, REQUEST, INSTRUCTION, MANIFEST } from '../cloudflare/pages/hosted-commissioning-successor.js';

const origin = 'https://ollie-twis-holo-workshop.pages.dev';
const control = 'a'.repeat(40), actor = { id: 141688225, type: 'User' };
const { publicKey, privateKey } = await generateKeyPair('RS256');
const env = { FOUNDATION_ACCESS_DOMAIN: 'fixture.cloudflareaccess.com', FOUNDATION_ACCESS_AUD: 'aud',
  FOUNDATION_OWNER_SUB: 'owner', FOUNDATION_GITHUB_TOKEN: 'fixture-not-a-token',
  FRIDAY_SUCCESSOR_CONTROL_SHA: control, FRIDAY_SUCCESSOR_READ_ENABLED: 'true', FRIDAY_SUCCESSOR_SUBMIT_ENABLED: 'true' };
const run = { id: 123, run_number: 1, run_attempt: 1, display_title: REQUEST,
  event: 'workflow_dispatch', path: '.github/workflows/friday-commissioning-002.yml', head_branch: 'main',
  head_sha: control, actor, triggering_actor: actor, repository: { full_name: 'Karmicmurphy/temporal-capability-foundry' },
  status: 'in_progress' };
const approval = { request_id: REQUEST, recipe: 'aios-path-containment-fixture-v1', owner_github_id: actor.id,
  manifest_sha256: MANIFEST, workflow_sha: control };
const jwt = (subject = 'owner') => new SignJWT({}).setProtectedHeader({ alg: 'RS256' })
  .setIssuer('https://fixture.cloudflareaccess.com').setAudience('aud').setSubject(subject)
  .setIssuedAt().setExpirationTime('5m').sign(privateKey);
const deps = fetch => ({ fetch, keyResolver: async () => publicKey });
const never = () => assert.fail('no upstream call permitted');
async function request(method = 'GET', subject) {
  return new Request(origin + '/api/foundation/hosted-commissioning-successor', { method,
    headers: { 'Cf-Access-Jwt-Assertion': await jwt(subject), ...(method === 'POST' ?
      { Origin: origin, 'Content-Type': 'application/json' } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify({ request_id: REQUEST, instruction: INSTRUCTION }) } : {}) });
}

test('successor refuses wrong owner and missing successor-specific enable flags', async () => {
  assert.equal((await handle({ request: await request('POST', 'other'), env }, deps(never))).status, 403);
  const noFlag = { ...env, FRIDAY_SUCCESSOR_READ_ENABLED: undefined, FRIDAY_HOSTED_READ_ENABLED: 'true' };
  assert.equal((await (await handle({ request: await request(), env: noFlag }, deps(never))).json()).error, 'HOSTED_READ_DISABLED');
});

test('read-only lookup never dispatches and exposes the new request identity', async () => {
  const response = await handle({ request: await request(), env }, deps(async (url, options) => {
    assert.match(url, /friday-commissioning-002.yml\/runs/);
    assert.notEqual(options.method, 'POST');
    return Response.json({ total_count: 0, workflow_runs: [] });
  }));
  assert.deepEqual(await response.json(), { request_id: REQUEST, status: 'NOT_SUBMITTED' });
});

test('old Harness binding cannot dispatch the successor; exact new binding dispatches once', async () => {
  for (const old of [true, false]) {
    let posts = 0;
    const response = await handle({ request: await request('POST'), env }, deps(async (url, options) => {
      if (url.includes('/runs?')) return Response.json({ total_count: 0, workflow_runs: [] });
      if (url.endsWith('/user')) return Response.json(actor);
      if (url.includes('foundry/commits/main')) return Response.json({ sha: control });
      if (url.includes('Harness-card/commits/main')) return Response.json({ sha: 'b'.repeat(40) });
      if (url.includes('/contents/')) return Response.json({ encoding: 'base64', content: Buffer.from(JSON.stringify({
        work_order: { status: 'ACTIVE', gate_id: 'FRIDAY_PC_WORKSHOP_DISPOSABLE_AIOS_PROOF',
          hosted_fixture: { ...approval, request_id: old ? 'request-first-001' : REQUEST } },
      })).toString('base64') });
      assert.match(url, /friday-commissioning-002.yml\/dispatches$/);
      posts++;
      return new Response(null, { status: 204 });
    }));
    assert.equal(posts, old ? 0 : 1);
    assert.equal((await response.json()).status, old ? 'BLOCKED' : 'PENDING');
  }
});

test('existing successor run is retrieved; original workflow metadata fails closed', async () => {
  for (const old of [false, true]) {
    const response = await handle({ request: await request('POST'), env }, deps(async (_, options) => {
      assert.notEqual(options.method, 'POST');
      return Response.json({ total_count: 1, workflow_runs: [{ ...run,
        path: old ? '.github/workflows/friday-first-job.yml' : run.path }] });
    }));
    assert.equal((await response.json()).status, old ? 'BLOCKED' : 'RUNNING');
  }
});

test('compiled verifier accepts real disposable successor bytes and rejects altered output',
  { skip: !process.env.FRIDAY_SUCCESSOR_PROOF }, async () => {
    // Provider fields below are substituted fixtures, not authenticated hosted evidence.
    const directory = process.env.FRIDAY_SUCCESSOR_PROOF;
    const read = async name => JSON.parse(await readFile(join(directory, name), 'utf8'));
    const receipt = await read('receipt.json'), source = await read('source-manifest.json');
    receipt.dispatch = { ...approval, run_id: run.id, harness_commit: 'b'.repeat(40), authentication: 'GITHUB_ACTIONS_PROVIDER_ACTOR' };
    source.dispatch = receipt.dispatch;
    const output = await readFile(join(directory, 'capabilities.py'));
    const lesson = await readFile(join(directory, 'verified-lesson.json'));
    const { verifyBundle } = await import('../cloudflare/pages/hosted-commissioning-successor.js');
    const bundle = changed => zipSync({ 'receipt.json': Buffer.from(JSON.stringify(receipt)),
      'source-manifest.json': Buffer.from(JSON.stringify(source)), 'verified-lesson.json': lesson,
      'capabilities.py': changed ? Buffer.from('wrong') : output });
    assert.equal((await verifyBundle(bundle(false), run, control)).output, output.toString());
    await assert.rejects(verifyBundle(bundle(true), run, control), /PROOF_MISMATCH/);
  });
