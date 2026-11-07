import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import test from 'node:test';
import vm from 'node:vm';
import { generateKeyPair, SignJWT } from 'jose';
import { zipSync } from 'fflate';
import { handle, REQUEST, INSTRUCTION } from '../cloudflare/pages/hosted-first-job.js';

const origin = 'https://ollie-twis-holo-workshop.pages.dev';
const control = '5528ea9dc2d1499155618217730e471355cd3635';
const manifestPin = '4d4e1956d8bb4cca939e3ce025ff4bfb5dc581ffef328dda34d1404f5cc98704';
const issuer = 'https://fixture.cloudflareaccess.com';
const { publicKey, privateKey } = await generateKeyPair('RS256');
const token = (subject = 'owner', audience = 'fixture-audience') =>
  new SignJWT({}).setProtectedHeader({ alg: 'RS256' }).setIssuer(issuer)
    .setAudience(audience).setSubject(subject).setIssuedAt().setExpirationTime('5m').sign(privateKey);
const env = {
  FOUNDATION_ACCESS_DOMAIN: 'fixture.cloudflareaccess.com',
  FOUNDATION_ACCESS_AUD: 'fixture-audience', FOUNDATION_OWNER_SUB: 'owner',
  FOUNDATION_GITHUB_TOKEN: 'fixture-token', FRIDAY_HOSTED_CONTROL_SHA: control,
  FRIDAY_HOSTED_READ_ENABLED: 'true', FRIDAY_HOSTED_SUBMIT_ENABLED: 'true',
};
const deps = fetch => ({ fetch, keyResolver: async () => publicKey });
const unexpected = () => assert.fail('unexpected upstream call');
const actor = { type: 'User', id: 141688225 };
const run = { id: 1234, run_number: 1, run_attempt: 1, display_title: REQUEST,
  event: 'workflow_dispatch', path: '.github/workflows/friday-first-job.yml',
  head_branch: 'main', head_sha: control, actor, triggering_actor: actor,
  repository: { full_name: 'Karmicmurphy/temporal-capability-foundry' },
  status: 'completed', conclusion: 'success' };
const binding = { request_id: REQUEST, recipe: 'aios-path-containment-fixture-v1',
  owner_github_id: actor.id, manifest_sha256: manifestPin, workflow_sha: control };
const state = { work_order: { status: 'ACTIVE',
  gate_id: 'FRIDAY_PC_WORKSHOP_DISPOSABLE_AIOS_PROOF', hosted_fixture: binding } };
const toBytes = object => Buffer.from(JSON.stringify(object));
const digest = data => createHash('sha256').update(data).digest('hex');
const raw = name => readFile(new URL('../../rehearsal-verified/' + name, import.meta.url));

async function ask(method = 'GET', access, instruction = INSTRUCTION) {
  access ??= await token();
  return new Request(origin + '/api/foundation/hosted-first-job', { method,
    headers: { 'Cf-Access-Jwt-Assertion': access,
      ...(method === 'POST' ? { Origin: origin, 'Content-Type': 'application/json' } : {}) },
    ...(method === 'POST' ? { body: JSON.stringify({ request_id: REQUEST, instruction }) } : {}) });
}

test('missing, wrong-owner and wrong-audience Access sessions never reach GitHub', async () => {
  for (const [jwt, expected] of [['', 401], [await token('other'), 403], [await token('owner', 'other'), 401]]) {
    const response = await handle({ request: await ask('GET', jwt), env }, deps(unexpected));
    assert.equal(response.status, expected);
  }
});

test('owner stop denies POST but allows read-only status', async () => {
  const stopped = { ...env, FRIDAY_HOSTED_SUBMIT_ENABLED: 'false' };
  const rejected = await handle({ request: await ask('POST'), env: stopped }, deps(unexpected));
  assert.equal((await rejected.json()).error, 'NEW_WORK_STOPPED');
  const read = await handle({ request: await ask(), env: stopped }, deps(async () =>
    Response.json({ total_count: 1, workflow_runs: [{ ...run, status: 'in_progress' }] })));
  assert.equal((await read.json()).status, 'RUNNING');
});

test('only the fixed instruction and matched owner can dispatch', async () => {
  const invalid = await handle({ request: await ask('POST', await token(), 'unapproved'), env }, deps(unexpected));
  assert.equal(invalid.status, 400);
  const response = await handle({ request: await ask('POST'), env }, deps(async url => {
    if (url.includes('/runs?')) return Response.json({ total_count: 0, workflow_runs: [] });
    if (url.endsWith('/user')) return Response.json({ ...actor, id: 9 });
    return unexpected();
  }));
  assert.equal((await response.json()).error, 'DISPATCH_ACTOR_NOT_OWNER');
});

