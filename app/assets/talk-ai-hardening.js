(() => {
  const KEY = "twisHolo.full.v1";
  const ENDPOINT = "/api/ai/chat";
  const DEFAULT_MODEL = "@cf/openai/gpt-oss-20b";
  const $ = (s, root = document) => root.querySelector(s);

  function loadState() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch { return {}; }
  }

  function saveState(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[m]));
  }

  function setStatus(text) {
    const el = $("#aiStatus");
    if (el) el.textContent = text;
  }

  function renderChat(state) {
    const box = $("#messages");
    if (!box) return;
    const chat = Array.isArray(state.chat) ? state.chat : [];
    box.innerHTML = chat.map((m) => `<div class="message ${m.role === "user" ? "user" : "assistant"}">${escapeHtml(m.content)}</div>`).join("");
    box.scrollTop = box.scrollHeight;
  }

  function getEndpoint(state) {
    return $("#aiEndpoint")?.value?.trim() || state.settings?.endpoint || ENDPOINT;
  }

  function getModel(state) {
    return $("#aiModel")?.value?.trim() || state.settings?.model || DEFAULT_MODEL;
  }

  function speak(text) {
    const state = loadState();
    if (!($("#speakReplies")?.checked || state.settings?.speakReplies)) return;
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }

  async function callAi(state) {
    const endpoint = getEndpoint(state);
    const model = getModel(state);
    const messages = [
      { role: "system", content: "You are the Twis Holo Workshop companion. Answer Randy directly and practically." },
      ...((Array.isArray(state.chat) ? state.chat : []).slice(-20))
    ];

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 700 })
    });

    const raw = await res.text();
    let data = {};
    try { data = JSON.parse(raw); } catch {}

    if (!res.ok || data.ok === false) {
      throw new Error(data.error || raw || `HTTP ${res.status}`);
    }

    return data.text || data.choices?.[0]?.message?.content || data.response || "AI replied but returned no visible text.";
  }

  async function submitTalk(event) {
    if (event.target?.id !== "chatForm") return;
    event.preventDefault();
    event.stopPropagation();

    const input = $("#chatInput");
    const text = input?.value?.trim();
    if (!text) return;

    const state = loadState();
    state.settings = state.settings || {};
    state.settings.endpoint = getEndpoint(state);
    state.settings.model = getModel(state);
    state.chat = Array.isArray(state.chat) ? state.chat : [];
    state.chat.push({ role: "user", content: text });
    input.value = "";
    saveState(state);
    renderChat(state);

    setStatus("Calling AI...");
    try {
      const reply = await callAi(state);
      state.chat.push({ role: "assistant", content: reply });
      saveState(state);
      renderChat(state);
      setStatus("AI replied: " + getModel(state));
      speak(reply);
    } catch (error) {
      const message = "AI ERROR: " + (error?.message || String(error));
      state.chat.push({ role: "assistant", content: message });
      saveState(state);
      renderChat(state);
      setStatus(message);
      speak(message);
    }
  }

  async function checkEndpoint() {
    setStatus("Checking /api/ai/chat...");
    const state = loadState();
    state.chat = Array.isArray(state.chat) ? state.chat : [];
    try {
      const res = await fetch(ENDPOINT, { method: "GET", cache: "no-store" });
      const data = await res.json();
      const msg = `Endpoint check: bindingPresent=${data.bindingPresent}; defaultModel=${data.defaultModel}`;
      state.chat.push({ role: "assistant", content: msg });
      setStatus(msg);
    } catch (error) {
      const msg = "Endpoint check failed: " + (error?.message || String(error));
      state.chat.push({ role: "assistant", content: msg });
      setStatus(msg);
    }
    saveState(state);
    renderChat(state);
  }

  function inject() {
    const form = $("#chatForm");
    if (form && !form.dataset.talkAiHardened) {
      form.dataset.talkAiHardened = "true";
      form.addEventListener("submit", submitTalk, true);
    }
    if (form && !$("#endpointTruthCheck")) {
      const b = document.createElement("button");
      b.id = "endpointTruthCheck";
      b.className = "quiet";
      b.type = "button";
      b.textContent = "Check /api/ai/chat";
      b.onclick = checkEndpoint;
      form.appendChild(b);
    }
  }

  function boot() {
    inject();
    document.addEventListener("click", (e) => {
      if (e.target?.dataset?.room === "talk" || e.target?.dataset?.room === "settings") setTimeout(inject, 80);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
