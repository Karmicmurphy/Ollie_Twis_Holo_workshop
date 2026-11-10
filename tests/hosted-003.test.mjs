import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { generateKeyPair, SignJWT } from 'jose';
import { zipSync } from 'fflate';
import { handle, REQUEST, INSTRUCTION, MANIFEST } from '../cloudflare/pages/hosted-commissioning-003.js';

const origin = 'https://ollie-twis-holo-workshop.pages.dev';
const control = 'a'.repeat(40), actor = { id: 141688225, type: 'User' };
const { publicKey, privateKey } = await generateKeyPair('RS256');
const env = { FOUNDATION_ACCESS_DOMAIN: 'fixture.cloudflareaccess.com', FOUNDATION_ACCESS_AUD: 'aud',
  FOUNDATION_OWNER_SUB: 'owner', FOUNDATION_GITHUB_TOKEN: 'fixture-not-a-token',
  FRIDAY_THIRD_CONTROL_SHA: control, FRIDAY_THIRD_READ_ENABLED: 'true', FRIDAY_THIRD_SUBMIT_ENABLED: 'true',
  FRIDAY_THIRD_SUBMIT_UNTIL: new Date(Date.now() + 5 * 60 * 1000).toISOString() };
const run = { id: 123, run_number: 1, run_attempt: 1, display_title: REQUEST,
  event: 'workflow_dispatch', path: '.github/workflows/friday-commissioning-003.yml', head_branch: 'main',
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
  return new Request(origin + '/api/foundation/hosted-commissioning-003', { method,
    headers: { 'Cf-Access-Jwt-Assertion': await jwt(subject), ...(method === 'POST' ?
      { Origin: origin, 'Content-Type': 'application/json' } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify({ request_id: REQUEST, instruction: INSTRUCTION }) } : {}) });
}

test('successor refuses wrong owner and missing successor-specific enable flags', async () => {
  assert.equal((await handle({ request: await request('POST', 'other'), env }, deps(never))).status, 403);
  const noFlag = { ...env, FRIDAY_THIRD_READ_ENABLED: undefined, FRIDAY_HOSTED_READ_ENABLED: 'true' };
  assert.equal((await (await handle({ request: await request(), env: noFlag }, deps(never))).json()).error, 'HOSTED_READ_DISABLED');
});

test('read-only lookup never dispatches and exposes the new request identity', async () => {
  const response = await handle({ request: await request(), env }, deps(async (url, options) => {
    assert.match(url, /friday-commissioning-003.yml\/runs/);
    assert.notEqual(options.method, 'POST');
    return Response.json({ total_count: 0, workflow_runs: [] });
  }));
  assert.deepEqual(await response.json(), { request_id: REQUEST, status: 'NOT_SUBMITTED' });
});

test('003 GET tolerates extra query text only on canonical host without dispatch', async () => {
  let calls = 0;
  const fetcher = async (url, opts) => {
    calls++;
    assert.ok(url.includes('friday-commissioning-003.yml/runs'));
    assert.notEqual(opts.method, 'POST');
    return Response.json({ total_count: 0, workflow_runs: [] });
  };
  const input = await request();
  const withQuery = new Request(origin + '/api/foundation/hosted-commissioning-003?from=app-link', {
    headers: input.headers,
  });
  const r = await handle({ request: withQuery, env }, deps(fetcher));
  assert.equal(r.status, 200);
  assert.deepEqual(await r.json(), { request_id: REQUEST, status: 'NOT_SUBMITTED' });
  assert.equal(calls, 1);
});

test('003 does not allow alternate origin or any query on POST', async () => {
  let calls = 0;
  const fetcher = () => { calls++; throw Error('Upstream call not permitted'); };
  const input = await request('POST');
  const options = { method: 'POST', headers: input.headers,
    body: JSON.stringify({ request_id: REQUEST, instruction: INSTRUCTION }) };
  const crossHost = new Request('https://example.net/api/foundation/hosted-commissioning-003', options);
  const crossResult = await handle({ request: crossHost, env }, deps(fetcher));
  assert.equal((await crossResult.json()).error, 'WORKSHOP_ORIGIN_REQUIRED');
  const queried = new Request(origin + '/api/foundation/hosted-commissioning-003?from=app-link', options);
  const queryResult = await handle({ request: queried, env }, deps(fetcher));
  assert.equal((await queryResult.json()).error, 'WORKSHOP_ORIGIN_REQUIRED');
  assert.equal(calls, 0);
});

test('003 timed submit gate stops expired or missing windows before GitHub calls', async () => {
  const input = await request('POST');
  const blocked = { ...env, FRIDAY_THIRD_SUBMIT_UNTIL: '2026-11-09T00:00:00.000Z' };
  const response = await handle({ request: input, env: blocked }, deps(never));
  assert.equal((await response.json()).error, 'NEW_WORK_STOPPED');
  const missing = { ...env, FRIDAY_THIRD_SUBMIT_UNTIL: undefined };
  const response2 = await handle({ request: await request('POST'), env: missing }, deps(never));
  assert.equal((await response2.json()).error, 'NEW_WORK_STOPPED');
  const broad = { ...env, FRIDAY_THIRD_SUBMIT_UNTIL: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() };
  const response3 = await handle({ request: await request('POST'), env: broad }, deps(never));
  assert.equal((await response3.json()).error, 'NEW_WORK_STOPPED');
});

