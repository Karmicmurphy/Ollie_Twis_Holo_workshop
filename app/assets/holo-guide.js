(() => {
  'use strict';
  const guides = [
    ['[data-room="home"]','Home cockpit','Orientation room: continue, jump rooms, or review recent artifacts.','LOCAL. Uses current project state.','Start here when you are lost.'],
    ['[data-room="talk"]','Talk','Think out loud, plan, repair drift, and save sessions.','AI OPTIONAL. Local-first unless configured.','Use for messy thinking, then save.'],
    ['[data-room="write"]','Write','Draft stories, lyrics, notes, and snapshots.','LOCAL + RECEIPT when saved.','Write first, snapshot before experiments.'],
    ['[data-room="music"]','Music bench','Sketch beats, melody, lyrics, and WAV ideas.','BROWSER LOCAL. No cloud required.','Use as a fast scratchpad.'],
    ['[data-room="image"]','Image bench','Open, mark up, draw, filter, and export PNG artifacts.','BROWSER LOCAL. Generation routes later.','Use for visual notes and prompt packets.'],
    ['[data-room="video"]','Video bench','Collect media, preview clips, and write storyboard plans.','LOCAL FIRST. Heavy engines are adapter-only later.','Plan scenes here before routing jobs.'],
    ['[data-room="research"]','Explore','Mission notes, findings, sources, and question finder.','LOCAL FIRST. Source capture later.','Turn research into source packets.'],
    ['[data-room="code"]','Build','Project file view and safe text editor.','LOCAL COMPANION. No blind shell.','Use for small repo/project edits.'],
    ['[data-room="import"]','Recover / Deep Sea Salvage','Import old folders, hash files, skip junk/secrets, and record receipts.','LOCAL + RECEIPT. Cloud never scans drives.','Paste a folder path and inspect the receipt.'],
    ['[data-room="work"]','My Work / Artifact Compass','Search and review project artifacts and relationships.','LOCAL REGISTRY. Optional mirror later.','Use when you need to find what exists.'],
    ['[data-room="modules"]','Engine bay','Inspect replaceable tools: local, browser, Cloudflare, MCP, AI, generation.','ADAPTERS. Disabled means socket, not dependency.','Check status before wiring tools.'],
    ['[data-room="settings"]','Settings / boundaries','Names, speech, AI endpoint, Cloudflare URL, and low-motion mode.','BOUNDARY ROOM. API keys stay session-only.','Configure only what you need.'],
    ['#exportProject','Export capsule','Package the active project for backup/handoff/sync.','RECEIPT. Share only what you choose.','Export before risky changes.'],
    ['#newProject','New project','Create a separate project boundary.','LOCAL REGISTRY. Prevents context smear.','Use for different source/canon work.'],
    ['#continueBtn','Continue last session','Return to the most recent useful action.','LOCAL STATE. No cloud needed.','Good default when menus are annoying.'],
    ['#importFolder','Import folder','Run the safe local salvage importer.','LOCAL ONLY. Skips secrets/caches/dependencies.','Use for old projects, not whole drives.'],
    ['#saveAI','Save AI adapter','Set optional OpenAI-compatible helper endpoint.','AI OPTIONAL. Key should not be stored.','Prefer local endpoints or explicit allowlist.'],
    ['#saveCloudflare','Save optional remote','Set optional Cloudflare Worker URL.','CLOUD OPTIONAL. App works without it.','Only set after deployment exists.']
  ];
  const moduleGuides = {
    'Deep Sea Salvage':['Deep Sea Salvage','Recover folders/zips/repos with skip reports and receipts.','Local private scanning only.'],
    'Artifact Compass':['Artifact Compass','Map, search, classify, and relate artifacts.','Local registry first.'],
    'Receipt Ledger':['Receipt Ledger','Audit trail for imports, exports, AI, sync, and generation.','Trust spine.'],
    'Signal Desk Pocket':['Signal Desk Pocket','Phone capture for text, photos, audio, and links.','Cloud inbox optional.'],
    'Cloudflare Remote Hull':['Cloudflare Remote Hull','Free-tier relay, capsule storage, receipt mirror, and light helper.','Never source of truth.'],
    'MCP Gate':['MCP Gate','Allowed-tool manifest with approvals, scopes, and receipts.','Blocks delete/publish/shell/secrets by default.'],
    'Edge AI Helper':['Edge AI Helper','Tiny summarize/classify/tag jobs.','Budgeted and receipt-logged.'],
    'Local Model Socket':['Local Model Socket','Detect local OpenAI-compatible endpoints.','Adapter only; model not bundled.'],
    'Generation Router':['Generation Router','Route media jobs to engines with human confirmation.','No bundled heavy models.']
  };
  let enabled = localStorage.getItem('twisHoloGuide') !== 'off';
  let tip;
  const data = (title, does, boundary, next) => [title, does, boundary, next];
  function makeTip(){
    const el = document.createElement('div');
    el.className = 'holo-guide-tip';
    el.setAttribute('role','status');
    el.setAttribute('aria-live','polite');
    el.innerHTML = '<h3></h3><p class="guide-does"></p><p class="guide-boundary"></p><p class="guide-next"></p>';
    document.body.appendChild(el);
    return el;
  }
  function show(el, info){
    if(!enabled || !tip || !info) return;
    const [title, does, boundary, next] = info;
    tip.querySelector('h3').textContent = title;
    tip.querySelector('.guide-does').textContent = does;
    tip.querySelector('.guide-boundary').textContent = boundary;
    tip.querySelector('.guide-next').textContent = next;
    const r = el.getBoundingClientRect();
    const top = Math.min(innerHeight - 230, Math.max(12, r.top + 8));
    const rightSide = r.left + r.width + 14;
    const left = rightSide + 350 > innerWidth ? Math.max(14, r.left - 354) : rightSide;
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
    tip.classList.add('show');
    el.classList.add('holo-help-ring');
  }
  function hide(){
    if(tip) tip.classList.remove('show');
    document.querySelectorAll('.holo-help-ring').forEach(el => el.classList.remove('holo-help-ring'));
  }
  function attach(el, info){
    if(!el || el.dataset.holoGuideReady) return;
    el.dataset.holoGuideReady = '1';
    el.title = `${info[0]} — ${info[1]}`;
    if(!el.hasAttribute('aria-label')) el.setAttribute('aria-label', info[0]);
    if(el.classList.contains('module-card') && !el.hasAttribute('tabindex')) el.tabIndex = 0;
    el.addEventListener('mouseenter', () => show(el, info));
    el.addEventListener('mouseleave', hide);
    el.addEventListener('focus', () => show(el, info));
    el.addEventListener('blur', hide);
    el.addEventListener('touchstart', () => show(el, info), {passive:true});
  }
  function attachAll(){
    guides.forEach(([selector,title,does,boundary,next]) => document.querySelectorAll(selector).forEach(el => attach(el, data(title,does,boundary,next))));
    document.querySelectorAll('.module-card').forEach(card => {
      if(card.dataset.holoGuideReady) return;
      const label = Object.keys(moduleGuides).find(name => card.textContent.includes(name));
      const g = label ? moduleGuides[label] : ['Module card','Replaceable Workshop capability.','Check execution, permissions, cost, and status.'];
      attach(card, data(g[0], g[1], g[2], 'Open Modules when wiring or inspecting tools.'));
    });
  }
  function addToggle(){
    if(document.querySelector('.holo-guide-button')) return;
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
      hide();
    });
    document.body.appendChild(btn);
  }
  function addChips(){
    const hero = document.querySelector('.hero > div:first-child');
    if(!hero || document.querySelector('.holo-status-strip')) return;
    const strip = document.createElement('div');
    strip.className = 'holo-status-strip';
    strip.innerHTML = '<span class="holo-chip local">LOCAL CORE</span><span class="holo-chip receipt">RECEIPTS FIRST</span><span class="holo-chip cloud">CLOUD OPTIONAL</span><span class="holo-chip ai">AI HELPER ONLY</span>';
    hero.appendChild(strip);
  }
  function boot(){
    tip = makeTip();
    addToggle();
    addChips();
    document.body.classList.toggle('holo-guide-on', enabled);
    attachAll();
    new MutationObserver(attachAll).observe(document.body, {childList:true, subtree:true});
    document.addEventListener('keydown', e => { if(e.key === 'Escape') hide(); });
    document.addEventListener('scroll', hide, true);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
