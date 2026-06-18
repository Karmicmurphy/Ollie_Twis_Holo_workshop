(() => {
  'use strict';

  const guideItems = [
    ['[data-room="home"]', 'Home cockpit', 'Orientation room. Continue the last session, jump into a room, or see recent artifacts.', 'LOCAL. Uses the current project and local artifact list.', 'Start here when you are not sure where to go.'],
    ['[data-room="talk"]', 'Talk', 'Think out loud, plan, repair a conversation, or turn a session into an artifact.', 'AI OPTIONAL. Local-first; external endpoint only if you configure one.', 'Use this for messy thinking, then save the session.'],
    ['[data-room="write"]', 'Write', 'Draft stories, lyrics, notes, scripts, and snapshots.', 'LOCAL + RECEIPT when saved. Read-aloud can use browser speech.', 'Write first, snapshot often, save useful versions.'],
    ['[data-room="music"]', 'Music bench', 'Sketch beats, melody, lyrics, and export quick WAV ideas.', 'BROWSER LOCAL. No cloud required.', 'Use it as a scratchpad, not a full DAW.'],
    ['[data-room="image"]', 'Image bench', 'Open, mark up, draw, text, filter, and export PNG image artifacts.', 'BROWSER LOCAL. Future generation goes through a router and receipt.', 'Use this for visual notes and prompt packets.'],
    ['[data-room="video"]', 'Video bench', 'Collect media, preview clips, write storyboard/edit plans, and save video project notes.', 'LOCAL FIRST. Heavy generation is adapter-only later.', 'Plan scenes here before sending anything to an engine.'],
    ['[data-room="research"]', 'Explore', 'Expedition notebook for missions, findings, sources, and useful questions.', 'LOCAL FIRST. Browser Scout/Cloud capture comes later.', 'Use this to turn research into source packets.'],
    ['[data-room="code"]', 'Build', 'Project file tree and code editor for safe repo/project work.', 'LOCAL COMPANION. File writes should stay inside project paths.', 'Use for small edits, not blind shell execution.'],
    ['[data-room="import"]', 'Recover / Deep Sea Salvage', 'Bring old folders into the active project. The companion copies safe files, hashes them, skips junk/secrets, and records a receipt.', 'LOCAL + RECEIPT. Cloud never scans your drive.', 'Paste a folder path, import, then inspect the receipt.'],
    ['[data-room="work"]', 'My Work / Artifact Compass', 'Search and review artifacts across the active project. This becomes the map of source, draft, media, handoff, and export records.', 'LOCAL REGISTRY. Optional cloud mirror later.', 'Use this when you need to find what already exists.'],
    ['[data-room="modules"]', 'Engine bay', 'Shows replaceable tools and adapters: local, browser, Cloudflare, MCP, AI helper, generation router.', 'ADAPTERS. Disabled modules are sockets, not required dependencies.', 'Check status before wiring a new tool.'],
    ['[data-room="settings"]', 'Settings / boundaries', 'Names, speech, optional AI endpoint, optional Cloudflare URL, and low-motion mode.', 'BOUNDARY ROOM. API keys should remain session-only and not saved.', 'Configure only what you need. Local works without cloud.'],
    ['#exportProject', 'Export project capsule', 'Packages the active project for backup, handoff, or remote sync.', 'RECEIPT. Share only what you choose.', 'Export before risky changes.'],
    ['#micBtn', 'Mic capture', 'Quick voice entry point for Signal Desk style capture.', 'LOCAL/DEVICE permission. Future pocket capture will use the phone.', 'Use when typing is too much.'],
    ['#newProject', 'New project', 'Creates a separate project boundary so artifacts do not smear together.', 'LOCAL REGISTRY. Project separation protects context.', 'Make a new project when the work has a different source/canon boundary.'],
    ['#continueBtn', 'Continue last session', 'Returns to the most recent useful action or room.', 'LOCAL STATE. No cloud needed.', 'Good default when you are tired of menus.'],
    ['#saveChat', 'Save conversation', 'Turns the current talk session into an artifact.', 'RECEIPT when saved. AI text is not Canon by itself.', 'Save only the useful conversation, then classify it.'],
    ['#chatToStory', 'Turn into story draft', 'Moves raw conversation into a draft artifact for editing.', 'LOCAL. Draft is not source authority.', 'Use this to turn messy talk into Thousand-Year Hangover material.'],
    ['#closeSession', 'Close session', 'Records a session close point so you can resume without rediscovery.', 'RECEIPT. Helps stop loops.', 'Use at the end of a pass.'],
    ['#saveDoc', 'Save document', 'Stores the current writing draft as a project artifact.', 'LOCAL + RECEIPT. Draft remains editable.', 'Save before you experiment.'],
    ['#snapshotDoc', 'Snapshot', 'Creates a version checkpoint of the current draft.', 'LOCAL. Good for rollback.', 'Snapshot before big rewrites.'],
    ['#readDoc', 'Read aloud', 'Uses available browser speech to hear the draft.', 'BROWSER LOCAL. Voice presets guide tone.', 'Use to catch rhythm, not to approve final text.'],
    ['#importFolder', 'Import folder', 'Runs the salvage importer against a local folder path.', 'LOCAL ONLY. Skips secrets/caches/dependencies and writes import receipt.', 'Use for old projects, not whole drives.'],
    ['#saveCloudflare', 'Save optional remote', 'Stores the optional Cloudflare Worker URL for remote hull features.', 'CLOUD OPTIONAL. The app must work without it.', 'Only set this after Cloudflare is actually deployed.'],
    ['#saveAI', 'Save AI adapter', 'Sets an optional OpenAI-compatible endpoint for helper calls.', 'AI OPTIONAL. API key should be session-only and scrubbed.', 'Prefer local endpoints or explicit remote allowlist.']
  ];

  const moduleGuides = {
    'talk': ['Talk module', 'Conversation capture and optional helper replies.', 'AI optional; artifacts can be saved.'],
    'write': ['Write module', 'Drafting, snapshots, read-aloud, and saved documents.', 'Local-first; receipt on save.'],
    'music': ['Music Bench', 'Browser beat/melody sketchpad and WAV export.', 'Free core; no cloud.'],
    'voice-presets': ['Voice Bench', 'Narration styles for browser speech and future local TTS.', 'No paid voice provider by default.'],
    'image': ['Image Studio', 'Canvas editing and image artifact creation.', 'Browser local; generation adapter later.'],
    'video': ['Video Studio', 'Media bin, preview, storyboard, and future generation tickets.', 'Adapter-only for heavy engines.'],
    'research': ['Expedition Engine', 'Missions, findings, source notes, and question generation.', 'Local-first; source capture later.'],
    'coding': ['Coding Bench', 'Project file view and safe text edits.', 'Local companion; no blind shell.'],
    'importer': ['Deep Sea Salvage base', 'Recover local folders into the active project.', 'Hashes files and writes receipts.'],
    'artifact-compass': ['Artifact Compass', 'Map, search, classify, and relate artifacts.', 'Local registry first; optional cloud mirror later.'],
    'deep-sea-salvage': ['Deep Sea Salvage', 'Zip/folder/repo recovery with skip reports and receipts.', 'Local private scanning only.'],
    'receipt-ledger': ['Receipt Ledger', 'Audit trail for imports, exports, AI, sync, and generation.', 'This is the trust spine.'],
    'signal-desk-pocket': ['Signal Desk Pocket', 'Phone capture for text, photos, audio, and links.', 'Cloudflare inbox optional; local pull later.'],
    'cloudflare': ['Cloudflare Remote Hull', 'Optional free-tier relay, capsule storage, receipt mirror, and light AI helper.', 'Never source of truth.'],
    'mcp': ['MCP Bridge', 'Tool socket layer for AI clients.', 'Must go through MCP Gate. No blind tools.'],
    'mcp-gate': ['MCP Gate', 'Allowed-tool manifest with approvals, scopes, and receipts.', 'Blocks delete/publish/shell/secrets by default.'],
    'edge-ai-helper': ['Edge AI Helper', 'Tiny summarize/classify/tag jobs on Cloudflare Workers AI.', 'Budgeted, receipt-logged, optional.'],
    'local-model-socket': ['Local Model Socket', 'Detects local OpenAI-compatible model endpoints.', 'Adapter only; model not bundled.'],
    'generation-router': ['Generation Router', 'Routes image/video/audio jobs to external/local engines with human confirmation.', 'No bundled heavy models.'],
    'liquid-lfm': ['Liquid LFM Adapter', 'Future small/edge model adapter lane.', 'Model-dependent, not core.'],
    'ag-ui': ['AG-UI Event Stream', 'Future event stream surface for tool/agent status.', 'Adapter only.'],
    'a2ui': ['A2UI Surface Renderer', 'Future adaptive UI rendering surface.', 'Adapter only.']
  };

  let enabled = localStorage.getItem('twisHoloGuide') !== 'off';
  let tip;

  function makeTip() {
    const node = document.createElement('div');
    node.className = 'holo-guide-tip';
    node.setAttribute('role', 'status');
    node.setAttribute('aria-live', 'polite');
    node.innerHTML = '<h3></h3><p class="guide-does"></p><p class="guide-boundary"></p><p class="guide-next"></p>';
    document.body.appendChild(node);
    return node;
  }

  function showTip(target, data) {
    if (!enabled || !tip || !data) return;
    const [title, does, boundary, next] = data;
    tip.querySelector('h3').textContent = title;
    tip.querySelector('.guide-does').textContent = does;
    tip.querySelector('.guide-boundary').textContent = boundary;
    tip.querySelector('.guide-next').textContent = next;
    const rect = target.getBoundingClientRect();
    const top = Math.min(window.innerHeight - 230, Math.max(12, rect.top + 10));
    const left = rect.left + rect.width + 14;
    const safeLeft = left + 350 > window.innerWidth ? Math.max(14, rect.left - 354) : left;
    tip.style.top = `${top}px`;
    tip.style.left = `${safeLeft}px`;
    tip.classList.add('show');
    target.classList.add('holo-help-ring');
  }

  function hideTip() {
    if (tip) tip.classList.remove('show');
    document.querySelectorAll('.holo-help-ring').forEach(el => el.classList.remove('holo-help-ring'));
  }

  function attachGuide(selector, data) {
    document.querySelectorAll(selector).forEach(el => {
      if (el.dataset.holoGuideReady) return;
      el.dataset.holoGuideReady = '1';
      el.setAttribute('title', `${data[0]} — ${data[1]}`);
      el.setAttribute('aria-label', el.getAttribute('aria-label') || data[0]);
      el.addEventListener('mouseenter', () => showTip(el, data));
      el.addEventListener('mouseleave', hideTip);
      el.addEventListener('focus', () => showTip(el, data));
      el.addEventListener('blur', hideTip);
      el.addEventListener('touchstart', () => showTip(el, data), {passive:true});
    });
  }

  function attachStaticGuides() {
    guideItems.forEach(([selector, title, does, boundary, next]) => attachGuide(selector, [title, does, boundary, next]));
  }

  function attachModuleGuides() {
    document.querySelectorAll('.module-card').forEach(card => {
      if (card.dataset.holoGuideReady) return;
      const text = card.textContent.toLowerCase();
      const match = Object.entries(moduleGuides).find(([id]) => text.includes(id.replaceAll('-', ' ')) || text.includes(id));
      const data = match ? match[1] : ['Module card', 'Replaceable Workshop capability.', 'Check execution, permissions, cost, and status before enabling.'];
      attachGuideForElement(card, [data[0], data[1], data[2], 'Open Modules when you need to wire or inspect tools.']);
    });
  }

  function attachGuideForElement(el, data) {
    if (el.dataset.holoGuideReady) return;
    el.dataset.holoGuideReady = '1';
    el.setAttribute('title', `${data[0]} — ${data[1]}`);
    el.setAttribute('tabindex', el.getAttribute('tabindex') || '0');
    el.addEventListener('mouseenter', () => showTip(el, data));
    el.addEventListener('mouseleave', hideTip);
    el.addEventListener('focus', () => showTip(el, data));
    el.addEventListener('blur', hideTip);
    el.addEventListener('touchstart', () => showTip(el, data), {passive:true});
  }

  function addStatusStrip() {
    const hero = document.querySelector('.hero > div:first-child');
    if (!hero || document.querySelector('.holo-status-strip')) return;
    const strip = document.createElement('div');
    strip.className = 'holo-status-strip';
    strip.innerHTML = [
      '<span class="holo-chip local">LOCAL CORE</span>',
      '<span class="holo-chip receipt">RECEIPTS FIRST</span>',
      '<span class="holo-chip cloud">CLOUD OPTIONAL</span>',
      '<span class="holo-chip ai">AI HELPER ONLY</span>'
    ].join('');
    hero.appendChild(strip);
  }

  function addToggle() {
    if (document.querySelector('.holo-guide-button')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'holo-guide-button';
    btn.textContent = 'Guide';
    btn.setAttribute('aria-pressed', String(enabled));
    btn.addEventListener('click', () => {
      enabled = !enabled;
      localStorage.setItem('twisHoloGuide', enabled ? 'on' : 'off');
      document.body.classList.toggle('holo-guide-on', enabled);
      btn.setAttribute('aria-pressed', String(enabled));
      hideTip();
    });
    document.body.appendChild(btn);
  }

  function boot() {
    tip = makeTip();
    addToggle();
    addStatusStrip();
    document.body.classList.toggle('holo-guide-on', enabled);
    attachStaticGuides();
    attachModuleGuides();
    const obs = new MutationObserver(() => {
      attachStaticGuides();
      attachModuleGuides();
    });
    obs.observe(document.body, {childList:true, subtree:true});
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') hideTip();
    });
    document.addEventListener('scroll', hideTip, true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
