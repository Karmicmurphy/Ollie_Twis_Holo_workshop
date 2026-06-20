(() => {
  const STORE_KEY = "twisHolo.roadSignal.v3";
  const OLD_KEYS = ["twisHolo.roadSignal.v21", "twisHolo.roadSignal.v2", "twisHolo.roadSignal.v1"];
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

  const mechanismPresets = {
    "Dirty Fast Road Groove": { gearSize: 7, gearSpeed: 8, rhythmDensity: 7, tension: 7, sectionEnergy: 8, leadEngine: "Guitar-Synth Motor", supportEngine: "Off-Time Tribal Engine", accentEngine: "Radio-Rhythm Engine" },
    "Tribal Glitch Rock": { gearSize: 8, gearSpeed: 9, rhythmDensity: 8, tension: 8, sectionEnergy: 9, leadEngine: "Guitar-Synth Motor", supportEngine: "Polyrhythm / Off-Time Tribal", accentEngine: "Stutter-Grid Engine" },
    "Ghost Radio Damage": { gearSize: 5, gearSpeed: 6, rhythmDensity: 5, tension: 9, sectionEnergy: 6, leadEngine: "Radio-Rhythm Engine", supportEngine: "Gravel-Grain Engine", accentEngine: "FX-Mutation Engine" },
    "Hard Bass Audit": { gearSize: 9, gearSpeed: 8, rhythmDensity: 6, tension: 8, sectionEnergy: 9, leadEngine: "Negative-Space Drop", supportEngine: "Dynamic Dirt Automation", accentEngine: "Resample-Abuse Engine" }
  };

  const femaleVoiceModes = {
    "human_signal_reality": "Grounded woman, sarcastic and sharp. Calls out bullshit without becoming clutter.",
    "sarcastic_bartender": "Funny, unimpressed, barroom wise. Cuts in with short reality-check lines.",
    "hostile_ai_auditor": "Cold, sterile, machine-like, corrective. Uses procedural failure language as rhythm debris.",
    "ghost_radio_woman": "Haunting, distant, memory voice. Appears through static and leaves before she explains herself.",
    "backseat_conscience": "Shit-talking inner voice, funny and irritated. Pushes the male voice back onto the road."
  };

  const femaleResponses = {
    human_signal_reality: ["Small world, big tab.", "That is not a plan, Randy.", "Tell the truth and keep moving.", "You call that fixed?"],
    sarcastic_bartender: ["Put it on the tab.", "Sure, hero. One more miracle.", "I have heard cleaner lies from jukeboxes.", "Bad road, worse excuse."],
    hostile_ai_auditor: ["Incorrect.", "Noncompliant.", "Classification failed. Again.", "Human mess detected.", "Resolution rejected."],
    ghost_radio_woman: ["You still hear the room.", "Static remembers.", "Come back through the wire.", "The weather kept your name."],
    backseat_conscience: ["Eyes up, genius.", "Quit arguing with the dashboard.", "That was almost a thought.", "Drive it or bury it."]
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
    mechanismPreset: "Tribal Glitch Rock",
    femaleVoiceMode: "hostile_ai_auditor",
    gearSize: 8,
    gearSpeed: 9,
    rhythmDensity: 8,
    tension: 8,
    sectionEnergy: 9,
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
  function py(v) { return JSON.stringify(v).replace(/true/g, "True").replace(/false/g, "False").replace(/null/g, "None"); }

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
      .rs-output{min-height:300px;white-space:pre-wrap;font:14px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace}.rs-note{border-left:3px solid #62e8ff;padding-left:10px;color:#9bb0c1}
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
    if (!s.bpm) s.bpm = 132;
    if (!s.key) s.key = "D minor";
    if (!s.swing) s.swing = 12;
    if (!s.coreObject) s.coreObject = "beer can sunrise / dog by the threshold / room comes back";
    if (!s.leadEngine) s.leadEngine = "Guitar-Synth Motor";
    if (!s.supportEngine) s.supportEngine = "Off-Time Tribal Engine";
    if (!s.accentEngine) s.accentEngine = "Radio-Rhythm Engine";
    if (!s.aiBehavior) s.aiBehavior = "Hostile Audit Machine";
    if (!s.dropBehavior) s.dropBehavior = "AI Insult To Door-Kick Bass";
    if (!s.mechanismPreset) s.mechanismPreset = "Dirty Fast Road Groove";
    if (!s.femaleVoiceMode) s.femaleVoiceMode = "hostile_ai_auditor";
    if (!s.gearSize) s.gearSize = 7;
    if (!s.gearSpeed) s.gearSpeed = 8;
    if (!s.rhythmDensity) s.rhythmDensity = 7;
    if (!s.tension) s.tension = 7;
    if (!s.sectionEnergy) s.sectionEnergy = 8;
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

  function timingFeel(s) {
    const swingNudge = Math.round(Number(s.swing || 0) / 2);
    return {
      kick_ms: 0,
      hats_ms: -8,
      tribal_toms_ms: 16 + swingNudge,
      clap_ms: 22 + swingNudge,
      banjo_ms: -12,
      static_ms: 40,
      meaning: "bad alignment but still running fast"
    };
  }

  function stepNumbers(pattern) {
    return Object.fromEntries(Object.entries(pattern || {}).map(([name, row]) => [name, row.map((on, i) => on ? i + 1 : null).filter(Boolean)]));
  }

  function compilerLines(s) {
    const names = selectedPads(s);
    const responses = femaleResponses[s.femaleVoiceMode] || femaleResponses.hostile_ai_auditor;
    const base = [
      "Dog by the threshold while the bass counts debt.",
      "Beer can sunrise, bad road heartbeat in the chest.",
      "Wire in the lungs and the hats run early.",
      "Guitar chewing sparks where the truth got flanged.",
      "Static in the ceiling says the room came back."
    ];
    return base.map((line, i) => ({
      voice: i === 3 ? "male_gravel_rapid_fire_rap" : "male_gravel_spoken_rap",
      lyric: line,
      active_gears: names.slice(i, i + 4).concat(names.slice(0, Math.max(0, i + 4 - names.length))),
      bar: i + 1,
      beat_start: i % 2 === 0 ? 1 : 3,
      beat_length: i === 4 ? 4 : 2,
      rhythm_density: Number(s.rhythmDensity || 7),
      tension: Math.min(10, Number(s.tension || 7) + (i > 2 ? 1 : 0)),
      section_energy: Number(s.sectionEnergy || 8),
      timing_feel: timingFeel(s),
      fx_event: i === 0 ? "dog-door thump tucked before beat 1" : i === 1 ? "sub-bass ducks under 'sunrise'" : i === 2 ? "hats rush ahead while toms drag late" : i === 3 ? "flanger bends the word 'truth'" : "radio static slices after 'back'",
      female_response: responses[i % responses.length]
    }));
  }

  function buildLyric(s) {
    const lines = compilerLines(s).map(line => line.lyric);
    return [...lines, "", `Female (${s.femaleVoiceMode}): ${(femaleResponses[s.femaleVoiceMode] || ["Incorrect."])[0]}`, "Human: Good. Means it still moves."].join("\n");
  }

  function buildFusedLinePrompt(s) {
    const names = selectedPads(s);
    return `ROAD-SIGNAL FUSED-LINE PROMPT

Turn each lyric line into a clockwork song object. Do not write flat lyrics first. Fuse voice, bar timing, active gears, timing feel, FX event, and female response line by line.

Identity: older gravelly male rapid-fire spoken-word rap; no coffee; beer, road, dog, truck, wire, static, busted machines, human truth.
Tempo/key: ${s.bpm} BPM, ${s.key}, 4/4 deep house drive.
Mechanism: ${s.mechanismPreset}; gear size ${s.gearSize}/10; gear speed ${s.gearSpeed}/10; rhythm density ${s.rhythmDensity}/10; tension ${s.tension}/10; section energy ${s.sectionEnergy}/10.
Female voice mode: ${s.femaleVoiceMode} — ${femaleVoiceModes[s.femaleVoiceMode] || s.femaleVoiceMode}. Use her like a character, not clutter.
Active gears: ${names.join(", ")}.
Timing feel: kick 0ms, hats -8ms, tribal toms ${timingFeel(s).tribal_toms_ms}ms, clap ${timingFeel(s).clap_ms}ms, banjo -12ms, static 40ms.

Lyric block to fuse:
${buildLyric(s)}

Output exactly 5-8 SongLine(...) objects plus a compact arrangement note. Success test: dirty fast groove, human voltage, controlled glitch damage, grounded/hostile female cut-ins, beer-soaked truth, hard bass/guitar-synth engine.`;
  }

  function buildCodePacket(s) {
    const secondsPerBeat = 60 / Number(s.bpm || 132);
    const barLength = secondsPerBeat * 4;
    const halfBar = barLength / 2;
    const sixteenth = secondsPerBeat / 4;
    const names = selectedPads(s);
    const lines = compilerLines(s);
    const packetLines = lines.map(line => `    SongLine(\n      voice=${py(line.voice)},\n      lyric=${py(line.lyric)},\n      active_gears=${py(line.active_gears)},\n      bar=${line.bar},\n      beat_start=${line.beat_start},\n      beat_length=${line.beat_length},\n      rhythm_density=${line.rhythm_density},\n      tension=${line.tension},\n      section_energy=${line.section_energy},\n      timing_feel=${py(line.timing_feel)},\n      fx_event=${py(line.fx_event)},\n      female_response=${py(line.female_response)},\n    )`).join(",\n");
    return `# ROAD-SIGNAL MACHINE v3 — CODE-SHAPED FUSED PACKET
# Engine first. Lyrics second. This is a producer/compiler packet, not a DAW file.

from road_signal import RoadSignalSong, SongLine, Gear, TimingMap

song = RoadSignalSong(
  title="untitled_road_signal_build",
  identity="older_deep_gravel_male_rapid_fire_spoken_rap",
  lyrical_center=${py(s.coreObject)},
  tempo_bpm=${Number(s.bpm || 132)},
  key=${py(s.key)},
  meter="4/4",
  mechanism_preset=${py(s.mechanismPreset)},
  lead_engine=${py(s.leadEngine)},
  support_engine=${py(s.supportEngine)},
  accent_engine=${py(s.accentEngine)},
  ai_behavior=${py(s.aiBehavior)},
  drop_behavior=${py(s.dropBehavior)},
  female_voice_mode=${py(s.femaleVoiceMode)},
  compiler_math={
    "seconds_per_beat": ${secondsPerBeat.toFixed(4)},
    "bar_length_seconds": ${barLength.toFixed(4)},
    "half_bar_seconds": ${halfBar.toFixed(4)},
    "sixteenth_seconds": ${sixteenth.toFixed(4)},
    "gear_size": ${Number(s.gearSize || 7)},
    "gear_speed": ${Number(s.gearSpeed || 8)},
    "rhythm_density": ${Number(s.rhythmDensity || 7)},
    "tension": ${Number(s.tension || 7)},
    "section_energy": ${Number(s.sectionEnergy || 8)},
  },
  timing=TimingMap(
    kick_ms=0,
    hats_ms=-8,
    tribal_toms_ms=${timingFeel(s).tribal_toms_ms},
    clap_ms=${timingFeel(s).clap_ms},
    banjo_ms=-12,
    static_ms=40,
    meaning="bad alignment but still running fast",
  ),
  active_gears=[
${names.map(name => {
  const pad = pads.find(p => p[0] === name) || [name, name, name, "Unknown"];
  return `    Gear(name=${py(pad[0])}, role=${py(pad[3])}, phrase=${py(pad[1])}, production=${py(pad[2])})`;
}).join(",\n")}
  ],
  step_loop=${py(stepNumbers(s.pattern))},
  lines=[
${packetLines}
  ],
)

producer_directive = """
Compile this as a dirty fast Road-Signal groove. Keep kick/sub stable. Let guitar-synth bite, tribal timing stagger, static damage answer the words, and female cut-ins act as character interruptions. Do not flatten into lyrics-only output. Do not add coffee. Do not turn this into clean EDM, pop singing, Nashville polish, or a generic prompt manual.
"""

success_test = "dirty fast groove + human voltage + controlled glitch damage + female reality/audit cut-ins + beer-road-dog-truck truth + hard bass/guitar-synth engine"
`;
  }

  function buildPrompt(s) {
    const names = selectedPads(s);
    const tags = names.map(name => pads.find(p => p[0] === name)?.[2]).filter(Boolean).join("; ");
    return `ROAD-SIGNAL MACHINE v3 - GEAR COMPILER PRODUCER PROMPT

STARTING FIELDS:
Lead engine: ${s.leadEngine}
Support engine: ${s.supportEngine}
Accent engine: ${s.accentEngine}
Mechanism preset: ${s.mechanismPreset}
Lyrical center: ${s.coreObject}
Female voice mode: ${s.femaleVoiceMode}
AI behavior: ${s.aiBehavior}
Drop behavior: ${s.dropBehavior}

COMPILER SETTINGS:
BPM/key: ${s.bpm} BPM, ${s.key}
Gear size: ${s.gearSize}/10
Gear speed: ${s.gearSpeed}/10
Rhythm density: ${s.rhythmDensity}/10
Tension: ${s.tension}/10
Section energy: ${s.sectionEnergy}/10
Timing feel: ${JSON.stringify(timingFeel(s))}

IDENTITY:
Randy / Ollie_Twis world. No coffee. Beer-before-sun honesty without turning it into cartoon debauchery. Dog at the door. Road, truck, mud, wire, static, bad machines. Older gravel male voice. Human against machine classification. Haunted underneath, moving hard on top. Fast, angry, funny at the edges, consequence-aware.

ENGINE MAP:
Lead: ${s.leadEngine}: ${engines[s.leadEngine] || s.leadEngine}
Support: ${s.supportEngine}: ${engines[s.supportEngine] || s.supportEngine}
Accent: ${s.accentEngine}: ${engines[s.accentEngine] || s.accentEngine}
Female voice: ${femaleVoiceModes[s.femaleVoiceMode] || s.femaleVoiceMode}
AI behavior: ${s.aiBehavior}: ${aiBehaviors[s.aiBehavior] || s.aiBehavior}
Drop behavior: ${s.dropBehavior}: ${dropBehaviors[s.dropBehavior] || s.dropBehavior}

PAD LANGUAGE:
${names.join(", ")}

PRODUCTION TAGS:
${tags}

FUSED-LINE COMPILER RULE:
Build the groove first. For every important lyric line, decide: bar, beat start, active gears, rhythm density, tension, FX event, and female response. Use roughly 60% real lyrics, 25% sound-command lyrics, 15% female/AI cut-ins. Use controlled glitch damage riding a strong groove.

FRESH PHRASE POOL:
${freshPhrases.join("; ")}

LYRIC BLOCK:
${buildLyric(s)}

CODE-SHAPED PACKET:
${buildCodePacket(s)}

AVOID:
No coffee. No pop singing. No slow funeral tempo. No clean sermon. No fake redemption arc. No polished Nashville. No generic EDM gloss. No young smooth male voice. No random novelty sample spam. No overstuffed chaos. No bracket-command manual disguised as a song. Controlled damage riding a strong groove.

SUCCESS TEST:
Does it feel like a dirty fast groove with human voltage, controlled glitch damage, hostile or grounded female cut-ins, beer-soaked truth, and a hard bass/guitar-synth engine?`;
  }

  function renderOutput(box) {
    const out = $("#rsOutput", box);
    if (out) out.value = buildCodePacket(state());
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

  function applyPreset(box) {
    const s = state();
    const preset = mechanismPresets[s.mechanismPreset];
    if (!preset) return;
    Object.assign(s, preset);
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
      <div class="rs-top"><div><p class="eyebrow">Road-Signal Machine v3</p><h3>Gear Compiler + Code Packet</h3><p class="muted">Engine first. Lyrics second. The compiler now fuses lines into Python-shaped song objects.</p></div><div><span class="rs-pill">gear compiler</span><span class="rs-pill">fused-line prompt</span><span class="rs-pill">code-shaped packet</span><span class="rs-pill">controlled damage</span></div></div>
      <p class="rs-note">v3 spine: mechanism preset + gear size/speed + timing feel + rhythm density + tension + section energy + female voice mode. This stays inside Music room and does not become a DAW.</p>
      <div class="rs-engine-grid">
        <label>BPM<input id="rsBpm" type="number" min="90" max="160" value="${s.bpm}"></label>
        <label>Key<input id="rsKey" value="${esc(s.key)}"></label>
        <label>Lyrical center<input id="rsObject" value="${esc(s.coreObject)}"></label>
        <label>Swing %<input id="rsSwing" type="number" min="0" max="40" value="${s.swing}"></label>
        <label>Mechanism preset<select id="rsPreset">${optionHtml(mechanismPresets, s.mechanismPreset)}</select></label>
        <label>Female voice mode<select id="rsFemaleMode">${optionHtml(femaleVoiceModes, s.femaleVoiceMode)}</select></label>
        <label>Gear size<input id="rsGearSize" type="number" min="1" max="10" value="${s.gearSize}"></label>
        <label>Gear speed<input id="rsGearSpeed" type="number" min="1" max="10" value="${s.gearSpeed}"></label>
        <label>Rhythm density<input id="rsRhythmDensity" type="number" min="1" max="10" value="${s.rhythmDensity}"></label>
        <label>Tension<input id="rsTension" type="number" min="1" max="10" value="${s.tension}"></label>
        <label>Section energy<input id="rsSectionEnergy" type="number" min="1" max="10" value="${s.sectionEnergy}"></label>
        <label>Lead engine<select id="rsLead">${optionHtml(engines, s.leadEngine)}</select></label>
        <label>Support engine<select id="rsSupport">${optionHtml(engines, s.supportEngine)}</select></label>
        <label>Accent engine<select id="rsAccent">${optionHtml(engines, s.accentEngine)}</select></label>
        <label>AI behavior<select id="rsAiBehavior">${optionHtml(aiBehaviors, s.aiBehavior)}</select></label>
        <label>Drop behavior<select id="rsDropBehavior">${optionHtml(dropBehaviors, s.dropBehavior)}</select></label>
      </div>
      ${groupedPads()}
      <h3>16-step road loop</h3><div id="rsSeq" class="rs-seq-wrap"></div>
      <div class="rs-actions"><button id="rsProof" class="primaryish">Load proof: Room Comes Back</button><button id="rsApplyPreset">Apply preset gears</button><button id="rsBuildPacket" class="primaryish">Build code-shaped fused packet</button><button id="rsBuildLinePrompt">Build fused-line prompt</button><button id="rsBuildPrompt">Build full Producer AI prompt</button><button id="rsBuildLyric">Build lyric block</button><button id="rsCopyPrompt">Copy output</button><button id="rsReset">Reset kit</button></div>
      <textarea id="rsOutput" class="rs-output" spellcheck="false"></textarea>
    `;
    panel.appendChild(box);

    const bindField = (id, prop, cast = v => v) => { $(id, box).oninput = e => { const n = state(); n[prop] = cast(e.target.value); save(n); renderOutput(box); }; $(id, box).onchange = $(id, box).oninput; };
    bindField("#rsBpm", "bpm", v => Number(v || 132));
    bindField("#rsKey", "key");
    bindField("#rsObject", "coreObject");
    bindField("#rsSwing", "swing", v => Number(v || 0));
    bindField("#rsPreset", "mechanismPreset");
    bindField("#rsFemaleMode", "femaleVoiceMode");
    bindField("#rsGearSize", "gearSize", v => Number(v || 1));
    bindField("#rsGearSpeed", "gearSpeed", v => Number(v || 1));
    bindField("#rsRhythmDensity", "rhythmDensity", v => Number(v || 1));
    bindField("#rsTension", "tension", v => Number(v || 1));
    bindField("#rsSectionEnergy", "sectionEnergy", v => Number(v || 1));
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
    $("#rsApplyPreset", box).onclick = () => applyPreset(box);
    $("#rsBuildPacket", box).onclick = () => { $("#rsOutput", box).value = buildCodePacket(state()); };
    $("#rsBuildLinePrompt", box).onclick = () => { $("#rsOutput", box).value = buildFusedLinePrompt(state()); };
    $("#rsBuildLyric", box).onclick = () => { $("#rsOutput", box).value = buildLyric(state()); };
    $("#rsBuildPrompt", box).onclick = () => { $("#rsOutput", box).value = buildPrompt(state()); };
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
