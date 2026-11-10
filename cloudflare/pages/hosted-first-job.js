import { createRemoteJWKSet, jwtVerify } from 'jose';
import { unzipSync } from 'fflate';

const REPO = 'Karmicmurphy/temporal-capability-foundry';
const HARNESS = 'Karmicmurphy/Harness-card';
const HOST = 'https://ollie-twis-holo-workshop.pages.dev';
export const REQUEST = 'request-first-001';
export const INSTRUCTION = 'Repair only the isolated AIOS path-containment test fixture.';
const RECIPE = 'aios-path-containment-fixture-v1';
const REHEARSAL_JOB = 'job:644d806c386c213f0a5cc50c';
const OWNER = 141688225;
const SHA = /^[0-9a-f]{40}$/;
const DIGEST = /^[0-9a-f]{64}$/;
const keys = new Map();
const decoder = new TextDecoder('utf-8', { fatal: true });

// Only compiled release modules choose a contract; request bodies cannot select one.
export function createHostedHandler({ workflow, requestId, manifestSha, envPrefix, allowStatusQuery = false, submitTimeLimited = false }) {
const WORKFLOW = workflow, REQUEST = requestId, MANIFEST = manifestSha;
const fail = (status, code) => { throw Object.assign(new Error(code), { status }); };
const json = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});
const stable = value => Array.isArray(value) ? '[' + value.map(stable).join(',') + ']' :
  value !== null && typeof value === 'object' ?
    '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + stable(value[k])).join(',') + '}' :
    JSON.stringify(value);
const sha256 = async bytes => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)),
  n => n.toString(16).padStart(2, '0')).join('');

async function bytes(response, limit) {
  if (Number(response.headers.get('content-length')) > limit) fail(413, 'BODY_TOO_LARGE');
  const reader = response.body?.getReader(), parts = [];
  let length = 0;
  if (reader) {
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.length;
        if (length > limit) { await reader.cancel(); fail(413, 'BODY_TOO_LARGE'); }
        parts.push(value);
      }
    } finally { reader.releaseLock(); }
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

// The existing Workshop Access contract: verified RS256 claims, not email or an unsigned header.
async function authorize(request, env, resolver) {
  const domain = env.FOUNDATION_ACCESS_DOMAIN;
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain || '') ||
      !env.FOUNDATION_ACCESS_AUD || !env.FOUNDATION_OWNER_SUB) fail(503, 'OWNER_AUTH_NOT_CONFIGURED');
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > 8192) fail(401, 'OWNER_AUTH_REQUIRED');
  const issuer = `https://${domain}`;
  if (!resolver) {
    if (!keys.has(issuer)) keys.set(issuer, createRemoteJWKSet(new URL(issuer + '/cdn-cgi/access/certs'),
      { timeoutDuration: 5000 }));
    resolver = keys.get(issuer);
  }
  let payload;
  try {
    ({ payload } = await jwtVerify(token, resolver, {
      issuer, audience: env.FOUNDATION_ACCESS_AUD, algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub'], maxTokenAge: '24h',
    }));
  } catch { fail(401, 'OWNER_AUTH_INVALID'); }
  if (payload.sub !== env.FOUNDATION_OWNER_SUB) fail(403, 'OWNER_ONLY');
}

async function github(env, fetcher, path, options = {}, useToken = true) {
  const response = await fetcher('https://api.github.com/' + path, {
    ...options, redirect: 'manual', signal: AbortSignal.timeout(12000),
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'FRIDAY-Workshop',
      'Content-Type': 'application/json',
      ...(useToken ? { Authorization: `Bearer ${env.FOUNDATION_GITHUB_TOKEN}` } : {}) },
  });
  if (!response.ok && response.status !== 302) fail(502, `GITHUB_${response.status}`);
  return response;
}

async function getJson(env, fetcher, path, useToken = true) {
  const response = await github(env, fetcher, path, {}, useToken);
  if (!response.ok) fail(502, 'GITHUB_JSON_REDIRECT_DENIED');
  return JSON.parse(decoder.decode(await bytes(response, 2_000_000)));
}

