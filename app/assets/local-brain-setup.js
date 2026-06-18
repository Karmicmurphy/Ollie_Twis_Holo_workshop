(() => {
  const DEFAULT_ENDPOINT = "http://127.0.0.1:11434/v1/chat/completions";
  const DEFAULT_MODEL = "llama3.2:3b";
  const $ = (s, r = document) => r.querySelector(s);

  function toast(text) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  }

  function settingsState() {
    try {
      const raw = localStorage.getItem("twisHolo.full.v1") || "{}";
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }

  function saveSettingsPatch(patch) {
    const state = settingsState();
    state.settings = Object.assign({}, state.settings || {}, patch);
    localStorage.setItem("twisHolo.full.v1", JSON.stringify(state));
  }

  function inject() {
    const aiStatus = $("#aiStatus");
    if (!aiStatus || $("#localBrainSetup")) return;
    const box = document.createElement("div");
    box.id = "localBrainSetup";
    box.innerHTML = '<hr><h3>Free local brain</h3><button id="useLocalBrain" class="tool">Use local Ollama-style brain</button><button id="probeLocalBrain" class="tool">Probe local brain</button><p class="muted">Uses localhost only. No paid key required. Works after a local OpenAI-compatible server is installed and running.</p>';
    aiStatus.parentElement.appendChild(box);
    $("#useLocalBrain").onclick = useLocal;
    $("#probeLocalBrain").onclick = probe;
  }

  function useLocal() {
    const endpoint = $("#aiEndpoint");
    const model = $("#aiModel");
    const key = $("#aiKey");
    if (endpoint) endpoint.value = DEFAULT_ENDPOINT;
    if (model && !model.value.trim()) model.value = DEFAULT_MODEL;
    if (key) key.value = "";
    saveSettingsPatch({ endpoint: DEFAULT_ENDPOINT, model: model?.value || DEFAULT_MODEL, apiKey: "" });
    const save = $("#saveAI");
    if (save) save.click();
    toast("Local brain settings filled");
  }

  async function probe() {
    const status = $("#aiStatus");
    const endpoint = $("#aiEndpoint")?.value.trim() || DEFAULT_ENDPOINT;
    if (!endpoint.startsWith("http://127.0.0.1") && !endpoint.startsWith("http://localhost")) {
      if (status) status.textContent = "Probe blocked: localhost only.";
      return;
    }
    if (status) status.textContent = "Probing local brain…";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: $("#aiModel")?.value.trim() || DEFAULT_MODEL,
          messages: [{ role: "user", content: "Reply with OK." }],
          stream: false
        })
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      if (status) status.textContent = "Local brain reachable.";
    } catch (err) {
      if (status) status.textContent = "Local brain not reachable yet: " + err.message;
    }
  }

  function boot() {
    inject();
    document.addEventListener("click", e => {
      if (e.target && e.target.dataset && e.target.dataset.room === "settings") setTimeout(inject, 80);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
