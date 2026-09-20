(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
const PAD_NAMES=['KICK','SNARE','HAT','OPEN','CLAP','TOM','LOW TOM','FX','BASS','BASS 2','SUB','PLUCK','CHORD','LEAD','NOISE','RIDE'];
const state={
  ctx:null, master:null, subsonic:null, filter:null, comp:null, delay:null, delayFeedback:null, delayWet:null, outputGate:null, analyser:null, meterBuffer:null, streamDest:null,
  bpm:100, playing:false, origin:0, step:0, worker:null, scheduledUntil:0, lookAhead:.14, tickCount:0, startCount:0, stopCount:0, barActions:[],
  pattern:Array.from({length:16},()=>Array(16).fill(0)), ratchets:Array.from({length:16},()=>Array(16).fill(1)),
  padBuffers:Array(16).fill(null), padMeta:Array(16).fill(null), padNames:[...PAD_NAMES],
  loops:Array.from({length:8},()=>({id:uid(),buffer:null,source:null,playing:false,recording:false,armed:false,bars:4,volume:.9,mute:false,solo:false,undo:null,startTime:0})),
  micStream:null,micSource:null,recorderNode:null,recorderSilent:null,recordTarget:-1,pendingCapture:null,
  importBuffer:null,importFile:null,importName:'',bpmGuess:0,beatOffset:0,transients:[],slices:[],sliceMode:'1 BAR',syncMode:'REPITCH',
  masterVolume:.78, scene:0, scenes:[null,null,null,null], tap:[], latencyOffsetMs:Number(localStorage.twisLoopOffsetMs||0),
  mixRecorder:null,mixChunks:[], midi:null, stretchReady:false, stretchLoading:false, storageOK:false, storagePersistent:false, restoreDone:false, restorePromise:null
};
const core=window.TWIS_LOOP_CORE;
if(!core)throw new Error('TWIS Loop Core must load before Loop Deck V2');
let transportClock=null;
const loopMachines=Array.from({length:8},()=>new core.LoopStateMachine('EMPTY'));
function clock(){if(!transportClock)transportClock=new core.TransportClock({bpm:state.bpm});return transportClock;}
function alignLoopMachine(i){
  const l=state.loops[i],m=loopMachines[i];
  if(l.buffer&&m.state==='EMPTY'){m.transition('LOAD');m.transition('LOAD_OK');}
  if(!l.buffer&&['STOPPED','PLAYING'].includes(m.state)){try{m.transition('CLEAR');}catch{}}
  l.machineState=m.state;
  return m;
}
function loopTransition(i,event,meta={}){
  const m=alignLoopMachine(i);
  try{const next=m.transition(event,{...meta,hasAsset:!!state.loops[i].buffer});state.loops[i].machineState=next;return next;}
  catch(e){console.warn('Loop state transition rejected',i,event,m.state,e);return m.state;}
}
let persistRequested=false;
function status(text){const el=$('#ldStatus');if(el)el.textContent=text;}
async function protectStorage(){
  if(persistRequested||!navigator.storage?.persist)return;
  persistRequested=true;
  try{state.storagePersistent=await navigator.storage.persist();}catch{state.storagePersistent=false;}
}
function audio(){
  if(state.ctx)return state.ctx;
  const C=window.AudioContext||window.webkitAudioContext;
  state.ctx=new C({latencyHint:'interactive'});
  state.master=state.ctx.createGain(); state.master.gain.value=state.masterVolume;
  state.subsonic=state.ctx.createBiquadFilter();state.subsonic.type='highpass';state.subsonic.frequency.value=28;state.subsonic.Q.value=.55;
  state.filter=state.ctx.createBiquadFilter(); state.filter.type='lowpass'; state.filter.frequency.value=18000; state.filter.Q.value=.65;
  state.delay=state.ctx.createDelay(2); state.delay.delayTime.value=.125;
  state.delayFeedback=state.ctx.createGain();state.delayFeedback.gain.value=0;state.delay.connect(state.delayFeedback);state.delayFeedback.connect(state.delay);
  state.delayWet=state.ctx.createGain();state.delayWet.gain.value=0;state.delay.connect(state.delayWet);
  state.comp=state.ctx.createDynamicsCompressor();state.comp.threshold.value=-8;state.comp.knee.value=12;state.comp.ratio.value=2.2;state.comp.attack.value=.008;state.comp.release.value=.18;
  state.outputGate=state.ctx.createGain();state.outputGate.gain.value=0;
  state.analyser=state.ctx.createAnalyser();state.analyser.fftSize=256;state.meterBuffer=new Float32Array(state.analyser.fftSize);
  state.streamDest=state.ctx.createMediaStreamDestination();
  state.master.connect(state.subsonic);state.subsonic.connect(state.filter);state.filter.connect(state.comp);
  state.master.connect(state.delay);state.delayWet.connect(state.comp);
  state.comp.connect(state.outputGate);state.outputGate.connect(state.analyser);state.analyser.connect(state.ctx.destination);state.comp.connect(state.streamDest);
  window.TWIS_SAMPLED_ROLE_ENGINE?.configure?.({context:state.ctx,output:state.master,onStatus:status});
  initClock(); initRecorderWorklet();
  return state.ctx;
}
async function unlock(){
  const c=audio();if(c.state!=='running')await c.resume();
  if(!state.restoreDone){
    state.restoreDone=true;
  }
  state.outputGate?.gain.setTargetAtTime(1,c.currentTime,.006);
  const base=Math.round((c.baseLatency||0)*1000),out=Math.round((c.outputLatency||0)*1000);
  status(`Audio ready · base ${base} ms · output ${out} ms · rec offset ${state.latencyOffsetMs} ms`);
}
function initClock(){
  if(state.worker)return;
  const src=`let t=null;onmessage=e=>{if(e.data==='start'&&!t)t=setInterval(()=>postMessage('tick'),20);if(e.data==='stop'&&t){clearInterval(t);t=null}}`;
  state.worker=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));
  state.worker.onmessage=()=>scheduleAhead();
}
async function initRecorderWorklet(){
  const c=state.ctx;if(!c?.audioWorklet||state.recorderNode)return;
  try{
    await c.audioWorklet.addModule('./assets/loop-recorder-worklet.js');
    state.recorderNode=new AudioWorkletNode(c,'twis-loop-recorder',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});
    state.recorderSilent=c.createGain();state.recorderSilent.gain.value=0;
    state.recorderNode.connect(state.recorderSilent).connect(c.destination);
    state.recorderNode.port.onmessage=handleRecorderMessage;
  }catch(e){console.warn(e);status('AudioWorklet recorder unavailable; browser recording fallback only.');}
}
function stepSec(){return clock().stepSeconds();}
function barSec(bars=1){return clock().barSeconds(bars);}
function transportPos(t=audio().currentTime){return clock().transportSeconds(t);}
function nextGrid(kind='bar',now=audio().currentTime){return clock().nextBoundary(kind,now);}
function queueBarAction(fn){if(typeof fn==='function')state.barActions.push(fn);}
async function play(){
  await unlock();if(state.playing)return;
  state.playing=true;state.origin=audio().currentTime+.06;state.scheduledUntil=state.origin;state.step=0;
  clock().setBpm(state.bpm,audio().currentTime);clock().start(state.origin,0);
  state.startCount++;state.worker.postMessage('start');$('#ldPlay').textContent='■';
}
function stop(){
  if(!state.playing&&state.loops.every(l=>!l.playing)&&state.recordTarget<0)return;
  const now=state.ctx?.currentTime||0;
  if(state.recordTarget>=0){
    const i=state.recordTarget;cancelRecord(i);state.pendingCapture=null;
  }
  state.barActions.length=0;
  state.playing=false;clock().stop(now);state.worker?.postMessage('stop');
  state.loops.forEach((l,i)=>{
    if(l.playing){
      try{l.source?.stop(now+.01);}catch{}
      l.playing=false;
      if(alignLoopMachine(i).state==='PLAYING')loopTransition(i,'STOP');
    }
  });
  window.TWIS_SAMPLED_ROLE_ENGINE?.stopAll?.();
  if(state.outputGate)state.outputGate.gain.setTargetAtTime(0,now,.005);
  state.stopCount++;$('#ldPlay').textContent='▶';document.querySelectorAll('.ld-step.now').forEach(x=>x.classList.remove('now'));renderLoops();
}
function scheduleAhead(){
  if(!state.playing)return;const c=audio(),limit=c.currentTime+state.lookAhead;
  while(state.scheduledUntil<limit){
    const s=state.step%16,t=state.scheduledUntil;
    if(s===0&&state.barActions.length){const actions=state.barActions.splice(0);for(const fn of actions){try{fn(t);}catch(e){console.warn('bar action failed',e);}}}
    const phraseBar=Math.floor(state.tickCount/16);
    for(let p=0;p<16;p++){
      const v=state.pattern[p][s];if(!v)continue;
      const r=state.ratchets[p][s]||1;
      for(let k=0;k<r;k++){
        const base=t+(stepSec()/r)*k;
        const swing=(s%2?stepSec()*.08:0);
        const human=((p*17+s*11+phraseBar*7)%9-4)*.0007;
        triggerPad(p,v,base+swing+human,{step:s,bar:phraseBar});
      }
    }
    const uiStep=s;setTimeout(()=>paintStep(uiStep),Math.max(0,(t-c.currentTime)*1000));
    state.scheduledUntil+=stepSec();state.step=(state.step+1)%16;state.tickCount++;
  }
}
function paintStep(s){$$('.ld-step.now').forEach(x=>x.classList.remove('now'));$$(`.ld-step[data-step='${s}']`).forEach(x=>x.classList.add('now'));}
function route(node,gain=.9,pan=0){const c=audio(),g=c.createGain();g.gain.value=gain;node.connect(g);if(c.createStereoPanner){const p=c.createStereoPanner();p.pan.value=pan;g.connect(p);p.connect(state.master);}else g.connect(state.master);return g;}
function synthKick(t,v){const c=audio(),o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(150,t);o.frequency.exponentialRampToValueAtTime(45,t+.13);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.34);o.connect(g).connect(state.master);o.start(t);o.stop(t+.36);}
function synthTone(t,f,d,v,type='sawtooth'){const c=audio(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.001,v),t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(state.master);o.start(t);o.stop(t+d+.03);}
function synthNoise(t,d,v,hp=1000){const c=audio(),b=c.createBuffer(1,Math.ceil(c.sampleRate*d),c.sampleRate),a=b.getChannelData(0);for(let i=0;i<a.length;i++)a[i]=Math.random()*2-1;const s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();s.buffer=b;f.type='highpass';f.frequency.value=hp;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(f).connect(g).connect(state.master);s.start(t);}
function builtin(i,t,v=.8){switch(i){case 0:synthKick(t,v);break;case 1:synthNoise(t,.16,v,1200);synthTone(t,180,.08,v*.22,'triangle');break;case 2:synthNoise(t,.045,v*.55,6500);break;case 3:synthNoise(t,.34,v*.45,5200);break;case 4:synthNoise(t,.14,v*.65,1900);break;case 5:synthTone(t,130,.25,v,'sine');break;case 6:synthTone(t,92,.3,v,'triangle');break;case 7:synthNoise(t,.65,v*.3,350);break;case 8:synthTone(t,65.4,.3,v,'sawtooth');break;case 9:synthTone(t,82.4,.3,v,'square');break;case 10:synthTone(t,43.65,.48,v,'sine');break;case 11:synthTone(t,261.6,.19,v,'triangle');break;case 12:[130.8,164.8,196].forEach(f=>synthTone(t,f,.62,v*.3,'triangle'));break;case 13:synthTone(t,392,.3,v,'sawtooth');break;case 14:synthNoise(t,.42,v*.32,180);break;case 15:synthNoise(t,.5,v*.25,7200);}}
function microSlice(buf,start,end,fade=.004){const c=audio(),sr=buf.sampleRate,s=Math.max(0,Math.floor(start*sr)),e=Math.min(buf.length,Math.ceil(end*sr)),len=Math.max(1,e-s),out=c.createBuffer(buf.numberOfChannels,len,sr),fn=Math.min(Math.floor(sr*fade),Math.floor(len/2));for(let ch=0;ch<buf.numberOfChannels;ch++){const src=buf.getChannelData(ch),dst=out.getChannelData(ch);for(let i=0;i<len;i++){let g=1;if(fn){if(i<fn)g=i/fn;else if(i>=len-fn)g=(len-i-1)/fn;}dst[i]=(src[s+i]||0)*Math.max(0,g);}}return out;}
function playBuffer(buf,t=audio().currentTime,loop=false,rate=1,offset=0,gain=.9,pan=0){const c=audio(),s=c.createBufferSource();s.buffer=buf;s.loop=loop;s.playbackRate.value=rate;route(s,gain,pan);s.start(t,offset);return s;}
function midiHz(m){return 440*Math.pow(2,(m-69)/12);}
function musicRoleMidi(role,ctx={}){
  const step=Number(ctx.step)||0,bar=Number(ctx.bar)||0;
  const progression=[38,34,41,36]; // D2, Bb1, F2, C2
  if(role==='BASS'){
    const roots=progression, offsets=[0,0,0,7,0,0,12,0,0,0,7,0,0,10,0,0];
    return roots[bar%4]+offsets[step%16];
  }
  if(role==='PAD')return [50,46,53,48][bar%4];
  if(role==='MELODY'){
    const motif=[0,0,62,0,65,0,69,0,0,67,0,65,0,62,0,0];
    return motif[(step+bar*2)%16]||62;
  }
  return 60;
}
function performancePan(meta,ctx={}){
  if(meta?.role==='HATS')return (Number(ctx.step)%4<2?-.14:.14);
  if(meta?.role==='CLAP')return .04;
  if(meta?.role==='FX')return .18;
  return 0;
}
function sampledDuration(role){
  if(role==='PAD')return 1.65;
  if(role==='MELODY')return .42;
  return .34;
}
function triggerPad(i,v=.85,t=audio().currentTime,ctx={}){
  const b=$(`.ld-pad[data-pad='${i}']`);
  if(t<=audio().currentTime+.02){b?.classList.add('hit');setTimeout(()=>b?.classList.remove('hit'),90);}
  const meta=state.padMeta[i]||{};
  if(meta.performance&&['BASS','PAD','MELODY'].includes(meta.role)){
    const midi=musicRoleMidi(meta.role,ctx);
    const ok=window.TWIS_SAMPLED_ROLE_ENGINE?.play?.(meta.role,midi,t,v,sampledDuration(meta.role));
    return !!ok;
  }
  const pb=state.padBuffers[i];
  if(pb){
    if(meta.performance&&meta.role==='KICK')window.TWIS_SAMPLED_ROLE_ENGINE?.duck?.(t,.54,.15);
    const rate=meta.sourceBpm&&state.syncMode==='REPITCH'?state.bpm/meta.sourceBpm:1;
    const gain=v*(Number(meta.gain)||1);
    playBuffer(pb,t,false,rate,0,gain,performancePan(meta,ctx));
    return true;
  }
  if(meta.performance)return false;
  builtin(i,t,v);
  return true;
}
async function ensureMic(){
  await unlock();
  if(state.micStream)return true;
  try{
    state.micStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
    state.micSource=audio().createMediaStreamSource(state.micStream);
    await initRecorderWorklet();
    if(state.recorderNode)state.micSource.connect(state.recorderNode);
    paintMicButton();
    status('MIC ON · recording will use the phone microphone.');
    return true;
  }catch(e){status('Microphone permission denied or unavailable.');return false;}
}
function disableMic(){
  if(state.recordTarget>=0)cancelRecord(state.recordTarget);
  try{state.micSource?.disconnect();}catch{}
  state.micStream?.getTracks?.().forEach(t=>t.stop());
  state.micSource=null;state.micStream=null;
  paintMicButton();
  status('MIC OFF.');
}
async function toggleMic(){if(state.micStream)disableMic();else await ensureMic();}
function paintMicButton(){
  const b=$('#ldMicEnable');if(!b)return;
  const on=!!state.micStream;b.textContent=on?'MIC ON · TAP TO TURN OFF':'MIC OFF · TAP TO TURN ON';
  b.classList.toggle('active',on);
}
function handleRecorderMessage(e){const d=e.data;if(d.type==='complete'&&state.pendingCapture){const p=state.pendingCapture;state.pendingCapture=null;finishCapture(p,d);}}
function bufferFromWorklet(msg){if(!msg.frames||!msg.channels?.length)return null;const c=audio(),out=c.createBuffer(msg.channels.length,msg.frames,msg.sampleRate);msg.channels.forEach((ab,i)=>out.copyToChannel(new Float32Array(ab),i));return out;}
function mixBuffers(a,b){const c=audio(),len=Math.max(a.length,b.length),ch=Math.max(a.numberOfChannels,b.numberOfChannels),o=c.createBuffer(ch,len,a.sampleRate);for(let k=0;k<ch;k++){const d=o.getChannelData(k),aa=a.getChannelData(Math.min(k,a.numberOfChannels-1)),bb=b.getChannelData(Math.min(k,b.numberOfChannels-1));for(let i=0;i<len;i++)d[i]=clamp((aa[i]||0)+(bb[i]||0),-1,1);}return o;}
async function finishCapture(p,msg){let buf=bufferFromWorklet(msg);const l=state.loops[p.index];l.recording=false;l.armed=false;if(!buf){loopTransition(p.index,'FAIL',{error:'no-audio'});renderLoops();return status('No audio captured.');}
  const trim=Math.max(0,Math.round((state.latencyOffsetMs/1000)*buf.sampleRate));if(trim&&trim<buf.length-128)buf=microSlice(buf,trim/buf.sampleRate,buf.duration);
  if(p.overdub&&l.buffer){l.undo=l.buffer;buf=mixBuffers(l.buffer,buf);}else l.undo=l.buffer;
  l.buffer=buf;
  loopTransition(p.index,p.overdub?'OVERDUB_DONE':'RECORD_DONE');
  renderLoops();status(`Loop ${p.index+1} captured for this session · ${buf.duration.toFixed(2)}s${p.overdub?' · overdubbed':''}`);startLoop(p.index,true);
}
async function toggleRecord(i){if(!(await ensureMic()))return;const l=state.loops[i];if(l.recording||l.armed){cancelRecord(i);return;}if(state.recordTarget>=0)return status('One loop can record at a time.');if(!state.playing)play();const start=nextGrid('bar'),free=l.bars==='FREE',stopAt=free?null:start+barSec(l.bars);const param=state.recorderNode?.parameters.get('recording');if(!param){state.recordTarget=-1;l.armed=false;l.recording=false;renderLoops();return status('Frame recorder unavailable on this browser.');}state.recordTarget=i;l.armed=true;loopTransition(i,l.buffer?'ARM_OVERDUB':'ARM_RECORD');renderLoops();param.cancelScheduledValues(audio().currentTime);param.setValueAtTime(0,audio().currentTime);param.setValueAtTime(1,start);if(stopAt)param.setValueAtTime(0,stopAt);state.pendingCapture={index:i,start,stopAt,overdub:!!l.buffer};l.recording=true;setTimeout(()=>loopTransition(i,l.buffer?'OVERDUB_START':'RECORD_START'),Math.max(0,(start-audio().currentTime)*1000));status(`Loop ${i+1} armed · starts next bar${free?' · tap REC to stop':` · ${l.bars} bar${l.bars>1?'s':''}`}`);renderLoops();if(stopAt)setTimeout(()=>{state.recordTarget=-1;},Math.max(0,(stopAt-audio().currentTime)*1000+80));else state.recordTarget=i;}
function cancelRecord(i){const l=state.loops[i],p=state.recorderNode?.parameters.get('recording');if(p){p.cancelScheduledValues(audio().currentTime);p.setValueAtTime(0,audio().currentTime+.005);}state.recordTarget=-1;l.armed=false;l.recording=false;loopTransition(i,'CANCEL');renderLoops();}
function cycleBars(i){const vals=[1,2,4,8,16,'FREE'],l=state.loops[i],n=vals[(vals.indexOf(l.bars)+1)%vals.length];l.bars=n;renderLoops();saveMeta();}
function startLoop(i,quantized=false){const l=state.loops[i];if(!l.buffer)return;try{l.source?.stop();}catch{}const when=state.playing?(quantized?nextGrid('bar'):audio().currentTime+.015):audio().currentTime+.015;let offset=0;if(state.playing&&!quantized){const phase=transportPos(when)%l.buffer.duration;offset=phase;}l.source=playBuffer(l.buffer,when,true,1,offset,l.mute?0:l.volume);if(['EMPTY','ERROR'].includes(alignLoopMachine(i).state))alignLoopMachine(i);if(alignLoopMachine(i).state==='STOPPED')loopTransition(i,'QUEUE_PLAY');if(alignLoopMachine(i).state==='PLAY_QUEUED')loopTransition(i,'PLAY');l.playing=true;l.startTime=when-offset;renderLoops();animateLoops();}
function toggleLoop(i){const l=state.loops[i];if(!l.buffer)return status(`Loop ${i+1} is empty.`);if(l.playing){try{l.source.stop(nextGrid('beat'));}catch{}l.playing=false;loopTransition(i,'STOP');renderLoops();}else startLoop(i,true);}
function clearLoop(i){const l=state.loops[i];try{l.source?.stop();}catch{}l.undo=null;l.buffer=null;l.source=null;l.playing=false;l.recording=false;l.armed=false;loopMachines[i]=new core.LoopStateMachine('EMPTY');l.machineState='EMPTY';deleteLoopFile(i);renderLoops();status(`Loop ${i+1} cleared.`);}
function undoLoop(i){const l=state.loops[i];if(!l.undo)return;loopTransition(i,'UNDO');const t=l.buffer;l.buffer=l.undo;l.undo=t;loopTransition(i,'UNDO_DONE',{playing:l.playing});renderLoops();}
function animateLoops(){let any=false;state.loops.forEach((l,i)=>{if(l.playing&&l.buffer){any=true;const p=((audio().currentTime-l.startTime)%l.buffer.duration)/l.buffer.duration;const el=$(`.ld-loop[data-loop='${i}'] .ld-progress span`);if(el)el.style.width=`${p*100}%`;}});if(any)requestAnimationFrame(animateLoops);}
function renderLoops(){
  const el=$('#ldLoops');if(!el)return;
  el.innerHTML=state.loops.map((l,i)=>{
    const mode=l.recording?'RECORDING':l.armed?'ARMED':l.playing?'PLAYING':l.buffer?'READY':'EMPTY';
    const dur=l.buffer?`${l.buffer.duration.toFixed(1)}s`:'no audio';
    return `<div class="ld-loop ${l.recording?'rec':''} ${l.playing?'playing':''}" data-loop="${i}">
      <div class="ld-loop-head"><strong>LOOP ${i+1} · ${mode}</strong><button data-bars="${i}" class="ld-link">${l.bars==='FREE'?'FREE':l.bars+' BAR'}</button></div>
      <div class="ld-mini">${dur} · ${l.buffer?'tap PLAY to hear it':'tap REC to capture a new loop'}</div>
      <div class="ld-progress"><span></span></div>
      <div class="ld-loop-actions">
        <button data-rec="${i}">${l.recording||l.armed?'STOP RECORDING':'RECORD'}</button>
        <button data-lplay="${i}" ${l.buffer?'':'disabled'}>${l.playing?'STOP LOOP':'PLAY LOOP'}</button>
        <button data-undo="${i}" ${l.undo?'':'disabled'}>UNDO</button>
        <button data-clearloop="${i}" ${l.buffer||l.undo?'':'disabled'}>CLEAR LOOP</button>
      </div></div>`;
  }).join('');
  document.querySelectorAll('[data-rec]').forEach(b=>b.onclick=()=>toggleRecord(+b.dataset.rec));
  document.querySelectorAll('[data-lplay]').forEach(b=>b.onclick=()=>toggleLoop(+b.dataset.lplay));
  document.querySelectorAll('[data-clearloop]').forEach(b=>b.onclick=()=>clearLoop(+b.dataset.clearloop));
  document.querySelectorAll('[data-undo]').forEach(b=>b.onclick=()=>undoLoop(+b.dataset.undo));
  document.querySelectorAll('[data-bars]').forEach(b=>b.onclick=()=>cycleBars(+b.dataset.bars));
}
function renderPads(){const el=$('#ldPads');if(!el)return;el.innerHTML=state.padNames.map((n,i)=>`<button class="ld-pad ${state.padBuffers[i]?'loaded':''}" data-pad="${i}"><b>${i+1}</b><small>${state.padMeta[i]?.label||n}</small></button>`).join('');$$('.ld-pad').forEach(b=>{b.onpointerdown=e=>{unlock();triggerPad(+b.dataset.pad,clamp(e.pressure||.82,.2,1));};b.oncontextmenu=e=>e.preventDefault();});}
function cycleStep(p,s){const levels=[0,.5,.75,1],cur=state.pattern[p][s],idx=levels.findIndex(x=>x===cur);state.pattern[p][s]=levels[(idx+1)%levels.length];renderSeq();saveMeta();}
function renderSeq(){const el=$('#ldSeq');if(!el)return;el.innerHTML=state.padNames.map((n,p)=>`<div class="ld-rowlabel">${p+1} ${state.padMeta[p]?.label||n}</div><div class="ld-seq">${Array.from({length:16},(_,s)=>{const v=state.pattern[p][s],r=state.ratchets[p][s];return `<button class="ld-step ${v?'on':''}" style="opacity:${v?(.35+.65*v):1}" data-row="${p}" data-step="${s}" title="velocity ${v} ratchet ${r}">${r>1?r:''}</button>`}).join('')}</div>`).join('');$$('.ld-step').forEach(b=>{let timer;b.onpointerdown=()=>{timer=setTimeout(()=>{const p=+b.dataset.row,s=+b.dataset.step;state.ratchets[p][s]=state.ratchets[p][s]===1?2:state.ratchets[p][s]===2?4:1;renderSeq();saveMeta();timer=null;},500)};b.onpointerup=()=>{if(timer){clearTimeout(timer);cycleStep(+b.dataset.row,+b.dataset.step);}};});}
function mono(buf){const out=new Float32Array(buf.length);for(let c=0;c<buf.numberOfChannels;c++){const d=buf.getChannelData(c);for(let i=0;i<d.length;i++)out[i]+=d[i]/buf.numberOfChannels;}return out;}
function analyzeLocal(buf){const x=mono(buf),sr=buf.sampleRate,hop=512,frames=Math.floor(x.length/hop),e=new Float32Array(frames);let lp=0,a=Math.exp(-2*Math.PI*180/sr);for(let f=0;f<frames;f++){let sum=0;for(let j=0;j<hop;j++){const idx=f*hop+j,v=x[idx]||0;lp=a*lp+(1-a)*v;const h=v-lp;sum+=h*h;}e[f]=Math.sqrt(sum/hop);}const novelty=new Float32Array(frames);let mean=0;for(let i=1;i<frames;i++){novelty[i]=Math.max(0,e[i]-e[i-1]);mean+=novelty[i];}mean/=Math.max(1,frames-1);const fps=sr/hop,onsets=[];let last=-9999;for(let i=2;i<frames-2;i++){if(novelty[i]>mean*1.45&&novelty[i]>=novelty[i-1]&&novelty[i]>=novelty[i+1]&&i-last>fps*.055){onsets.push(i/fps);last=i;}}
  let bestBpm=120,best=-1,second=0;for(let bpm=60;bpm<=200;bpm+=.5){const lag=Math.round((60/bpm)*fps);let score=0,count=0;for(let i=lag;i<frames;i++){score+=novelty[i]*novelty[i-lag];count++;}score/=Math.max(1,count);if(score>best){second=best;best=score;bestBpm=bpm;}else if(score>second)second=score;}while(bestBpm<80)bestBpm*=2;while(bestBpm>180)bestBpm/=2;const offset=onsets[0]||0,confidence=best>0?clamp((best-second)/best*4,0,1):0;return {bpm:Math.round(bestBpm*10)/10,offset,onsets,confidence};}
