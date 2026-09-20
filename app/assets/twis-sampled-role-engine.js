(()=>{
'use strict';

const SOURCE_BASE='https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/';
const ROLE_CONFIG={
  BASS:{
    instrument:'synth_bass_1',
    targets:[34,36,38,41,43,45,46,48,50,53],
    level:.58,cutoff:1550,attack:.003,release:.09,pan:0
  },
  PAD:{
    instrument:'pad_2_warm',
    targets:[46,48,49,50,51,53,55,56,57,58,60,63],
    level:.24,cutoff:4600,attack:.07,release:.28,pan:-.06
  },
  MELODY:{
    instrument:'lead_2_sawtooth',
    targets:[60,62,65,67,69,72],
    level:.25,cutoff:3300,attack:.006,release:.16,pan:.08
  }
};

let ctx=null;
let destination=null;
let tonalBus=null;
let statusFn=()=>{};
const roles=new Map();
const activeSources=new Set();

function noteNameToMidi(name){
  const m=/^([A-G])([#b]?)(-?\d+)$/.exec(String(name||''));
  if(!m)return null;
  const semis={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  let n=semis[m[1]];
  if(m[2]==='#')n+=1;
  if(m[2]==='b')n-=1;
  return (Number(m[3])+1)*12+n;
}

function parseMidiJs(source){
  const header=source.indexOf('MIDI.Soundfont.');
  if(header<0)throw new Error('Invalid MIDI.js soundfont');
  const start=source.indexOf('=',header)+2;
  const end=source.lastIndexOf(',');
  return JSON.parse(source.slice(start,end)+'}');
}

function base64ToArrayBuffer(uri){
  const comma=uri.indexOf(',');
  const raw=atob(comma>=0?uri.slice(comma+1):uri);
  const out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out.buffer;
}

function nearest(list,target,keyFn=x=>x){
  let best=null,dist=Infinity;
  for(const item of list){
    const v=keyFn(item),d=Math.abs(v-target);
    if(d<dist){best=item;dist=d;}
  }
  return best;
}

function configure({context,output,onStatus}={}){
  if(context)ctx=context;
  if(output)destination=output;
  if(typeof onStatus==='function')statusFn=onStatus;
  if(ctx&&destination&&!tonalBus){
    tonalBus=ctx.createGain();
    tonalBus.gain.value=.92;
    tonalBus.connect(destination);
  }
  return api;
}

async function prepareRole(role){
  role=String(role||'').toUpperCase();
  const cfg=ROLE_CONFIG[role];
  if(!cfg)throw new Error('Unsupported sampled role '+role);
  if(!ctx||!destination)throw new Error('Sampled role engine is not configured');

  const current=roles.get(role);
  if(current?.ready)return current;
  if(current?.promise)return current.promise;

  const state={role,ready:false,error:null,samples:new Map(),promise:null};
  roles.set(role,state);

  state.promise=(async()=>{
    statusFn(role+' loading studio samples…');
    const url=SOURCE_BASE+cfg.instrument+'-mp3.js';
    const res=await fetch(url,{cache:'force-cache'});
    if(!res.ok)throw new Error('HTTP '+res.status+' loading '+cfg.instrument);
    const source=await res.text();
    const json=parseMidiJs(source);
    const available=Object.entries(json)
      .map(([name,uri])=>({name,uri,midi:noteNameToMidi(name)}))
      .filter(x=>Number.isFinite(x.midi));

    const selected=new Map();
    for(const target of cfg.targets){
      const src=nearest(available,target,x=>x.midi);
      if(src)selected.set(src.name,src);
    }

    const decoded=new Map();
    await Promise.all([...selected.values()].map(async src=>{
      try{
        const buffer=await ctx.decodeAudioData(base64ToArrayBuffer(src.uri));
        decoded.set(src.name,{buffer,midi:src.midi});
      }catch(err){
        console.warn('TWIS sampled role decode failed',role,src.name,err);
      }
    }));

    if(!decoded.size)throw new Error('No '+role+' samples decoded');

    for(const target of cfg.targets){
      const src=nearest([...decoded.values()],target,x=>x.midi);
      if(src)state.samples.set(target,src);
    }
    state.ready=true;
    state.promise=null;
    statusFn(role+' ready · sampled instrument loaded.');
    return state;
  })().catch(err=>{
    state.error=String(err?.message||err);
    state.promise=null;
    statusFn(role+' unavailable · check network, then tap '+role+' again.');
    throw err;
  });

  return state.promise;
}

function isReady(role){
  return !!roles.get(String(role||'').toUpperCase())?.ready;
}

function play(role,midi,time,velocity=.8,duration=.35){
  role=String(role||'').toUpperCase();
  const cfg=ROLE_CONFIG[role],state=roles.get(role);
  if(!cfg||!state?.ready||!ctx||!tonalBus)return false;

  const sourceInfo=nearest([...state.samples.entries()],midi,x=>x[0])?.[1];
  if(!sourceInfo?.buffer)return false;

  const src=ctx.createBufferSource();
  const gain=ctx.createGain();
  const filter=ctx.createBiquadFilter();
  const pan=ctx.createStereoPanner?ctx.createStereoPanner():null;
  const start=Math.max(ctx.currentTime+.001,Number(time)||ctx.currentTime);
  const dur=Math.max(.05,Number(duration)||.35);
  const amp=Math.max(.001,Math.min(1,velocity))*cfg.level;

  src.buffer=sourceInfo.buffer;
  src.playbackRate.value=Math.pow(2,(Number(midi)-sourceInfo.midi)/12);

  filter.type='lowpass';
  filter.frequency.value=cfg.cutoff;
  filter.Q.value=role==='BASS'?1.05:.7;

  gain.gain.setValueAtTime(.0001,start);
  gain.gain.linearRampToValueAtTime(amp,start+cfg.attack);
  const releaseStart=Math.max(start+cfg.attack+.02,start+dur-cfg.release);
  gain.gain.setValueAtTime(amp,releaseStart);
  gain.gain.exponentialRampToValueAtTime(.0001,start+dur);

  src.connect(filter).connect(gain);
  if(pan){
    pan.pan.value=cfg.pan;
    gain.connect(pan).connect(tonalBus);
  }else gain.connect(tonalBus);

  activeSources.add(src);
  src.onended=()=>activeSources.delete(src);
  src.start(start);
  src.stop(start+dur+.05);
  return true;
}

function duck(time,depth=.58,release=.14){
  if(!ctx||!tonalBus)return;
  const t=Math.max(ctx.currentTime+.001,Number(time)||ctx.currentTime);
  const g=tonalBus.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(Math.max(.01,g.value||.92),t);
  g.linearRampToValueAtTime(Math.max(.25,Math.min(.9,depth)),t+.008);
  g.exponentialRampToValueAtTime(.92,t+Math.max(.06,release));
}

function stopAll(){
  for(const src of [...activeSources]){
    try{src.stop();}catch{}
  }
  activeSources.clear();
}

function reset(){
  stopAll();
  roles.clear();
  statusFn('Sampled instruments reset.');
}

function health(){
  return {
    roles:Object.fromEntries(Object.keys(ROLE_CONFIG).map(role=>[role,{
      ready:isReady(role),
      loading:!!roles.get(role)?.promise,
      error:roles.get(role)?.error||null,
      decoded:roles.get(role)?.samples?.size||0
    }])),
    activeVoices:activeSources.size
  };
}

const api={configure,prepareRole,isReady,play,duck,stopAll,reset,health,ROLE_CONFIG};
window.TWIS_SAMPLED_ROLE_ENGINE=api;
})();