// Actual bundled Worker with fixture JWT/JWKS and mocked GitHub; never live proof.
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';

if (!process.env.FRIDAY_FUNCTIONS_BUNDLE) throw Error('Exact compiled bundle path required');
const worker = (await import(pathToFileURL(resolve(process.env.FRIDAY_FUNCTIONS_BUNDLE)))).default;
const { publicKey, privateKey } = await generateKeyPair('RS256');
const jwk = { ...await exportJWK(publicKey), kid: 'fixture', alg: 'RS256', use: 'sig' };
const domain = 'https://fixture.cloudflareaccess.com';
const token = subject => new SignJWT({}).setProtectedHeader({ alg: 'RS256', kid: 'fixture' })
  .setIssuer(domain).setAudience('aud').setSubject(subject).setIssuedAt().setExpirationTime('5m').sign(privateKey);
const env = { FOUNDATION_ACCESS_DOMAIN: 'fixture.cloudflareaccess.com', FOUNDATION_ACCESS_AUD: 'aud',
  FOUNDATION_OWNER_SUB: 'owner', FOUNDATION_GITHUB_TOKEN: 'fixture-only',
  FRIDAY_SUCCESSOR_CONTROL_SHA: 'a'.repeat(40), FRIDAY_SUCCESSOR_READ_ENABLED: 'true',
  FRIDAY_HOSTED_CONTROL_SHA: 'b'.repeat(40), FRIDAY_HOSTED_READ_ENABLED: 'true',
  ASSETS: { fetch: () => assert.fail('protected API fell through to assets') } };
const original = globalThis.fetch;
let upstreamFailure = false, calls = 0;
globalThis.fetch = async input => {
  const url = String(input);
  if (url === domain + '/cdn-cgi/access/certs') return Response.json({ keys: [jwk] });
  assert.match(url, /^https:\/\/api\.github\.com\/repos\/Karmicmurphy\/temporal-capability-foundry\/actions\/workflows\/(friday-first-job|friday-commissioning-002)\.yml\/runs\?/);
  calls++;
  return upstreamFailure ? new Response('fixture failure', { status: 503 }) : Response.json({ total_count: 0, workflow_runs: [] });
};
const context = { waitUntil() {}, passThroughOnException() { assert.fail('unsafe fallback'); } };
const ask = async (path, subject = 'owner', bindings = env) => worker.fetch(new Request(
  'https://ollie-twis-holo-workshop.pages.dev/api/foundation/' + path,
  { headers: { 'Cf-Access-Jwt-Assertion': await token(subject) } }), bindings, context);
try {
  let response = await ask('hosted-commissioning-successor');
  assert.equal((await response.json()).request_id, 'request-commissioning-002');
  assert.equal(response.status, 200);
  const before = calls;
  assert.equal((await ask('hosted-commissioning-successor', 'other')).status, 403);
  assert.equal(calls, before);
  assert.equal((await ask('hosted-commissioning-successor', 'owner', { ...env, FRIDAY_SUCCESSOR_READ_ENABLED: undefined })).status, 503);
  assert.equal((await (await ask('hosted-first-job')).json()).request_id, 'request-first-001');
  upstreamFailure = true;
  response = await ask('hosted-commissioning-successor');
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, 'GITHUB_503');
  const report = { status: 'PASS', scope: 'LOCAL_COMPILED_WORKER_FIXTURES_NOT_LIVE_OWNER',
    checks: ['RS256 fixture session', 'wrong owner denied before GitHub', 'missing successor flags denied',
      'original route preserved', 'upstream failure has no asset fallback'] };
  if (process.env.FRIDAY_COMPILED_REPORT) await writeFile(process.env.FRIDAY_COMPILED_REPORT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { globalThis.fetch = original; }
