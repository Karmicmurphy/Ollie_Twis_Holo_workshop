(() => {
  const prefix = 'twisHolo.project-context.v1.';
  const encoder = new TextEncoder();
  const kinds = new Set(['goal', 'correction', 'decision', 'note', 'stop', 'resume']);
  const identity = /^[A-Za-z0-9_-]{8,80}$/;
  const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',
    encoder.encode(JSON.stringify(value)))), n => n.toString(16).padStart(2, '0')).join('');

  function view(record) {
    let goal = null, enabled = true;
    for (const event of record.events) {
      if (event.kind === 'goal') goal = { id: event.eventId, text: event.text, updatedAt: event.createdAt };
      if (event.kind === 'correction' && goal?.id === event.goalId) goal = { ...goal, text: event.text, updatedAt: event.createdAt };
      if (event.kind === 'stop' || event.kind === 'resume') enabled = event.kind === 'resume';
    }
    return { ...record, goal, newLocalWorkEnabled: enabled, revisionId: record.revision ?
      `browser-context:${record.projectId}:${record.revision}` : null,
      storage: 'BROWSER_LOCAL', proofScope: 'PRIVATE_BROWSER_STORAGE_NOT_JOB_CERTIFICATION',
      executionAuthority: 'NOT_GRANTED', cancellationConfirmed: false, jobs: [] };
  }

  async function read(projectId) {
    const raw = localStorage.getItem(prefix + projectId);
    if (!raw) return view({ projectId, events: [], revision: 0, snapshotSha256: null });
    const record = JSON.parse(raw);
    if (record.projectId !== projectId || !Array.isArray(record.events) ||
        !Number.isInteger(record.revision) || record.revision !== record.events.length ||
        record.snapshotSha256 !== await hash({ projectId, events: record.events, revision: record.revision })) {
      throw Error('PRIVATE_CONTEXT_INTEGRITY_FAILED');
    }
    return view(record);
  }

  async function append(projectId, request) {
    if (!navigator.locks?.request) throw Error('PRIVATE_CONTEXT_LOCK_UNAVAILABLE');
    return navigator.locks.request(prefix + projectId, async () => {
      const current = await read(projectId);
      const { eventId, kind, text, expectedRevision, goalId = '' } = request;
      if (Object.keys(request).some(k => !['eventId', 'kind', 'text', 'expectedRevision', 'goalId'].includes(k)) ||
          typeof eventId !== 'string' || !identity.test(eventId) || !kinds.has(kind) || typeof text !== 'string' ||
          !text.trim() || text.length > 4096 || Array.from(text).some(c => c.length === 1 && c.charCodeAt(0) >= 0xd800 && c.charCodeAt(0) <= 0xdfff) ||
          !Number.isInteger(expectedRevision) || expectedRevision < 0 ||
          typeof goalId !== 'string' || goalId && !identity.test(goalId)) throw Error('INVALID_CONTEXT_EVENT');
      const event = { eventId, kind, text, goalId: kind === 'goal' ? eventId : goalId };
      const prior = current.events.find(e => e.eventId === eventId);
      if (prior) {
        if (Object.keys(event).some(k => event[k] !== prior[k])) throw Error('CONTEXT_EVENT_CONFLICT');
        return { ...current, duplicate: true };
      }
      if (expectedRevision !== current.revision || kind === 'correction' && current.goal?.id !== goalId) {
        throw Error('CONTEXT_REVISION_CONFLICT');
      }
      const events = [...current.events, { ...event, createdAt: new Date().toISOString() }];
      const record = { projectId, events, revision: current.revision + 1 };
      if (events.length > 1000 || encoder.encode(JSON.stringify(record)).length > 256 * 1024) throw Error('CONTEXT_LIMIT');
      record.snapshotSha256 = await hash(record);
      localStorage.setItem(prefix + projectId, JSON.stringify(record));
      return { ...view(record), duplicate: false };
    });
  }
  window.FoundationContextStore = Object.freeze({ read, append });
})();
