(() => {
  const REQUEST = 'request-commissioning-002';
  const INSTRUCTION = 'Repair only the isolated AIOS path-containment test fixture.';
  const ROUTE = '/api/foundation/hosted-commissioning-successor';
  const normalize = value => String(value || '').trim().replace(/^["\u201c]|["\u201d]$/g, '')
    .trim().toLowerCase().replace(/\s+/g, ' ').replace(/[.!?]+$/, '');

  async function check(response) {
    const result = await response.json();
    if (result.request_id !== REQUEST) throw Error('REQUEST_MISMATCH');
    if (result.status === 'COMPLETE') {
      if (typeof result.output !== 'string' || !result.receipt || !result.manifest ||
          result.receipt.result?.job_id !== result.job_id ||
          result.receipt.result?.receipt?.job_id !== result.job_id ||
          result.manifest.job_id !== result.job_id || result.receipt.dispatch?.run_id !== result.run_id ||
          result.receipt.dispatch?.request_id !== REQUEST) throw Error('DELIVERY_CORRELATION_MISMATCH');
    }
    return result;
  }

  async function request({ projectId, goalRef, records, persist, fetcher = fetch, submit = false }) {
    let record = records[REQUEST];
    if (record && record.projectId !== projectId) throw Error('ORIGINATING_PROJECT_REQUIRED');
    const current = await check(await fetcher(ROUTE, { cache: 'no-store' }));
    if (record?.runId && current.run_id && record.runId !== current.run_id) throw Error('ORIGINAL_RUN_CHANGED');
    let result = current;
    if (!record && current.run_id) record = records[REQUEST] = { projectId, goalRef, uncertain: true };
    if (current.status === 'NOT_SUBMITTED' && submit && !record?.uncertain) {
      record = records[REQUEST] = { projectId, goalRef, uncertain: true, status: 'SUBMITTING' };
      persist(); // If private persistence fails, no dispatch may occur.
      result = await check(await fetcher(ROUTE, { method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: REQUEST, instruction: INSTRUCTION }) }));
      if (['NEW_WORK_STOPPED', 'OWNER_ONLY', 'OWNER_AUTH_REQUIRED', 'OWNER_AUTH_INVALID',
           'FIXED_REQUEST_REQUIRED', 'HARNESS_AUTHORITY_MISMATCH', 'CONTROL_SHA_CHANGED'].includes(result.error)) {
        record.uncertain = false;
      }
    }
    if (record) {
      if (record.runId && result.run_id && record.runId !== result.run_id) throw Error('ORIGINAL_RUN_CHANGED');
      Object.assign(record, { status: result.status, updatedAt: new Date().toISOString(),
        ...(result.run_id ? { runId: result.run_id } : {}), ...(result.job_id ? { jobId: result.job_id } : {}) });
      persist();
    }
    return result;
  }

  window.FoundationJobClient = Object.freeze({ REQUEST, INSTRUCTION, ROUTE, request,
    recognizes: text => normalize(text) === normalize(INSTRUCTION) });
})();
