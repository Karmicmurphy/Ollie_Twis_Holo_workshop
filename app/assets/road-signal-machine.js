(() => {
  const STORE_KEY = "twisHolo.roadSignal.v1";
  const $ = (s, root = document) => root.querySelector(s);

  const pads = [
    ["Kick Mud", "kick in the mud", "deep house kick, muddy sub-bass, hard downbeat"],
    ["Four Hats", "four hats on the fence wire", "tight hi-hats, nervous rhythm, fence-wire tick"],
    ["Late Tom", "late tom rolling under the road", "tribal toms, late groove, body pulse"],
    ["Clap Crooked", "clap crooked off the porch", "crooked clap, rough backbeat, human timing"],
    ["Dirty Guitar", "guitar in the teeth", "dirty electric guitar, rust synth, hard bite"],
    ["Synth Growl", "synth growl under the hood", "guitar-synth growl, voltage, bad machine"],
    ["Banjo Wire", "banjo tick nervous like wire", "banjo ticks, fence wire, rust Americana"],
    ["Bass Duck", "bass ducks under the boot", "sidechained sub-bass, pressure, survival weight"],
    ["Static Blood", "static in the blood", "radio static, signal damage, AM dirt"],
    ["Scanner Cut", "scanner cuts the name in half", "scanner squelch, glitch cut, police-radio damage"],
    ["Scratch Label", "scratch the label off the file", "record scratch, interruption, classification failure"],
    ["Flanger Lie", "flanger the lie till it bends", "flanger, phaser, bent guitar, warped truth"],
    ["Beer Can", "beer before the sun", "can crack, rough morning truth, not cozy"],
    ["Dog Door", "dog at the door keeps time", "dog-at-door thump, real life callback"],
    ["AI Reply", "AI says classification missing", "sterile female AI countervoice, machine response"],
    ["Drop Gate", "drop the gate and let it move", "drop call, gate slam, final release"]
  ];

  const tracks = ["Kick Mud", "Four Hats", "Late Tom", "Banjo Wire", "Static Blood", "Dirty Guitar", "Synth Growl", "AI Reply"];

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || "{}"); }
    catch { return {}; }
  }

  function save(data) {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }

  function addStyles() {
    if ($("#roadSignalStyle")) return;
    const style = document.createElement("style");
    style.id = "roadSignalStyle";
    style.textContent = `
      .road-signal{margin-top:16px;border:1px solid #3a596f;border-radius:18px;padding:16px;background:linear-gradient(180deg,#101d29,#071018)}
      .road-signal h3{margin:.2rem 0}.road-signal .rs-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
      .road-signal .rs-pill{display:inline-block;border:1px solid #345166;border-radius:999px;padding:5px 9px;color:#9bb0c1;font-size:12px;margin:2px}
      .rs-pad-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:9px;margin:14px 0}
      .rs-pad{min-height:82px;border:1px solid #345166;border-radius:13px;background:#0a141d;color:#eff9ff;padding:10px;text-align:left}
      .rs-pad b{display:block;color:#62e8ff}.rs-pad small{display:block;color:#9bb0c1;margin-top:4px;line-height:1.25}
      .rs-pad:active,.rs-pad.hot{background:#17394a;border-color:#62e8ff;box-shadow:0 0 22px #62e8ff33}
      .rs-row{display:grid;grid-template-columns:92px repeat(16,28px);gap:5px;align-items:center;margin:6px 0;min-width:610px}
      .rs-seq-wrap{overflow:auto;border:1px solid #263f52;border-radius:12px;padding:10px;background:#071019}
      .rs-step{width:26px;height:26px;border:1px solid #2d4456;border-radius:7px;background:#05090e}
      .rs-step.on{background:#9d7dff;box-shadow:0 0 12px #9d7dff77}.rs-name{font-size:12px;color:#9bb0c1;white-space:nowrap}
      .rs-actions{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}.rs-actions button{border:1px solid #345166;border-radius:10px;background:#0a141d;color:#eff9ff;padding:9px 10px}
      .rs-output{min-height:170px;white-space:pre-wrap;font:14px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace}
      @media(max-width:780px){.rs-pad-grid{grid-template-columns:repeat(2,1fr)}.road-signal{padding:12px}.rs-row{grid-template-columns:78px repeat(16,24px);min-width:505px}.rs-step{width:22px;height:22px}.rs-actions{display:grid}.rs-actions button{width:100%}}
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
        if (name === "Static Blood") return [5,13].includes(i);
        if (name === "Dirty Guitar") return [0,8].includes(i);
        if (name === "Synth Growl") return [4,12].includes(i);
        if (name === "AI Reply") return [15].includes(i);
        return idx === 0 && i % 4 === 0;
      });
      return acc;
    }, {});
  }

  function state() {
    const s = load();
    if (!s.bpm) s.bpm = 130;
    if (!s.swing) s.swing = 12;
    if (!s.offsets) s.offsets = { "Kick Mud":0, "Four Hats":-4, "Late Tom":7, "Banjo Wire":-6, "Static Blood":11, "Dirty Guitar":0, "Synth Growl":4, "AI Reply":15 };
    if (!s.activePads) s.activePads = [];
    if (!s.pattern) s.pattern = defaultPattern();
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
    const base = [48,64,78,93,110,130,155,185,210,240,260,310,380,430,520,92][padIndex] || 160;
    osc.type = padIndex % 3 === 0 ? "sine" : padIndex % 3 === 1 ? "square" : "sawtooth";
    osc.frequency.setValueAtTime(base, now);
    if (padIndex === 0 || padIndex === 7) osc.frequency.exponentialRampToValueAtTime(Math.max(35, base * .45), now + .16);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(padIndex > 7 ? 1800 : 900, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(filter); filter.connect(gain); gain.connect(audio.destination);
    osc.start(now); osc.stop(now + 0.24);
  }

  function buildLyric(s) {
    const selected = (s.activePads.length ? s.activePads : ["Beer Can","Dog Door","Four Hats","Kick Mud","Static Blood","Dirty Guitar","AI Reply","Drop Gate"]);
    const lines = selected.map(name => pads.find(p => p[0] === name)?.[1]).filter(Boolean);
    return [...lines, "", "AI: Morning condition abnormal.", "Human: No. Morning condition honest."].join("\n");
  }

  function buildPrompt(s) {
    const selected = (s.activePads.length ? s.activePads : pads.map(p => p[0]));
    const tags = selected.map(name => pads.find(p => p[0] === name)?.[2]).filter(Boolean).join("; ");
    return `ROAD-SIGNAL MACHINE - BEER BEFORE THE SUN KIT\nTempo: ${s.bpm} BPM, fast spoken-word rap over tribal/deep house.\nVocal: older gravelly male voice in his 50s, rapid-fire, not pop singing. Add sterile female AI countervoice.\nSound: dirty electric guitar, guitar-synth growl, banjo ticks like fence wire, sidechained sub-bass, radio static, glitch cuts, flanger, phaser, delay tails.\nRules: no coffee, no polished Nashville, no generic EDM gloss, no slow funeral tempo.\nActive pad language: ${selected.join(", ")}\nProduction tags: ${tags}\n\nLyrics:\n${buildLyric(s)}`;
  }

  function renderOutput(box) {
    const s = state();
    const out = $("#rsOutput", box);
    if (out) out.value = buildPrompt(s);
  }

  function renderSequencer(box) {
    const s = state();
    const wrap = $("#rsSeq", box);
    if (!wrap) return;
    wrap.innerHTML = tracks.map(track => `<div class="rs-row"><div class="rs-name">${track}</div>${s.pattern[track].map((on, i) => `<button class="rs-step ${on ? "on" : ""}" data-rs-track="${track}" data-rs-step="${i}" title="${track} step ${i+1}"></button>`).join("")}</div>`).join("");
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

  function render() {
    const panel = document.querySelector('[data-panel="music"]');
    if (!panel || $("#roadSignalMachine")) return;
    addStyles();
    const s = state();
    const box = document.createElement("section");
    box.id = "roadSignalMachine";
    box.className = "road-signal";
    box.innerHTML = `
      <div class="rs-top"><div><p class="eyebrow">Road-Signal Machine</p><h3>Beer Before the Sun Kit</h3><p class="muted">Pads are sound, lyric command, emotional meaning, and prompt fragment.</p></div><div><span class="rs-pill">130 BPM default</span><span class="rs-pill">16 pads</span><span class="rs-pill">8 tracks</span><span class="rs-pill">phone-friendly</span></div></div>
      <div class="rs-actions"><label>BPM<input id="rsBpm" type="number" min="90" max="160" value="${s.bpm}"></label><label>Swing %<input id="rsSwing" type="number" min="0" max="40" value="${s.swing}"></label></div>
      <div class="rs-pad-grid">${pads.map((p, i) => `<button class="rs-pad" data-rs-pad="${i}"><b>${p[0]}</b><small>${p[1]}</small></button>`).join("")}</div>
      <h3>16-step road loop</h3><div id="rsSeq" class="rs-seq-wrap"></div>
      <div class="rs-actions"><button id="rsBuildLyric">Build lyric block</button><button id="rsBuildPrompt">Build full prompt</button><button id="rsCopyPrompt">Copy prompt</button><button id="rsReset">Reset kit</button></div>
      <textarea id="rsOutput" class="rs-output" spellcheck="false"></textarea>
    `;
    panel.appendChild(box);

    $("#rsBpm", box).oninput = e => { const n = state(); n.bpm = Number(e.target.value || 130); save(n); renderOutput(box); };
    $("#rsSwing", box).oninput = e => { const n = state(); n.swing = Number(e.target.value || 0); save(n); renderOutput(box); };
    box.querySelectorAll("[data-rs-pad]").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.dataset.rsPad);
        const name = pads[idx][0];
        const n = state();
        n.activePads = n.activePads.includes(name) ? n.activePads.filter(x => x !== name) : [...n.activePads, name];
        save(n);
        btn.classList.toggle("hot", n.activePads.includes(name));
        beep(idx);
        renderOutput(box);
      };
    });
    $("#rsBuildLyric", box).onclick = () => { $("#rsOutput", box).value = buildLyric(state()); };
    $("#rsBuildPrompt", box).onclick = () => renderOutput(box);
    $("#rsCopyPrompt", box).onclick = async () => { const v = $("#rsOutput", box).value; try { await navigator.clipboard.writeText(v); } catch {} };
    $("#rsReset", box).onclick = () => { localStorage.removeItem(STORE_KEY); box.remove(); render(); };
    renderSequencer(box);
    renderOutput(box);
  }

  function boot() {
    render();
    document.addEventListener("click", e => { if (e.target?.dataset?.room === "music") setTimeout(render, 60); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
