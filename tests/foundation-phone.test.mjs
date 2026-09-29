import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPair, SignJWT, createLocalJWKSet, exportJWK } from 'jose';
import { authorize, handle, verifyReceipt, boundedBytes, FIXTURE, REPO, WORKFLOW } from '../cloudflare/pages/foundation.js';
import { readFileSync } from 'node:fs';
import { zipSync, strToU8 } from 'fflate';

const job = 'job:phone-' + 'a'.repeat(32);
const env = { FOUNDATION_PHONE_ENABLED: 'true', FOUNDATION_GITHUB_TOKEN: 'TEST_ONLY',
  FOUNDATION_DISPATCH_SHA: 'b'.repeat(40), FOUNDATION_SOURCE_SHA: 'c'.repeat(40),
  FOUNDATION_ACCESS_DOMAIN: 'owner.cloudflareaccess.com', FOUNDATION_ACCESS_AUD: 'aud', FOUNDATION_OWNER_SUB: 'owner' };
const run = { id: 123, display_title: `${job} / attempt 1`, event: 'workflow_dispatch', path: `.github/workflows/${WORKFLOW}`,
  repository: { full_name: REPO }, head_branch: 'main', head_sha: env.FOUNDATION_DISPATCH_SHA,
  status: 'completed', conclusion: 'success', run_attempt: 1 };
const body = { action: 'dispatch', job_id: job, fixture: FIXTURE };
const post = data => new Request('https://workshop.example/api/foundation/jobs', {
  method: 'POST', headers: { origin: 'https://workshop.example', 'Content-Type': 'application/json' }, body: JSON.stringify(data),
});
const ok = value => Response.json(value);
const receipt = () => ({ job_id: job, foundation_job_id: job, transport_run_id: '123', attempt: 1,
  source_repo: REPO, source_sha: env.FOUNDATION_SOURCE_SHA, fixture_id: FIXTURE,
  activation_performed: false, status: 'CERTIFIED_AWAITING_HUMAN_REVIEW', execution_outcome: 'PASSED',
  proof_verdict: 'CERTIFIED', job_identity_correlated: true,
  core_receipt: { result: { job_id: job, runtime: { job_id: job }, builder_receipt: { job_id: job },
    activation_performed: false, status: 'CERTIFIED_AWAITING_HUMAN_REVIEW',
    certificate: { verdict: 'CERTIFIED', certificate_boundary: { foundry_job_id: job } } } } });
const bypass = { authorize: async () => {} };

test('deny by default without making network calls', async () => {
  const response = await handle({ request: post(body), env: {} }, { fetch: () => assert.fail('network') });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
});

test('JWT verifies signature, audience, expiry and owner', async () => {
  const pair = await generateKeyPair('RS256');
  const jwk = await exportJWK(pair.publicKey); jwk.kid = 'one';
  const resolver = createLocalJWKSet({ keys: [jwk] });
  async function token(sub = 'owner', aud = 'aud', exp = '5m') {
    return new SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: 'one' }).setSubject(sub)
      .setIssuer('https://owner.cloudflareaccess.com').setAudience(aud).setIssuedAt().setExpirationTime(exp).sign(pair.privateKey);
  }
  const req = value => new Request('https://workshop.example', { headers: { 'Cf-Access-Jwt-Assertion': value } });
  await authorize(req(await token()), env, resolver);
  for (const value of [await token('stranger'), await token('owner', 'wrong'), await token('owner', 'aud', '-1s'), 'forged']) {
    await assert.rejects(authorize(req(value), env, resolver));
  }
});

test('unknown fixture, extra command and cross-origin requests cannot dispatch', async () => {
  for (const data of [{ ...body, fixture: 'shell' }, { ...body, command: 'run' }, { ...body, job_id: 'bad' }]) {
    const response = await handle({ request: post(data), env }, { ...bypass, fetch: () => assert.fail('dispatch') });
    assert.equal(response.status, 400);
  }
  const request = post(body); request.headers.set('origin', 'https://other.example');
  assert.equal((await handle({ request, env }, { ...bypass, fetch: () => assert.fail('dispatch') })).status, 403);
});

test('body bounded even without content-length', async () => {
  await assert.rejects(boundedBytes(new Response('x'.repeat(1025)), 1024), /BODY_TOO_LARGE/);
});

test('dispatch uses fixed workflow, fixed fixture and boundary identity only', async () => {
  const calls = [];
  const fetch = async (url, options) => {
    calls.push([url, options]);
    if (url.endsWith('commits/main')) return ok({ sha: env.FOUNDATION_DISPATCH_SHA });
    if (url.includes('/runs?')) return ok({ workflow_runs: [] });
    assert.equal(url, `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`);
    assert.deepEqual(JSON.parse(options.body), { ref: 'main', inputs: { fixture: FIXTURE, job_id: job, attempt: '1', parent_run_id: '' } });
    return ok({ workflow_run_id: 123 });
  };
  const response = await handle({ request: post(body), env }, { ...bypass, fetch });
  assert.equal(response.status, 202);
  assert.equal((await response.json()).job_id, job);
  assert.equal(calls.length, 3);
});

test('observed duplicate returns existing run without a new dispatch', async () => {
  let count = 0;
  const fetch = async url => { count++; return url.endsWith('commits/main') ? ok({ sha: env.FOUNDATION_DISPATCH_SHA }) : ok({ workflow_runs: [run] }); };
  const response = await handle({ request: post(body), env }, { ...bypass, fetch });
  assert.equal((await response.json()).run_id, '123'); assert.equal(count, 2);
});