test('approved fixture dispatches once per call and never retries transport uncertainty', async () => {
  for (const uncertain of [false, true]) {
    let count = 0;
    const response = await handle({ request: await ask('POST'), env }, deps(async (url, options) => {
      if (url.includes('/runs?')) return Response.json({ total_count: 0, workflow_runs: [] });
      if (url.endsWith('/user')) return Response.json(actor);
      if (url.includes('foundry/commits/main')) return Response.json({ sha: control });
      if (url.includes('Harness-card/commits/main')) return Response.json({ sha: 'b'.repeat(40) });
      if (url.includes('/contents/state/CURRENT_PROJECT.json')) {
        assert.equal(options.headers.Authorization, undefined);
        return Response.json({ encoding: 'base64', content: toBytes(state).toString('base64') });
      }
      if (url.endsWith('/dispatches')) {
        count++;
        assert.equal(options.method, 'POST');
        assert.deepEqual(JSON.parse(options.body), { ref: 'main' });
        if (uncertain) throw new Error('lost response');
        return new Response(null, { status: 204 });
      }
      return unexpected();
    }));
    assert.equal(count, 1);
    assert.equal((await response.json()).status, uncertain ? 'DISPATCH_UNCERTAIN' : 'PENDING');
  }
});

test('reopen verifies actual retained proof bytes in a simulated hosted envelope', async () => {
  const result = JSON.parse(await raw('vertical-proof.json')).first;
  // This substitutes fixture provider identity only; it is not live owner proof.
  result.owner_authenticated = true;
  result.receipt.admission.subject = String(actor.id);
  result.receipt.admission.issuer = 'github';
  const dispatch = { ...binding, authentication: 'GITHUB_ACTIONS_PROVIDER_ACTOR', run_id: run.id,
    harness_commit: 'b'.repeat(40) };
  const source = { ...JSON.parse(await raw('source-manifest.json')), dispatch };
  const output = await raw('capabilities.py');
  const lesson = await raw('verified-lesson.json');
  for (const changed of ['', 'output', 'manifest']) {
    const bundle = zipSync({
      'receipt.json': toBytes({ dispatch, result }),
      'source-manifest.json': toBytes(changed === 'manifest' ?
        { ...source, approved_fixture_source: 'a'.repeat(40) } : source),
      'verified-lesson.json': lesson, 'capabilities.py': changed === 'output' ? Buffer.from('bad') : output,
    });
    const response = await handle({ request: await ask(), env }, deps(async (url, options) => {
      assert.notEqual(options.method, 'POST');
      if (url.includes('/runs?')) return Response.json({ total_count: 1, workflow_runs: [run] });
      if (url.includes('/artifacts?')) return Response.json({ total_count: 1, artifacts: [
        { id: 7, name: 'friday-' + REQUEST, size_in_bytes: bundle.length, digest: 'sha256:' + digest(bundle) }] });
      if (url.endsWith('/zip')) return new Response(null, {
        status: 302, headers: { Location: 'https://fixture.blob.core.windows.net/proof' } });
      if (url === 'https://fixture.blob.core.windows.net/proof') {
        assert.equal(options.headers, undefined);
        return new Response(bundle);
      }
      return unexpected();
    }));
    const data = await response.json();
    assert.equal(data.status, changed ? 'BLOCKED' : 'COMPLETE', JSON.stringify(data).slice(0, 400));
    if (!changed) {
      assert.equal(data.output, output.toString('utf-8'));
      assert.equal(data.output_sha256, digest(output));
      assert.equal(data.receipt.dispatch.run_id, run.id);
    }
  }
});

test('existing request is not redispatched', async () => {
  const response = await handle({ request: await ask('POST'), env }, deps(async (url, options) => {
    assert.match(url, /\/runs\?/);
    assert.notEqual(options.method, 'POST');
    return Response.json({ total_count: 1, workflow_runs: [{ ...run, status: 'in_progress' }] });
  }));
  assert.equal((await response.json()).status, 'RUNNING');
});

test('both Workshop service workers leave private result GETs to the network', async () => {
  for (const path of ['service-worker.js', 'sw.js']) {
    const hooks = {};
    const source = await readFile(new URL('../app/' + path, import.meta.url), 'utf-8');
    vm.runInNewContext(source, { URL, self: {
      location: { origin }, addEventListener: (event, hook) => { hooks[event] = hook; },
    } });
    hooks.fetch({ request: { method: 'GET', mode: 'navigate', url: origin + '/api/foundation/hosted-first-job' },
      respondWith: () => assert.fail('private proof must not enter the service worker cache') });
    hooks.fetch({ request: { method: 'GET', mode: 'navigate', url: origin + '/api/projects/example/foundation/context' },
      respondWith: () => assert.fail('private context must not enter the service worker cache') });
  }
});
