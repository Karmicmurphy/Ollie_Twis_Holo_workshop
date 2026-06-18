(() => {
  const MODULES_URL = "modules/modules.json";
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

  function addStyles() {
    if ($("#engineHarnessStyle")) return;
    const style = document.createElement("style");
    style.id = "engineHarnessStyle";
    style.textContent = `.engine-harness{margin-bottom:1rem;padding:1rem;border-radius:18px;border:1px solid rgba(255,255,255,.12);background:rgba(3,10,18,.58)}.engine-harness .flow{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.6rem;margin:.8rem 0}.engine-harness .node{border:1px solid rgba(127,255,240,.18);border-radius:14px;padding:.7rem;background:rgba(255,255,255,.04)}.engine-harness .node b{display:block}.engine-harness .node small{opacity:.76}.engine-harness .lane-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:.75rem;margin-top:.8rem}.engine-harness .lane{border-top:1px solid rgba(255,255,255,.09);padding:.75rem 0}.engine-harness .lane small{display:block;opacity:.72}.engine-harness .pill{display:inline-block;margin:.18rem .18rem 0 0;padding:.12rem .45rem;border-radius:999px;border:1px solid rgba(255,255,255,.13);font-size:.72rem;opacity:.85}`;
    document.head.appendChild(style);
  }

  async function loadModules() {
    try {
      const res = await fetch(MODULES_URL, { cache: "no-store" });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }

  function render(modules) {
    const panel = document.querySelector('[data-panel="modules"]');
    const grid = $("#moduleGrid");
    if (!panel || !grid) return;
    addStyles();
    let box = $("#engineHarness", panel);
    if (!box) {
      box = document.createElement("section");
      box.id = "engineHarness";
      box.className = "engine-harness";
      panel.insertBefore(box, grid);
    }
    const enabled = modules.filter(m => m.enabledByDefault).length;
    const gated = modules.filter(m => !m.enabledByDefault || String(m.status || "").includes("gated")).length;
    const receipt = modules.filter(m => m.receiptRequired).length;
    const local = modules.filter(m => (m.execution || []).some(x => /local|browser|canvas|web-audio/i.test(String(x)))).length;
    box.innerHTML = `<p class="eyebrow">Engine harness</p><h2>Mini-engine pipeline</h2><p class="muted">Chat, write, code, create, recover, search, and export through small bounded engines. Engines get packets; artifacts stay permanent.</p><div class="flow"><div class="node"><b>${modules.length}</b><small>registered engines</small></div><div class="node"><b>${enabled}</b><small>enabled core lanes</small></div><div class="node"><b>${gated}</b><small>gated adapter lanes</small></div><div class="node"><b>${receipt}</b><small>receipt lanes</small></div><div class="node"><b>${local}</b><small>local/browser lanes</small></div></div><div class="lane-grid">${modules.slice(0, 8).map(laneHtml).join("")}</div>`;
  }

  function laneHtml(m) {
    const exec = (m.execution || []).slice(0, 4).map(x => `<span class="pill">${esc(x)}</span>`).join("");
    return `<article class="lane"><b>${esc(m.name)}</b><small>${esc(m.room)} · ${esc(m.status)} · ${esc(m.sandbox || "sandboxed")}</small><small>${esc(m.notes || "")}</small><div>${exec}</div></article>`;
  }

  loadModules().then(modules => {
    render(modules);
    document.addEventListener("click", e => {
      if (e.target?.dataset?.room === "modules") setTimeout(() => render(modules), 50);
    });
  });
})();
