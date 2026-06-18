(() => {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canHear = Boolean(Rec);
  const canTalk = "speechSynthesis" in window;
  let on = false;
  let rec = null;
  let talking = false;
  let last = "";

  const $ = (s, root = document) => root.querySelector(s);

  function status(text) {
    const s = $("#voiceLoopStatus");
    if (s) s.textContent = text;
    const b = $("#voiceLoopToggle");
    if (b) b.textContent = on ? "Stop voice conversation" : "Start voice conversation";
  }

  function panel() {
    const side = document.querySelector('[data-panel="talk"] aside.panel');
    if (!side || $("#voiceLoopPanel")) return;
    const box = document.createElement("div");
    box.id = "voiceLoopPanel";
    box.innerHTML = '<hr><h3>Voice mode</h3><button id="voiceLoopToggle" class="tool">Start voice conversation</button><p id="voiceLoopStatus" class="muted">Click start, allow microphone, then talk.</p><p class="muted">Uses browser speech input and browser speech output.</p>';
    side.appendChild(box);
    $("#voiceLoopToggle").onclick = toggle;
    if (!canHear) status("Voice input is not available in this browser.");
  }

  function listen() {
    if (!on || !canHear || talking) return;
    try {
      rec = new Rec();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.continuous = false;
      rec.onstart = () => status("Listening…");
      rec.onerror = (e) => status("Voice input error: " + (e.error || "unknown"));
      rec.onresult = (e) => {
        const text = Array.from(e.results).map(r => r[0].transcript).join(" ").trim();
        if (text) send(text);
      };
      rec.onend = () => { if (on && !talking) setTimeout(listen, 500); };
      rec.start();
    } catch {
      status("Could not start voice input. Check microphone permission.");
    }
  }

  function stopListen() {
    try { if (rec) rec.stop(); } catch {}
    rec = null;
  }

  function send(text) {
    const input = $("#chatInput");
    const form = $("#chatForm");
    if (!input || !form) return;
    input.value = text;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    status("Heard: " + text);
  }

  function say(text) {
    if (!on || !canTalk || !text || text === last) return;
    last = text;
    talking = true;
    stopListen();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
    u.rate = 0.98;
    u.pitch = 0.92;
    u.onend = () => { talking = false; if (on) setTimeout(listen, 700); };
    u.onerror = () => { talking = false; if (on) setTimeout(listen, 700); };
    status("Speaking reply…");
    speechSynthesis.speak(u);
  }

  function watch() {
    const messages = $("#messages");
    if (!messages || messages.dataset.voiceLoop) return;
    messages.dataset.voiceLoop = "1";
    new MutationObserver(() => {
      if (!on) return;
      const replies = Array.from(messages.querySelectorAll(".message.assistant"));
      const latest = replies[replies.length - 1];
      if (latest) say(latest.textContent.trim());
    }).observe(messages, { childList: true, subtree: true });
  }

  function toggle() {
    if (!canHear) { status("Voice input is not available in this browser."); return; }
    on = !on;
    if (on) {
      const talk = document.querySelector('[data-room="talk"]');
      if (talk) talk.click();
      panel();
      watch();
      status("Starting voice mode…");
      listen();
    } else {
      stopListen();
      if (canTalk) speechSynthesis.cancel();
      talking = false;
      status("Voice mode stopped.");
    }
  }

  function boot() {
    panel();
    watch();
    document.addEventListener("click", e => {
      if (e.target && e.target.dataset && e.target.dataset.room === "talk") setTimeout(() => { panel(); watch(); }, 50);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