function checkRun(run, control) {
  if (!Number.isSafeInteger(run.id) || run.id < 1 || run.run_number !== 1 || run.run_attempt !== 1 ||
      run.display_title !== REQUEST || run.event !== 'workflow_dispatch' ||
      run.path !== '.github/workflows/' + WORKFLOW || run.head_branch !== 'main' ||
      run.head_sha !== control || run.actor?.type !== 'User' || run.actor?.id !== OWNER ||
      run.triggering_actor?.type !== 'User' || run.triggering_actor?.id !== OWNER ||
      run.repository?.full_name !== REPO) fail(409, 'RUN_BINDING_MISMATCH');
}

async function verifyBundle(bundle, run, control) {
  const expected = { 'receipt.json': 1_000_000, 'source-manifest.json': 200_000,
    'verified-lesson.json': 100_000, 'capabilities.py': 100_000 };
  const seen = new Set();
  const files = unzipSync(bundle, { filter(file) {
    if (!Object.hasOwn(expected, file.name) || seen.has(file.name) ||
        file.originalSize > expected[file.name]) fail(409, 'UNEXPECTED_ARTIFACT_ENTRY');
    seen.add(file.name);
    return true;
  } });
  if (seen.size !== Object.keys(expected).length) fail(409, 'INCOMPLETE_ARTIFACT');
  const read = name => JSON.parse(decoder.decode(files[name]));
  const { dispatch, result } = read('receipt.json');
  const manifest = read('source-manifest.json'), lesson = read('verified-lesson.json');
  const originalManifest = { ...manifest, job_id: REHEARSAL_JOB };
  delete originalManifest.dispatch;
  if (await sha256(new TextEncoder().encode(JSON.stringify(originalManifest, null, 2) + '\n')) !== MANIFEST) {
    fail(409, 'SOURCE_MANIFEST_MISMATCH');
  }
  const receipt = result?.receipt, cert = receipt?.core_result?.certificate;
  const job = result?.job_id, digest = await sha256(files['capabilities.py']);
  if (dispatch?.request_id !== REQUEST || dispatch?.recipe !== RECIPE ||
      dispatch?.manifest_sha256 !== MANIFEST || dispatch?.run_id !== run.id ||
      dispatch?.owner_github_id !== OWNER || dispatch?.workflow_sha !== control ||
      dispatch?.authentication !== 'GITHUB_ACTIONS_PROVIDER_ACTOR' ||
      !SHA.test(dispatch?.harness_commit || '') || stable(manifest.dispatch) !== stable(dispatch) ||
      manifest.request_id !== REQUEST || manifest.job_id !== job ||
      Object.keys(manifest.files || {}).length !== 51 ||
      !Object.values(manifest.files).every(hash => DIGEST.test(hash)) ||
      stable(manifest.files) !== stable(result?.candidate_sources) ||
      !/^job:[a-f0-9]+$/.test(job || '') || receipt?.job_id !== job ||
      receipt?.admission?.request_id !== REQUEST || receipt?.admission?.subject !== String(OWNER) ||
      receipt?.admission?.issuer !== 'github' || result.owner_authenticated !== true ||
      result.status !== 'CERTIFIED_AWAITING_HUMAN_REVIEW' || result.activation_performed !== false ||
      cert?.verdict !== 'CERTIFIED' || cert?.certificate_boundary?.foundry_job_id !== job ||
      cert?.certificate_boundary?.candidate_path !== 'src/untethered_aios/capabilities.py' ||
      cert?.certificate_boundary?.candidate_sha256 !== digest || receipt.certificate_sha256 !== digest ||
      cert?.evidence?.final_candidate_matches !== true || cert?.evidence?.final_candidate_sha256 !== digest ||
      !/^cert:[a-f0-9]+$/.test(cert?.certificate_id || '') || result.lesson_id !== cert.certificate_id ||
      lesson?.lesson?.job_id !== job || lesson?.lesson?.certificate_id !== cert.certificate_id ||
      lesson?.lesson?.candidate_sha256 !== digest || lesson?.lesson?.authority_grants?.length !== 0 ||
      await sha256(new TextEncoder().encode(stable(lesson.lesson))) !== lesson?.digest) {
    fail(409, 'INDEPENDENT_PROOF_MISMATCH');
  }
  return { job_id: job, certificate_id: cert.certificate_id, output_sha256: digest,
    output: decoder.decode(files['capabilities.py']), receipt: { dispatch, result }, manifest, lesson };
}

