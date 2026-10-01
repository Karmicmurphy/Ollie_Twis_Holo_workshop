import { createRemoteJWKSet, jwtVerify } from 'jose';
import { unzipSync } from 'fflate';

export const REPO = 'Karmicmurphy/temporal-capability-foundry';
export const WORKFLOW = 'foundation-bounded-job.yml';
export const FIXTURE = 'aios-path-containment';
const JOB = /^job:phone-[a-f0-9]{32}$/;
const ID = /^[1-9][0-9]{0,19}$/;
const SHA = /^[a-f0-9]{40}$/;
const keys = new Map();
const fail = (status, code) => { throw Object.assign(new Error(code), { status }); };
const json = (body, status = 200) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
});

export async function boundedBytes(response, limit) {
  if (Number(response.headers.get('content-length')) > limit) fail(413, 'BODY_TOO_LARGE');
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const parts = []; let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) { await reader.cancel(); fail(413, 'BODY_TOO_LARGE'); }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(size); let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

export async function authorize(request, env, keyResolver) {
  const domain = env.FOUNDATION_ACCESS_DOMAIN;
  if (!/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain || '') ||
      !env.FOUNDATION_ACCESS_AUD || !env.FOUNDATION_OWNER_SUB) fail(503, 'OWNER_AUTH_NOT_CONFIGURED');
  const issuer = `https://${domain}`;
  if (!keyResolver) {
    if (!keys.has(issuer)) keys.set(issuer, createRemoteJWKSet(new URL(`${issuer}/cdn-cgi/access/certs`), { timeoutDuration: 5000 }));
    keyResolver = keys.get(issuer);
  }
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > 8192) fail(401, 'OWNER_AUTH_REQUIRED');
  try {
    const { payload } = await jwtVerify(token, keyResolver, {
      issuer, audience: env.FOUNDATION_ACCESS_AUD, algorithms: ['RS256'],
      requiredClaims: ['exp', 'iat', 'sub'], maxTokenAge: '24h',
    });
    if (payload.sub !== env.FOUNDATION_OWNER_SUB) fail(403, 'OWNER_ONLY');
  } catch (error) {
    if (error.status) throw error;
    fail(401, 'OWNER_AUTH_INVALID');
  }
}

function configuration(env) {
  if (env.FOUNDATION_PHONE_ENABLED !== 'true') fail(503, 'PHONE_JOBS_DISABLED');
  if (!env.FOUNDATION_GITHUB_TOKEN || !SHA.test(env.FOUNDATION_DISPATCH_SHA || '') ||
      !SHA.test(env.FOUNDATION_SOURCE_SHA || '')) fail(503, 'DISPATCH_NOT_CONFIGURED');
}

async function github(env, path, options = {}, fetcher = fetch) {
  const response = await fetcher(`https://api.github.com/repos/${REPO}/${path}`, {
    ...options, redirect: 'manual', signal: AbortSignal.timeout(15000),
    headers: {
      Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2026-03-10',
      'User-Agent': 'Workshop-bounded-phone-job', 'Content-Type': 'application/json',
      Authorization: `Bearer ${env.FOUNDATION_GITHUB_TOKEN}`,
    },
  });
  if (!response.ok && response.status !== 302) fail(502, `GITHUB_${response.status}`);
  return response;
}

async function ghJson(env, path, fetcher) {
  const response = await github(env, path, {}, fetcher);
  return JSON.parse(new TextDecoder().decode(await boundedBytes(response, 2_000_000)));
}

function validateRun(run, job, env) {
  if (![1,2,3].some(n => run.display_title === `${job} / attempt ${n}`) || run.run_attempt !== 1 || run.event !== 'workflow_dispatch' ||
      run.path !== `.github/workflows/${WORKFLOW}` || run.head_branch !== 'main' ||
      run.head_sha !== env.FOUNDATION_DISPATCH_SHA || run.repository?.full_name !== REPO) {
    fail(409, 'RUN_AUTHORITY_MISMATCH');
  }
}

function attemptOf(run) { return Number(run.display_title.split(' / attempt ')[1]); }

