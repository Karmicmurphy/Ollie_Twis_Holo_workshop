(() => {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const canHear = Boolean(Rec);
  const canTalk = "speechSynthesis" in window;
  let on = false;
  let rec = null;
  let talking = false;
  let last = "";
  // Uses browser speech input and browser speech output.
  // Browser-only FRIDAY voice: pick a suitable installed English female voice.
  // No cloud requests, API keys, downloads, or auto-activation.
  const FEMALE_VOICE_NAMES = ["Jenny", "Aria", "Samantha", "Ava", "Sonia", "Zira", "Natasha", "Emma", "Susan", "Female"];
  function fridayVoice() {
    if (!canTalk) return null;
    const voices = speechSynthesis.getVoices();
    const english = voices.filter(v => /^en([_-]|$)/i.test(v.lang || ""));
    return english.find(v => FEMALE_VOICE_NAMES.some(name => v.name.toLowerCase().includes(name.toLowerCase())))
      || voices.find(v => FEMALE_VOICE_NAMES.some(name => v.name.toLowerCase().includes(name.toLowerCase())))
      || english[0] || voices[0] || null;
  }

  const $ = (s, root = document) => root.querySelector(s);

  function status(text) {
    for (const selector of ["#voiceLoopStatus", "#fridayHomeVoiceStatus"]) {
      const target = $(selector);
      if (target) target.textContent = text;
    }
    for (const selector of ["#fridayHomeTalk", "#fridayTalkToggle"]) {
      const button = $(selector);
      if (button) {
        button.textContent = on ? "Stop FRIDAY" : "Talk to FRIDAY";
        button.setAttribute("aria-pressed", String(on));
      }
    }
  }

  function panel() {
    if (!canHear) status("Voice input unavailable in this browser; Read last reply may still work.");
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
    if (!canTalk || !text || (on && text === last)) return;
    last = text;
    talking = true;
    stopListen();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
    const selectedVoice = fridayVoice();
    if (selectedVoice) u.voice = selectedVoice;
    u.rate = 0.96;
    u.pitch = 1.0;
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
    if (!canHear) { status("Voice input unavailable; Read last reply may still work."); return; }
    on = !on;
    if (on) {
      const talk = document.querySelector('nav [data-room="talk"]');
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

  function readLastReply() {
    if (!canTalk) { status("Text-to-speech unavailable in this browser."); return; }
    const messages = $("#messages");
    const replies = messages ? Array.from(messages.querySelectorAll(".message.assistant")) : [];
    const latest = replies[replies.length - 1];
    if (!latest || !latest.textContent.trim()) { status("No FRIDAY reply to read yet."); return; }
    last = "";
    say(latest.textContent.trim());
  }

  function boot() {
    panel();
    watch();
    $("#fridayHomeTalk")?.addEventListener("click", toggle);
    $("#fridayTalkToggle")?.addEventListener("click", toggle);
    $("#fridayReadReply")?.addEventListener("click", readLastReply);
    status(canHear ? "Voice is off. Tap Talk to FRIDAY." : "Voice input unavailable; Read last reply may still work.");
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
