(() => {
  const KEY = 'twis-friday-learning-v1';
  const now = () => new Date().toISOString();
  const defaults = () => ({
    version: 1,
    created_at: now(),
    events: [],
    counts: { talk: 0, simplify: 0, save: 0, speak: 0, foundation: 0, recover: 0, proof: 0 },
    weights: { proof: 3, recovery: 3, simplicity: 3, voice: 1, exploration: 1 },
    learned_rules: [
      { id: 'proof_over_claim', text: 'Do not call it done until the real user path proves it.', score: 5 },
      { id: 'recover_before_rebuild', text: 'Recover before rebuilding. Existing working mechanisms outrank cleaner rewrites.', score: 5 },
      { id: 'owner_interrupt_cost', text: 'Do not ask Randy to repeat or manually inspect anything the machine can recover itself.', score: 5 },
      { id: 'one_next_move', text: 'One machine. One next move. No architecture branching while a concrete gate is still open.', score: 4 }
    ],
    wins: [
      { at: '2026-09-23', text: 'Scrapyard unload preserved 127 artifacts and 9 relationships, then rejected false cross-domain survivors instead of inventing novelty.' },
      { at: '2026-09-24', text: 'Harness self-improvement was repaired so stale derived state could no longer quietly masquerade as truth.' },
      { at: '2026-09-27', text: 'Foundation bounded execution preserved one job identity through execution and Independent Proof in test.' },
      { at: '2026-09-29', text: 'Workshop phone Preview opened through Cloudflare Access on Android.' },
      { at: '2026-10-01', text: 'Workshop CI passed the complete repo-side phone-path build after the configuration-authority and stale-contract repairs.' },
      { at: '2026-10-01', text: 'FRIDAY // Owner Node was added to the existing Workshop with no new backend or paid service, and its full Workshop CI passed.' }
    ]
  });
  function load() {
    try {
      const current = JSON.parse(localStorage.getItem(KEY) || 'null');
      return current && current.version === 1 ? current : defaults();
    } catch { return defaults(); }
  }
  let state = load();
  const saveState = () => localStorage.setItem(KEY, JSON.stringify(state));
  function event(type, detail = '') {
    state.events.unshift({ at: now(), type, detail: String(detail).slice(0, 180) });
    state.events = state.events.slice(0, 120);
    if (type in state.counts) state.counts[type]++;
    if (type === 'foundation') state.weights.proof += 1;
    if (type === 'recover') state.weights.recovery += 1;
    if (type === 'simplify') state.weights.simplicity += 1;
    if (type === 'speak' || type === 'talk') state.weights.voice += 1;
    saveState(); render();
  }
  function addWin(text) {
    if (!text || state.wins.some(w => w.text === text)) return;
    state.wins.unshift({ at: now().slice(0, 10), text });
    state.wins = state.wins.slice(0, 40);
    state.counts.proof++;
    saveState(); render();
  }
  function topPreference() {
    return Object.entries(state.weights).sort((a,b) => b[1]-a[1])[0][0];
  }
  function recommendation() {
    const p = topPreference();
    if (p === 'proof') return 'Friday should show evidence first and explanation second.';
    if (p === 'recovery') return 'Friday should search existing work before proposing anything new.';
    if (p === 'simplicity') return 'Friday should collapse complexity into one next move.';
    if (p === 'voice') return 'Friday should favor conversation over controls and forms.';
    return 'Friday should expose one useful discovery at a time.';
  }
  function panel() {
    const section = document.createElement('section');
    section.className = 'panel';
    section.id = 'fridayLearning';
    section.innerHTML = `
      <div class="eyebrow">THE MACHINE IS LEARNING // NO AI REQUIRED</div>
      <h2 style="margin:.25rem 0">What have I actually accomplished?</h2>
      <p class="muted">This ledger lives on this device. It learns from actions and verified outcomes, not from a model guessing what you meant.</p>
      <div id="fridayWin" class="result good"></div>
      <div class="row" style="margin-top:10px">
        <button id="anotherWin">Show me another win</button>
        <button id="whatLearned">What have you learned about me?</button>
      </div>
      <div id="fridayLearned" class="truth" style="margin-top:10px" hidden></div>
      <details><summary>Machine counters</summary><div id="fridayCounters" class="muted"></div></details>`;
    const anchor = document.querySelector('#history')?.closest('.panel');
    if (anchor) anchor.before(section); else document.querySelector('.wrap')?.append(section);
  }
  function render() {
    const win = document.querySelector('#fridayWin');
    if (!win) return;
    const chosen = state.wins[state._winIndex || 0] || { text: 'No wins recorded yet.' };
    win.textContent = chosen.text;
    const counters = document.querySelector('#fridayCounters');
    counters.textContent = Object.entries(state.counts).map(([k,v]) => `${k}: ${v}`).join(' • ');
    const learned = document.querySelector('#fridayLearned');
    learned.innerHTML = `
      <div><b>CURRENT PREFERENCE</b>${topPreference().toUpperCase()}</div>
      <div><b>FRIDAY SHOULD</b>${recommendation()}</div>
      <div><b>PERMANENT RULE</b>${state.learned_rules.sort((a,b)=>b.score-a.score)[0].text}</div>`;
  }
  function wire(id, type) {
    const el = document.querySelector(id); if (!el) return;
    el.addEventListener('click', () => event(type));
  }
  function init() {
    panel(); render();
    wire('#listen', 'talk'); wire('#distill', 'simplify'); wire('#save', 'save'); wire('#speak', 'speak');
    wire('#run', 'foundation'); wire('#recover', 'recover');
    document.querySelector('#anotherWin')?.addEventListener('click', () => {
      state._winIndex = ((state._winIndex || 0) + 1) % Math.max(1, state.wins.length); saveState(); render();
    });
    document.querySelector('#whatLearned')?.addEventListener('click', () => {
      const box = document.querySelector('#fridayLearned'); box.hidden = !box.hidden; render();
    });
    const result = document.querySelector('#result');
    if (result) new MutationObserver(() => {
      const text = result.textContent || '';
      if (/PASSED/i.test(text)) addWin('Foundation returned a certified PASS to the owner surface. The bounded phone path reached proof.');
      else if (/BLOCKED|FAILED|Not confirmed/i.test(text)) event('proof', text);
    }).observe(result, { childList:true, subtree:true, characterData:true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
