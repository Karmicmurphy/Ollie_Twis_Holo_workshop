(() => {
  const form = document.querySelector('#openDoorForm');
  if (!form) return;
  const box = document.createElement('div');
  box.innerHTML = `<label style="display:flex;align-items:flex-start;gap:8px"><input style="width:auto;flex:none" id="foundationBoundedMode" type="checkbox"> Run the approved Foundation path-containment check</label>
    <p id="foundationJobStatus" style="padding-right:72px" role="status" aria-live="polite"></p>
    <p id="foundationJobIdentity" style="overflow-wrap:anywhere;padding-right:72px"></p>
    <div class="toolbar"><button type="button" id="foundationRefresh" hidden>Check result</button>
    <button type="button" id="foundationRetry" hidden>Retry failed attempt</button>
    <a id="foundationProof" target="_blank" rel="noopener noreferrer" hidden>Open proof receipt</a>
    <a id="foundationPrevious" target="_blank" rel="noopener noreferrer" hidden>Previous attempt</a></div>`;
  form.querySelector('.toolbar').before(box.querySelector('label'));
  form.after(box);
  const status = box.querySelector('#foundationJobStatus');
  const identity = box.querySelector('#foundationJobIdentity');
  const refresh = box.querySelector('#foundationRefresh');
  const retry = box.querySelector('#foundationRetry');
  const proof = box.querySelector('#foundationProof');
  const previous = box.querySelector('#foundationPrevious');
  const params = new URLSearchParams(location.hash.slice(1));
  let current = /^job:phone-[a-f0-9]{32}$/.test(params.get('foundation_job') || '')
    ? { job_id: params.get('foundation_job'), run_id: params.get('foundation_run') || '' } : null;
  let busy = false;
  function remember(value) {
    current = { ...current, ...value };
    const fragment = new URLSearchParams();
    fragment.set('foundation_job', current.job_id);
    if (current.run_id) fragment.set('foundation_run', current.run_id);
    history.replaceState(null, '', `#${fragment}`);
    identity.textContent = `${current.job_id} | attempt ${current.attempt || 'pending'}`;
    refresh.hidden = !current.run_id;
  }
  async function call(options = {}) {
    const query = options.method ? '' : `?job_id=${encodeURIComponent(current.job_id)}&run_id=${encodeURIComponent(current.run_id)}`;
    const response = await fetch(`/api/foundation/jobs${query}`, {
      ...options, headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
      cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(25000),
    });
    if (!response.headers.get('content-type')?.includes('application/json')) throw Error('Sign in to Workshop, then check again.');
    const result = await response.json();
    if (!response.ok) throw Error(`${result.status}: ${result.error}`);
    return result;
  }
  function render(result) {
    remember(result);
    status.textContent = result.status === 'PASSED'
      ? 'PASSED: the fixed containment check is certified. Human review is still required; nothing was activated.'
      : `${result.status}${result.reason ? ': ' + result.reason : ''}`;
    retry.hidden = result.status !== 'FAILED' || result.attempt >= 3;
    proof.hidden = !result.proof_url;
    if (result.proof_url) proof.href = result.proof_url;
    previous.hidden = !result.previous_run_url;
    if (result.previous_run_url) previous.href = result.previous_run_url;
  }
  async function action(operation) {
    if (busy) return;
    busy = true; refresh.disabled = retry.disabled = true;
    proof.hidden = previous.hidden = true;
    try { await operation(); }
    catch (error) { status.textContent = `Not confirmed: ${error.message}. No automatic retry was sent.`; }
    finally { busy = false; refresh.disabled = retry.disabled = false; }
  }
  window.foundationPhone = {
    submit: () => action(async () => {
      if (current?.run_id) { render(await call()); return; }
      // This is a fixed job. The Open Door text never leaves the device.
      if (!current) remember({ job_id: `job:phone-${crypto.randomUUID().replaceAll('-', '')}` });
      status.textContent = 'SUBMITTED: requesting the fixed containment check.';
      const result = await call({ method: 'POST', body: JSON.stringify({ action: 'dispatch', fixture: 'aios-path-containment', job_id: current.job_id }) });
      render(result);
    }),
  };
  refresh.onclick = () => action(async () => render(await call()));
  retry.onclick = () => action(async () => {
    const result = await call({ method: 'POST', body: JSON.stringify({ action: 'retry', fixture: 'aios-path-containment', job_id: current.job_id, run_id: current.run_id, attempt: current.attempt }) });
    render(result);
  });
  if (current) { remember(current); status.textContent = 'Saved job identity. Check the result to recover current server state.'; }
})();