async function originalArtifact(env, fetcher, run, control, stage = () => {}) {
  stage('ARTIFACT_LIST');
  const { artifacts, total_count } = await getJson(env, fetcher, `repos/${REPO}/actions/runs/${run.id}/artifacts?per_page=100`);
  if (!Array.isArray(artifacts) || total_count !== artifacts.length) fail(409, 'INCOMPLETE_ARTIFACT_LIST');
  const matching = artifacts.filter(a => a.name === 'friday-' + REQUEST);
  if (matching.length !== 1 || matching[0].expired) return { status: 'BLOCKED', error: 'ORIGINAL_ARTIFACT_UNAVAILABLE' };
  const artifact = matching[0];
  if (!Number.isSafeInteger(artifact.id) || artifact.id < 1 || artifact.size_in_bytes > 2_000_000 ||
      !/^sha256:[a-f0-9]{64}$/.test(artifact.digest || '')) fail(409, 'ARTIFACT_METADATA_INVALID');
  stage('ARTIFACT_ZIP_REQUEST');
  let response = await github(env, fetcher, `repos/${REPO}/actions/artifacts/${artifact.id}/zip`);
  if (response.status === 302) {
    const url = new URL(response.headers.get('location'));
    if (url.protocol !== 'https:' || url.username || url.password || url.port ||
        !/(^|\.)(githubusercontent\.com|blob\.core\.windows\.net)$/.test(url.hostname)) fail(502, 'ARTIFACT_REDIRECT_DENIED');
    stage('ARTIFACT_REDIRECT_DOWNLOAD');
    response = await fetcher(url.href, { redirect: 'error', signal: AbortSignal.timeout(12000) });
    if (!response.ok) fail(502, 'ARTIFACT_DOWNLOAD_FAILED');
  }
  stage('ARTIFACT_READ_BYTES');
  const bundle = await bytes(response, 2_000_000);
  stage('ARTIFACT_DIGEST');
  if ('sha256:' + await sha256(bundle) !== artifact.digest) fail(409, 'ARTIFACT_DIGEST_MISMATCH');
  stage('ARTIFACT_VERIFY_BUNDLE');
  return { status: 'COMPLETE', ...await verifyBundle(bundle, run, control),
    proof_url: `https://github.com/${REPO}/actions/runs/${run.id}/artifacts/${artifact.id}` };
}

