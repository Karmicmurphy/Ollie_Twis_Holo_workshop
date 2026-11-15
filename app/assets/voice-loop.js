(() => {
  "use strict";
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const synth = window.speechSynthesis;
  const $ = id => document.getElementById(id);
  const voiceKey = "twisHolo.voiceURI";
  let recognition, pending, timer, utterance, voicePicker;
  let generation = 0, mode = "";

  function status(message) {
    for (const id of ["fridayVoiceStatus", "fridayTalkVoiceStatus"]) {
      if ($(id)) $(id).textContent = message;
    }
    $("fridayPushTalk")?.setAttribute("aria-pressed", String(mode === "door"));
    $("fridayLiveVoice")?.setAttribute("aria-pressed", String(mode === "live"));
    $("micBtn")?.setAttribute("aria-pressed", String(mode === "talk"));
  }

  function stop(message = "Voice stopped.") {
    generation++;
    mode = "";
    clearTimeout(timer);
    pending?.abort();
    pending = undefined;
    const r = recognition;
    recognition = utterance = undefined;
    if (r) {
      r.onstart = r.onresult = r.onerror = r.onend = null;
      try { r.abort(); } catch {}
    }
    synth?.cancel();
    status(message);
  }

  function arm(session, delay, callback) {
    clearTimeout(timer);
    timer = setTimeout(() => { if (session === generation) callback(); }, delay);
  }

  function speak(text, session, test = false) {
    if (!synth || !window.SpeechSynthesisUtterance) {
      stop("Speech playback is unavailable in this browser.");
      return;
    }
    const u = new SpeechSynthesisUtterance(text.slice(0, 4000));
    utterance = u;
    const current = () => session === generation && utterance === u;
    const voice = synth.getVoices().find(item => item.voiceURI === voicePicker?.value);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || "en-US";
    u.onstart = () => {
      if (!current()) return;
      status(test ? "Speaker test playing..." : "FRIDAY speaking...");
      arm(session, 90000, () => stop("Speech playback timed out."));
    };
    u.onend = () => {
      if (!current()) return;
      utterance = undefined;
      clearTimeout(timer);
      if (test) stop("Speaker test finished. If silent, check your audio output.");
      else arm(session, 600, () => listen(session));
    };
    u.onerror = event => {
      if (current()) stop("Speech playback failed: " + (event.error || "unknown") + ". Try Test speaker.");
    };
    arm(session, 5000, () => stop("Playback did not start. Try Test speaker and check your audio output."));
    try { synth.speak(u); }
    catch { stop("Speech playback could not start."); }
  }

  async function reply(text, session) {
    const controller = new AbortController();
    pending = controller;
    status("Heard: " + text + " - waiting for FRIDAY.");
    arm(session, 25000, () => stop("The AI reply timed out. Voice stopped."));
    try {
      const answer = await window.workshopVoiceReply(text, controller.signal);
      if (session !== generation) return;
      pending = undefined;
      speak(answer, session);
    } catch (error) {
      if (session === generation) stop(error.message || "The AI reply failed.");
    }
  }

  function listen(session) {
    if (session !== generation) return;
    let r;
    try { r = new Rec(); }
    catch { stop("Speech recognition could not initialize."); return; }
    recognition = r;
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false;
    const current = () => session === generation && recognition === r;
    r.onstart = () => {
      if (!current()) return;
      status("Listening... speak now.");
      arm(session, 30000, () => stop("No speech result arrived. Start voice to try again."));
    };
    r.onresult = event => {
      if (!current()) return;
      const text = Array.from(event.results).filter(item => item.isFinal !== false)
        .map(item => item[0]?.transcript || "").join(" ").trim().slice(0, 2000);
      if (!text) return;
      recognition = undefined;
      clearTimeout(timer);
      try { r.abort(); } catch {}
      if (mode === "live") {
        void reply(text, session);
      } else {
        const input = $(mode === "talk" ? "chatInput" : "openDoorInput");
        if (!input) { stop("The Workshop text input is unavailable."); return; }
        input.value = mode === "talk" && input.value ? input.value + " " + text : text;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        stop("Speech added to the text box. Review it before submitting.");
      }
    };
    r.onerror = event => {
      if (!current()) return;
      const reason = {
        "not-allowed": "Microphone access was denied. Check browser and Windows microphone permissions.",
        "service-not-allowed": "This browser blocked the speech recognition service.",
        "audio-capture": "No available microphone. Check your input device.",
        network: "The browser speech recognition service could not connect.",
        "no-speech": "No speech heard. Start voice to try again.",
      }[event.error];
      stop(reason || "Speech recognition failed: " + (event.error || "unknown") + ".");
    };
    r.onend = () => { if (current()) stop("Recognition ended without speech. Start voice to try again."); };
    arm(session, 10000, () => stop("Microphone did not start. Check site permissions."));
    try { r.start(); }
    catch { stop("Microphone could not start. Check browser permissions."); }
  }

  function start(next) {
    if (mode === next) { stop(); return; }
    stop();
    if (!window.isSecureContext) { status("Microphone access requires HTTPS or localhost."); return; }
    if (!Rec) { status("Speech recognition is unavailable in this browser. You can still type."); return; }
    if (next === "live" && (!synth || typeof window.workshopVoiceReply !== "function")) {
      status("Live voice is unavailable. Use Push to talk or type.");
      return;
    }
    mode = next;
    status("Starting microphone...");
    // The recognition service owns the microphone permission prompt and capture.
    listen(generation);
  }

  function setupPicker() {
    if (!synth || !$("fridayVoiceStatus")) return;
    const label = document.createElement("label");
    label.textContent = "Reply voice ";
    voicePicker = document.createElement("select");
    voicePicker.id = "fridayVoiceChoice";
    label.append(voicePicker);
    $("fridayVoiceStatus").before(label);
    let saved = "";
    try { saved = localStorage.getItem(voiceKey) || ""; } catch {}
    const populate = () => {
      voicePicker.replaceChildren(new Option("System default", ""));
      for (const v of synth.getVoices()) voicePicker.add(new Option(v.name + " (" + v.lang + ")", v.voiceURI));
      voicePicker.value = Array.from(voicePicker.options).some(o => o.value === saved) ? saved : "";
    };
    voicePicker.onchange = () => {
      saved = voicePicker.value;
      try { localStorage.setItem(voiceKey, saved); } catch {}
    };
    synth.addEventListener?.("voiceschanged", populate);
    populate();
  }

  function boot() {
    $("fridayPushTalk")?.addEventListener("click", () => start("door"));
    $("fridayLiveVoice")?.addEventListener("click", () => start("live"));
    $("fridayStopVoice")?.addEventListener("click", () => stop());
    if ($("micBtn")) {
      $("micBtn").onclick = () => start("talk");
      const hint = document.createElement("p");
      hint.id = "fridayTalkVoiceStatus";
      hint.setAttribute("role", "status");
      hint.className = "muted";
      $("micBtn").closest(".toolbar")?.after(hint);
    }
    $("fridayTestVoice")?.addEventListener("click", () => {
      stop();
      mode = "test";
      status("Starting speaker test...");
      speak("FRIDAY speaker test. If you hear this, sound is working.", generation, true);
    });
    setupPicker();
    document.addEventListener("click", e => {
      if (mode && e.target.closest?.("[data-room]")) stop();
    }, true);
    document.addEventListener("visibilitychange", () => { if (mode && document.hidden) stop(); });
    window.addEventListener("pagehide", () => { if (mode) stop(); });
    status(Rec ? "Browser voice ready." : "Speech recognition unavailable. You can still type.");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
