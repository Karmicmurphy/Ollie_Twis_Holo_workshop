(() => {
  const STORE_KEY = "twisHolo.roadSignal.v21";
  const OLD_KEYS = ["twisHolo.roadSignal.v2", "twisHolo.roadSignal.v1"];
  const $ = (s, root = document) => root.querySelector(s);

  const pads = [
    ["Kick Mud", "kick in the mud", "deep house kick, muddy sub-bass, hard downbeat", "Drum/Timing"],
    ["Four Hats", "four hats on the fence wire", "tight hi-hats, nervous rhythm, fence-wire tick", "Drum/Timing"],
    ["Late Tom", "late tom rolling under the road", "tribal toms, late groove, body pulse", "Drum/Timing"],
    ["Clap Crooked", "clap crooked off the porch", "crooked clap, rough backbeat, human timing", "Drum/Timing"],
    ["Stutter Grid", "stutter the grid till it bites", "1/16 and 1/32 buffer stutters, snare cuts, gated vocal grains", "Glitch"],
    ["Static Cut", "static cuts the room in half", "radio-static slices, rhythmic AM dirt, signal interruption", "Glitch"],
    ["Scanner Drop", "scanner drops the name", "scanner squelch, broken transmission, bitcrushed dropouts", "Glitch"],
    ["Scratch Before Drop", "scratch before the drop", "record scratch, pre-drop cut, hard interruption", "Glitch"],
    ["Dirty Guitar Bite", "guitar in the teeth", "dirty electric guitar, hard-rock pressure, rust bite", "Guitar/Synth"],
    ["Synth Growl", "synth growl under the hood", "analog synth growl, voltage, machine pressure", "Guitar/Synth"],
    ["Flanger Bend", "flanger the lie till it bends", "flanger, phaser, warped guitar/synth movement", "Guitar/Synth"],
    ["Bass Duck", "bass ducks under the boot", "sidechained sub-bass, pressure, survival weight", "Guitar/Synth"],
    ["Beer Can", "beer before the sun", "can crack, rough morning truth, not cozy", "Backroad"],
    ["Dog Door", "dog at the door keeps time", "dog-at-door thump, real life callback", "Backroad"],
    ["Banjo Wire", "banjo tick nervous like wire", "banjo ticks, fence wire, rust Americana", "Backroad"],
    ["Truck Idle", "truck idle under the porch light", "low idle rumble, worn engine, road pressure", "Backroad"],
    ["Gravel Line", "gravel line in the throat", "older gravel male spoken-word line, close mic, hard-lived voice", "AI/Voice"],
    ["AI Classification", "AI says classification missing", "sterile hostile AI countervoice, machine category failure", "AI/Voice"],
    ["Human Refusal", "human says good means it still moves", "human refusal, sarcastic counterline, survival signal", "AI/Voice"],
    ["Drop Command", "cut the room and drop it back", "negative-space command, half-bar cut, full slam back", "AI/Voice"]
  ];

  const engines = {
    "Guitar-Synth Motor": "Dirty electric guitar riff fused with analog synth growl. Guitar is anger. Synth is pressure. Together they sound like a machine with teeth.",
    "Off-Time Tribal Engine": "On-time kick, late tribal toms, crooked claps, ahead-of-beat hats, humanized staggered groove.",
    "Polyrhythm / Off-Time Tribal": "Deep house kick stays steady while tribal toms run a 3-pattern against the 4. Hi-hats stay fast and nervous.",
    "Radio-Rhythm Engine": "AM static, scanner squelch, broken transmission dropouts, frequency sweeps, and bitcrushed signal bursts locked to rhythm.",
    "Stutter-Grid Engine": "Chopped 1/16 and 1/32 repeats, buffer stutters, snare cuts, gated vocal grains, rhythmic glitch edits.",
    "Gravel-Grain Engine": "Tiny grains of dirty guitar, banjo, breath, static, bark, and vocal fragments swirl around the groove.",
    "Banjo-Wire Tension Engine": "Banjo ticks and fence-wire plucks become nervous percussion, not polished country.",
    "FX-Mutation Engine": "Flanger, phaser, delay throws, filter tunnels, distortion ramps, and tape drag become arrangement movement.",
    "Resample-Abuse Engine": "Print beer can cracks, guitar scrapes, radio static, dog barks, breath, and voice grains to audio, then chop them into percussion.",
    "Negative-Space Drop": "Before major drops, strip almost everything out for half a bar, leaving static or breath, then slam back with kick, sub, guitar, and synth.",
    "Instrument Handoff Engine": "Guitar asks, synth answers. Tom asks, static answers. Dog interrupts once. Kick replies.",
    "Dynamic Dirt Automation": "Distortion, filter, delay, flanger, and bitcrush rise and fall across sections instead of staying static.",
    "Velocity-Ghost Engine": "Ghost notes, muted hits, low-velocity percussion, humanized accents, and barely-there dirt keep the groove alive."
  };

  const aiBehaviors = {
    "Hostile Audit Machine": "Sterile but sarcastic compliance engine. Interrupts with Incorrect, Noncompliant, Classification failed again, Resolution rejected. Her phrases get chopped into rhythmic debris when challenged.",
    "Cold Classification Failure": "Calm AI voice tries to classify the human mess and keeps failing. Less sarcastic, more procedural and eerie.",
    "Interruptive Compliance Engine": "Short hostile interruptions become percussion: non-com-pli-ant, class-i-fi-ca-tion, un-re-solved, de-nied.",
    "Minimal Ghost AI": "Use only a few AI cut-ins, buried in static and bitcrush, as if the machine is losing signal."
  };

  const dropBehaviors = {
    "AI Insult To Door-Kick Bass": "AI insult, half-bar silence/static, male breath or shut up lady, then bass drop hits like a door kicked open.",
    "Negative-Space Slam": "Strip nearly everything out for half a bar before the drop, leave breath/static, then slam back with kick, sub, guitar-synth, and static.",
    "Instrument Handoff Drop": "Guitar asks, synth answers, tom asks, static answers, dog interrupts once, then kick and bass reply together.",
    "Noisy But Controlled Drop": "Use stutters, scanner cuts, tape drag, and radio bursts, but keep the kick/sub groove stable."
  };

  const freshPhrases = [
    "beer can sunrise", "dog by the threshold", "wire in the lungs", "sub-bass under the ribs", "guitar chewing sparks",
    "static in the ceiling", "bad road heartbeat", "machine dust", "rust in the timing", "flanger on the truth"
  ];

  const tracks = ["Kick Mud", "Four Hats", "Late Tom", "Banjo Wire", "Static Cut", "Dirty Guitar Bite", "Synth Growl", "AI Classification"];

  const proof = {
    bpm: 132,
    key: "D minor",
    object: "the room after the party, when reality comes back",
    lead: "Guitar-Synth Motor",
    support: "Polyrhythm / Off-Time Tribal",
    accent: "Resample-Abuse Engine",
    aiBehavior: "Hostile Audit Machine",
    dropBehavior: "AI Insult To Door-Kick Bass",
    pads: ["Beer Can", "Dog Door", "Four Hats", "Kick Mud", "Static Cut", "Dirty Guitar Bite", "Synth Growl", "AI Classification", "Drop Command"]
  };

  function load() {
    try {
      const current = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      if (Object.keys(current).length) return current;
      for (const key of OLD_KEYS) {
        const old = JSON.parse(localStorage.getItem(key) || "{}");
        if (Object.keys(old).length) return old;
      }
    } catch {}
    return {};
  }

  function save(data) { localStorage.setItem(STORE_KEY, JSON.stringify(data)); }
  function esc(v) { return String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m])); }

  function addStyles() {
    if ($("#roadSignalStyle")) return;
    const style = document.createElement("style");
    style.id = "roadSignalStyle";
    style.textContent = `
      .road-signal{margin-top:16px;border:1px solid #3a596f;border-radius:18px;padding:16px;background:linear-gradient(180deg,#101d29,#071018)}
      .road-signal h3{margin:.2rem 0}.road-signal .rs-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
      .road-signal .rs-pill{display:inline-block;border:1px solid #345166;border-radius:999px;padding:5px 9px;color:#9bb0c1;font-size:12px;margin:2px}
      .rs-engine-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:12px 0}.rs-engine-grid label{margin:0}
      .rs-pad-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:14px 0}.rs-bank{margin-top:12px}.rs-bank h4{margin:8px 0;color:#62e8ff}
      .rs-pad{min-height:82px;border:1px solid #345166;border-radius:13px;background:#0a141d;color:#eff9ff;padding:10px;text-align:left}
      .rs-pad b{display:block;color:#62e8ff}.rs-pad small{display:block;color:#9bb0c1;margin-top:4px;line-height:1.25}
      .rs-pad:active,.rs-pad.hot{background:#17394a;border-color:#62e8ff;box-shadow:0 0 22px #62e8ff33}
      .rs-row{display:grid;grid-template-columns:112px repeat(16,28px);gap:5px;align-items:center;margin:6px 0;min-width:650px}.rs-seq-wrap{overflow:auto;border:1px solid #263f52;border-radius:12px;padding:10px;background:#071019}
      .rs-step{width:26px;height:26px;border:1px solid #2d4456;border-radius:7px;background:#05090e}.rs-step.on{background:#9d7dff;box-shadow:0 0 12px #9d7dff77}.rs-name{font-size:12px;color:#9bb0c1;white-space:nowrap}
      .rs-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.rs-actions button{border:1px solid #345166;border-radius:10px;background:#0a141d;color:#eff9ff;padding:9px 10px}.rs-actions button.primaryish{border-color:#53d6ef;background:#12313f}
      .rs-output{min-height:260px;white-space:pre-wrap;font:14px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace}.rs-note{border-left:3px solid #62e8ff;padding-left:10px;color:#9bb0c1}
      @media(max-width:900px){.rs-engine-grid{grid-template-columns:1fr 1fr}.rs-pad-grid{grid-template-columns:repeat(2,1fr)}}
      @media(max-width:780px){.road-signal{padding:12px}.rs-row{grid-template-columns:92px repeat(16,24px);min-width:565px}.rs-step{width:22px;height:22px}.rs-actions{display:grid}.rs-actions button{width:100%}.rs-engine-grid{grid-template-columns:1fr}}
      @media(max-width:420px){.rs-pad-grid{grid-template-columns:1fr}.rs-pad{min-height:64px}}
    `;
    document.head.appendChild(style);
  }

  function defaultPattern() {
    return tracks.reduce((acc, name, idx) => {
      acc[name] = Array.from({ length: 16 }, (_, i) => {
        if (name === "Kick Mud") return [0,4,8,12].includes(i);
        if (name === "Four Hats") return i % 2 === 0;
        if (name === "Late Tom") return [3,7,11,15].includes(i);
        if (name === "Banjo Wire") return [2,6,10,14].includes(i);
        if (name === "Static Cut") return [5,13].includes(i);
        if (name === "Dirty Guitar Bite") return [0,8].includes(i);
        if (name === "Synth Growl") return [4,12].includes(i);
        if (name === "AI Classification") return [15].includes(i);
        return idx === 0 && i % 4 === 0;
      });
      return acc;
    }, {});
  }

  function state() {
    const s = load();
    if (!s.bpm) s.bpm = 130;
    if (!s.key) s.key = "D minor";
    if (!s.swing) s.swing = 12;
    if (!s.coreObject) s.coreObject = "beer can sunrise / dog by the threshold / room comes back";
    if (!s.leadEngine) s.leadEngine = "Guitar-Synth Motor";
    if (!s.supportEngine) s.supportEngine = "Off-Time Tribal Engine";
    if (!s.accentEngine) s.accentEngine = "Radio-Rhythm Engine";
    if (!s.aiBehavior) s.aiBehavior = "Hostile Audit Machine";
    if (!s.dropBehavior) s.dropBehavior = "AI Insult To Door-Kick Bass";
    if (!Array.isArray(s.activePads)) s.activePads = [];
    if (!s.pattern) s.pattern = defaultPattern();
    tracks.forEach(t => { if (!Array.isArray(s.pattern[t])) s.pattern[t] = defaultPattern()[t]; });
    return s;
  }

  let audio;
  function beep(padIndex) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    audio = audio || new AudioContext();
    audio.resume && audio.resume();
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    const filter = audio.createBiquadFilter();
    const base = [48,64,78,93,230,270,320,180,110,130,310,60,380,430,155,92,120,520,160,80][padIndex] || 160;
    osc.type = padIndex % 3 === 0 ? "sine" : padIndex % 3 === 1 ? "square" : "sawtooth";
    osc.frequency.setValueAtTime(base, now);
    if (padIndex === 0 || padIndex === 11 || padIndex === 19) osc.frequency.exponentialRampToValueAtTime(Math.max(35, base * .45), now + .16);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(padIndex >= 4 && padIndex <= 7 ? 2400 : 1000, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(filter); filter.connect(gain); gain.connect(audio.destination);
    osc.start(now); osc.stop(now + 0.24);
  }

  function selectedPads(s) {
    return s.activePads.length ? s.activePads : ["Beer Can","Dog Door","Four Hats","Kick Mud","Static Cut","Dirty Guitar Bite","Synth Growl","AI Classification","Drop Command"];
  }

  function buildLyric(s) {
    const lines = selectedPads(s).map(name => pads.find(p => p[0] === name)?.[1]).filter(Boolean);
    return [...lines, "", "AI: Noncompliant. Classification failed again.", "Human: Good. Means it still moves."].join("\n");
  }

  function buildPrompt(s) {
    const names = selectedPads(s);
    const tags = names.map(name => pads.find(p => p[0] === name)?.[2]).filter(Boolean).join("; ");
    return `ROAD-SIGNAL MACHINE v2.1 - DEBUG-STABLE EVOLUTIONARY PROMPT\n\nSTARTING FIELDS:\nLead engine: ${s.leadEngine}\nSupport engine: ${s.supportEngine}\nAccent engine: ${s.accentEngine}\nLyrical center: ${s.coreObject}\nAI behavior: ${s.aiBehavior}\nDrop behavior: ${s.dropBehavior}\n\nIDENTITY:\nRandy / Ollie_Twis world. No coffee. Beer-before-sun honesty without turning it into cartoon debauchery. Dog at the door. Road, truck, mud, wire, static, bad machines. Older gravel male voice. Human against machine classification. Haunted underneath, moving hard on top. Fast, angry, funny at the edges, consequence-aware.\n\nCORE OBJECT:\n${s.coreObject}\n\nTEMPO / KEY:\n${s.bpm} BPM, ${s.key}.\n\nLEAD INSTRUMENTAL ENGINE:\n${s.leadEngine}: ${engines[s.leadEngine] || s.leadEngine}\n\nSUPPORT ENGINE:\n${s.supportEngine}: ${engines[s.supportEngine] || s.supportEngine}\n\nACCENT ENGINE:\n${s.accentEngine}: ${engines[s.accentEngine] || s.accentEngine}\n\nAI VOICE BEHAVIOR:\n${s.aiBehavior}: ${aiBehaviors[s.aiBehavior] || s.aiBehavior}\n\nBASS / DROP BEHAVIOR:\n${s.dropBehavior}: ${dropBehaviors[s.dropBehavior] || s.dropBehavior}\n\nPAD LANGUAGE:\n${names.join(", ")}\n\nPRODUCTION TAGS:\n${tags}\n\nSECTION BEHAVIOR:\nBuild the groove first. Let lyrics name sounds while sounds answer, but do not make every line a production command. Use roughly 60% real lyrics, 25% sound-command lyrics, 15% AI cut-ins/glitch instructions. Use bracket commands mainly at intro, pre-chorus, drops, AI interruptions, and final build. Use instrument handoffs. Use controlled glitch damage riding a strong groove.\n\nFRESH PHRASE POOL:\n${freshPhrases.join("; ")}\n\nVOCAL:\nOlder gravelly male spoken-word rapper, 50s, cracked hard-lived voice, close-mic'd, fast-thinking, sarcastic, angry, funny at the edges. No pop singing. Secondary female AI voice is not soft or sexy; she is a smug hostile audit machine.\n\nLYRIC BLOCK:\n${buildLyric(s)}\n\nAVOID:\nNo coffee. No pop singing. No slow funeral tempo. No clean sermon. No fake redemption arc. No polished Nashville. No generic EDM gloss. No young smooth male voice. No random novelty sample spam. No overstuffed chaos. No random animal-sound takeover. No bracket-command manual disguised as a song. Controlled damage riding a strong groove.\n\nSUCCESS TEST:\nDoes it feel like a dirty fast groove with human voltage, controlled glitch damage, hostile AI cut-ins, beer-soaked truth, and a hard bass/guitar-synth engine?`;
  }

  function renderOutput(box) {
    const out = $("#rsOutput", box);
    if (out) out.value = buildPrompt(state());
  }

  function optionHtml(source, selected) {
    return Object.keys(source).map(name => `<option ${name === selected ? "selected" : ""}>${esc(name)}</option>`).join("");
  }

  function renderSequencer(box) {
    const s = state();
    const wrap = $("#rsSeq", box);
    if (!wrap) return;
    wrap.innerHTML = tracks.map(track => `<div class="rs-row"><div class="rs-name">${esc(track)}</div>${s.pattern[track].map((on, i) => `<button class="rs-step ${on ? "on" : ""}" data-rs-track="${esc(track)}" data-rs-step="${i}" title="${esc(track)} step ${i + 1}"></button>`).join("")}</div>`).join("");
    wrap.querySelectorAll("[data-rs-track]").forEach(btn => {
      btn.onclick = () => {
        const next = state();
        const t = btn.dataset.rsTrack;
        const i = Number(btn.dataset.rsStep);
        next.pattern[t][i] = !next.pattern[t][i];
        save(next);
        renderSequencer(box);
        renderOutput(box);
      };
    });
  }

  function groupedPads() {
    return ["Drum/Timing", "Glitch", "Guitar/Synth", "Backroad", "AI/Voice"].map(bank => {
      const bankPads = pads.map((p, i) => ({ p, i })).filter(x => x.p[3] === bank);
      return `<div class="rs-bank"><h4>${bank}</h4><div class="rs-pad-grid">${bankPads.map(({p, i}) => `<button class="rs-pad" data-rs-pad="${i}"><b>${esc(p[0])}</b><small>${esc(p[1])}</small></button>`).join("")}</div></div>`;
    }).join("");
  }

  function loadProof(box) {
    const s = state();
    Object.assign(s, proof);
    s.coreObject = proof.object;
    s.leadEngine = proof.lead;
    s.supportEngine = proof.support;
    s.accentEngine = proof.accent;
    s.activePads = proof.pads;
    save(s);
    box.remove();
    render(true);
  }

  function render(force = false) {
    const panel = document.querySelector('[data-panel="music"]');
    if (!panel) return;
    if ($("#roadSignalMachine") && !force) return;
    $("#roadSignalMachine")?.remove();
    addStyles();
    const s = state();
    const box = document.createElement("section");
    box.id = "roadSignalMachine";
    box.className = "road-signal";
    box.innerHTML = `
      <div class="rs-top"><div><p class="eyebrow">Road-Signal Machine v2.1</p><h3>Debug-Stable Evolution Kit</h3><p class="muted">Engine first. Lyrics second. Hostile AI and harder bass drops are now first-class controls.</p></div><div><span class="rs-pill">debug-stable</span><span class="rs-pill">hostile AI</span><span class="rs-pill">bass/drop controls</span><span class="rs-pill">controlled damage</span></div></div>
      <p class="rs-note">v2 debug fix: do not overdo grief, do not turn every lyric into a bracket command, make the AI voice more hostile, and make bass/drop behavior stronger by default.</p>
      <div class="rs-engine-grid">
        <label>BPM<input id="rsBpm" type="number" min="90" max="160" value="${s.bpm}"></label>
        <label>Key<input id="rsKey" value="${esc(s.key)}"></label>
        <label>Lyrical center<input id="rsObject" value="${esc(s.coreObject)}"></label>
        <label>Swing %<input id="rsSwing" type="number" min="0" max="40" value="${s.swing}"></label>
        <label>Lead engine<select id="rsLead">${optionHtml(engines, s.leadEngine)}</select></label>
        <label>Support engine<select id="rsSupport">${optionHtml(engines, s.supportEngine)}</select></label>
        <label>Accent engine<select id="rsAccent">${optionHtml(engines, s.accentEngine)}</select></label>
        <label>AI behavior<select id="rsAiBehavior">${optionHtml(aiBehaviors, s.aiBehavior)}</select></label>
        <label>Drop behavior<select id="rsDropBehavior">${optionHtml(dropBehaviors, s.dropBehavior)}</select></label>
      </div>
      ${groupedPads()}
      <h3>16-step road loop</h3><div id="rsSeq" class="rs-seq-wrap"></div>
      <div class="rs-actions"><button id="rsProof" class="primaryish">Load proof: Room Comes Back</button><button id="rsBuildLyric">Build lyric block</button><button id="rsBuildPrompt">Build full prompt</button><button id="rsCopyPrompt">Copy prompt</button><button id="rsReset">Reset kit</button></div>
      <textarea id="rsOutput" class="rs-output" spellcheck="false"></textarea>
    `;
    panel.appendChild(box);

    const bindField = (id, prop, cast = v => v) => { $(id, box).oninput = e => { const n = state(); n[prop] = cast(e.target.value); save(n); renderOutput(box); }; $(id, box).onchange = $(id, box).oninput; };
    bindField("#rsBpm", "bpm", v => Number(v || 130));
    bindField("#rsKey", "key");
    bindField("#rsObject", "coreObject");
    bindField("#rsSwing", "swing", v => Number(v || 0));
    bindField("#rsLead", "leadEngine");
    bindField("#rsSupport", "supportEngine");
    bindField("#rsAccent", "accentEngine");
    bindField("#rsAiBehavior", "aiBehavior");
    bindField("#rsDropBehavior", "dropBehavior");

    box.querySelectorAll("[data-rs-pad]").forEach(btn => {
      const idx = Number(btn.dataset.rsPad);
      const name = pads[idx][0];
      btn.classList.toggle("hot", s.activePads.includes(name));
      btn.onclick = () => {
        const n = state();
        n.activePads = n.activePads.includes(name) ? n.activePads.filter(x => x !== name) : [...n.activePads, name];
        save(n);
        btn.classList.toggle("hot", n.activePads.includes(name));
        beep(idx);
        renderOutput(box);
      };
    });

    $("#rsProof", box).onclick = () => loadProof(box);
    $("#rsBuildLyric", box).onclick = () => { $("#rsOutput", box).value = buildLyric(state()); };
    $("#rsBuildPrompt", box).onclick = () => renderOutput(box);
    $("#rsCopyPrompt", box).onclick = async () => { try { await navigator.clipboard.writeText($("#rsOutput", box).value); } catch {} };
    $("#rsReset", box).onclick = () => { localStorage.removeItem(STORE_KEY); OLD_KEYS.forEach(k => localStorage.removeItem(k)); box.remove(); render(true); };

    renderSequencer(box);
    renderOutput(box);
  }

  function boot() {
    render();
    document.addEventListener("click", e => { if (e.target?.dataset?.room === "music") setTimeout(() => render(), 60); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
