(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
let installed=false,selectedPad=0;
const deck=()=>window.TWIS_LOOP_DECK, st=()=>deck()?.state;
const PRESETS=[
 ['KICKS','DEEP KICK','kickDeep'],['KICKS','808 KICK','kick808'],['KICKS','TIGHT KICK','kickTight'],
 ['DRUMS','FAT SNARE','snareFat'],['DRUMS','CLAP STACK','clap'],['DRUMS','CLOSED HAT','hatClosed'],['DRUMS','OPEN HAT','hatOpen'],['DRUMS','LOW TOM','tomLow'],
 ['BASS','SUB BASS','sub'],['BASS','DIRTY BASS','bassDirty'],['BASS','PLUCK BASS','bassPluck'],
 ['SYNTH','WARM SYNTH','synthWarm'],['SYNTH','BRIGHT SYNTH','synthBright'],['SYNTH','DARK PAD','synthPad'],['SYNTH','LEAD','lead'],
 ['KEYS','SOFT KEYS','keys'],['KEYS','BELL','bell'],
 ['STRINGS','VIOLIN BOW','violin'],['STRINGS','CELLO LOW','cello'],
 ['GUITAR','CLEAN GUITAR','guitarClean'],['GUITAR','DIRTY GUITAR','guitarDirty'],['GUITAR','MUTED PICK','guitarMuted'],
 ['FX','RISE','rise'],['FX','NOISE HIT','noiseHit']
];
function status(t){const e=q('#ldStatus');if(e)e.textContent=t;}
function ctx(){return st()?.ctx||null;}
function ensureCtx(){const s=st();if(!s?.ctx){status('Tap PLAY once to wake audio, then open SOUND RACK again.');return null}return s.ctx;}
function env(i,n,a,d,sus,r){const t=i/n;if(t<a)return t/Math.max(a,.0001);if(t<a+d)return 1-(1-sus)*((t-a)/d);if(t<1-r)return sus;return sus*Math.max(0,(1-t)/r)}
function makeBuffer(kind){const c=ensureCtx();if(!c)return null;const sr=c.sampleRate;let dur=.5;if(['synthPad','violin','cello','rise'].includes(kind))dur=2.4;if(['guitarClean','guitarDirty'].includes(kind))dur=1.2;if(kind==='hatClosed')dur=.12;if(kind==='hatOpen')dur=.55;if(kind==='clap')dur=.32;if(kind==='snareFat')dur=.42;if(kind==='kickTight')dur=.28;const n=Math.max(1,Math.floor(sr*dur)),b=c.createBuffer(1,n,sr),x=b.getChannelData(0);let lp=0,phase=0;
 const noise=()=>Math.random()*2-1;
 for(let i=0;i<n;i++){
   const t=i/sr,u=i/n;let y=0;
   if(kind==='kickDeep'||kind==='kick808'||kind==='kickTight'){
     const base=kind==='kickDeep'?48:kind==='kick808'?52:58, start=kind==='kickTight'?175:155, decay=kind==='kickTight'?20:14;
     const f=base+(start-base)*Math.exp(-t*decay);phase+=2*Math.PI*f/sr;const body=(Math.sin(phase)+.22*Math.sin(phase*2))*Math.exp(-t*(kind==='kick808'?4.5:kind==='kickDeep'?7.4:12));const click=(noise()*.16+Math.sin(2*Math.PI*1800*t)*.08)*Math.exp(-t*65);y=Math.tanh((body+click)*1.45)*.78;
   } else if(kind==='snareFat') y=(noise()*.82+Math.sin(2*Math.PI*185*t)*.28)*Math.exp(-t*12);
   else if(kind==='clap'){const burst=(Math.exp(-Math.pow((t-.02)/.018,2))+Math.exp(-Math.pow((t-.07)/.018,2))*.8+Math.exp(-Math.pow((t-.12)/.025,2))*.65);y=noise()*burst*.75;}
   else if(kind==='hatClosed'||kind==='hatOpen'){let nn=noise();lp+=.08*(nn-lp);y=(nn-lp)*(kind==='hatOpen'?Math.exp(-t*7):Math.exp(-t*35));}
   else if(kind==='tomLow'){const f=105-28*u;phase+=2*Math.PI*f/sr;y=Math.sin(phase)*Math.exp(-t*6);}
   else if(kind==='sub'||kind==='bassDirty'||kind==='bassPluck'){
     const f=73.42;phase+=2*Math.PI*f/sr;const e=kind==='bassPluck'?Math.exp(-t*8):env(i,n,.008,.1,.68,.18);y=(Math.sin(phase)*.78+Math.sin(phase*2)*.24+(kind==='bassDirty'?Math.sin(phase*3)*.18:0))*e;if(kind==='bassDirty')y=Math.tanh(y*2.6)*.82;
   } else if(kind==='synthWarm'||kind==='synthBright'||kind==='synthPad'||kind==='lead'||kind==='keys'||kind==='bell'){
     const f=kind==='lead'?392:261.63;phase+=2*Math.PI*f/sr;const e=kind==='synthPad'?env(i,n,.16,.35,.62,.32):kind==='bell'?Math.exp(-t*3.4):env(i,n,.01,.16,.55,.22);if(kind==='synthWarm')y=(Math.sin(phase)+.35*Math.sin(phase*2))*.7*e;else if(kind==='synthBright')y=(Math.sin(phase)+.45*Math.sin(phase*2)+.25*Math.sin(phase*3))*.62*e;else if(kind==='synthPad'){const d=146.83,f3=174.61,a=220;y=(Math.sin(2*Math.PI*d*t)+.78*Math.sin(2*Math.PI*f3*t)+.64*Math.sin(2*Math.PI*a*t)+.18*Math.sin(2*Math.PI*d*2*t))*.28*e;}else if(kind==='lead')y=Math.tanh((Math.sin(phase)+.5*Math.sin(phase*2))*1.8)*.6*e;else if(kind==='keys')y=(Math.sin(phase)+.2*Math.sin(phase*2)+.12*Math.sin(phase*4))*.68*e;else y=(Math.sin(phase)+.55*Math.sin(phase*2.01)+.3*Math.sin(phase*3.98))*.55*e;
   } else if(kind==='violin'||kind==='cello'){
     const f=kind==='violin'?293.66:98;phase+=2*Math.PI*f/sr;const vib=1+.012*Math.sin(2*Math.PI*5.2*t);const p=phase*vib;const saw=2*((p/(2*Math.PI))%1)-1;const e=env(i,n,.12,.24,.78,.25);y=(saw*.45+Math.sin(p)*.3+Math.sin(p*2)*.12)*e;
   } else if(kind==='guitarClean'||kind==='guitarDirty'||kind==='guitarMuted'){
     const f=kind==='guitarMuted'?110:196;phase+=2*Math.PI*f/sr;const e=Math.exp(-t*(kind==='guitarMuted'?13:3.8));y=(Math.sin(phase)+.5*Math.sin(phase*2)+.25*Math.sin(phase*3))*e*.55;if(kind==='guitarDirty')y=Math.tanh(y*3.4)*.8;
   } else if(kind==='rise'){const f=120*Math.pow(10,u*1.4);phase+=2*Math.PI*f/sr;y=(Math.sin(phase)*.35+noise()*.16)*u*u;}
   else if(kind==='noiseHit')y=noise()*Math.exp(-t*5.5)*.7;
   x[i]=Math.max(-1,Math.min(1,y));
 }
 return b;
}
const PERFORMANCE_ROLE_META=[
 {role:'KICK',rootMidi:36,gain:1},
 {role:'BASS',rootMidi:38,gain:.86},
 {role:'HATS',rootMidi:60,gain:.58},
 {role:'PERC',rootMidi:60,gain:.62},
 {role:'PAD',rootMidi:50,gain:.62},
 {role:'MELODY',rootMidi:62,gain:.58},
 {role:'FX',rootMidi:60,gain:.48},
 {role:'VOCAL',rootMidi:60,gain:.52}
];
const PERFORMANCE_ASSETS={
  0:'https://raw.githubusercontent.com/Boochi44/free-drum-samples/main/drum-samples/02-bounce/kicks/bounce-kick-01.wav',
  2:'https://raw.githubusercontent.com/Boochi44/free-drum-samples/main/drum-samples/02-bounce/hi-hats/hi-hat-closed-01.wav',
  3:'https://raw.githubusercontent.com/Boochi44/free-drum-samples/main/drum-samples/02-bounce/claps/clap-01.wav',
  6:'https://raw.githubusercontent.com/Boochi44/free-drum-samples/main/drum-samples/02-bounce/fx/fx-cymbal.wav',
  7:'https://raw.githubusercontent.com/n33kos/kokoro-voices/main/samples/am_ash.wav'
};
async function fetchDecode(url){
  const c=ensureCtx();if(!c)return null;
  const r=await fetch(url,{cache:'force-cache'});if(!r.ok)throw new Error('HTTP '+r.status);
  return c.decodeAudioData((await r.arrayBuffer()).slice(0));
}
async function loadPerformancePack(){
  const s=st(),c=ensureCtx();if(!s||!c)return {loaded:0,failed:Object.keys(PERFORMANCE_ASSETS).length};
  s.sonicPackState='LOADING';
  for(let i=0;i<8;i++){
    const meta=PERFORMANCE_ROLE_META[i];
    s.padMeta[i]={...(s.padMeta[i]||{}),...meta,performance:true};
  }
  const jobs=Object.entries(PERFORMANCE_ASSETS).map(async([idx,url])=>{
    const i=Number(idx);
    try{
      const buf=await fetchDecode(url);
      if(buf){s.padBuffers[i]=buf;s.padMeta[i]={...(s.padMeta[i]||{}),...PERFORMANCE_ROLE_META[i],sampled:true,url};padLabel(i,PERFORMANCE_ROLE_META[i].role+' · SAMPLE');return true;}
    }catch(e){console.warn('TWIS performance sample fallback',i,e);}
    return false;
  });
  const results=await Promise.all(jobs);
  const loaded=results.filter(Boolean).length;
  s.sonicPackState=loaded>=4?'SAMPLED':'HYBRID';
  status(loaded>=4?'Performance pack online · sampled kick/hats/perc/FX/voice + tonal engine.':'Performance pack running hybrid fallback · tonal engine remains active.');
  paintPads();
  return {loaded,failed:results.length-loaded,state:s.sonicPackState};
}
function padLabel(i,label){const s=st();if(!s)return;s.padNames[i]=label;const btn=q(`.ld-pad[data-pad='${i}']`);if(btn){btn.classList.add('loaded');const sm=btn.querySelector('small');if(sm)sm.textContent=label;}}
function loadPreset(){const s=st();if(!s)return;const sel=q('#soundPreset');if(!sel)return;const p=PRESETS[Number(sel.value)||0],buf=makeBuffer(p[2]);if(!buf)return;s.padBuffers[selectedPad]=buf;s.padMeta[selectedPad]={label:p[1],factory:true,preset:p[2],...(selectedPad<8?PERFORMANCE_ROLE_META[selectedPad]:{})};padLabel(selectedPad,p[1]);status(`Pad ${selectedPad+1} loaded: ${p[1]}.`);paintPads();}
async function loadFile(file){const s=st(),c=ensureCtx();if(!s||!c||!file)return;try{const ab=await file.arrayBuffer(),buf=await c.decodeAudioData(ab.slice(0));s.padBuffers[selectedPad]=buf;s.padMeta[selectedPad]={label:file.name,custom:true};padLabel(selectedPad,file.name.replace(/\.[^.]+$/,''));status(`Pad ${selectedPad+1} loaded from your file: ${file.name}`);paintPads();}catch(e){console.warn(e);status('Could not decode that audio file. Try WAV, MP3, M4A, or OGG supported by this browser.');}}
function loadPresetToPad(padIndex,presetIndex){const s=st();if(!s)return false;const p=PRESETS[Number(presetIndex)];if(!p)return false;selectedPad=Math.max(0,Math.min(15,Number(padIndex)||0));const buf=makeBuffer(p[2]);if(!buf)return false;s.padBuffers[selectedPad]=buf;s.padMeta[selectedPad]={label:p[1],factory:true,preset:p[2],...(selectedPad<8?PERFORMANCE_ROLE_META[selectedPad]:{})};padLabel(selectedPad,p[1]);paintPads();return true;}
async function loadArrayBufferToPad(padIndex,ab,name='CUSTOM',type=''){const s=st(),c=ensureCtx();if(!s||!c||!ab)return false;try{selectedPad=Math.max(0,Math.min(15,Number(padIndex)||0));const buf=await c.decodeAudioData(ab.slice(0));s.padBuffers[selectedPad]=buf;s.padMeta[selectedPad]={label:name||'CUSTOM',custom:true,type:type||''};padLabel(selectedPad,String(name||'CUSTOM').replace(/\.[^.]+$/,''));paintPads();return true;}catch(e){console.warn(e);status('Could not decode that audio file. Try WAV, MP3, M4A, or OGG supported by this browser.');return false;}}
async function loadFileToPad(padIndex,file){if(!file)return false;return loadArrayBufferToPad(padIndex,await file.arrayBuffer(),file.name,file.type||'');}
function clearPad(){const s=st();if(!s)return;s.padBuffers[selectedPad]=null;s.padMeta[selectedPad]=null;s.padNames[selectedPad]=`PAD ${selectedPad+1}`;const btn=q(`.ld-pad[data-pad='${selectedPad}']`);btn?.classList.remove('loaded');status(`Pad ${selectedPad+1} reset to built-in sound.`);paintPads();}
function preview(){const s=st();if(!s?.ctx)return status('Tap PLAY once first.');const buf=s.padBuffers[selectedPad];if(!buf)return status('Load a sound to this pad first.');const src=s.ctx.createBufferSource(),g=s.ctx.createGain();src.buffer=buf;g.gain.value=.9;src.connect(g).connect(s.master);src.start();}
function paintPads(){qa('#soundPadGrid button').forEach(b=>b.classList.toggle('active',Number(b.dataset.soundPad)===selectedPad));const s=st(),m=s?.padMeta?.[selectedPad];const e=q('#soundCurrent');if(e)e.textContent=`PAD ${selectedPad+1} · ${m?.label||s?.padNames?.[selectedPad]||'BUILT-IN'}`;}
function show(){const host=q('#twisLoopDeck');if(!host)return;qa('.ld-tab').forEach(x=>x.classList.toggle('active',x.dataset.tab==='sound'));qa('.ld-page').forEach(x=>x.classList.toggle('active',x.dataset.page==='sound'));}
function css(){if(q('#twisSoundRackStyle'))return;const s=document.createElement('style');s.id='twisSoundRackStyle';s.textContent=`.ld-sound-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.ld-sound-grid button{min-height:44px}.ld-sound-grid button.active{outline:2px solid #35c889;background:#17382d}.ld-sound-card{border:1px solid #2c3a40;background:#0b1115;border-radius:14px;padding:12px;margin:10px 0}.ld-sound-card select,.ld-sound-card button,.ld-sound-card input{width:100%;min-height:44px;margin-top:8px}.ld-sound-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ld-sound-note{font-size:.76rem;color:#91a4ac;margin-top:8px}@media(max-width:600px){.ld-sound-grid{grid-template-columns:repeat(4,minmax(0,1fr))}.ld-sound-actions{grid-template-columns:1fr}}`;document.head.appendChild(s)}
function build(){const host=q('#twisLoopDeck');if(!host||q('[data-page="sound"]'))return false;css();const tabs=host.querySelector('.ld-tabs');if(!tabs)return false;const tab=document.createElement('button');tab.className='ld-tab';tab.dataset.tab='sound';tab.textContent='SOUND';tab.onclick=show;tabs.appendChild(tab);const page=document.createElement('div');page.className='ld-page';page.dataset.page='sound';const opts=PRESETS.map((p,i)=>`<option value="${i}">${p[0]} · ${p[1]}</option>`).join('');page.innerHTML=`<div class="ld-section"><h3>SOUND RACK</h3><div class="ld-sound-card"><strong id="soundCurrent">PAD 1</strong><div id="soundPadGrid" class="ld-sound-grid">${Array.from({length:16},(_,i)=>`<button data-sound-pad="${i}">${i+1}</button>`).join('')}</div></div><div class="ld-sound-card"><strong>FACTORY SOUNDS</strong><select id="soundPreset">${opts}</select><div class="ld-sound-actions"><button id="soundLoad">LOAD TO PAD</button><button id="soundPreview">PREVIEW</button></div><div class="ld-sound-note">Local/offline generated bank. Guitar and string presets are lightweight synth-style approximations, not sampled orchestral instruments.</div></div><div class="ld-sound-card"><strong>YOUR OWN SOUND</strong><input id="soundFile" type="file" accept="audio/*"><button id="soundClear">RESET PAD TO BUILT-IN</button></div></div>`;const statusEl=q('#ldStatus');host.insertBefore(page,statusEl||null);page.querySelectorAll('[data-sound-pad]').forEach(b=>b.onclick=()=>{selectedPad=Number(b.dataset.soundPad);paintPads()});q('#soundLoad').onclick=loadPreset;q('#soundPreview').onclick=preview;q('#soundClear').onclick=clearPad;q('#soundFile').onchange=e=>loadFile(e.target.files?.[0]);paintPads();return true;}
function install(){if(installed)return;if(!build()){setTimeout(install,120);return}installed=true;}
window.TWIS_LOOP_SOUND_RACK={install,loadPresetToPad,loadFileToPad,loadArrayBufferToPad,loadPerformancePack,getPresets:()=>PRESETS.map(x=>x.slice())};
})();