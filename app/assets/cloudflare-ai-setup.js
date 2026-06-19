(() => {
  const ENDPOINT = "/api/ai/chat";
  const MODEL = "@cf/openai/gpt-oss-20b";
  const AGENT_MODEL = "@cf/zai-org/glm-5.2";
  const KEY = "twisHolo.full.v1";
  const $ = (s, root = document) => root.querySelector(s);

  function toast(text) {
    const el = $("#toast");
    if (!el) return;
    el.textContent = text;
    el.classList.add("show");
    setTimeout(() => el.classList.remove("show"), 2200);
  }

  function patchState(patch) {
    let state = {};
    try { state = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch {}
    state.settings = Object.assign({}, state.settings || {}, patch);
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function saveAdapter(modelName, message) {
    const endpoint = $("#aiEndpoint");
    const model = $("#aiModel");
    const key = $("#aiKey");
    if (endpoint) endpoint.value = ENDPOINT;
    if (model) model.value = modelName;
    if (key) key.value = "";
    patchState({ endpoint: ENDPOINT, model: modelName, apiKey: "" });
    const save = $("#saveAI");
    if (save) save.click();
    toast(message);
  }

  function inject() {
    const aiStatus = $("#aiStatus");
    if (!aiStatus || $("#cloudflareAiSetup")) return;
    const box = document.createElement("div");
    box.id = "cloudflareAiSetup";
    box.innerHTML = '<hr><h3>Away mode Cloudflare AI</h3><button id="useCloudflareAi" class="tool">Use Cloudflare AI</button><button id="useCloudflareAgentAi" class="tool">Use coding/agent AI</button><button id="probeCloudflareAi" class="tool">Probe Cloudflare AI</button><p class="muted">Talk default: @cf/openai/gpt-oss-20b. Coding/agent option: @cf/zai-org/glm-5.2. Requires one Cloudflare Pages binding named AI.</p>';
    aiStatus.parentElement.appendChild(box);
    $("#useCloudflareAi").onclick = () => saveAdapter(MODEL, "Cloudflare AI selected");
    $("#useCloudflareAgentAi").onclick = () => saveAdapter(AGENT_MODEL, "Cloudflare coding/agent AI selected");
    $("#probeCloudflareAi").onclick = probe;
  }

  async function probe() {
    const status = $("#aiStatus");
    const selectedModel = $("#aiModel")?.value.trim() || MODEL;
    if (status) status.textContent = "Probing Cloudflare AI…";
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: selectedModel,
          messages: [{ role: "user", content: "Reply with OK." }],
          temperature: 0.2,
          max_tokens: 30
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "HTTP " + res.status);
      if (status) status.textContent = "Cloudflare AI reachable: " + (data.model || selectedModel);
    } catch (err) {
      if (status) status.textContent = "Cloudflare AI not ready: " + err.message;
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
