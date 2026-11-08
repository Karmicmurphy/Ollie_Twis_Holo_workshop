import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
const source = await readFile(new URL('../app/assets/foundation-context-store.js', import.meta.url), 'utf8');
function fixture() {
  const data = new Map();
  const localStorage = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) };
  let queue = Promise.resolve();
  const navigator = { locks: { request: (_, fn) => { const next = queue.then(fn); queue = next.catch(() => {}); return next; } } };
  const reload = () => {
    const window = {};
    vm.runInNewContext(source, { window, crypto: webcrypto, TextEncoder, localStorage, navigator });
    return window.FoundationContextStore;
  };
  return { data, store: reload(), reload, localStorage };
}
const event = (kind, revision, extra = {}) => ({ eventId: webcrypto.randomUUID(), kind,
  text: 'Preserve exact source and useful output', expectedRevision: revision, ...extra });

test('goals, corrections and pause persist after a fresh client loads the private store', async () => {
  const f = fixture(), goal = event('goal', 0);
  await f.store.append('one', goal);
  await f.store.append('one', event('correction', 1, { goalId: goal.eventId, text: 'Use the existing repair' }));
  await f.store.append('one', event('stop', 2));
  const restored = await f.reload().read('one');
  assert.equal(restored.goal.text, 'Use the existing repair');
  assert.equal(restored.events[0].text, goal.text);
  assert.equal(restored.newLocalWorkEnabled, false);
  assert.equal(restored.executionAuthority, 'NOT_GRANTED');
  assert.equal(restored.storage, 'BROWSER_LOCAL');
});

test('duplicates are idempotent; changed duplicates and stale writes reject', async () => {
  const { store } = fixture(), goal = event('goal', 0);
  await store.append('one', goal);
  assert.equal((await store.append('one', goal)).duplicate, true);
  await assert.rejects(store.append('one', { ...goal, text: 'changed' }), /EVENT_CONFLICT/);
  await assert.rejects(store.append('one', event('note', 0)), /REVISION_CONFLICT/);
  assert.equal((await store.read('one')).revision, 1);
});

test('concurrent clients have one revision winner and projects remain isolated', async () => {
  const f = fixture();
  const result = await Promise.allSettled([f.store.append('one', event('goal', 0)), f.reload().append('one', event('goal', 0))]);
  assert.equal(result.filter(x => x.status === 'fulfilled').length, 1);
  assert.equal((await f.store.read('two')).events.length, 0);
});

test('corruption, invalid UTF-8 scalar and storage failure fail without a claimed save', async () => {
  const f = fixture();
  await assert.rejects(f.store.append('one', event('note', 0, { text: '\ud800' })), /INVALID_CONTEXT/);
  await f.store.append('one', event('goal', 0));
  const key = [...f.data.keys()][0], record = JSON.parse(f.data.get(key));
  record.events[0].text = 'tampered';f.data.set(key, JSON.stringify(record));
  await assert.rejects(f.store.read('one'), /INTEGRITY/);
  const other = fixture();other.localStorage.setItem = () => { throw Error('quota'); };
  await assert.rejects(other.store.append('one', event('goal', 0)), /quota/);
  assert.equal((await other.store.read('one')).revision, 0);
});