test('stale authority and busy admission fail closed', async () => {
  const stale = await handle({ request: post(body), env }, { ...bypass, fetch: async () => ok({ sha: 'd'.repeat(40) }) });
  assert.equal(stale.status, 409);
  const busy = await handle({ request: post(body), env }, { ...bypass, fetch: async url => url.endsWith('commits/main')
    ? ok({ sha: env.FOUNDATION_DISPATCH_SHA }) : ok({ workflow_runs: [{ ...run, display_title: 'other', status: 'queued' }] }) });
  assert.equal(busy.status, 429);
});

test('retry dispatches a linked child, never destructive native rerun', async () => {
  let dispatches = 0;
  const fetch = async (url, options) => {
    assert.ok(!url.endsWith('/rerun'));
    if (url.endsWith('commits/main')) return ok({ sha: env.FOUNDATION_DISPATCH_SHA });
    if (url.includes('/runs?')) return ok({ workflow_runs: [] });
    if (url.endsWith('/dispatches')) {
      dispatches++;
      assert.deepEqual(JSON.parse(options.body).inputs, { fixture: FIXTURE, job_id: job, attempt: '2', parent_run_id: '123' });
      return ok({ workflow_run_id: 124 });
    }
    return ok({ ...run, conclusion: 'failure' });
  };
  const response = await handle({ request: post({ ...body, action: 'retry', run_id: '123', attempt: 1 }), env }, { ...bypass, fetch });
  const result = await response.json();
  assert.equal(result.attempt, 2); assert.equal(result.run_id, '124'); assert.equal(dispatches, 1);
  const stale = await handle({ request: post({ ...body, action: 'retry', run_id: '123', attempt: 2 }), env }, { ...bypass, fetch });
  assert.equal(stale.status, 409); assert.equal(dispatches, 1);
  const success = await handle({ request: post({ ...body, action: 'retry', run_id: '123', attempt: 1 }), env }, { ...bypass, fetch: async url => url.endsWith('commits/main') ? ok({ sha: env.FOUNDATION_DISPATCH_SHA }) : ok(run) });
  assert.equal(success.status, 409);
});

test('executor success alone is not proof; all identities and attempts must match', () => {
  assert.equal(verifyReceipt(receipt(), run, job, env), 'PASSED');
  const bad = receipt(); bad.core_receipt.result.certificate.certificate_boundary.foundry_job_id = 'wrong';
  assert.throws(() => verifyReceipt(bad, run, job, env), /INDEPENDENT_PROOF_MISMATCH/);
  assert.throws(() => verifyReceipt(receipt(), { ...run, display_title: `${job} / attempt 2` }, job, env), /RECEIPT_IDENTITY_MISMATCH/);
  const failure = receipt(); failure.execution_outcome = 'FAILED';
  assert.equal(verifyReceipt(failure, run, job, env), 'FAILED');
});

test('service workers bypass APIs and UI is wired into the actual Open Door', () => {
  for (const name of ['sw.js', 'service-worker.js']) assert.match(readFileSync(`app/${name}`, 'utf8'), /pathname.startsWith\('\/api\/'\)/);
  assert.match(readFileSync('app/index.html', 'utf8'), /assets\/foundation-phone.js/);
  assert.match(readFileSync('app/assets/app.js', 'utf8'), /return window.foundationPhone.submit/);
});

test('real ZIP bytes and digest return only the matching independent receipt', async () => {
  const bytes = zipSync({ 'foundation-phone-job-receipt.json': strToU8(JSON.stringify(receipt())) });
  const digest = Buffer.from(await crypto.subtle.digest('SHA-256', bytes)).toString('hex');
  let downloaded = false;
  const fetch = async (url, options) => {
    if (url.endsWith('/runs/123')) return ok(run);
    if (url.includes('/artifacts?')) return ok({ artifacts: [{ id: 44, name: 'foundation-phone-job-receipt-1', size_in_bytes: bytes.length, digest: `sha256:${digest}` }] });
    if (url.endsWith('/44/zip')) return new Response(null, { status: 302, headers: { location: 'https://example.blob.core.windows.net/receipt' } });
    assert.equal(url, 'https://example.blob.core.windows.net/receipt');
    assert.equal(options.headers, undefined); downloaded = true;
    return new Response(bytes);
  };
  const request = new Request(`https://workshop.example/api/foundation/jobs?job_id=${job}&run_id=123`);
  const response = await handle({ request, env }, { ...bypass, fetch });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, 'PASSED');
  assert.equal(downloaded, true);
});

test('wrong artifact digest and missing receipt cannot produce PASSED', async () => {
  const request = () => new Request(`https://workshop.example/api/foundation/jobs?job_id=${job}&run_id=123`);
  const missing = await handle({ request: request(), env }, { ...bypass, fetch: async url => url.endsWith('/runs/123') ? ok(run) : ok({ artifacts: [] }) });
  assert.equal((await missing.json()).status, 'PROOF_PENDING');
  const corrupted = await handle({ request: request(), env }, { ...bypass, fetch: async url => {
    if (url.endsWith('/runs/123')) return ok(run);
    if (url.includes('/artifacts?')) return ok({ artifacts: [{ id: 44, name: 'foundation-phone-job-receipt-1', size_in_bytes: 4, digest: `sha256:${'0'.repeat(64)}` }] });
    return new Response('fake');
  } });
  assert.equal(corrupted.status, 409);
});
