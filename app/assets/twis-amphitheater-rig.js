(()=>{'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const STEMS=['KICK','BASS','PERC','CHORDS','MELODY','ATMOS','VOCAL','FX'];
const active={KICK:1,BASS:1,PERC:1,CHORDS:1,MELODY:0,ATMOS:1,VOCAL:0,FX:1};
const scenes={
 INTRO:{KICK:0,BASS:0,PERC:0,CHORDS:1,MELODY:0,ATMOS:1,VOCAL:0,FX:1,e:.22,s:.65,f:.58,t:.12},
 DEEP:{KICK:1,BASS:1,PERC:1,CHORDS:1,MELODY:0,ATMOS:1,VOCAL:0,FX:1,e:.42,s:.48,f:.88,t:.25},
 LIFT:{KICK:1,BASS:1,PERC:1,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:0,FX:1,e:.62,s:.44,f:.92,t:.48},
 BREAK:{KICK:0,BASS:0,PERC:0,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:1,FX:1,e:.35,s:.78,f:.62,t:.58},
 PEAK:{KICK:1,BASS:1,PERC:1,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:1,FX:1,e:.88,s:.42,f:.98,t:.78},
 OUTRO:{KICK:0,BASS:0,PERC:0,CHORDS:1,MELODY:0,ATMOS:1,VOCAL:0,FX:1,e:.18,s:.82,f:.46,t:.08}
};
const roots={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
const scales={MINOR:[0,2,3,5,7,8,10],DORIAN:[0,2,3,5,7,9,10],PHRYGIAN:[0,1,3,5,7,8,10]};
let progression=[0,5,3,6], motif=[0,2,4,2,5,4,2,1], audio=null, running=false, step=0, bar=0, buildTimer=null;

function say(t){$('#status').textContent=t}
function val(id){return +$('#'+id).value}
function note(deg,oct){
 const sc=scales[$('#scale').value], root=roots[$('#key').value];
 const i=((deg%7)+7)%7, shift=Math.floor(deg/7);
 return Tone.Frequency(12*(oct+1)+root+sc[i]+12*shift,'midi').toNote();
}
function chord(d){return [note(d,3),note(d+2,3),note(d+4,3),note(d+6,4)]}
function stem(name,on){
 active[name]=on?1:0;
 if(audio?.g[name]) audio.g[name].gain.rampTo(on?1:0,.06);
 $('[data-stem="'+name+'"]')?.classList.toggle('on',!!on);
}
function duck(time){
 if(!audio)return;
 ['BASS','CHORDS','MELODY','ATMOS'].forEach(n=>{
   const g=audio.duck[n].gain;
   g.cancelScheduledValues(time); g.setValueAtTime(g.value,time); g.linearRampToValueAtTime(.42,time+.008); g.exponentialRampToValueAtTime(.999,time+.19);
 });
}
function macros(){
 ['energy','space','filter','tension'].forEach(id=>$('#'+id+'V').textContent=Math.round(val(id)*100));
 if(!audio)return;
 const e=val('energy'),s=val('space'),f=val('filter'),t=val('tension');
 audio.reverb.wet.rampTo(.18+s*.64,.08);
 audio.delay.wet.rampTo(.08+t*.46,.08);
 audio.masterFilter.frequency.rampTo(500+f*17500,.1);
 audio.bass.filterEnvelope.octaves=2.6+e*3.4;
 audio.lead.volume.rampTo(-22+e*12,.08);
 audio.atmosGain.gain.rampTo(.025+s*.08,.12);
 audio.fxGain.gain.rampTo(.15+t*.55,.12);
}
async function init(){
 if(audio)return audio;
 await Tone.start();
 const limiter=new Tone.Limiter(-1).toDestination();
 const comp=new Tone.Compressor(-16,3).connect(limiter);
 const masterFilter=new Tone.Filter(17000,'lowpass').connect(comp);
 const dry=new Tone.Gain(.92).connect(masterFilter);
 const reverb=new Tone.Reverb({decay:7.2,wet:.42}).connect(masterFilter);
 const delay=new Tone.FeedbackDelay('8n.',.34).connect(reverb);

 const g={},duckBus={};
 STEMS.forEach(n=>g[n]=new Tone.Gain(active[n]?1:0).connect(dry));
 ['BASS','CHORDS','MELODY','ATMOS'].forEach(n=>{duckBus[n]=new Tone.Gain(1).connect(g[n])});

 const kick=new Tone.MembraneSynth({pitchDecay:.035,octaves:7,envelope:{attack:.001,decay:.34,sustain:0,release:.05}}).connect(g.KICK);
 const kickClick=new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.001,decay:.012,sustain:0}}).connect(new Tone.Filter(3200,'highpass').connect(new Tone.Gain(.06).connect(g.KICK)));

 const bass=new Tone.MonoSynth({oscillator:{type:'fatsawtooth',count:2,spread:10},filter:{Q:2.2,type:'lowpass',rolloff:-24},envelope:{attack:.008,decay:.16,sustain:.38,release:.36},filterEnvelope:{attack:.006,decay:.2,sustain:.2,release:.3,baseFrequency:55,octaves:4.4}}).connect(duckBus.BASS);

 const hat=new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.001,decay:.035,sustain:0}}).connect(new Tone.Filter(7000,'highpass').connect(new Tone.Gain(.085).connect(g.PERC)));
 const clap=new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:.001,decay:.12,sustain:0}}).connect(new Tone.Filter(1300,'highpass').connect(new Tone.Gain(.09).connect(reverb)));
 const tom=new Tone.MembraneSynth({pitchDecay:.04,octaves:3,envelope:{attack:.001,decay:.18,sustain:0,release:.08}}).connect(new Tone.Gain(.22).connect(g.PERC));

 const pad=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'fatsawtooth',count:3,spread:18},envelope:{attack:.55,decay:.8,sustain:.58,release:3.4}}).connect(new Tone.Filter(3500,'lowpass').connect(new Tone.Gain(.18).connect(reverb)));
 const pluck=new Tone.PluckSynth({attackNoise:1.2,dampening:3400,resonance:.92}).connect(new Tone.Gain(.16).connect(delay));
 const lead=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'fatsine',count:2,spread:7},envelope:{attack:.015,decay:.2,sustain:.1,release:.75}}).connect(new Tone.Gain(.24).connect(delay));

 const vocalBP=new Tone.Filter({type:'bandpass',frequency:1000,Q:5}).connect(new Tone.Gain(.14).connect(reverb));
 const vocal=new Tone.AMSynth({harmonicity:1.5,oscillator:{type:'sine'},modulation:{type:'square'},envelope:{attack:.06,decay:.28,sustain:.25,release:1.25},modulationEnvelope:{attack:.1,decay:.3,sustain:.4,release:.9}}).connect(vocalBP);

 const atmosNoise=new Tone.Noise('pink');
 const atmosFilter=new Tone.AutoFilter({frequency:.055,baseFrequency:160,octaves:4,depth:.9}).start();
 const atmosGain=new Tone.Gain(.05);
 const surf=new Tone.LFO({frequency:.075,min:.02,max:.11}).start();
 surf.connect(atmosGain.gain);
 atmosNoise.connect(new Tone.Filter(1100,'lowpass')).connect(atmosFilter).connect(atmosGain).connect(duckBus.ATMOS);
 atmosNoise.start();

 const fxGain=new Tone.Gain(.26).connect(reverb);
 const riserNoise=new Tone.Noise('white').connect(new Tone.Filter(2500,'bandpass').connect(fxGain));
 const impact=new Tone.MembraneSynth({pitchDecay:.2,octaves:7,envelope:{attack:.001,decay:1.2,sustain:0,release:.5}}).connect(new Tone.Gain(.35).connect(reverb));

 audio={limiter,comp,masterFilter,dry,reverb,delay,g,duck:duckBus,kick,kickClick,bass,hat,clap,tom,pad,pluck,lead,vocal,vocalBP,atmosNoise,atmosFilter,atmosGain,surf,fxGain,riserNoise,impact};
 audio.loop=new Tone.Loop(tick,'16n');
 Tone.Transport.bpm.value=+$('#bpm').value;
 macros();
 return audio;
}
function tick(time){
 if(!audio)return;
 const s=step%16; bar=Math.floor(step/16); const d=progression[bar%progression.length],e=val('energy');

 if(active.KICK && [0,4,8,12].includes(s)){audio.kick.triggerAttackRelease('C1','8n',time,.98);audio.kickClick.triggerAttackRelease('64n',time,.3);duck(time);}
 if(active.PERC && s%2===1)audio.hat.triggerAttackRelease('32n',time,.32+e*.22);
 if(active.PERC && [4,12].includes(s))audio.clap.triggerAttackRelease('16n',time,.28+e*.18);
 if(active.PERC && e>.65 && [7,15].includes(s))audio.tom.triggerAttackRelease(s===7?'G1':'D2','16n',time,.3);

 if(active.BASS && [0,3,6,8,11,14].includes(s)){const deg=d+(s===14?4:0);audio.bass.triggerAttackRelease(note(deg,2),s===14?'8n':'16n',time,.58+e*.2);}
 if(active.CHORDS && s===0)audio.pad.triggerAttackRelease(chord(d),'1m',time,.44);
 if(active.CHORDS && [2,6,10,14].includes(s) && e>.35)audio.pluck.triggerAttack(note(d+(s/2)%5,4),time);

 if(active.MELODY && s%2===0){const n=note(d+motif[(s/2)%motif.length],4);audio.lead.triggerAttackRelease(n,'16n',time,.36+e*.18);}
 if(active.VOCAL && s===0 && bar%4===2){audio.vocalBP.frequency.setValueAtTime(750+val('tension')*1100,time);audio.vocal.triggerAttackRelease(note(d+4,4),'2n',time,.27);}
 if(active.FX && s===15 && bar%4===3)audio.impact.triggerAttackRelease('C1','8n',time,.18);

 step++;
 Tone.Draw.schedule(()=>$('#clock').textContent='BAR '+String(bar+1).padStart(2,'0')+' · '+String(s+1).padStart(2,'0'),time);
}
async function start(){
 if(running)return;
 await init();
 if(Tone.context.state!=='running')await Tone.context.resume();
 audio.loop.start(0);Tone.Transport.start('+0.05');running=true;$('#play').textContent='■ STOP SET';$('#clock').textContent='BAR 01 · 01';say('DEEP groove running. Tap stems or scenes.');
}
function stop(){
 if(!running)return;Tone.Transport.stop();Tone.Transport.position=0;step=0;bar=0;running=false;$('#play').textContent='▶ PLAY SET';$('#clock').textContent='SILENT';say('Stopped. Silent again.');
}
async function ensure(){if(!running)await start()}
function setScene(name){
 const sc=scenes[name];STEMS.forEach(n=>stem(n,!!sc[n]));
 [['energy','e'],['space','s'],['filter','f'],['tension','t']].forEach(([id,k])=>$('#'+id).value=sc[k]);
 macros();$$('.scene').forEach(b=>b.classList.toggle('on',b.dataset.scene===name));say(name+' scene loaded.');
}
async function build(){
 await ensure();clearTimeout(buildTimer);$('#build').classList.add('on');
 const startF=audio.masterFilter.frequency.value;audio.masterFilter.frequency.rampTo(1400,2.8);audio.delay.wet.rampTo(.52,2.8);audio.reverb.wet.rampTo(.72,2.8);
 audio.riserNoise.start();audio.riserNoise.volume.setValueAtTime(-38,Tone.now());audio.riserNoise.volume.rampTo(-9,2.8);
 buildTimer=setTimeout(()=>{try{audio.riserNoise.stop()}catch{} $('#build').classList.remove('on');say('Build ready. Hit DROP.');},2850);
}
async function drop(){
 await ensure();$('#drop').classList.add('on');setScene('PEAK');audio.masterFilter.frequency.cancelScheduledValues(Tone.now());audio.masterFilter.frequency.rampTo(18000,.08);audio.delay.wet.rampTo(.14,.08);audio.impact.triggerAttackRelease('C1','1n',Tone.now(),.85);setTimeout(()=>$('#drop').classList.remove('on'),260);say('DROP.');
}
async function echo(){
 await ensure();$('#echo').classList.toggle('on');const on=$('#echo').classList.contains('on');audio.delay.wet.rampTo(on?.58:.14,.12);say('Echo '+(on?'ON':'OFF'));
}
async function wash(){
 await ensure();$('#wash').classList.toggle('on');const on=$('#wash').classList.contains('on');audio.reverb.wet.rampTo(on?.88:.42,.18);audio.masterFilter.frequency.rampTo(on?4200:500+val('filter')*17500,.18);say('Wash '+(on?'ON':'OFF'));
}
function ui(){
 $('#stems').innerHTML=STEMS.map(n=>'<button class="stem '+(active[n]?'on':'')+'" data-stem="'+n+'">'+n+'<small>'+({KICK:'FOUR ON FLOOR',BASS:'ROLLING LOW END',PERC:'HATS + CLAP',CHORDS:'WIDE HARMONY',MELODY:'LEAD MOTIF',ATMOS:'OCEAN + AIR',VOCAL:'VOCAL TEXTURE',FX:'RISERS + IMPACTS'}[n])+'</small></button>').join('');
 $('[data-stem="ATMOS"]').classList.add('on');
 $$('#stems button').forEach(b=>b.onclick=async()=>{await ensure();stem(b.dataset.stem,!active[b.dataset.stem]);say(b.dataset.stem+' '+(active[b.dataset.stem]?'ON':'OFF'));});
 $('#mixer').innerHTML=['KICK','BASS','PERC','MUSIC','VOCAL','MASTER'].map((n,i)=>'<div class="chan">'+n+'<input type="range" min="0" max="1" step=".01" value="'+(i===5?'.92':'.78')+'" data-mix="'+n+'"></div>').join('');
 $$('[data-mix]').forEach(el=>el.oninput=async()=>{await ensure();const n=el.dataset.mix,v=+el.value;if(n==='MASTER')audio.limiter.volume.rampTo((v-1)*18,.05);else if(n==='MUSIC'){['CHORDS','MELODY','ATMOS'].forEach(k=>audio.g[k].gain.rampTo(v,.05));}else if(audio.g[n])audio.g[n].gain.rampTo(v,.05);});
 $('#play').onclick=async()=>running?stop():await start();
 $$('.scene').forEach(b=>b.onclick=async()=>{await ensure();setScene(b.dataset.scene)});
 ['energy','space','filter','tension'].forEach(id=>$('#'+id).oninput=async()=>{await ensure();macros()});
 $('#bpm').onchange=async()=>{await ensure();Tone.Transport.bpm.rampTo(+$('#bpm').value,.2);say($('#bpm').value+' BPM')};
 $('#key').onchange=async()=>{await ensure();say('Key '+$('#key').value)};
 $('#scale').onchange=async()=>{await ensure();say($('#scale').value+' scale')};
 $('#build').onclick=build;$('#drop').onclick=drop;$('#echo').onclick=echo;$('#wash').onclick=wash;
 macros();
}
ui();
})();