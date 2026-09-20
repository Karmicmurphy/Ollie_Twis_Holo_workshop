(()=>{
'use strict';
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)], clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let installed=false, active=Array(8).fill(false), energy=.52, packName='DEEP MELODIC HOUSE', lastGhostLoop=-1;
const proMode=new URLSearchParams(location.search).get('mode')==='pro';
let currentScene='INTRO',echoOn=false,washOn=false,buildBarsLeft=0,packPrimed=false,autoMixToken=0;
const roles=['KICK','BASS','HATS','PERC','PAD','MELODY','FX','VOCAL'];
const packs={
 'DEEP MELODIC HOUSE':{bpm:124,key:'D MIN',presets:[0,8,5,7,13,15,22,24]},
 'NIGHT DRIVE':{bpm:118,key:'D MIN',presets:[1,8,5,6,13,14,22,24]},
 'NOTHING LEFT RED':{bpm:100,key:'D MIN',presets:[0,9,5,7,13,15,23,24]},
 'ROAD SIGNAL':{bpm:112,key:'D MIN',presets:[2,8,5,6,13,14,22,24]},
 'INDUSTRIAL BLUES':{bpm:88,key:'D MIN',presets:[0,9,4,7,13,15,23,24]}
};
const performanceScenes={
  INTRO:{active:[1,1,0,0,1,0,0,0],energy:.30},
  DEEP:{active:[1,1,0,1,1,1,0,0],energy:.50},
  LIFT:{active:[1,1,1,1,1,1,1,0],energy:.68},
  BREAK:{active:[0,1,0,0,1,1,1,0],energy:.40},
  PEAK:{active:[1,1,1,1,1,1,1,0],energy:.90},
  OUTRO:{active:[1,0,0,0,1,0,0,0],energy:.24}
};
const patterns={
 KICK:{deep:[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],mid:[1,0,0,.35,1,0,0,0,1,0,0,.35,1,0,0,0],drive:[1,0,.35,0,1,0,.35,0,1,0,.35,0,1,0,.5,.35]},
 BASS:{deep:[1,0,0,0,0,0,.65,0,1,0,0,0,0,.55,0,0],mid:[1,0,0,.55,0,0,.75,0,1,0,.5,0,0,.7,0,.4],drive:[1,0,.45,.7,0,.4,.85,0,1,.45,.65,0,.45,.8,0,.6]},
 HATS:{deep:[0,0,.18,0,0,.28,0,0,0,0,.22,0,0,.34,0,.16],mid:[0,.28,0,.55,0,.22,0,.68,0,.32,0,.48,0,.24,.18,.72],drive:[.14,.46,.22,.72,.18,.5,.26,.82,.14,.44,.2,.7,.24,.52,.32,.9]},
 PERC:{deep:[0,0,0,0,0,.28,0,0,0,0,.18,0,0,0,0,.34],mid:[0,0,.26,0,0,.42,0,.18,0,0,0,.3,0,.5,0,.24],drive:[0,.18,.36,0,.2,.56,0,.28,0,.22,.4,0,.24,.62,.18,.34]},
 PAD:{deep:[.65,0,0,0,0,0,0,0,.6,0,0,0,0,0,0,0],mid:[.75,0,0,0,0,0,0,0,.7,0,0,0,0,0,0,0],drive:[.8,0,0,0,.45,0,0,0,.8,0,0,0,.5,0,0,0]},
 MELODY:{deep:[0,0,0,0,0,0,.35,0,0,0,0,0,0,0,.3,0],mid:[0,0,.35,0,0,0,.55,0,0,.35,0,0,0,0,.5,0],drive:[0,.35,.55,0,.4,0,.7,0,0,.45,.6,0,.4,0,.75,.35]},
 FX:{deep:[0,0,0,0,0,0,0,0,0,0,0,0,.35,0,0,0],mid:[0,0,0,0,0,0,0,.3,0,0,0,0,.55,0,0,0],drive:[0,0,0,.25,0,0,0,.45,0,0,0,.3,.75,0,0,.4]},
 VOCAL:{deep:[0,0,0,0,0,0,0,0,0,0,.3,0,0,0,0,0],mid:[0,0,0,0,.3,0,0,0,0,0,.45,0,0,0,0,.3],drive:[0,0,.35,0,.45,0,0,.3,0,0,.55,0,.4,0,0,.45]}
};
const state=()=>window.TWIS_LOOP_DECK?.state;
function status(t){const e=q('#simpleStatus');if(e)e.textContent=t;const old=q('#ldStatus');if(old)old.textContent=t;}
function variant(){return energy<.34?'deep':energy<.7?'mid':'drive'}
function ensureTransport(){const s=state();if(!s)return false;if(!s.playing)q('#ldPlay')?.click();return true}
function setBpm(v){const s=state();if(!s)return;s.bpm=Number(v);const b=q('#ldBpm');if(b){b.value=String(s.bpm);b.dispatchEvent(new Event('change',{bubbles:true}));}paintStatus();}
function rolePattern(i){return patterns[roles[i]][variant()]}
function applyRole(i){const s=state();if(!s)return;const row=s.pattern[i];if(!row)return;row.fill(0);if(active[i])rolePattern(i).forEach((v,k)=>row[k]=v);}
function applyAll(){for(let i=0;i<8;i++)applyRole(i);syncAdvancedSeq();paintPads();}
function syncAdvancedSeq(){const s=state();if(!s)return;qa('.ld-step').forEach(b=>{const p=+b.dataset.row,k=+b.dataset.step,v=s.pattern[p]?.[k]||0,r=s.ratchets[p]?.[k]||1;b.classList.toggle('on',!!v);b.style.opacity=v?String(.35+.65*v):'1';b.textContent=r>1?String(r):'';});}
function toggleRole(i){if(!ensureTransport())return;active[i]=!active[i];applyRole(i);syncAdvancedSeq();paintPads();status(roles[i]+(active[i]?' ON · locked to the groove.':' OFF · drops cleanly on the running pattern.'));saveAuto();}
function paintPads(){qa('.simple-role').forEach((b,i)=>b.classList.toggle('active',!!active[i]));}
function paintStatus(){const s=state(),pack=packs[packName];const bpm=q('#simpleBpm'),key=q('#simpleKey');if(bpm)bpm.textContent=Math.round(s?.bpm||pack.bpm)+' BPM';if(key)key.textContent=pack.key;}
async function loadPack(name,keepActive=false){
  const api=window.TWIS_LOOP_SOUND_RACK,def=packs[name];
  if(!api||!def)return status('Sound engine is still waking up. Try PACK again in a second.');
  packName=name;setBpm(def.bpm);
  for(let i=0;i<8;i++){api.loadPresetToPad?.(i,def.presets[i]);await new Promise(r=>setTimeout(r,4));}
  if(!keepActive)active.fill(false);
  applyAll();
  const sel=q('#simplePack');if(sel)sel.value=name;paintStatus();
  status(name+' local role engine loaded · sampled drums/voice loading in background.');
  const sampleResult=await api.loadPerformancePack?.().catch(()=>null);
  if(sampleResult?.loaded)status(name+' · sampled drums online · bass/harmony phrase engine ready.');
  else status(name+' · local hybrid engine active.');
  saveAuto();
  return sampleResult;
}
function setEnergy(v){energy=clamp(Number(v),0,1);const s=state();if(s?.filter&&s.ctx){const hz=2200+energy*14500;s.filter.frequency.setTargetAtTime(hz,s.ctx.currentTime,.04);s.filter.Q.setTargetAtTime(.6+energy*2.8,s.ctx.currentTime,.04);}const out=q('#simpleEnergyV');if(out)out.textContent=Math.round(energy*100)+'%';applyAll();saveAuto();}
function paintScene(){
  qa('[data-performance-scene]').forEach(b=>b.classList.toggle('active',b.dataset.performanceScene===currentScene));
}
function applySceneNow(name){
  const def=performanceScenes[name];if(!def)return;
  currentScene=name;active=def.active.map(Boolean);energy=def.energy;
  const er=q('#simpleEnergy');if(er)er.value=String(energy);
  setEnergy(energy);applyAll();paintPads();paintScene();saveAuto();
}
function queueScene(name){
  if(!ensureTransport())return;
  const api=window.TWIS_LOOP_DECK?.commands;
  if(!api)return;
  status(name+' queued for the next bar.');
  api.queueBarAction(()=>{applySceneNow(name);status(name+' LIVE · one Loop Core, one transport.');});
}
function scheduleBars(count,fn,token){
  const api=window.TWIS_LOOP_DECK?.commands;
  let left=count;
  const step=()=>{
    if(token!==autoMixToken)return;
    left--;
    if(left<=0){fn();return;}
    api?.queueBarAction?.(step);
  };
  api?.queueBarAction?.(step);
}
function startProfessionalArc(){
  const token=++autoMixToken;
  applySceneNow('INTRO');
  scheduleBars(2,()=>{
    applySceneNow('DEEP');
    scheduleBars(4,()=>{
      applySceneNow('LIFT');
      scheduleBars(4,()=>{
        applySceneNow('BREAK');
        window.TWIS_LOOP_DECK?.commands?.setWash?.(true);
        scheduleBars(3,()=>{
          window.TWIS_LOOP_DECK?.commands?.setWash?.(false);
          buildBarsLeft=3;
          buildStep();
          scheduleBars(3,()=>{
            applySceneNow('PEAK');
            window.TWIS_LOOP_DECK?.commands?.triggerPad?.(6,.82,window.TWIS_LOOP_DECK.commands.nextGrid('bar'));
            status('PEAK · full groove, no click-track layer.');
          },token);
        },token);
      },token);
    },token);
  },token);
}
async function playSet(){
  const api=window.TWIS_LOOP_DECK?.commands;if(!api)return;
  active.fill(false);applyAll();
  await api.play?.();
  if(!packPrimed){await loadPack(packName,false);await restoreCustomSounds();packPrimed=true;}
  startProfessionalArc();
  const b=q('#simplePlaySet');if(b)b.textContent='■ STOP SET';
  status('SET LIVE · kick + bass + pad first. Percussion builds in, not a metronome.');
}
async function stopClear(){
  autoMixToken++;
  active.fill(false);applyAll();
  await window.TWIS_LOOP_DECK?.commands?.clearSession?.({purgeLegacy:true});
  const b=q('#simplePlaySet');if(b)b.textContent='▶ PLAY SET';
  echoOn=false;washOn=false;buildBarsLeft=0;
  window.TWIS_LOOP_DECK?.commands?.setEcho?.(false);
  window.TWIS_LOOP_DECK?.commands?.setWash?.(false);
  q('#simpleEcho')?.classList.remove('active');q('#simpleWash')?.classList.remove('active');q('#simpleBuild')?.classList.remove('active');
  status('CLEARED. No loop, import, pattern, or auto-session will come back on PLAY.');
}
function togglePlaySet(){const s=state();if(s?.playing)stopClear();else playSet();}
function buildStep(){
  if(buildBarsLeft<=0)return;
  const progress=(5-buildBarsLeft)/4;
  energy=clamp(.58+progress*.34,0,1);
  const er=q('#simpleEnergy');if(er)er.value=String(energy);
  setEnergy(energy);
  buildBarsLeft--;
  if(buildBarsLeft>0)window.TWIS_LOOP_DECK?.commands?.queueBarAction?.(buildStep);
  else{q('#simpleBuild')?.classList.remove('active');status('BUILD complete · hit DROP.');}
}
function buildSet(){
  if(!ensureTransport())return;
  buildBarsLeft=4;q('#simpleBuild')?.classList.add('active');
  window.TWIS_LOOP_DECK?.commands?.queueBarAction?.(buildStep);
  status('4-bar BUILD armed on the master clock.');
}
function dropSet(){
  if(!ensureTransport())return;
  buildBarsLeft=0;q('#simpleBuild')?.classList.remove('active');
  const api=window.TWIS_LOOP_DECK?.commands;
  api?.queueBarAction?.((t)=>{applySceneNow('PEAK');api?.setWash?.(false);api?.triggerPad?.(6,1,t);status('DROP · PEAK LIVE.');});
}
function toggleEcho(){
  echoOn=!echoOn;window.TWIS_LOOP_DECK?.commands?.setEcho?.(echoOn);
  q('#simpleEcho')?.classList.toggle('active',echoOn);status('ECHO '+(echoOn?'ON':'OFF'));
}
function toggleWash(){
  washOn=!washOn;window.TWIS_LOOP_DECK?.commands?.setWash?.(washOn);
  q('#simpleWash')?.classList.toggle('active',washOn);status('WASH '+(washOn?'ON':'OFF'));
}
function vocalHit(){
  if(!ensureTransport())return;
  const api=window.TWIS_LOOP_DECK?.commands;api?.triggerPad?.(7,.92,api?.nextGrid?.('beat'));
  status('VOCAL HIT · quantized to the master transport.');
}
function fuckIt(){window.TWIS_LOOP_FORGE?.fuckIt?.();q('#simpleUndo')?.classList.add('show');setTimeout(()=>{syncAdvancedSeq();paintPads();},30);}
function undo(){window.TWIS_LOOP_FORGE?.undoLast?.();q('#simpleUndo')?.classList.remove('show');setTimeout(()=>{syncAdvancedSeq();},30);}
function audioBufferToWav(buf){const ch=buf.numberOfChannels,len=buf.length,sr=buf.sampleRate,ab=new ArrayBuffer(44+len*ch*2),v=new DataView(ab);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+len*ch*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,sr,true);v.setUint32(28,sr*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,len*ch*2,true);let o=44;for(let i=0;i<len;i++)for(let c=0;c<ch;c++){let x=clamp(buf.getChannelData(c)[i],-1,1);v.setInt16(o,x<0?x*32768:x*32767,true);o+=2;}return ab;}
async function opfsDir(parts){if(!navigator.storage?.getDirectory)return null;let d=await navigator.storage.getDirectory();for(const p of ['twis-loop-deck',...parts])d=await d.getDirectoryHandle(p,{create:true});return d;}
async function opfsWrite(path,data){try{const parts=path.split('/'),file=parts.pop(),dir=await opfsDir(parts);if(!dir)return false;const h=await dir.getFileHandle(file,{create:true}),w=await h.createWritable();await w.write(data);await w.close();return true}catch(e){console.warn(e);return false}}
async function opfsRead(path){try{const parts=path.split('/'),file=parts.pop(),dir=await opfsDir(parts);if(!dir)return null;const h=await dir.getFileHandle(file),f=await h.getFile();return {buffer:await f.arrayBuffer(),type:f.type};}catch{return null}}
async function catchGhost(){status('GHOST is grabbing the last 4 bars…');const b=await window.TWIS_LOOP_FORGE?.ghostCatch?.(4);if(!b)return status('GHOST had nothing to catch yet. Let something play first.');const s=state();let i=s.loops.findIndex(l=>!l.buffer);if(i<0)i=lastGhostLoop>=0?lastGhostLoop:7;lastGhostLoop=i;const l=s.loops[i];try{l.source?.stop();}catch{}l.buffer=b;l.playing=false;l.undo=null;await opfsWrite('loops/'+i+'.wav',audioBufferToWav(b));q('[data-lplay="'+i+'"]')?.click();status('GHOST caught 4 bars and dropped them into Loop '+(i+1)+'.');}
function sessionStore(){try{return JSON.parse(localStorage.twisSimpleSessions||'[]')}catch{return []}}
function sessionData(name){const s=state();return {name,when:Date.now(),packName,energy,bpm:s?.bpm||packs[packName].bpm,active:[...active],patterns:s?.pattern?.slice(0,8).map(r=>r.slice())||[]};}
function saveSessions(x){localStorage.twisSimpleSessions=JSON.stringify(x)}
function saveSession(){const def='Groove '+new Date().toLocaleDateString()+' '+new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}),name=(prompt('Name this session:',def)||'').trim();if(!name)return;const a=sessionStore().filter(x=>x.name!==name);a.unshift(sessionData(name));saveSessions(a.slice(0,20));renderSessionList();status('Saved: '+name);}
async function loadSession(name){const x=sessionStore().find(v=>v.name===name);if(!x)return;await loadPack(x.packName||'DEEP MELODIC HOUSE',true);energy=Number.isFinite(x.energy)?x.energy:.52;const er=q('#simpleEnergy');if(er)er.value=String(energy);setEnergy(energy);setBpm(x.bpm||packs[packName].bpm);active=(x.active||Array(8).fill(false)).slice(0,8);const s=state();if(x.patterns?.length&&s){x.patterns.forEach((r,i)=>{s.pattern[i].fill(0);r.slice(0,16).forEach((v,k)=>s.pattern[i][k]=v);});}else applyAll();syncAdvancedSeq();paintPads();ensureTransport();status('Loaded: '+x.name);saveAuto();closeDrawer();}
function deleteSession(name){saveSessions(sessionStore().filter(x=>x.name!==name));renderSessionList();}
function renderSessionList(){const box=q('#simpleSessions');if(!box)return;const a=sessionStore();box.innerHTML=a.length?a.map(x=>'<div class="simple-session"><button data-load-session="'+esc(x.name)+'">'+esc(x.name)+'</button><button class="trash" data-del-session="'+esc(x.name)+'">×</button></div>').join(''):'<p class="simple-muted">No saved sessions yet.</p>';qa('[data-load-session]').forEach(b=>b.onclick=()=>loadSession(b.dataset.loadSession));qa('[data-del-session]').forEach(b=>b.onclick=()=>deleteSession(b.dataset.delSession));}
function esc(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function saveAuto(){}
function restoreAuto(){packName='DEEP MELODIC HOUSE';energy=.52;active=Array(8).fill(false);const er=q('#simpleEnergy');if(er)er.value=String(energy);applyAll();paintPads();}
async function customSound(roleIndex,file){if(!file)return;const api=window.TWIS_LOOP_SOUND_RACK;if(!api?.loadFileToPad)return status('Sound rack is not ready.');const ok=await api.loadFileToPad(roleIndex,file);if(!ok)return;await opfsWrite('simple-sounds/'+roleIndex+'.audio',new Uint8Array(await file.arrayBuffer()));localStorage.setItem('twisSimpleSound'+roleIndex,JSON.stringify({name:file.name,type:file.type||''}));status(file.name+' is now your '+roles[roleIndex]+' sound.');}
async function restoreCustomSounds(){const api=window.TWIS_LOOP_SOUND_RACK;if(!api?.loadArrayBufferToPad)return;for(let i=0;i<8;i++){let meta;try{meta=JSON.parse(localStorage.getItem('twisSimpleSound'+i)||'null')}catch{};if(!meta)continue;const f=await opfsRead('simple-sounds/'+i+'.audio');if(f)await api.loadArrayBufferToPad(i,f.buffer,meta.name,meta.type);}}
function openDrawer(which){q('#simpleDrawer')?.classList.add('open');qa('.simple-drawer-panel').forEach(x=>x.hidden=x.dataset.panel!==which);if(which==='sessions')renderSessionList();}
function closeDrawer(){q('#simpleDrawer')?.classList.remove('open');}
function advanced(){document.body.classList.remove('twis-simple-mode');q('#twisLoopDeck')?.classList.remove('simple-mode');qa('.ld-tab').forEach(x=>x.classList.toggle('active',x.dataset.tab==='loop'));qa('.ld-page').forEach(x=>x.classList.toggle('active',x.dataset.page==='loop'));}
function easy(){document.body.classList.add('twis-simple-mode');q('#twisLoopDeck')?.classList.add('simple-mode');qa('.ld-tab').forEach(x=>x.classList.toggle('active',x.dataset.tab==='simple'));qa('.ld-page').forEach(x=>x.classList.toggle('active',x.dataset.page==='simple'));paintStatus();}
function css(){if(q('#twisSimpleStyle'))return;const s=document.createElement('style');s.id='twisSimpleStyle';s.textContent='#twisLoopDeck.simple-mode>.ld-top,#twisLoopDeck.simple-mode>.ld-tabs,#twisLoopDeck.simple-mode .ld-status{display:none!important}#twisLoopDeck.simple-mode{inset:0;background:#07090b}.simple-shell{max-width:620px;margin:0 auto;padding:18px 14px 28px;display:grid;gap:14px;color:#eef5f7}.simple-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.simple-brand{font-size:.7rem;letter-spacing:.28em;color:#9cabb2}.simple-title{font-size:2.2rem;line-height:1;font-weight:1000;letter-spacing:.03em;margin:5px 0}.simple-packline{font-size:.72rem;letter-spacing:.12em;color:#aebcc2}.simple-advanced{border:1px solid #334149;background:#0d1317;color:#b7c5ca;border-radius:10px;min-height:38px;padding:0 12px}.simple-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.simple-role{aspect-ratio:1/1;min-height:82px;border:1px solid #334149;border-radius:15px;background:linear-gradient(145deg,#11171b,#090d10);color:#dbe5e8;font-weight:900;letter-spacing:.05em;box-shadow:inset 0 0 0 1px #000}.simple-role.active{border-color:#6c8cff;background:linear-gradient(145deg,#142044,#10162d);box-shadow:0 0 18px #4d6dff55,inset 0 0 22px #4d6dff22;color:#fff}.simple-role:nth-child(1).active{border-color:#ff6d67;box-shadow:0 0 18px #ff514a55}.simple-role:nth-child(3).active{border-color:#48d88b;box-shadow:0 0 18px #48d88b55}.simple-role:nth-child(5).active{border-color:#bb73ff;box-shadow:0 0 18px #a653ff55}.simple-info{display:grid;grid-template-columns:1fr 1fr 2fr;gap:8px;border:1px solid #253139;background:#0a0f12;border-radius:13px;padding:10px}.simple-info div{font-size:.63rem;color:#7f929a}.simple-info b{display:block;font-size:1rem;color:#edf4f6}.simple-actions{display:grid;gap:9px}.simple-ghost{min-height:68px;border:1px solid #8b66e6;border-radius:15px;background:linear-gradient(145deg,#21143c,#100c20);color:#eadfff;font-size:1rem;font-weight:1000;letter-spacing:.05em}.simple-row{display:grid;grid-template-columns:1.35fr .9fr;gap:8px}.simple-fuck{min-height:58px;border:1px solid #d48648;border-radius:14px;background:#2b190d;color:#ffd0a5;font-weight:1000;font-size:1rem}.simple-stop{border:1px solid #93414b;border-radius:14px;background:#241014;color:#ffd8dc;font-weight:900}.simple-undo{display:none;margin-top:-4px;min-height:38px;border:1px solid #586b77;border-radius:10px;background:#10171b;color:#fff}.simple-undo.show{display:block}.simple-bottom{border:1px solid #253139;background:#0a0f12;border-radius:15px;padding:12px;display:grid;gap:10px}.simple-packrow{display:grid;grid-template-columns:1fr auto auto;gap:7px}.simple-packrow select,.simple-packrow button{min-height:40px;border:1px solid #334149;background:#10171b;color:#fff;border-radius:9px}.simple-energy{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;font-size:.7rem;color:#8fa1a9}.simple-energy input{width:100%}.simple-status{min-height:36px;font-size:.74rem;color:#9fb1b8;text-align:center}.simple-drawer{position:fixed;inset:0;z-index:9999;background:#000b;display:none;align-items:flex-end}.simple-drawer.open{display:flex}.simple-drawer-box{width:100%;max-height:78vh;overflow:auto;background:#0b1013;border-radius:20px 20px 0 0;padding:14px;border:1px solid #2c3940}.simple-drawer-head{display:flex;justify-content:space-between;align-items:center}.simple-drawer-head button{min-width:44px;min-height:40px}.simple-drawer-panel{display:grid;gap:9px;margin-top:12px}.simple-session{display:grid;grid-template-columns:1fr 44px;gap:6px}.simple-session button,.simple-drawer-panel button,.simple-drawer-panel select,.simple-drawer-panel input{min-height:44px;border:1px solid #334149;background:#11181c;color:#fff;border-radius:9px}.simple-session .trash{color:#ff9aa3}.simple-muted{color:#7e919a;font-size:.8rem}@media(max-width:430px){.simple-shell{padding:13px 10px 24px}.simple-title{font-size:1.9rem}.simple-grid{gap:6px}.simple-role{min-height:72px;font-size:.72rem}.simple-packrow{grid-template-columns:1fr 1fr}.simple-packrow select{grid-column:1/-1}}';document.head.appendChild(s)}
function proCss(){
  if(q('#twisUnifiedProStyle'))return;
  const s=document.createElement('style');s.id='twisUnifiedProStyle';s.textContent=
  '.simple-playset{min-height:64px;border:1px solid #42d79e;border-radius:15px;background:#12372b;color:#fff;font-size:1rem;font-weight:1000;letter-spacing:.08em}'+
  '.simple-scenes{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}.simple-scenes button{min-height:44px;border:1px solid #334149;border-radius:10px;background:#10161a;color:#cdd8dc;font-size:.68rem;font-weight:900}.simple-scenes button.active{border-color:#ba79ff;background:#321846;color:#fff}'+
  '.simple-livefx{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.simple-livefx button{min-height:48px;border:1px solid #5b4937;border-radius:10px;background:#1c1510;color:#ffe2c3;font-size:.68rem;font-weight:900}.simple-livefx button.active{border-color:#ffb25f;background:#4c2c12;color:#fff}'+
  '.simple-modebadge{font-size:.66rem;letter-spacing:.12em;color:#52d9a3;margin-top:5px}'+
  '@media(max-width:520px){.simple-scenes{grid-template-columns:repeat(3,1fr)}.simple-livefx{grid-template-columns:repeat(2,1fr)}}';
  document.head.appendChild(s);
}
function build(){
  const host=q('#twisLoopDeck'),body=host?.querySelector('.ld-body'),tabs=host?.querySelector('.ld-tabs');
  if(!host||!body||!tabs)return false;if(q('[data-page="simple"]'))return true;
  css();proCss();
  const tab=document.createElement('button');tab.className='ld-tab';tab.dataset.tab='simple';tab.textContent='EASY';tabs.insertBefore(tab,tabs.firstChild);
  const page=document.createElement('div');page.className='ld-page';page.dataset.page='simple';
  const sceneHtml=Object.keys(performanceScenes).map(n=>'<button data-performance-scene="'+n+'">'+n+'</button>').join('');
  page.innerHTML='<div class="simple-shell">'+
    '<div class="simple-head"><div><div class="simple-brand">TWIS LOOP DECK</div><div class="simple-title">'+(proMode?'PRO RIG':'PERFORM')+'</div><div class="simple-packline">ONE ENGINE · ONE CLOCK · ONE MUSICAL JOB PER CONTROL</div><div class="simple-modebadge">'+(proMode?'AMPHITHEATER PERFORMANCE SURFACE':'PHONE-FIRST LOOP WORKSTATION')+'</div></div><button class="simple-advanced" id="simpleAdvanced">ADVANCED</button></div>'+
    '<button class="simple-playset" id="simplePlaySet">▶ PLAY SET</button>'+
    '<div class="simple-scenes">'+sceneHtml+'</div>'+
    '<div class="simple-grid">'+roles.map((r,i)=>'<button class="simple-role" data-role="'+i+'">'+r+'</button>').join('')+'</div>'+
    '<div class="simple-info"><div><b id="simpleBpm">124 BPM</b>TEMPO</div><div><b id="simpleKey">D MIN</b>KEY</div><div><b>1 BAR</b>MASTER QUANTIZATION</div></div>'+
    '<div class="simple-livefx"><button id="simpleBuild">BUILD 4</button><button id="simpleDrop">DROP</button><button id="simpleEcho">ECHO</button><button id="simpleWash">WASH</button><button id="simpleVocalHit">VOCAL HIT</button></div>'+
    '<div class="simple-actions"><button class="simple-ghost" id="simpleGhost">👻 GHOST — CATCH THAT</button><div class="simple-row"><button class="simple-fuck" id="simpleFuck">FUCK IT</button><button class="simple-stop" id="simpleStop">STOP / CLEAR</button></div><button class="simple-undo" id="simpleUndo">UNDO THAT SHIT</button></div>'+
    '<div class="simple-bottom"><div class="simple-packrow"><select id="simplePack">'+Object.keys(packs).map(n=>'<option>'+n+'</option>').join('')+'</select><button id="simpleSound">+ MY SOUND</button><button id="simpleSaveLoad">SAVE / LOAD</button></div><div class="simple-energy"><span>DEEP</span><input id="simpleEnergy" type="range" min="0" max="1" step=".01" value=".52"><span>DRIVE · <b id="simpleEnergyV">52%</b></span></div></div>'+
    '<div id="simpleStatus" class="simple-status">Loading local performance engine…</div></div>';
  const oldStatus=body.querySelector('#ldStatus');body.insertBefore(page,oldStatus||null);

  const drawer=document.createElement('div');drawer.id='simpleDrawer';drawer.className='simple-drawer';
  drawer.innerHTML='<div class="simple-drawer-box"><div class="simple-drawer-head"><b>TWIS STASH</b><button id="simpleDrawerClose">×</button></div><div class="simple-drawer-panel" data-panel="sound" hidden><label>PUT MY SOUND ON <select id="simpleSoundRole">'+roles.map((r,i)=>'<option value="'+i+'">'+r+'</option>').join('')+'</select></label><input id="simpleSoundFile" type="file" accept="audio/*"><p class="simple-muted">The file stays on this device and is restored from OPFS where supported.</p></div><div class="simple-drawer-panel" data-panel="sessions" hidden><button id="simpleSaveSession">SAVE CURRENT GROOVE</button><div id="simpleSessions"></div></div></div>';
  document.body.appendChild(drawer);

  tab.onclick=easy;qa('[data-role]').forEach(b=>b.onclick=()=>toggleRole(+b.dataset.role));
  qa('[data-performance-scene]').forEach(b=>b.onclick=()=>queueScene(b.dataset.performanceScene));
  q('#simpleAdvanced').onclick=advanced;q('#simplePlaySet').onclick=togglePlaySet;
  q('#simpleBuild').onclick=buildSet;q('#simpleDrop').onclick=dropSet;q('#simpleEcho').onclick=toggleEcho;q('#simpleWash').onclick=toggleWash;q('#simpleVocalHit').onclick=vocalHit;
  q('#simpleGhost').onclick=catchGhost;q('#simpleFuck').onclick=fuckIt;q('#simpleUndo').onclick=undo;q('#simpleStop').onclick=stopClear;
  q('#simplePack').onchange=e=>loadPack(e.target.value);q('#simpleEnergy').oninput=e=>setEnergy(e.target.value);
  q('#simpleSound').onclick=()=>openDrawer('sound');q('#simpleSaveLoad').onclick=()=>openDrawer('sessions');q('#simpleDrawerClose').onclick=closeDrawer;q('#simpleSaveSession').onclick=saveSession;
  q('#simpleSoundFile').onchange=e=>{const i=Number(q('#simpleSoundRole').value);customSound(i,e.target.files?.[0]);e.target.value='';};
  drawer.onclick=e=>{if(e.target===drawer)closeDrawer();};
  paintScene();return true;
}
async function install(){
  if(installed)return;if(!build()){setTimeout(install,140);return}
  installed=true;easy();
  setTimeout(async()=>{
    restoreAuto();paintStatus();paintScene();
    status(proMode?'Ready. PLAY SET starts the unified Loop Core.':'Ready. Tap PLAY SET or a layer and perform.');
  },350);
}
window.TWIS_SIMPLE_PERFORM={install,easy,advanced,loadPack,saveSession,playSet,stop:stopClear,scene:queueScene};
})();