function nearestZero(buf,time,windowMs=8){const d=buf.getChannelData(0),sr=buf.sampleRate,center=Math.round(time*sr),w=Math.round(sr*windowMs/1000);let best=center,mag=Infinity;for(let i=Math.max(1,center-w);i<Math.min(d.length-1,center+w);i++){const m=Math.abs(d[i]);if(m<mag){mag=m;best=i;}}return best/sr;}
function regionDNA(start,end){const b=state.importBuffer,d=b.getChannelData(0),sr=b.sampleRate,s=Math.max(0,Math.floor(start*sr)),e=Math.min(b.length,Math.floor(end*sr));let sq=0,peak=0;for(let i=s;i<e;i++){const v=d[i];sq+=v*v;peak=Math.max(peak,Math.abs(v));}const rms=Math.sqrt(sq/Math.max(1,e-s)),dur=Math.max(.001,end-start),hits=state.transients.filter(t=>t>=start&&t<end).length,density=hits/dur,crest=rms?peak/rms:0,beats=dur*state.bpmGuess/60;let tag='SMOOTH';if(density>5)tag='BUSY';else if(crest>5&&density>1.2)tag='PUNCHY';else if(density<1)tag='SPARSE';return {rms,peak,density,beats,tag};}
function makeSlices(mode=state.sliceMode){const b=state.importBuffer;if(!b||!state.bpmGuess)return;state.sliceMode=mode;const beat=60/state.bpmGuess,d=b.duration,o=state.beatOffset||0,out=[];const push=(s,e)=>{s=nearestZero(b,clamp(s,0,d));e=nearestZero(b,clamp(e,0,d));if(e-s>.035)out.push({start:s,end:e,dna:null});};if(mode==='TRANSIENTS'){const pts=state.transients.length?state.transients:[0];for(let i=0;i<pts.length&&i<48;i++)push(pts[i],pts[i+1]??Math.min(d,pts[i]+beat));}else if(mode.startsWith('EQUAL')){const n=Number(mode.split(' ')[1]);for(let i=0;i<n;i++)push(d*i/n,d*(i+1)/n);}else{const count={'1 BEAT':1,'2 BEATS':2,'1 BAR':4,'2 BARS':8,'4 BARS':16}[mode]||4,step=beat*count;for(let t=o;t<d-.04&&out.length<48;t+=step)push(t,t+step);}out.forEach(r=>r.dna=regionDNA(r.start,r.end));state.slices=out;drawWave();renderSlices();}
function diverseSliceIndexes(n=16){const a=state.slices.map((s,i)=>({i,e:s.dna.rms,d:s.dna.density}));if(a.length<=n)return a.map(x=>x.i);const norm=key=>{const vals=a.map(x=>x[key]),mn=Math.min(...vals),mx=Math.max(...vals);return v=>(v-mn)/(mx-mn||1)};const ne=norm('e'),nd=norm('d'),pts=a.map(x=>({...x,x:ne(x.e),y:nd(x.d)})),chosen=[pts.reduce((p,q)=>q.e>p.e?q:p)];while(chosen.length<n){let best=null,dist=-1;for(const p of pts){if(chosen.some(c=>c.i===p.i))continue;const md=Math.min(...chosen.map(c=>(p.x-c.x)**2+(p.y-c.y)**2));if(md>dist){dist=md;best=p;}}if(!best)break;chosen.push(best);}return chosen.map(x=>x.i).sort((a,b)=>a-b);}
function assignSlice(sliceIndex,padIndex){const r=state.slices[sliceIndex];if(!r||!state.importBuffer)return;state.padBuffers[padIndex]=microSlice(state.importBuffer,r.start,r.end);state.padMeta[padIndex]={label:`SL ${sliceIndex+1}`,sourceBpm:state.bpmGuess,start:r.start,end:r.end,dna:r.dna};}
function buildKit(){if(!state.slices.length)return status('Analyze and slice a track first.');diverseSliceIndexes(16).forEach((idx,p)=>assignSlice(idx,p));renderPads();renderSeq();saveMeta();status('Diverse 16-pad kit built locally from this track.');}
function renderSlices(){const el=$('#ldSlices');if(!el)return;el.innerHTML=state.slices.map((s,i)=>`<button class="ld-slice" data-slice="${i}"><b>${i+1}</b><span>${s.dna.tag}</span><small>${s.dna.beats.toFixed(1)} beat · E ${(s.dna.rms*100).toFixed(0)} · T ${s.dna.density.toFixed(1)}/s</small></button>`).join('');$$('[data-slice]').forEach(b=>b.onclick=()=>{const i=+b.dataset.slice,r=state.slices[i];playBuffer(microSlice(state.importBuffer,r.start,r.end),audio().currentTime,false,state.syncMode==='REPITCH'?state.bpm/state.bpmGuess:1);});}
function drawWave(){const cv=$('#ldWave'),b=state.importBuffer;if(!cv||!b)return;const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);c.fillStyle='#091014';c.fillRect(0,0,cv.width,cv.height);const d=b.getChannelData(0),stride=Math.max(1,Math.floor(d.length/cv.width)),mid=cv.height/2;c.strokeStyle='#40cf94';c.beginPath();for(let x=0;x<cv.width;x++){let m=0;for(let j=0;j<stride;j++)m=Math.max(m,Math.abs(d[x*stride+j]||0));c.moveTo(x,mid-m*mid*.9);c.lineTo(x,mid+m*mid*.9);}c.stroke();c.strokeStyle='#ffffff45';for(const s of state.slices){const x=s.start/b.duration*cv.width;c.beginPath();c.moveTo(x,0);c.lineTo(x,cv.height);c.stroke();}}
async function importFile(file){await unlock();try{const arr=await file.arrayBuffer();state.importFile=arr.slice(0);state.importBuffer=await audio().decodeAudioData(arr.slice(0));state.importName=file.name;$('#ldDur').textContent=formatTime(state.importBuffer.duration);drawWave();status(`Loaded ${file.name} for this session only · ${formatTime(state.importBuffer.duration)}`);}catch(e){console.warn(e);status('Could not decode that audio format on this phone.');}}
function analyzeImport(){if(!state.importBuffer)return status('Import a track first.');status('Analyzing BPM, beat offset, transients and Loop DNA locally…');setTimeout(()=>{const a=analyzeLocal(state.importBuffer);state.bpmGuess=a.bpm;state.beatOffset=a.offset;state.transients=a.onsets;$('#ldGuess').textContent=a.bpm.toFixed(1);makeSlices(state.sliceMode);$('#ldSlicesN').textContent=state.slices.length;status(`Analysis: ${a.bpm.toFixed(1)} BPM · first beat ${a.offset.toFixed(3)}s · ${a.onsets.length} transients · confidence ${Math.round(a.confidence*100)}%`);},30);}
async function opfsDir(pathParts){if(!navigator.storage?.getDirectory)return null;let dir=await navigator.storage.getDirectory();for(const p of pathParts)dir=await dir.getDirectoryHandle(p,{create:true});state.storageOK=true;return dir;}
async function opfsWrite(path,data){try{const parts=path.split('/'),file=parts.pop(),dir=await opfsDir(['twis-loop-deck',...parts]);if(!dir)return false;const h=await dir.getFileHandle(file,{create:true}),w=await h.createWritable();await w.write(data);await w.close();return true;}catch(e){console.warn('OPFS write',e);return false;}}
async function opfsRead(path){try{const parts=path.split('/'),file=parts.pop(),dir=await opfsDir(['twis-loop-deck',...parts]);if(!dir)return null;const h=await dir.getFileHandle(file),f=await h.getFile();return f.arrayBuffer();}catch{return null;}}
async function opfsDelete(path){try{const parts=path.split('/'),file=parts.pop(),dir=await opfsDir(['twis-loop-deck',...parts]);await dir?.removeEntry(file);return true;}catch{return false;}}
function audioBufferToWav(buf){const ch=Math.min(2,buf.numberOfChannels),len=buf.length,bytes=44+len*ch*2,ab=new ArrayBuffer(bytes),v=new DataView(ab);const s=(o,t)=>[...t].forEach((x,i)=>v.setUint8(o+i,x.charCodeAt(0)));s(0,'RIFF');v.setUint32(4,bytes-8,true);s(8,'WAVE');s(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,buf.sampleRate,true);v.setUint32(28,buf.sampleRate*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);s(36,'data');v.setUint32(40,len*ch*2,true);let o=44;for(let i=0;i<len;i++)for(let c=0;c<ch;c++){let x=clamp(buf.getChannelData(c)[i],-1,1);v.setInt16(o,x<0?x*32768:x*32767,true);o+=2;}return ab;}
async function persistLoop(i){const b=state.loops[i].buffer;if(!b)return;await opfsWrite(`loops/${i}.wav`,new Uint8Array(audioBufferToWav(b)));}
async function deleteLoopFile(i){await opfsDelete(`loops/${i}.wav`);}
async function restoreAudio(){
  const c=audio();
  for(let i=0;i<8;i++){
    const ab=await opfsRead(`loops/${i}.wav`);
    if(ab)try{state.loops[i].buffer=await c.decodeAudioData(ab.slice(0));alignLoopMachine(i);}catch(e){console.warn('Loop restore',i,e);}
  }
  renderLoops();
  const imp=await opfsRead('imports/current.bin');
  if(imp)try{state.importBuffer=await c.decodeAudioData(imp.slice(0));state.importFile=imp;drawWave();$('#ldDur').textContent=formatTime(state.importBuffer.duration);}catch(e){console.warn('Import restore',e);}
}
async function clearSession({purgeLegacy=true}={}){
  stop();
  state.barActions.length=0;
  state.pattern.forEach(r=>r.fill(0));
  state.ratchets.forEach(r=>r.fill(1));
  state.recordTarget=-1;state.pendingCapture=null;
  state.loops.forEach((l,i)=>{
    try{l.source?.stop();}catch{}
    l.buffer=null;l.source=null;l.playing=false;l.recording=false;l.armed=false;l.undo=null;l.startTime=0;
    loopMachines[i]=new core.LoopStateMachine('EMPTY');l.machineState='EMPTY';
  });
  state.importBuffer=null;state.importFile=null;state.importName='';state.bpmGuess=0;state.beatOffset=0;state.transients=[];state.slices=[];
  state.scenes=[null,null,null,null];state.scene=0;
  if(purgeLegacy){
    await Promise.all([
      ...Array.from({length:8},(_,i)=>opfsDelete(`loops/${i}.wav`)),
      ...Array.from({length:8},(_,i)=>opfsDelete(`simple-sounds/${i}.audio`)),
      opfsDelete('imports/current.bin'),
      opfsDelete('imports/current-name.txt')
    ]);
    localStorage.removeItem('twisSimpleAuto');localStorage.removeItem('twisSimpleSessions');
    for(let i=0;i<8;i++)localStorage.removeItem(`twisSimpleSound${i}`);
    for(let i=0;i<4;i++)localStorage.removeItem(`twisLoopScene${i}`);
    localStorage.twisLoopDeckV2=JSON.stringify({latencyOffsetMs:state.latencyOffsetMs,syncMode:state.syncMode});
  }
  disableMic();renderLoops();renderSeq();drawWave();
  const dur=$('#ldDur'),guess=$('#ldGuess'),slices=$('#ldSlicesN');
  if(dur)dur.textContent='0:00';if(guess)guess.textContent='—';if(slices)slices.textContent='0';
  status('Session cleared. Nothing recorded or imported is saved for next time.');
}
async function purgeLegacyAutosaves(){
  if(localStorage.twisEphemeralLoopsV1==='1')return;
  await Promise.all([
    ...Array.from({length:8},(_,i)=>opfsDelete(`loops/${i}.wav`)),
    opfsDelete('imports/current.bin'),
    opfsDelete('imports/current-name.txt')
  ]);
  localStorage.removeItem('twisSimpleAuto');localStorage.removeItem('twisSimpleSessions');
  for(let i=0;i<8;i++)localStorage.removeItem(`twisSimpleSound${i}`);
  for(let i=0;i<4;i++)localStorage.removeItem(`twisLoopScene${i}`);
  localStorage.twisEphemeralLoopsV1='1';
}
function sceneData(){return {bpm:state.bpm,pattern:state.pattern,ratchets:state.ratchets,loopPlay:state.loops.map(x=>x.playing)};}
function saveScene(i){state.scenes[i]=JSON.parse(JSON.stringify(sceneData()));localStorage.setItem(`twisLoopScene${i}`,JSON.stringify(state.scenes[i]));status(`Scene ${i+1} saved.`);}
function loadScene(i){let s=state.scenes[i];if(!s){try{s=JSON.parse(localStorage.getItem(`twisLoopScene${i}`));}catch{}}if(!s)return saveScene(i);state.bpm=s.bpm||state.bpm;state.pattern=s.pattern||state.pattern;state.ratchets=s.ratchets||state.ratchets;$('#ldBpm').value=state.bpm;renderSeq();state.loops.forEach((l,k)=>{if(s.loopPlay?.[k]&&!l.playing&&l.buffer)startLoop(k,true);if(!s.loopPlay?.[k]&&l.playing)toggleLoop(k);});state.scene=i;$$('.ld-scene').forEach((b,k)=>b.classList.toggle('active',k===i));status(`Scene ${i+1} launched.`);}
function setBpm(v){state.bpm=clamp(Math.round(Number(v)||100),40,240);clock().setBpm(state.bpm,state.ctx?.currentTime);$('#ldBpm').value=state.bpm;saveMeta();}
function tapTempo(){const n=performance.now();state.tap=state.tap.filter(t=>n-t<2500);state.tap.push(n);if(state.tap.length>1){const gaps=state.tap.slice(1).map((t,i)=>t-state.tap[i]),avg=gaps.reduce((a,b)=>a+b,0)/gaps.length;setBpm(60000/avg);}if(navigator.vibrate)navigator.vibrate(8);}
function saveMeta(){localStorage.twisLoopDeckV2=JSON.stringify({latencyOffsetMs:state.latencyOffsetMs,syncMode:state.syncMode});}
function loadMeta(){try{const m=JSON.parse(localStorage.twisLoopDeckV2||'{}');if(Number.isFinite(m.latencyOffsetMs))state.latencyOffsetMs=m.latencyOffsetMs;if(m.syncMode)state.syncMode=m.syncMode;}catch{}}
function download(blob,name){const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000);}
function captureMix(){if(state.mixRecorder){state.mixRecorder.stop();return;}try{state.mixChunks=[];state.mixRecorder=new MediaRecorder(state.streamDest.stream);state.mixRecorder.ondataavailable=e=>e.data.size&&state.mixChunks.push(e.data);state.mixRecorder.onstop=()=>{const blob=new Blob(state.mixChunks,{type:state.mixRecorder.mimeType});download(blob,`twis-loop-deck-${Date.now()}.webm`);state.mixRecorder=null;$('#ldMixRec').textContent='CAPTURE MIX';status('Mix captured locally.');};state.mixRecorder.start();$('#ldMixRec').textContent='STOP + EXPORT';status('Capturing master mix…');}catch{status('Mix capture unsupported here.');}}
function stutter(div,on){if(!state.delay)return;const now=audio().currentTime;state.delay.delayTime.setTargetAtTime((60/state.bpm)*(4/div),now,.01);state.delayFeedback?.gain.setTargetAtTime(on?.34:0,now,.02);state.delayWet?.gain.setTargetAtTime(on?.28:0,now,.02);if(on){state.filter.frequency.setTargetAtTime(4200,now,.01);}else state.filter.frequency.setTargetAtTime(Number($('#ldCutoff')?.value||18000),now,.04);}
async function midiEnable(){if(!navigator.requestMIDIAccess)return status('Web MIDI is not available in this browser.');try{state.midi=await navigator.requestMIDIAccess();for(const input of state.midi.inputs.values())input.onmidimessage=e=>{const [st,n,v]=e.data;if((st&0xf0)===0x90&&v){const pad=n-36;if(pad>=0&&pad<16)triggerPad(pad,v/127);}if((st&0xf0)===0xb0&&n===1){const hz=120*Math.pow(18000/120,v/127);state.filter.frequency.setTargetAtTime(hz,audio().currentTime,.01);$('#ldCutoff').value=hz;}};status('MIDI enabled · notes 36–51 → pads · mod wheel → filter.');}catch{status('MIDI permission not granted.');}}
function buildUI(){if($('#twisLoopDeck'))return;const host=document.createElement('div');host.id='twisLoopDeck';host.className='twis-loopdeck';host.innerHTML=`<div class="ld-top"><div class="ld-brand">TWIS LOOP DECK <small>V2 · SALVAGE ENGINE</small></div><div class="ld-transport"><button id="ldPlay" class="ld-btn ld-play">▶</button><div><input id="ldBpm" class="ld-bpm" type="number" min="40" max="240" value="${state.bpm}"><div class="ld-mini">BPM</div></div><button id="ldTap" class="ld-btn">TAP</button></div><button id="ldClose" class="ld-close">×</button></div><div class="ld-body">
<div class="ld-page active" data-page="loop"><div class="ld-section"><h3>LIVE LOOPS · QUANTIZED + PHASE LOCKED</h3><div class="ld-toolbar"><button id="ldMicEnable" class="ld-btn primary">MIC OFF · TAP TO TURN ON</button><button id="ldMixRec" class="ld-btn">CAPTURE MIX</button><button id="ldMidi" class="ld-btn">MIDI</button><button id="ldClearAll" class="ld-btn danger">CLEAR ALL LOOPS</button></div><div class="ld-scenes">${[0,1,2,3].map(i=>`<button class="ld-scene ${i===0?'active':''}" data-scene="${i}">S${i+1}</button>`).join('')}</div><div class="ld-loops" id="ldLoops"></div><div class="ld-mixrow"><span>REC OFFSET</span><input id="ldOffset" type="range" min="0" max="250" step="1" value="${state.latencyOffsetMs}"><span id="ldOffsetV">${state.latencyOffsetMs}ms</span></div></div></div>
<div class="ld-page" data-page="pads"><div class="ld-section"><h3>16-PAD KIT</h3><div class="ld-grid" id="ldPads"></div></div></div>
<div class="ld-page" data-page="seq"><div class="ld-section"><h3>SEQUENCER · TAP=VELOCITY · HOLD=RATCHET</h3><div class="ld-toolbar"><button id="ldSeqClear" class="ld-btn danger">CLEAR</button><button id="ldSeqRandom" class="ld-btn">RANDOM</button></div><div id="ldSeq"></div></div></div>
<div class="ld-page" data-page="import"><div class="ld-section"><h3>SMART LOOP LAB · LOCAL ONLY</h3><div class="ld-import"><input id="ldFile" type="file" accept="audio/*"><p>Song stays on this device. OPFS persistence when supported.</p></div><canvas id="ldWave" class="ld-wave" width="900" height="220"></canvas><div class="ld-stat"><div><b id="ldDur">0:00</b><span>DURATION</span></div><div><b id="ldGuess">—</b><span>BPM</span></div><div><b id="ldSlicesN">0</b><span>SLICES</span></div></div><div class="ld-toolbar"><button id="ldAnalyze" class="ld-btn primary">ANALYZE</button><select id="ldSliceMode"><option>TRANSIENTS</option><option>1 BEAT</option><option>2 BEATS</option><option selected>1 BAR</option><option>2 BARS</option><option>4 BARS</option><option>EQUAL 8</option><option>EQUAL 16</option></select><button id="ldBuildKit" class="ld-btn">BUILD KIT</button></div><div class="ld-slices" id="ldSlices"></div></div></div>
<div class="ld-page" data-page="mix"><div class="ld-section"><h3>PERFORMANCE</h3><div class="ld-mixrow"><span>MASTER</span><input id="ldMaster" type="range" min="0" max="1.2" step=".01" value="${state.masterVolume}"><span id="ldMasterV">${Math.round(state.masterVolume*100)}%</span></div><div class="ld-mixrow"><span>CUTOFF</span><input id="ldCutoff" type="range" min="120" max="18000" step="10" value="18000"><span>LPF</span></div><div class="ld-xy" id="ldXY"><div class="ld-xy-dot" id="ldXYDot"></div></div><div class="ld-toolbar">${[2,4,8,16].map(x=>`<button class="ld-btn" data-stutter="${x}">1/${x}</button>`).join('')}</div><p class="ld-mini">Current tempo-fit for imported slices: REPITCH. Pitch-preserving Signalsmith module is rights-clean and staged next, but this control does not pretend it is active yet.</p></div></div>
<div id="ldStatus" class="ld-status">Tap PLAY or a pad to unlock audio.</div></div><div class="ld-tabs">${['loop','pads','seq','import','mix'].map((n,i)=>`<button class="ld-tab ${i===0?'active':''}" data-tab="${n}">${n.toUpperCase()}</button>`).join('')}</div>`;host.addEventListener('pointerdown',protectStorage,{once:true,capture:true});document.body.appendChild(host);renderPads();renderLoops();renderSeq();bind();}
function bind(){
  $('#ldClose').onclick=()=>$('#twisLoopDeck').remove();$('#ldPlay').onclick=()=>state.playing?stop():play();$('#ldBpm').onchange=e=>setBpm(e.target.value);$('#ldTap').onclick=tapTempo;$('#ldMicEnable').onclick=toggleMic;$('#ldMixRec').onclick=captureMix;$('#ldMidi').onclick=midiEnable;$('#ldClearAll').onclick=()=>clearSession({purgeLegacy:true});
  $$('.ld-tab').forEach(b=>b.onclick=()=>{$$('.ld-tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.ld-page').forEach(x=>x.classList.toggle('active',x.dataset.page===b.dataset.tab));});
  $$('.ld-scene').forEach((b,i)=>{let t;b.onpointerdown=()=>t=setTimeout(()=>{saveScene(i);t=null;},650);b.onpointerup=()=>{if(t){clearTimeout(t);loadScene(i);}};});
  $('#ldOffset').oninput=e=>{state.latencyOffsetMs=Number(e.target.value);$('#ldOffsetV').textContent=`${state.latencyOffsetMs}ms`;localStorage.twisLoopOffsetMs=state.latencyOffsetMs;saveMeta();};
  $('#ldSeqClear').onclick=()=>{state.pattern.forEach(r=>r.fill(0));state.ratchets.forEach(r=>r.fill(1));renderSeq();saveMeta();};$('#ldSeqRandom').onclick=()=>{state.pattern.forEach((r,p)=>r.forEach((_,s)=>r[s]=Math.random()<(p===0?(s%4===0?.85:.08):p===1?(s%8===4?.8:.06):p<4?.22:.04)?(.5+Math.random()*.5):0));renderSeq();saveMeta();};
  $('#ldFile').onchange=e=>e.target.files?.[0]&&importFile(e.target.files[0]);$('#ldAnalyze').onclick=analyzeImport;$('#ldSliceMode').onchange=e=>{state.sliceMode=e.target.value;if(state.bpmGuess)makeSlices(state.sliceMode);};$('#ldBuildKit').onclick=buildKit;
  $('#ldMaster').oninput=e=>{state.masterVolume=Number(e.target.value);audio().resume();state.master.gain.setTargetAtTime(state.masterVolume,audio().currentTime,.02);$('#ldMasterV').textContent=`${Math.round(state.masterVolume*100)}%`;};$('#ldCutoff').oninput=e=>state.filter?.frequency.setTargetAtTime(Number(e.target.value),audio().currentTime,.02);
  const xy=$('#ldXY');xy.onpointermove=e=>{if(!e.buttons)return;const r=xy.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width,0,1),y=clamp((e.clientY-r.top)/r.height,0,1),hz=120*Math.pow(18000/120,x);audio();state.filter.frequency.setTargetAtTime(hz,audio().currentTime,.01);state.filter.Q.setTargetAtTime(.5+(1-y)*12,audio().currentTime,.01);$('#ldXYDot').style.left=`${x*100}%`;$('#ldXYDot').style.top=`${y*100}%`;};
  $$('[data-stutter]').forEach(b=>{b.onpointerdown=()=>stutter(+b.dataset.stutter,true);b.onpointerup=b.onpointercancel=()=>stutter(+b.dataset.stutter,false);});
}
function formatTime(s){const m=Math.floor(s/60),ss=Math.floor(s%60);return `${m}:${String(ss).padStart(2,'0')}`;}
function outputPeak(){
  if(!state.analyser||!state.meterBuffer)return 0;
  state.analyser.getFloatTimeDomainData(state.meterBuffer);
  let p=0;for(let i=0;i<state.meterBuffer.length;i++)p=Math.max(p,Math.abs(state.meterBuffer[i]));return p;
}
function setEcho(on){
  const now=audio().currentTime;state.delay.delayTime.setTargetAtTime(60/state.bpm*.375,now,.02);
  state.delayFeedback.gain.setTargetAtTime(on?.32:0,now,.03);state.delayWet.gain.setTargetAtTime(on?.24:0,now,.03);
}
function setWash(on){
  const now=audio().currentTime;state.filter.frequency.setTargetAtTime(on?3200:18000,now,.08);
  state.filter.Q.setTargetAtTime(on?1.6:.7,now,.08);state.delayFeedback.gain.setTargetAtTime(on?.2:0,now,.05);state.delayWet.gain.setTargetAtTime(on?.18:0,now,.05);
}
function stopAll(){stop();}
function health(){
  return {
    version:'loop-core-sample-first-3',playing:state.playing,contextState:state.ctx?.state||'not-started',
    bpm:state.bpm,step:state.step,tickCount:state.tickCount,startCount:state.startCount,stopCount:state.stopCount,sonicPackState:state.sonicPackState||'LOCAL',
    peak:outputPeak(),transport:clock().snapshot(state.ctx?.currentTime||0),sampledRoles:window.TWIS_SAMPLED_ROLE_ENGINE?.health?.()||null,
    roles:state.padMeta.slice(0,8).map((m,i)=>({i,role:m?.role||null,label:m?.label||state.padNames[i],sampled:!!m?.sampled,rootMidi:m?.rootMidi||null})),loops:state.loops.map((l,i)=>({state:alignLoopMachine(i).state,playing:l.playing,hasBuffer:!!l.buffer,recording:l.recording,armed:l.armed}))
  };
}
loadMeta();clock().setBpm(state.bpm);
window.TWIS_LOOP_DECK={
  open:async()=>{buildUI();$('#ldBpm').value=state.bpm;status('Fresh session. Recordings and imports are temporary unless you explicitly export them.');purgeLegacyAutosaves().catch(()=>{});},
  state,analyzeLocal,health,
  commands:{play,stop:stopAll,clearSession,toggleMic,disableMic,setBpm,triggerPad,nextGrid,barSec,queueBarAction,setEcho,setWash,stutter}
};
})();
