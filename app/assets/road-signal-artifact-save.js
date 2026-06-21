(() => {
  const APP_KEY = "twisHolo.full.v1";
  const $ = (s, root = document) => root.querySelector(s);
  const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const read = () => { try { return JSON.parse(localStorage.getItem(APP_KEY) || "{}"); } catch { return {}; } };
  const write = state => localStorage.setItem(APP_KEY, JSON.stringify(state));
  const id = () => crypto.randomUUID ? crypto.randomUUID() : "road-signal-" + Date.now() + "-" + Math.random().toString(16).slice(2);
  const now = () => new Date().toISOString();

  function toast(text) {
    const t = $("#toast");
    if (!t) return;
    t.textContent = text;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2200);
  }

  function activeProject(state) {
    if (state.activeProject) return state.activeProject;
    if (state.projects?.[0]?.id) return state.projects[0].id;
    return "thousand-year-hangover";
  }

  function currentSettings() {
    return {
      bpm: $("#rsBpm")?.value || "",
      key: $("#rsKey")?.value || "",
      lyricalCenter: $("#rsObject")?.value || "",
      mechanismPreset: $("#rsPreset")?.value || "",
      femaleVoiceMode: $("#rsFemaleMode")?.value || "",
      leadEngine: $("#rsLead")?.value || "",
      supportEngine: $("#rsSupport")?.value || "",
      accentEngine: $("#rsAccent")?.value || "",
      aiBehavior: $("#rsAiBehavior")?.value || "",
      dropBehavior: $("#rsDropBehavior")?.value || "",
      gearSize: $("#rsGearSize")?.value || "",
      gearSpeed: $("#rsGearSpeed")?.value || "",
      rhythmDensity: $("#rsRhythmDensity")?.value || "",
      tension: $("#rsTension")?.value || "",
      sectionEnergy: $("#rsSectionEnergy")?.value || ""
    };
  }

  function inferKind(text, fallback = "road-signal-artifact") {
    if (/CODE-SHAPED FUSED PACKET/i.test(text)) return "road-signal-packet";
    if (/FUSED-LINE PROMPT/i.test(text)) return "road-signal-fused-prompt";
    if (/PRODUCER PROMPT/i.test(text)) return "road-signal-producer-prompt";
    if (/Female \(|Dog by the threshold|Beer can sunrise/i.test(text)) return "road-signal-lyrics";
    return fallback;
  }

  async function persistToCompanion(item, state) {
    try {
      const health = await fetch("/api/health");
      if (!health.ok) return false;
      const projectId = activeProject(state);
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/artifacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          kind: item.type,
          title: item.title,
          path: item.path || "",
          payload: item.data,
          authorityState: item.authorityState || "DRAFT",
          createdAt: item.createdAt
        })
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function saveRoadSignalArtifact(kind, title, output) {
    const text = String(output || $("#rsOutput")?.value || "").trim();
    if (!text) return toast("Nothing to save yet");
    const state = read();
    const projectId = activeProject(state);
    const finalKind = kind || inferKind(text);
    const settings = currentSettings();
    const stamp = now();
    const item = {
      id: id(),
      type: finalKind,
      title: title || `Road-Signal ${finalKind.replace(/^road-signal-/, "")} ${new Date().toLocaleDateString()}`,
      path: `road-signal/${finalKind}/${Date.now()}.txt`,
      projectId,
      authorityState: "DRAFT",
      createdAt: stamp,
      updatedAt: stamp,
      data: {
        body: text,
        output: text,
        settings,
        source: "Road-Signal Machine",
        artifactCompassTags: ["road-signal", "music", "gear-compiler", "fused-line", "code-shaped-packet"],
        nextAction: "Review, reuse, or evolve this Road-Signal artifact."
      }
    };
    state.items = Array.isArray(state.items) ? state.items : [];
    state.items.unshift(item);
    write(state);
    const synced = await persistToCompanion(item, state);
    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new CustomEvent("twis-holo-artifact-saved", { detail: item }));
    toast(synced ? "Road-Signal artifact saved + synced" : "Road-Signal artifact saved locally");
    return item;
  }

  function buildThenSave(buttonId, kind, titlePrefix) {
    const btn = $(buttonId);
    if (btn) btn.click();
    setTimeout(() => {
      const center = $("#rsObject")?.value?.trim();
      const title = `${titlePrefix}${center ? ": " + center.slice(0, 70) : ""}`;
      saveRoadSignalArtifact(kind, title, $("#rsOutput")?.value || "");
    }, 40);
  }

  function install() {
    const box = $("#roadSignalMachine");
    if (!box || $("#rsArtifactSavePanel", box)) return;
    const actions = $(".rs-actions", box);
    if (!actions) return;
    const panel = document.createElement("div");
    panel.id = "rsArtifactSavePanel";
    panel.className = "rs-actions";
    panel.innerHTML = `
      <button id="rsSaveCurrent" class="primaryish">Save current output as artifact</button>
      <button id="rsSavePacket">Save packet artifact</button>
      <button id="rsSaveFused">Save fused prompt artifact</button>
      <button id="rsSaveProducer">Save Producer prompt artifact</button>
      <button id="rsSaveLyrics">Save lyric artifact</button>
    `;
    actions.insertAdjacentElement("afterend", panel);
    $("#rsSaveCurrent", panel).onclick = () => saveRoadSignalArtifact(null, null, $("#rsOutput")?.value || "");
    $("#rsSavePacket", panel).onclick = () => buildThenSave("#rsBuildPacket", "road-signal-packet", "Road-Signal Packet");
    $("#rsSaveFused", panel).onclick = () => buildThenSave("#rsBuildLinePrompt", "road-signal-fused-prompt", "Road-Signal Fused Prompt");
    $("#rsSaveProducer", panel).onclick = () => buildThenSave("#rsBuildPrompt", "road-signal-producer-prompt", "Road-Signal Producer Prompt");
    $("#rsSaveLyrics", panel).onclick = () => buildThenSave("#rsBuildLyric", "road-signal-lyrics", "Road-Signal Lyrics");
  }

  document.addEventListener("click", e => {
    if (e.target?.dataset?.room === "music") setTimeout(install, 120);
  });
  setInterval(install, 1000);
  window.twisHoloSaveRoadSignalArtifact = saveRoadSignalArtifact;
})();
