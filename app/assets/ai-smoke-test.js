(() => {
  const ENDPOINT = "/api/ai/chat";
  const MODEL = "@cf/openai/gpt-oss-20b";
  const $ = (s, root = document) => root.querySelector(s);

  function setStatus(text) {
    const status = $("#aiStatus");
    if (status) status.textContent = text;
  }

  function addMessage(role, content) {
    const messages = $("#messages");
    if (!messages) return;
    const div = document.createElement("div");
    div.className = "message " + role;
    div.textContent = content;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function speak(text) {
    if (!$("#speakReplies")?.checked) return;
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  }

  async function smokeTest() {
    setStatus("Running direct Cloudflare AI smoke test…");
    addMessage("user", "AI smoke test: reply with one short sentence.");

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: "user", content: "Reply with exactly this: AI path is working." }],
          temperature: 0.2,
          max_tokens: 40
        })
      });

      const text = await res.text();
      let data = {};
      try { data = JSON.parse(text); } catch {}

      if (!res.ok) {
        const error = data.error || text || "HTTP " + res.status;
        setStatus("AI smoke test failed: " + error);
        addMessage("assistant", "AI smoke test failed: " + error);
        return;
      }

      const reply = data.text || data.choices?.[0]?.message?.content || "AI replied but returned no visible text.";
      setStatus("AI smoke test passed: " + (data.model || MODEL));
      addMessage("assistant", reply);
      speak(reply);
    } catch (error) {
      const message = error?.message || String(error);
      setStatus("AI smoke test failed: " + message);
      addMessage("assistant", "AI smoke test failed: " + message);
    }
  }

  function inject() {
    if ($("#aiSmokeTest")) return;

    const aiStatus = $("#aiStatus");
    if (aiStatus?.parentElement) {
      const button = document.createElement("button");
      button.id = "aiSmokeTest";
      button.className = "tool";
      button.type = "button";
      button.textContent = "Run direct AI smoke test";
      button.onclick = smokeTest;
      aiStatus.parentElement.insertBefore(button, aiStatus.nextSibling);
    }

    const chatForm = $("#chatForm");
    if (chatForm && !$("#talkSmokeTest")) {
      const button = document.createElement("button");
      button.id = "talkSmokeTest";
      button.className = "quiet";
      button.type = "button";
      button.textContent = "Direct AI test";
      button.onclick = smokeTest;
      chatForm.appendChild(button);
    }
  }

  function boot() {
    inject();
    document.addEventListener("click", (event) => {
      if (event.target?.dataset?.room === "settings" || event.target?.dataset?.room === "talk") {
        setTimeout(inject, 80);
      }
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