export function verifyReceipt(receipt, run, job, env) {
  const result = receipt.core_receipt?.result;
  const cert = result?.certificate;
  if (receipt.job_id !== job || receipt.foundation_job_id !== job ||
      String(receipt.transport_run_id) !== String(run.id) || receipt.attempt !== attemptOf(run) ||
      receipt.source_repo !== REPO || receipt.source_sha !== env.FOUNDATION_SOURCE_SHA ||
      receipt.fixture_id !== FIXTURE || receipt.activation_performed !== false) fail(409, 'RECEIPT_IDENTITY_MISMATCH');
  if (receipt.execution_outcome !== 'PASSED' || receipt.proof_verdict !== 'CERTIFIED') return 'FAILED';
  if (run.conclusion !== 'success' || receipt.status !== 'CERTIFIED_AWAITING_HUMAN_REVIEW' ||
      receipt.job_identity_correlated !== true || result?.job_id !== job ||
      result?.runtime?.job_id !== job || result?.builder_receipt?.job_id !== job ||
      cert?.certificate_boundary?.foundry_job_id !== job || cert?.verdict !== 'CERTIFIED' ||
      result?.activation_performed !== false || result?.status !== 'CERTIFIED_AWAITING_HUMAN_REVIEW') {
    fail(409, 'INDEPENDENT_PROOF_MISMATCH');
  }
  return 'PASSED';
}

