(() => {
  "use strict";
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const $ = id => document.getElementById(id);
  let recognition = null, live = false, speaking = false, generation = 0;
  let lastReply = "";
  const status = message => {
    if ($("fridayVoiceStatus")) $("fridayVoiceStatus").textContent = message;
    if ($("fridayPushTalk")) $("fridayPushTalk").setAttribute("aria-pressed", String(Boolean(recognition && !live)));
    if ($("fridayLiveVoice")) $("fridayLiveVoice").setAttribute("aria-pressed", String(live));
  };
  function stop() {
    generation++;
    live = false;
    speaking = false;
    const r = recognition; recognition = null;
    if (r) { r.onend = null; try { r.abort(); } catch {} }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    status("Voice stopped.");
  }
  function start(continuous) {
    stop();
    if (!Rec) { status("This browser does not support speech recognition. Try Chrome on Android."); return; }
    if (!window.isSecureContext) { status("Microphone requires HTTPS."); return; }
    live = continuous;
    const session = ++generation;
    status(continuous ? "Starting live voice…" : "Starting microphone…");
    // Explicit permission probe makes unsupported or blocked Android microphones visible.
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      status("Microphone API unavailable here. Open the Workshop directly in Chrome, not an in-app browser.");
      live = false;
      return;
    }
    navigator.mediaDevices.getUserMedia({audio:true}).then(stream => {
      stream.getTracks().forEach(track => track.stop());
      if (session === generation) listen(session);
    }).catch(error => {
      if (session !== generation) return;
      live = false;
      status("Microphone permission failed: " + (error.name || "unknown") + ". Allow microphone access in Chrome site settings.");
    });
  }
  function listen(session) {
    if (session !== generation || speaking) return;
    const r = new Rec();
    recognition = r;
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false;
    let heard = false, failed = false;
    r.onstart = () => status("Listening… speak now.");
    r.onresult = event => {
      if (session !== generation) return;
      const transcript = Array.from(event.results).map(item => item[0].transcript).join(" ").trim();
      if (!transcript) return;
      heard = true;
      if (live) {
        const input = $("chatInput"), form = $("chatForm");
        if (input && form) {
          document.querySelector('[data-room="talk"]')?.click();
          input.value = transcript;
          form.dispatchEvent(new Event("submit", {bubbles:true,cancelable:true}));
          status("Heard: " + transcript + " — waiting for reply.");
        }
      } else {
        const input = $("openDoorInput");
        if (input) { input.value = transcript; input.dispatchEvent(new Event("input",{bubbles:true})); }
        status("Heard: " + transcript + ". Review the text, then tap Start here.");
      }
    };
    r.onerror = event => {
      failed = true;
      if (session !== generation) return;
      live = false;
      status("Microphone: " + (event.error || "unavailable") + ". Check browser permission.");
    };
    r.onend = () => {
      if (recognition === r) recognition = null;
      if (session !== generation) return;
      if (!live && !heard && !failed) status("No speech heard. Tap Push to talk to try again.");
      // Live mode resumes after a spoken reply, or after a no-speech timeout.
      if (live && !heard && !failed && !speaking) setTimeout(() => listen(session), 900);
    };
    try { r.start(); } catch { live = false; recognition = null; status("Microphone could not start. Check permissions."); }
  }
  function boot() {
    $("fridayPushTalk")?.addEventListener("click", () => {
      if (recognition && !live) stop(); else start(false);
    });
    $("fridayLiveVoice")?.addEventListener("click", () => {
      if (live) stop(); else start(true);
    });
    $("fridayStopVoice")?.addEventListener("click", stop);
    $("fridayTestVoice")?.addEventListener("click", () => {
      if (!("speechSynthesis" in window)) { status("Speaker test unavailable in this browser."); return; }
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance("FRIDAY speaker test. If you hear this, sound is working.");
      u.onstart = () => status("Speaker test playing…");
      u.onend = () => status("Speaker test complete.");
      u.onerror = event => status("Speaker test failed: " + (event.error || "unknown"));
      speechSynthesis.speak(u);
      status("Speaker test requested. Check media volume.");
    });
    $("micBtn")?.addEventListener("click", () => {
      // Existing one-shot dictation remains available in the Talk room.
    });
    const messages = $("messages");
    if (messages && "MutationObserver" in window) {
      new MutationObserver(() => {
        if (!live || speaking || !("speechSynthesis" in window)) return;
        const replies = messages.querySelectorAll(".message.assistant");
        const reply = replies.length ? replies[replies.length-1].textContent.trim() : "";
        if (!reply || reply === lastReply) return;
        lastReply = reply;
        speaking = true;
        const session = generation;
        const r = recognition; recognition = null;
        if (r) { r.onend = null; try { r.abort(); } catch {} }
        const utterance = new SpeechSynthesisUtterance(reply.slice(0,4000));
        utterance.lang = "en-US";
        utterance.rate = 0.98;
        utterance.onend = utterance.onerror = () => {
          speaking = false;
          if (live && session === generation) setTimeout(() => listen(session), 600);
        };
        status("FRIDAY speaking…");
        speechSynthesis.speak(utterance);
      }).observe(messages, {childList:true,subtree:true});
    }
    status(!Rec ? "Speech recognition unavailable here. Open in Chrome on Android." : "Voice ready. Tap Push to talk or Start live voice.");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded",boot);
  else boot();
})();