test('003 read-only retrieval exposes redacted phase for unexpected upstream failure', async () => {
  let calls = 0;
  const failedHistory = await handle({ request: await request(), env }, deps(async () => {
    calls++; throw new TypeError('private simulated network error');
  }));
  const history = await failedHistory.json();
  assert.equal(failedHistory.status, 502);
  assert.deepEqual(history, { request_id: REQUEST, status: 'BLOCKED',
    error: 'UPSTREAM_OR_PROOF_UNAVAILABLE', phase: 'HISTORY_LOOKUP' });
  assert.equal(calls, 1);

  const completed = { ...run, status: 'completed', conclusion: 'success' };
  const failedArtifactList = await handle({ request: await request(), env }, deps(async url => {
    if (url.includes('/runs?')) return Response.json({ total_count: 1, workflow_runs: [completed] });
    throw new TypeError('simulated list transport issue');
  }));
  assert.equal((await failedArtifactList.json()).phase, 'ARTIFACT_LIST');

  const failedZip = await handle({ request: await request(), env }, deps(async url => {
    if (url.includes('/runs?')) return Response.json({ total_count: 1, workflow_runs: [completed] });
    if (url.includes('/artifacts?')) return Response.json({ total_count: 1, artifacts: [{
      id: 100, name: 'friday-' + REQUEST, expired: false,
      size_in_bytes: 14000, digest: 'sha256:' + 'a'.repeat(64),
    }] });
    throw new TypeError('simulated ZIP transport issue');
  }));
  assert.equal((await failedZip.json()).phase, 'ARTIFACT_ZIP_REQUEST');
});

test('003 artifact ZIP uses manual redirect and checks bytes instead of throwing', async () => {
  const completed = { ...run, status: 'completed', conclusion: 'success' };
  const signedZip = 'https://productionresultssa0.blob.core.windows.net/actions-results/pinned-proof.zip?sig=fake';
  let signedRequests = 0;
  const fetcher = async (url, options) => {
    assert.notEqual(options.method, 'POST');
    if (url.includes('/runs?')) return Response.json({ total_count: 1, workflow_runs: [completed] });
    if (url.includes('/artifacts?')) return Response.json({ total_count: 1, artifacts: [{
      id: 1234, name: 'friday-' + REQUEST, expired: false,
      size_in_bytes: 14000, digest: 'sha256:' + 'b'.repeat(64),
    }] });
    if (url.endsWith('/artifacts/1234/zip')) {
      assert.equal(options.redirect, 'manual');
      return new Response(null, { status: 302, headers: { Location: signedZip } });
    }
    assert.equal(url, signedZip);
    assert.equal(options.redirect, 'manual');
    assert.ok(!options.headers?.Authorization);
    signedRequests++;
    return new Response(new Uint8Array([80, 75]), { status: 200 });
  };
  const response = await handle({ request: await request(), env }, deps(fetcher));
  assert.equal(signedRequests, 1);
  // Deliberately wrong ZIP digest proves download reached the original checksum gate.
  assert.equal((await response.json()).error, 'ARTIFACT_DIGEST_MISMATCH');
});

test('003 signed artifact download rejects secondary redirects without following', async () => {
  const completed = { ...run, status: 'completed', conclusion: 'success' };
  const signedZip = 'https://productionresultssa0.blob.core.windows.net/actions-results/pinned-proof.zip?sig=fake';
  let signedRequests = 0;
  const fetcher = async (url, options) => {
    if (url.includes('/runs?')) return Response.json({ total_count: 1, workflow_runs: [completed] });
    if (url.includes('/artifacts?')) return Response.json({ total_count: 1, artifacts: [{
      id: 1234, name: 'friday-' + REQUEST, expired: false,
      size_in_bytes: 14000, digest: 'sha256:' + 'b'.repeat(64),
    }] });
    if (url.endsWith('/artifacts/1234/zip')) {
      return new Response(null, { status: 302, headers: { Location: signedZip } });
    }
    assert.equal(url, signedZip);
    assert.equal(options.redirect, 'manual');
    signedRequests++;
    return new Response(null, { status: 302, headers: { Location: 'https://untrusted.example/escape' } });
  };
  const response = await handle({ request: await request(), env }, deps(fetcher));
  assert.equal(signedRequests, 1);
  assert.equal((await response.json()).error, 'ARTIFACT_REDIRECT_DENIED');
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
      assert.match(url, /friday-commissioning-003.yml\/dispatches$/);
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
  { skip: !process.env.FRIDAY_THIRD_PROOF }, async () => {
    // Provider fields below are substituted fixtures, not authenticated hosted evidence.
    const directory = process.env.FRIDAY_THIRD_PROOF;
    const read = async name => JSON.parse(await readFile(join(directory, name), 'utf8'));
    const receipt = await read('receipt.json'), source = await read('source-manifest.json');
    receipt.dispatch = { ...approval, run_id: run.id, harness_commit: 'b'.repeat(40), authentication: 'GITHUB_ACTIONS_PROVIDER_ACTOR' };
    source.dispatch = receipt.dispatch;
    const output = await readFile(join(directory, 'capabilities.py'));
    const lesson = await readFile(join(directory, 'verified-lesson.json'));
    const { verifyBundle } = await import('../cloudflare/pages/hosted-commissioning-003.js');
    const bundle = changed => zipSync({ 'receipt.json': Buffer.from(JSON.stringify(receipt)),
      'source-manifest.json': Buffer.from(JSON.stringify(source)), 'verified-lesson.json': lesson,
      'capabilities.py': changed ? Buffer.from('wrong') : output });
    assert.equal((await verifyBundle(bundle(false), run, control)).output, output.toString());
    await assert.rejects(verifyBundle(bundle(true), run, control), /PROOF_MISMATCH/);
  });
