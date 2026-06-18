(() => {
  const KEY = "twisHolo.full.v1";
  const STOP = new Set("a an and are as at be but by for from has have i in is it its of on or that the this to with you your into not no do does did what when where who why how".split(" "));
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (m) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const readState = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
  const words = (v) => String(v ?? "").toLowerCase().match(/[a-z0-9][a-z0-9'-]{1,}/g)?.filter(w => !STOP.has(w)) || [];
  const textOf = (item) => [item.title, item.type, item.path, item.authorityState, JSON.stringify(item.data || {})].join(" ");
  const unique = (a) => [...new Set(a)];
  const projectName = (state, id) => (state.projects || []).find(p => p.id === id)?.title || id || "Active project";

  function score(item, queryTokens) {
    const text = textOf(item).toLowerCase();
    const title = String(item.title || "").toLowerCase();
    const type = String(item.type || "").toLowerCase();
    const path = String(item.path || "").toLowerCase();
    const data = JSON.stringify(item.data || {}).toLowerCase();
    let points = 0;
    const why = [];
    for (const q of queryTokens) {
      if (title.includes(q)) { points += 7; why.push(`title:${q}`); }
      if (type.includes(q)) { points += 4; why.push(`kind:${q}`); }
      if (path.includes(q)) { points += 3; why.push(`path:${q}`); }
      if (data.includes(q)) { points += 2; why.push(`body:${q}`); }
      if (text.includes(q)) points += 1;
    }
    const age = Date.parse(item.updatedAt || item.createdAt || 0) || 0;
    return { item, points: points + Math.min(4, age / 1e13), why: unique(why).slice(0, 6) };
  }

  function related(items, hit) {
    const hWords = new Set(words(textOf(hit.item)));
    return items.filter(i => i.id !== hit.item.id).map(i => {
      const overlap = words(textOf(i)).filter(w => hWords.has(w));
      return { item: i, overlap: unique(overlap).slice(0, 5) };
    }).filter(x => x.overlap.length >= 2).slice(0, 3);
  }

  function installStyles() {
    if ($("#artifactCompassStyle")) return;
    const style = document.createElement("style");
    style.id = "artifactCompassStyle";
    style.textContent = `
      .artifact-compass{margin:0 0 1rem 0;padding:1rem;border:1px solid rgba(127,255,240,.18);border-radius:18px;background:rgba(4,12,20,.62);box-shadow:0 0 28px rgba(0,255,220,.08)}
      .artifact-compass .compass-row{display:flex;gap:.5rem;flex-wrap:wrap;align-items:center}.artifact-compass input,.artifact-compass select{min-height:2.4rem}.artifact-compass input{flex:1;min-width:220px}.artifact-compass .chips{display:flex;gap:.4rem;flex-wrap:wrap;margin:.7rem 0}.artifact-compass .chip{font-size:.78rem;border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:.22rem .55rem;opacity:.86}.artifact-compass .hit{display:grid;grid-template-columns:1fr auto;gap:.6rem;padding:.75rem;border-top:1px solid rgba(255,255,255,.08)}.artifact-compass .hit small{display:block;opacity:.72}.artifact-compass .why{font-size:.75rem;opacity:.75}.artifact-compass .empty{opacity:.7;padding:.8rem}`;
    document.head.appendChild(style);
  }

  function render() {
    const work = document.querySelector('[data-panel="work"]');
    if (!work) return;
    installStyles();
    let box = $("#artifactCompass", work);
    if (!box) {
      box = document.createElement("section");
      box.id = "artifactCompass";
      box.className = "artifact-compass";
      work.insertBefore(box, $("#workList", work));
    }
    const state = readState();
    const active = state.activeProject;
    const items = (state.items || []).filter(i => !active || !i.projectId || i.projectId === active);
    const kinds = unique(items.map(i => i.type).filter(Boolean)).sort();
    const q = box.dataset.q || "";
    const kind = box.dataset.kind || "all";
    const tokens = words(q);
    const filtered = items.filter(i => kind === "all" || i.type === kind);
    const hits = (tokens.length ? filtered.map(i => score(i, tokens)).filter(h => h.points > 0).sort((a,b) => b.points - a.points) : filtered.map(i => ({ item:i, points:0, why:["recent"] }))).slice(0, 18);
    const topTerms = unique(filtered.flatMap(i => words(textOf(i))).filter(w => w.length > 3)).slice(0, 12);
    box.innerHTML = `<div class="compass-row"><div><p class="eyebrow">Artifact Compass</p><h2>Savage local search</h2><small>${esc(projectName(state, active))} · ${items.length} indexed artifacts · keyword + field weighting + relationship hints</small></div></div><div class="compass-row"><input id="compassQuery" placeholder="Try: Cheryl rain window, beat sketch, source receipt, video plan" value="${esc(q)}"><select id="compassKind"><option value="all">All artifact kinds</option>${kinds.map(k => `<option value="${esc(k)}" ${k===kind?"selected":""}>${esc(k)}</option>`).join("")}</select><button id="compassClear" class="quiet">Clear</button></div><div class="chips">${topTerms.map(t => `<button class="chip" data-chip="${esc(t)}">${esc(t)}</button>`).join("")}</div><div>${hits.length ? hits.map(h => hitHtml(h, related(filtered, h))).join("") : '<div class="empty">No artifact match. Capture or import more work, then search again.</div>'}</div>`;
    $("#compassQuery", box).oninput = e => { box.dataset.q = e.target.value; render(); };
    $("#compassKind", box).onchange = e => { box.dataset.kind = e.target.value; render(); };
    $("#compassClear", box).onclick = () => { box.dataset.q = ""; box.dataset.kind = "all"; render(); };
    box.querySelectorAll("[data-chip]").forEach(b => b.onclick = () => { box.dataset.q = b.dataset.chip; render(); });
  }

  function hitHtml(h, rel) {
    const i = h.item;
    const relText = rel.length ? `Related: ${rel.map(r => `${r.item.title || r.item.type} (${r.overlap.join(", ")})`).join(" · ")}` : "No strong local relationship found yet.";
    return `<article class="hit"><div><b>${esc(i.title || "Untitled")}</b><small>${esc(i.type || "artifact")} · ${esc(i.authorityState || "DRAFT")} · ${esc(new Date(i.updatedAt || i.createdAt || Date.now()).toLocaleString())}</small><div class="why">Matched: ${esc((h.why || []).join(", ") || "recent")}<br>${esc(relText)}</div></div><button class="quiet" title="Use the normal Open button below for full artifact loading">Compass</button></article>`;
  }

  window.addEventListener("storage", render);
  document.addEventListener("click", (e) => { if (e.target?.dataset?.room === "work") setTimeout(render, 80); });
  setTimeout(render, 500);
})();