async function receiptFor(env, run, job, fetcher) {
  const listing = await ghJson(env, `actions/runs/${run.id}/artifacts?per_page=100`, fetcher);
  const artifacts = listing.artifacts.filter(a => a.name === `foundation-phone-job-receipt-${attemptOf(run)}` && !a.expired);
  if (artifacts.length !== 1) return { status: run.conclusion === 'success' ? 'PROOF_PENDING' : 'FAILED', reason: 'RECEIPT_UNAVAILABLE' };
  const artifact = artifacts[0];
  if (artifact.size_in_bytes > 2_000_000 || !/^sha256:[a-f0-9]{64}$/.test(artifact.digest || '')) fail(409, 'ARTIFACT_INTEGRITY_UNAVAILABLE');
  let response = await github(env, `actions/artifacts/${artifact.id}/zip`, {}, fetcher);
  if (response.status === 302) {
    const url = new URL(response.headers.get('location'));
    if (url.protocol !== 'https:' || url.username || url.password ||
        !(/(^|\.)githubusercontent\.com$/.test(url.hostname) || /(^|\.)blob\.core\.windows\.net$/.test(url.hostname))) fail(502, 'ARTIFACT_REDIRECT_DENIED');
    // Do not forward the GitHub token to the signed artifact download host.
    response = await fetcher(url.href, { redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!response.ok) fail(502, 'ARTIFACT_DOWNLOAD_FAILED');
  }
  const bytes = await boundedBytes(response, 2_000_000);
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(x => x.toString(16).padStart(2, '0')).join('');
  if (`sha256:${digest}` !== artifact.digest) fail(409, 'ARTIFACT_DIGEST_MISMATCH');
  const files = unzipSync(bytes, { filter: file => file.name === 'foundation-phone-job-receipt.json' && file.originalSize <= 1_000_000 });
  const content = files['foundation-phone-job-receipt.json'];
  if (!content || content.length > 1_000_000) fail(409, 'RECEIPT_UNAVAILABLE');
  const receipt = JSON.parse(new TextDecoder().decode(content));
  return { status: verifyReceipt(receipt, run, job, env), receipt,
    previous_run_url: ID.test(receipt.parent_run_id || '') ? `https://github.com/${REPO}/actions/runs/${receipt.parent_run_id}` : null,
    proof_url: `https://github.com/${REPO}/actions/runs/${run.id}/artifacts/${artifact.id}` };
}

export async function handle(context, dependencies = {}) {
  const { request, env } = context;
  const fetcher = dependencies.fetch || fetch;
  try {
    configuration(env);
    await (dependencies.authorize || authorize)(request, env);
    const url = new URL(request.url);
    if (request.method === 'GET') {
      const job = url.searchParams.get('job_id');
      const runId = url.searchParams.get('run_id');
      if (!JOB.test(job || '') || !ID.test(runId || '')) fail(400, 'INVALID_IDENTITY');
      const run = await ghJson(env, `actions/runs/${runId}`, fetcher);
      validateRun(run, job, env);
      let result = { status: run.status === 'in_progress' ? 'RUNNING' : 'PENDING' };
      if (run.status === 'completed') result = await receiptFor(env, run, job, fetcher);
      return json({ ...result, job_id: job, run_id: String(run.id), attempt: attemptOf(run),
        run_url: `https://github.com/${REPO}/actions/runs/${run.id}`, owner_review_required: true });
    }
    if (request.method !== 'POST') fail(405, 'METHOD_NOT_ALLOWED');
    if (request.headers.get('origin') !== url.origin) fail(403, 'SAME_ORIGIN_REQUIRED');
    if (request.headers.get('content-type')?.split(';')[0] !== 'application/json') fail(415, 'JSON_REQUIRED');
    let body;
    try { body = JSON.parse(new TextDecoder().decode(await boundedBytes(request, 1024))); }
    catch (error) { if (error.status) throw error; fail(400, 'INVALID_JSON'); }
    if (!body || Array.isArray(body) || Object.keys(body).some(k => !['job_id','fixture','action','run_id','attempt'].includes(k)) ||
        !JOB.test(body.job_id || '') || body.fixture !== FIXTURE || !['dispatch','retry'].includes(body.action)) fail(400, 'REJECTED_BEFORE_EXECUTION');
    const head = await ghJson(env, 'commits/main', fetcher);
    if (head.sha !== env.FOUNDATION_DISPATCH_SHA) fail(409, 'DISPATCH_AUTHORITY_CHANGED');
    let attempt = 1; let parent = '';
    if (body.action === 'retry') {
      if (!ID.test(String(body.run_id || '')) || !Number.isSafeInteger(body.attempt)) fail(400, 'INVALID_ATTEMPT');
      const run = await ghJson(env, `actions/runs/${body.run_id}`, fetcher);
      validateRun(run, body.job_id, env);
      if (run.status !== 'completed' || !['failure','cancelled','timed_out'].includes(run.conclusion) ||
          attemptOf(run) !== body.attempt || body.attempt >= 3) fail(409, 'RETRY_NOT_ALLOWED');
      attempt = body.attempt + 1; parent = String(run.id);
    }
    const recent = await ghJson(env, `actions/workflows/${WORKFLOW}/runs?event=workflow_dispatch&per_page=100`, fetcher);
    const same = recent.workflow_runs.filter(r => r.display_title === `${body.job_id} / attempt ${attempt}`).sort((a,b) => a.id - b.id);
    if (same.length) {
      validateRun(same[0], body.job_id, env);
      return json({ status: 'PENDING', job_id: body.job_id, run_id: String(same[0].id), attempt }, 202);
    }
    // Conservative admission bound; dispatcher serialization supplies duplicate rejection.
    if (recent.workflow_runs.filter(r => Date.parse(r.created_at) > Date.now() - 3600000).length >= 3 ||
        recent.workflow_runs.some(r => r.status !== 'completed')) fail(429, 'BOUNDED_JOB_LIMIT');
    const response = await github(env, `actions/workflows/${WORKFLOW}/dispatches`, {
      method: 'POST', body: JSON.stringify({ ref: 'main', inputs: { fixture: FIXTURE, job_id: body.job_id, attempt: String(attempt), parent_run_id: parent } }),
    }, fetcher);
    // Never retry an ambiguous dispatch automatically.
    if (response.status !== 200) fail(502, 'DISPATCH_ACCEPTED_RESULT_UNKNOWN');
    const result = await response.json();
    if (!ID.test(String(result.workflow_run_id || ''))) fail(502, 'DISPATCH_ACCEPTED_RESULT_UNKNOWN');
    return json({ status: 'SUBMITTED', job_id: body.job_id, run_id: String(result.workflow_run_id), attempt }, 202);
  } catch (error) {
    return json({ status: error.status === 400 ? 'REJECTED' : 'BLOCKED', error: error.status ? error.message : 'UPSTREAM_UNAVAILABLE' }, error.status || 502);
  }
}