async function handle({ request, env }, deps = {}) {
  const fetcher = deps.fetch || fetch;
  const control = env[envPrefix + '_CONTROL_SHA'];
  let diagnosticPhase = 'BEFORE_AUTHENTICATION';
  try {
    const url = new URL(request.url);
    // A harmless, authenticated 003 GET may arrive with browser-added query text.
    // Never relax the canonical origin or the no-query POST dispatch boundary.
    if (url.origin !== HOST || (url.search && !(allowStatusQuery && request.method === 'GET')))
      fail(403, 'WORKSHOP_ORIGIN_REQUIRED');
    if (env[envPrefix + '_READ_ENABLED'] !== 'true' ||
        !env.FOUNDATION_GITHUB_TOKEN || !SHA.test(control || '')) fail(503, 'HOSTED_READ_DISABLED');
    await authorize(request, env, deps.keyResolver);
    if (!['GET', 'POST'].includes(request.method)) fail(405, 'METHOD_NOT_ALLOWED');
    if (request.method === 'POST') {
      if (env[envPrefix + '_SUBMIT_ENABLED'] !== 'true') fail(503, 'NEW_WORK_STOPPED');
      // Only commissioning 003 can use the narrow owner-only deployment window.
      // Missing, malformed, expired, or excessively long windows stay fail-closed.
      if (submitTimeLimited) {
        const until = env[envPrefix + '_SUBMIT_UNTIL'];
        const expiresAt = typeof until === 'string' &&
          /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(until) ? Date.parse(until) : NaN;
        const remaining = expiresAt - Date.now();
        if (!Number.isFinite(remaining) || remaining <= 0 || remaining > 60 * 60 * 1000)
          fail(503, 'NEW_WORK_STOPPED');
      }
      if (request.headers.get('origin') !== HOST ||
          request.headers.get('content-type')?.split(';')[0] !== 'application/json') fail(403, 'SAME_ORIGIN_JSON_REQUIRED');
      const body = JSON.parse(decoder.decode(await bytes(request, 512)));
      if (stable(body) !== stable({ request_id: REQUEST, instruction: INSTRUCTION })) fail(400, 'FIXED_REQUEST_REQUIRED');
    }
    diagnosticPhase = 'HISTORY_LOOKUP';
    const history = await getJson(env, fetcher, `repos/${REPO}/actions/workflows/${WORKFLOW}/runs?event=workflow_dispatch&per_page=100`);
    if (!Array.isArray(history.workflow_runs) || history.total_count !== history.workflow_runs.length) fail(409, 'INCOMPLETE_HISTORY');
    const first = history.workflow_runs.filter(r => r.run_number === 1);
    if (first.length > 1 || (history.total_count && !first.length)) fail(409, 'ORIGINAL_RUN_UNCERTAIN');
    const run = first[0];
    if (run) {
      diagnosticPhase = 'RUN_BINDING';
      checkRun(run, control);
      const status = run.status === 'completed' ?
        (run.conclusion === 'success' ? await originalArtifact(env, fetcher, run, control, phase => { diagnosticPhase = phase; }) : { status: 'FAILED' }) :
        { status: run.status === 'in_progress' ? 'RUNNING' : 'PENDING' };
      return json({ request_id: REQUEST, run_id: run.id, ...status });
    }
    if (request.method === 'GET') return json({ request_id: REQUEST, status: 'NOT_SUBMITTED' });

    const actor = await getJson(env, fetcher, 'user');
    if (actor.type !== 'User' || actor.id !== OWNER) fail(403, 'DISPATCH_ACTOR_NOT_OWNER');
    const head = await getJson(env, fetcher, `repos/${REPO}/commits/main`);
    if (head.sha !== control) fail(409, 'CONTROL_SHA_CHANGED');
    const authority = await getJson(env, fetcher, `repos/${HARNESS}/commits/main`, false);
    if (!SHA.test(authority.sha || '')) fail(409, 'HARNESS_REVISION_INVALID');
    const blob = await getJson(env, fetcher, `repos/${HARNESS}/contents/state/CURRENT_PROJECT.json?ref=${authority.sha}`, false);
    if (blob.encoding !== 'base64') fail(409, 'HARNESS_STATE_UNAVAILABLE');
    const state = JSON.parse(decoder.decode(Uint8Array.from(atob(blob.content), c => c.charCodeAt(0))));
    const work = state.work_order;
    const approval = { request_id: REQUEST, recipe: RECIPE, owner_github_id: OWNER,
      manifest_sha256: MANIFEST, workflow_sha: control };
    if (work?.gate_id !== 'FRIDAY_PC_WORKSHOP_DISPOSABLE_AIOS_PROOF' || work.status !== 'ACTIVE' ||
        stable(work.hosted_fixture) !== stable(approval)) fail(409, 'HARNESS_AUTHORITY_MISMATCH');
    // No retry on transport loss. Only the first provider run is eligible to execute.
    try {
      const response = await github(env, fetcher, `repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`,
        { method: 'POST', body: JSON.stringify({ ref: 'main' }) });
      if (![200, 204].includes(response.status)) fail(502, 'UNEXPECTED_DISPATCH_RESPONSE');
    } catch { return json({ request_id: REQUEST, status: 'DISPATCH_UNCERTAIN' }, 202); }
    return json({ request_id: REQUEST, status: 'PENDING' }, 202);
  } catch (error) {
    // Only the original, read-only 003 status route reports a fixed diagnostic phase.
    // No raw exception, token, upstream URL, or transport detail is exposed.
    const extra = REQUEST === 'request-commissioning-003' &&
      request.method === 'GET' && !error?.status ? { phase: diagnosticPhase } : {};
    return json({ request_id: REQUEST, status: 'BLOCKED',
      error: error?.status ? error.message : 'UPSTREAM_OR_PROOF_UNAVAILABLE', ...extra }, error?.status || 502);
  }
}
return { authorize, verifyBundle, handle };
}

const original = createHostedHandler({ workflow: 'friday-first-job.yml', requestId: REQUEST,
  manifestSha: '4d4e1956d8bb4cca939e3ce025ff4bfb5dc581ffef328dda34d1404f5cc98704', envPrefix: 'FRIDAY_HOSTED' });
export const { authorize, verifyBundle, handle } = original;
