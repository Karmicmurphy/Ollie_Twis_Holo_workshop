import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
const window = {};
vm.runInNewContext(await readFile(new URL('../app/assets/foundation-job-client.js', import.meta.url), 'utf8'), { window });
const client = window.FoundationJobClient;
const response = (status, more = {}) => ({ json: async () => ({ request_id: client.REQUEST, status, ...more }) });

test('known operation accepts ordinary capitalization and spacing but not another task', () => {
  for (const text of [client.INSTRUCTION, 'repair only the isolated AIOS path-containment test fixture',
      '\u201cRepair only the isolated AIOS path-containment test fixture.\u201d', '  REPAIR only the isolated AIOS  path-containment test fixture! ']) {
    assert.equal(client.recognizes(text), true);
  }
  assert.equal(client.recognizes('Repair all my repositories.'), false);
  assert.equal(client.recognizes(client.INSTRUCTION + ' Then deploy it.'), false);
});

test('checks original before one deliberate submission; uncertainty never retries', async () => {
  const records = {}, calls = [];
  const persist = () => {};
  const fetcher = async (url, options) => {
    calls.push(options.method || 'GET');
    if (options.method === 'POST') { assert.equal(records[client.REQUEST].uncertain, true); throw Error('timeout'); }
    return response('NOT_SUBMITTED');
  };
  await assert.rejects(client.request({ projectId: 'one', records, persist, fetcher, submit: true }), /timeout/);
  await client.request({ projectId: 'one', records, persist, fetcher, submit: true });
  assert.deepEqual(calls, ['GET', 'POST', 'GET']);
});

test('storage failure prevents submission', async () => {
  let posts = 0;
  await assert.rejects(client.request({ projectId: 'one', records: {}, submit: true,
    persist: () => { throw Error('quota'); }, fetcher: async (_, options) => {
      if (options.method) posts++;
      return response('NOT_SUBMITTED');
    } }), /quota/);
  assert.equal(posts, 0);
});

test('reopen and duplicate submission retrieve the original without POST', async () => {
  const records = { [client.REQUEST]: { projectId: 'one', runId: 42, uncertain: true } };
  const calls = [];
  const fetcher = async (_, options) => { calls.push(options.method || 'GET'); return response('RUNNING', { run_id: 42 }); };
  for (const submit of [false, true]) await client.request({ projectId: 'one', records, persist: () => {}, fetcher, submit });
  assert.deepEqual(calls, ['GET', 'GET']);
});

test('wrong project, changed run and mismatched receipt fail closed', async () => {
  const records = { [client.REQUEST]: { projectId: 'one', runId: 42 } };
  await assert.rejects(client.request({ projectId: 'other', records, persist: () => {}, fetcher: () => assert.fail() }), /ORIGINATING/);
  await assert.rejects(client.request({ projectId: 'one', records, persist: () => {},
    fetcher: async () => response('RUNNING', { run_id: 99 }) }), /ORIGINAL_RUN_CHANGED/);
  await assert.rejects(client.request({ projectId: 'one', records: {}, persist: () => {}, fetcher: async () =>
    response('COMPLETE', { output: 'wrong', job_id: 'job:a', receipt: {}, manifest: {} }) }), /CORRELATION/);
});
