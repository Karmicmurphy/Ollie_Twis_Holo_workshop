(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STEMS=['KICK','BASS','PERC','CHORDS','MELODY','ATMOS','VOCAL','FX'];
const active={KICK:1,BASS:1,PERC:1,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:0,FX:1};
const roots={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
const scales={MINOR:[0,2,3,5,7,8,10],DORIAN:[0,2,3,5,7,9,10],PHRYGIAN:[0,1,3,5,7,8,10]};
const sampleURL={
 kick:'https://cdn.jsdelivr.net/gh/Boochi44/free-drum-samples@main/drum-samples/02-bounce/kicks/bounce-kick-01.wav',
 clap:'https://cdn.jsdelivr.net/gh/Boochi44/free-drum-samples@main/drum-samples/02-bounce/claps/clap-01.wav',
 hat:'https://cdn.jsdelivr.net/gh/Boochi44/free-drum-samples@main/drum-samples/02-bounce/hi-hats/hi-hat-closed-01.wav',
 openhat:'https://cdn.jsdelivr.net/gh/Boochi44/free-drum-samples@main/drum-samples/02-bounce/open-hats/open-hat-01.wav',
 impact:'https://cdn.jsdelivr.net/gh/Boochi44/free-drum-samples@main/drum-samples/02-bounce/fx/fx-cymbal.wav',
 vocal:'https://cdn.jsdelivr.net/gh/n33kos/kokoro-voices@main/samples/am_ash.wav'
};
const scenes={
 INTRO:{KICK:0,BASS:0,PERC:0,CHORDS:1,MELODY:0,ATMOS:1,VOCAL:1,FX:1,e:.22,s:.72,f:.58,t:.15},
 DEEP:{KICK:1,BASS:1,PERC:1,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:0,FX:1,e:.48,s:.48,f:.92,t:.28},
 LIFT:{KICK:1,BASS:1,PERC:1,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:1,FX:1,e:.68,s:.45,f:.96,t:.52},
 BREAK:{KICK:0,BASS:0,PERC:0,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:1,FX:1,e:.34,s:.82,f:.62,t:.62},
 PEAK:{KICK:1,BASS:1,PERC:1,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:1,FX:1,e:.9,s:.42,f:1,t:.8},
 OUTRO:{KICK:0,BASS:0,PERC:0,CHORDS:1,MELODY:0,ATMOS:1,VOCAL:0,FX:1,e:.18,s:.86,f:.44,t:.08}
};
const patterns=[
 {prog:[0,5,3,6],motif:[0,null,2,4,null,2,5,4,2,null,1,2,null,4,2,null]},
 {prog:[0,3,5,4],motif:[4,null,3,2,0,null,2,3,5,null,4,2,null,1,2,null]},
 {prog:[0,6,5,3],motif:[0,4,null,2,5,null,4,2,1,null,6,4,null,2,1,null]},
 {prog:[0,4,3,5],motif:[0,null,2,3,4,null,2,0,5,null,4,3,2,null,1,null]}
];
let variation=0, progression=patterns[0].prog.slice(), motif=patterns[0].motif.slice();
let audio=null,running=false,step=0,bar=0,queuedScene=null,packState='NOT LOADED',loopStarted=false,buildState=null;

function say(t){$('#status').textContent=t}
function diag(){const ctx=audio?Tone.getContext().state.toUpperCase():'NOT STARTED';$('#diag').textContent='AUDIO: '+ctx+' · PACK: '+packState}
function v(id){return +$('#'+id).value}
function degreeNote(deg,oct){
 const sc=scales[$('#scale').value],root=roots[$('#key').value],i=((deg%7)+7)%7,shift=Math.floor(deg/7);
 return Tone.Frequency(12*(oct+1)+root+sc[i]+12*shift,'midi').toNote();
}
function chordNotes(d,b){
 const inversion=b%4===3?1:(b%4===1?0:0);
 let ds=[d,d+2,d+4,d+6]; if(inversion){ds=[d+2,d+4,d+6,d+7]}
 return ds.map((x,i)=>degreeNote(x, i===3?4:3));
}
function setStem(n,on){
 active[n]=on?1:0;
 if(audio?.g[n])audio.g[n].gain.rampTo(on?1:0,.06);
 $('[data-stem="'+n+'"]')?.classList.toggle('on',!!on);
}
function applyMacros(){
 ['energy','space','filter','tension'].forEach(id=>$('#'+id+'V').textContent=Math.round(v(id)*100));
 if(!audio)return;
 const e=v('energy'),s=v('space'),f=v('filter'),t=v('tension');
 audio.reverb.wet.rampTo(.12+s*.58,.08);
 audio.delay.wet.rampTo(.05+t*.34,.08);
 audio.masterLP.frequency.rampTo(650+f*17500,.1);
 audio.sat.wet.rampTo(.08+e*.2,.1);
 audio.atmosGain.gain.rampTo(.018+s*.055,.12);
 audio.lead.volume.rampTo(-22+e*11,.08);
}
function duck(time){
 ['BASS','CHORDS','MELODY','ATMOS'].forEach(n=>{
   const g=audio.duck[n].gain;g.cancelScheduledValues(time);g.setValueAtTime(Math.max(g.value,.99),time);g.linearRampToValueAtTime(.5,time+.006);g.exponentialRampToValueAtTime(.999,time+.21);
 });
}
function oneShot(player,fallback,time,vel=1,offset=0,dur){
 if(player?.loaded){
   try{player.volume.value=Tone.gainToDb(Math.max(.05,vel));player.start(time,offset,dur);return}catch(e){}
 }
 fallback?.();
}
async function initAudio(){
 if(audio)return audio;
 await Tone.start();
 const limiter=new Tone.Limiter(-1).toDestination();
 const comp=new Tone.Compressor({threshold:-18,ratio:3,attack:.01,release:.16}).connect(limiter);
 const sat=new Tone.Distortion({distortion:.12,wet:.14}).connect(comp);
 const masterLP=new Tone.Filter(17500,'lowpass').connect(sat);
 const dry=new Tone.Gain(.9).connect(masterLP);
 const reverb=new Tone.Reverb({decay:6.5,preDelay:.035,wet:.4}).connect(masterLP);
 const delay=new Tone.FeedbackDelay('8n.',.28).connect(reverb);
 const g={},duckBus={};
 STEMS.forEach(n=>g[n]=new Tone.Gain(active[n]?1:0).connect(dry));
 ['BASS','CHORDS','MELODY','ATMOS'].forEach(n=>duckBus[n]=new Tone.Gain(1).connect(g[n]));

 const fallbackKick=new Tone.MembraneSynth({pitchDecay:.025,octaves:5,envelope:{attack:.001,decay:.23,sustain:0,release:.04}}).connect(g.KICK);
 const fallbackHat=new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.001,decay:.025,sustain:0}}).connect(new Tone.Filter(7500,'highpass').connect(new Tone.Gain(.055).connect(g.PERC)));
 const fallbackClap=new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:.001,decay:.08,sustain:0}}).connect(new Tone.Filter(1500,'highpass').connect(new Tone.Gain(.055).connect(reverb)));

 const sub=new Tone.Synth({oscillator:{type:'sine'},envelope:{attack:.005,decay:.12,sustain:.58,release:.22}}).connect(new Tone.Gain(.42).connect(duckBus.BASS));
 const bass=new Tone.MonoSynth({oscillator:{type:'fatsawtooth',count:2,spread:9},filter:{Q:1.7,type:'lowpass',rolloff:-24},envelope:{attack:.005,decay:.14,sustain:.25,release:.24},filterEnvelope:{attack:.004,decay:.16,sustain:.16,release:.2,baseFrequency:70,octaves:3.8}}).connect(new Tone.Gain(.24).connect(duckBus.BASS));

 const padFilter=new Tone.Filter(4200,'lowpass').connect(new Tone.Gain(.18).connect(reverb));
 const pad=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'fatsawtooth',count:3,spread:22},envelope:{attack:.38,decay:.65,sustain:.42,release:2.5}}).connect(padFilter);
 const pluck=new Tone.PluckSynth({attackNoise:.65,dampening:3800,resonance:.88}).connect(new Tone.Gain(.12).connect(delay));
 const lead=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'fatsine',count:2,spread:8},envelope:{attack:.012,decay:.16,sustain:.08,release:.52}}).connect(new Tone.Gain(.18).connect(delay));

 const atmosNoise=new Tone.Noise('pink');
 const atmosAuto=new Tone.AutoFilter({frequency:.045,baseFrequency:180,octaves:4,depth:.8}).start();
 const atmosGain=new Tone.Gain(.04);
 const surf=new Tone.LFO({frequency:.07,min:.015,max:.075}).start();surf.connect(atmosGain.gain);
 atmosNoise.connect(new Tone.Filter(1250,'lowpass')).connect(atmosAuto).connect(atmosGain).connect(duckBus.ATMOS);atmosNoise.start();

 const vocalFilter=new Tone.Filter({type:'bandpass',frequency:1100,Q:2.2}).connect(new Tone.Gain(.18).connect(delay));
 const players={};
 Object.entries(sampleURL).forEach(([k,url])=>{
   players[k]=new Tone.Player({url,fadeIn:.005,fadeOut:.03}).connect(k==='kick'?g.KICK:k==='vocal'?vocalFilter:(k==='impact'?reverb:g.PERC));
   players[k].retrigger=true;
 });

 audio={limiter,comp,sat,masterLP,dry,reverb,delay,g,duck:duckBus,fallbackKick,fallbackHat,fallbackClap,sub,bass,pad,padFilter,pluck,lead,atmosNoise,atmosAuto,atmosGain,surf,vocalFilter,players};
 packState='LOADING';diag();
 const packLoad=Tone.loaded()
   .then(()=>{packState='READY';diag();return true;})
   .catch(()=>{packState='FALLBACK OK';diag();return false;});
 await Promise.race([
   packLoad,
   new Promise(r=>setTimeout(()=>{if(packState==='LOADING'){packState='FALLBACK OK';diag();}r(false)},7000))
 ]);
 audio.loop=new Tone.Loop(tick,'16n');
 Tone.Transport.bpm.value=+$('#bpm').value;
 applyMacros();
 return audio;
}
function queueScene(name){queuedScene=name;say(name+' queued for next bar.')}
function commitScene(name){
 const sc=scenes[name];STEMS.forEach(n=>setStem(n,!!sc[n]));
 [['energy','e'],['space','s'],['filter','f'],['tension','t']].forEach(([id,k])=>$('#'+id).value=sc[k]);
 applyMacros();$$('.scene').forEach(b=>b.classList.toggle('on',b.dataset.scene===name));say(name+' scene LIVE.');
}
function tick(time){
 if(!audio)return;
 const s=step%16;bar=Math.floor(step/16);
 if(s===0 && queuedScene){const n=queuedScene;queuedScene=null;Tone.Draw.schedule(()=>commitScene(n),time);}
 const d=progression[bar%progression.length],e=v('energy');
 if(active.KICK && [0,4,8,12].includes(s)){
   oneShot(audio.players.kick,()=>audio.fallbackKick.triggerAttackRelease('C1','8n',time,.9),time,.86);duck(time);
 }
 if(active.PERC && [2,6,10,14].includes(s))oneShot(audio.players.hat,()=>audio.fallbackHat.triggerAttackRelease('32n',time,.4),time,.35+(s===14?.12:0));
 if(active.PERC && [4,12].includes(s))oneShot(audio.players.clap,()=>audio.fallbackClap.triggerAttackRelease('16n',time,.35),time,.32);
 if(active.PERC && e>.6 && s===15)oneShot(audio.players.openhat,null,time,.27);

 if(active.BASS && [0,3,6,8,11,14].includes(s)){
   const walk=(s===14&&bar%2===1)?4:0,n=degreeNote(d+walk,2);
   audio.sub.triggerAttackRelease(n,s===14?'8n':'16n',time,.55);
   audio.bass.triggerAttackRelease(n,s===14?'8n':'16n',time,.42);
 }
 if(active.CHORDS && s===0)audio.pad.triggerAttackRelease(chordNotes(d,bar),'1m',time,.38);
 if(active.CHORDS && e>.42 && [3,7,11,15].includes(s))audio.pluck.triggerAttack(degreeNote(d+((s+bar)%5),4),time,.34);

 if(active.MELODY && s%2===0){
   const m=motif[(bar*8+s/2)%motif.length];
   if(m!==null)audio.lead.triggerAttackRelease(degreeNote(d+m,4),s===14?'8n':'16n',time,.3+e*.14);
 }
 if(active.VOCAL && s===0 && bar%8===4)oneShot(audio.players.vocal,null,time,.22,.25,.9);
 if(active.FX && s===15 && bar%8===7)oneShot(audio.players.impact,null,time,.22);

 if(buildState){
   const elapsed=bar-buildState.startBar,progress=Math.min(1,elapsed/buildState.bars);
   Tone.Draw.schedule(()=>{audio.masterLP.frequency.rampTo(1500+progress*3500,.15);audio.reverb.wet.rampTo(.5+progress*.25,.15);},time);
   if(elapsed>=buildState.bars){buildState=null;Tone.Draw.schedule(()=>{$('#build').classList.remove('on');queueScene('PEAK');say('BUILD complete · PEAK queued.');},time);}
 }
 step++;
 Tone.Draw.schedule(()=>$('#clock').textContent='BAR '+String(bar+1).padStart(2,'0')+' · '+String(s+1).padStart(2,'0'),time);
}
async function start(){
 if(running)return;
 say('Starting audio and loading sound pack…');
 await initAudio();
 if(Tone.getContext().state!=='running')await Tone.getContext().resume();
 if(!loopStarted){audio.loop.start(0);loopStarted=true}
 Tone.Transport.start('+0.05');running=true;$('#play').textContent='■ STOP SET';diag();say(packState==='READY'?'DEEP set running with CC0 performance pack.':'DEEP set running · sample fallback is active where needed.');
}
function stop(){if(!running)return;Tone.Transport.stop();Tone.Transport.position=0;step=0;bar=0;running=false;$('#play').textContent='▶ PLAY SET';$('#clock').textContent='SILENT';say('Stopped.');diag()}
async function ensure(){if(!running)await start()}
async function vocalHit(){await ensure();oneShot(audio.players.vocal,null,Tone.now(),.3,.2,1.2);$('#vocalHit').classList.add('on');setTimeout(()=>$('#vocalHit').classList.remove('on'),300)}
async function build(){await ensure();buildState={startBar:bar,bars:4};$('#build').classList.add('on');say('4-bar build started.')}
async function drop(){await ensure();buildState=null;queueScene('PEAK');audio.masterLP.frequency.rampTo(18000,.08);oneShot(audio.players.impact,null,Tone.now(),.55);$('#drop').classList.add('on');setTimeout(()=>$('#drop').classList.remove('on'),250)}
async function echo(){await ensure();$('#echo').classList.toggle('on');audio.delay.wet.rampTo($('#echo').classList.contains('on')?.58:.12,.1)}
async function wash(){await ensure();$('#wash').classList.toggle('on');const on=$('#wash').classList.contains('on');audio.reverb.wet.rampTo(on?.86:.4,.15);audio.masterLP.frequency.rampTo(on?4200:650+v('filter')*17500,.15)}
async function mutate(){await ensure();variation=(variation+1)%patterns.length;progression=patterns[variation].prog.slice();motif=patterns[variation].motif.slice();$('#variation').classList.add('on');setTimeout(()=>$('#variation').classList.remove('on'),250);say('Musical variation '+(variation+1)+' loaded for next phrases.')}
function reset(){variation=0;progression=patterns[0].prog.slice();motif=patterns[0].motif.slice();commitScene('DEEP');$('#echo').classList.remove('on');$('#wash').classList.remove('on');say('Set reset to DEEP.')}
function ui(){
 const subtitles={KICK:'REAL ONE-SHOT',BASS:'SUB + ROLL',PERC:'HATS + CLAP',CHORDS:'4-BAR VOICING',MELODY:'PHRASED MOTIF',ATMOS:'OCEAN + AIR',VOCAL:'CC0 VOICE',FX:'IMPACT + THROWS'};
 $('#stems').innerHTML=STEMS.map(n=>'<button class="stem '+(active[n]?'on':'')+'" data-stem="'+n+'">'+n+'<small>'+subtitles[n]+'</small></button>').join('');
 $$('#stems button').forEach(b=>b.onclick=async()=>{await ensure();setStem(b.dataset.stem,!active[b.dataset.stem]);say(b.dataset.stem+' '+(active[b.dataset.stem]?'ON':'OFF'));});
 $('#mixer').innerHTML=['KICK','BASS','PERC','MUSIC','VOCAL','MASTER'].map((n,i)=>'<div class="chan">'+n+'<input type="range" min="0" max="1" step=".01" value="'+(i===5?'.94':'.78')+'" data-mix="'+n+'"></div>').join('');
 $$('[data-mix]').forEach(el=>el.oninput=async()=>{await ensure();const n=el.dataset.mix,val=+el.value;if(n==='MASTER')audio.limiter.volume.rampTo((val-1)*16,.05);else if(n==='MUSIC'){['CHORDS','MELODY','ATMOS'].forEach(k=>audio.g[k].gain.rampTo(val,.05));}else if(audio.g[n])audio.g[n].gain.rampTo(val,.05);});
 $('#play').onclick=async()=>running?stop():await start();
 $$('.scene').forEach(b=>b.onclick=async()=>{await ensure();queueScene(b.dataset.scene)});
 ['energy','space','filter','tension'].forEach(id=>$('#'+id).oninput=async()=>{await ensure();applyMacros()});
 $('#bpm').onchange=async()=>{await ensure();Tone.Transport.bpm.rampTo(+$('#bpm').value,.2)};
 $('#key').onchange=async()=>{await ensure();say('Key '+$('#key').value+' · phrase engine stays harmonic.')};
 $('#scale').onchange=async()=>{await ensure();say($('#scale').value+' mode.')};
 $('#build').onclick=build;$('#drop').onclick=drop;$('#echo').onclick=echo;$('#wash').onclick=wash;$('#vocalHit').onclick=vocalHit;$('#variation').onclick=mutate;$('#reset').onclick=reset;
 $('#loops').onclick=()=>location.href='loop-deck.html';
 applyMacros();diag();
}
window.addEventListener('error',e=>{say('Audio/UI error: '+(e.message||'unknown'));$('#diag').textContent+=' · ERROR';});
window.addEventListener('unhandledrejection',e=>{say('Load/audio error: '+((e.reason&&e.reason.message)||'unknown')+' · fallback should remain usable.');packState='FALLBACK OK';diag();});
ui();
})();