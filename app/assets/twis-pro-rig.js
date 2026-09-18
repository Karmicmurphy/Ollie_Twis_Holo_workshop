(()=>{'use strict';
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const stems=['KICK','BASS','DRUMS','CHORDS','MELODY','ATMOS','VOCAL','FX'];
const active={KICK:true,BASS:true,DRUMS:true,CHORDS:true,MELODY:false,ATMOS:true,VOCAL:false,FX:true};
const sceneStates=[
 {KICK:1,BASS:1,DRUMS:1,CHORDS:1,MELODY:0,ATMOS:1,VOCAL:0,FX:1},
 {KICK:1,BASS:1,DRUMS:1,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:0,FX:1},
 {KICK:0,BASS:0,DRUMS:0,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:1,FX:1},
 {KICK:1,BASS:1,DRUMS:1,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:1,FX:1}
];
const deckGroups={A:['KICK','BASS','DRUMS'],B:['CHORDS','MELODY'],C:['VOCAL'],D:['ATMOS','FX']};
let audio=null, started=false, step=0, energy=.45;
const roots={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
const scaleMap={MINOR:[0,2,3,5,7,8,10],DORIAN:[0,2,3,5,7,9,10],PHRYGIAN:[0,1,3,5,7,8,10]};
let progression=[0,5,3,6], melodyShape=[0,2,4,2,5,4,2,1];

function status(t){q('#status').textContent=t;}
function noteFromDegree(deg,oct=4){
 const scale=scaleMap[q('#scale').value], key=q('#key').value;
 const idx=((deg%7)+7)%7, octShift=Math.floor(deg/7);
 const midi=12*(oct+1)+roots[key]+scale[idx]+12*octShift;
 return Tone.Frequency(midi,'midi').toNote();
}
function chordForBar(b){
 const d=progression[b%progression.length];
 return [noteFromDegree(d,3),noteFromDegree(d+2,3),noteFromDegree(d+4,3)];
}
function setStem(name,on){
 active[name]=!!on;
 if(audio?.channels?.[name]) audio.channels[name].gain.rampTo(on?1:0,.05);
 q('[data-stem="'+name+'"]')?.classList.toggle('on',!!on);
}
function applyScene(i){
 const s=sceneStates[i];
 stems.forEach(n=>setStem(n,!!s[n]));
 qa('.scene').forEach((b,k)=>b.classList.toggle('on',k===i));
 status('Scene '+['DEEP','DRIVE','BREAK','PEAK'][i]+' loaded.');
}
function applyMacros(){
 energy=+q('#energy').value;
 ['energy','space','delay','filter'].forEach(id=>q('#'+id+'V').textContent=Math.round(+q('#'+id).value*100));
 if(!audio)return;
 const space=+q('#space').value, dly=+q('#delay').value, f=+q('#filter').value;
 audio.reverb.wet.rampTo(space,.08);
 audio.delay.wet.rampTo(dly,.08);
 audio.masterFilter.frequency.rampTo(600+f*17500,.08);
 audio.bass.filterEnvelope.octaves=2+energy*3;
 audio.lead.volume.rampTo(-18+energy*9,.08);
 audio.oceanGain.gain.rampTo(.015+.11*space,.2);
}
function makeOcean(){
 const noise=new Tone.Noise('pink');
 const low=new Tone.Filter(900,'lowpass');
 const auto=new Tone.AutoFilter({frequency:.06,baseFrequency:180,octaves:3.2,depth:.9}).start();
 const gain=new Tone.Gain(.055);
 const swell=new Tone.LFO({frequency:.085,min:.015,max:.12}).start();
 swell.connect(gain.gain);
 noise.connect(low).connect(auto).connect(gain).connect(audio.channels.ATMOS);
 noise.start();
 return {noise,gain,swell};
}
async function initAudio(){
 if(audio) return audio;
 await Tone.start();

 const limiter=new Tone.Limiter(-1).toDestination();
 const comp=new Tone.Compressor(-14,3).connect(limiter);
 const masterFilter=new Tone.Filter(16000,'lowpass').connect(comp);
 const dry=new Tone.Gain(.95).connect(masterFilter);
 const reverb=new Tone.Reverb({decay:6.2,wet:.5}).connect(masterFilter);
 const delay=new Tone.FeedbackDelay('8n.',.28).connect(reverb);

 const channels={};
 stems.forEach(n=>channels[n]=new Tone.Gain(active[n]?1:0).connect(dry));

 const bass=new Tone.MonoSynth({
   oscillator:{type:'sawtooth'},
   filter:{Q:2,type:'lowpass',rolloff:-24},
   envelope:{attack:.01,decay:.18,sustain:.35,release:.45},
   filterEnvelope:{attack:.01,decay:.22,sustain:.18,release:.35,baseFrequency:70,octaves:4}
 }).connect(channels.BASS);

 const pad=new Tone.PolySynth(Tone.Synth,{
   oscillator:{type:'triangle'},
   envelope:{attack:.5,decay:.6,sustain:.55,release:3}
 }).connect(new Tone.Gain(.34).connect(reverb));

 const lead=new Tone.PolySynth(Tone.Synth,{
   oscillator:{type:'sine'},
   envelope:{attack:.015,decay:.18,sustain:.12,release:.7}
 }).connect(new Tone.Gain(.28).connect(delay));

 const kick=new Tone.MembraneSynth({
   pitchDecay:.04,octaves:6,
   envelope:{attack:.001,decay:.3,sustain:0,release:.05}
 }).connect(channels.KICK);

 const hat=new Tone.NoiseSynth({
   noise:{type:'white'},
   envelope:{attack:.001,decay:.045,sustain:0}
 }).connect(new Tone.Filter(6500,'highpass').connect(new Tone.Gain(.1).connect(channels.DRUMS)));

 const clap=new Tone.NoiseSynth({
   noise:{type:'pink'},
   envelope:{attack:.001,decay:.13,sustain:0}
 }).connect(new Tone.Filter(1200,'highpass').connect(new Tone.Gain(.1).connect(reverb)));

 const vocal=new Tone.Synth({
   oscillator:{type:'fatsine'},
   envelope:{attack:.08,decay:.25,sustain:.25,release:1.1}
 }).connect(new Tone.Gain(.14).connect(delay));

 audio={limiter,comp,masterFilter,dry,reverb,delay,channels,bass,pad,lead,kick,hat,clap,vocal};
 const ocean=makeOcean(); audio.oceanGain=ocean.gain; audio.ocean=ocean;

 audio.loop=new Tone.Loop(tick,'16n');
 Tone.Transport.bpm.value=+q('#bpm').value;
 applyMacros();
 return audio;
}
function tick(time){
 if(!audio)return;
 const s=step%16,b=Math.floor(step/16),d=progression[b%progression.length];

 if(active.KICK && [0,4,8,12].includes(s)) audio.kick.triggerAttackRelease('C1','8n',time,.9);
 if(active.DRUMS && s%2===1) audio.hat.triggerAttackRelease('32n',time,.55);
 if(active.DRUMS && [4,12].includes(s)) audio.clap.triggerAttackRelease('16n',time,.34);

 if(active.BASS && [0,3,6,8,11,14].includes(s))
   audio.bass.triggerAttackRelease(noteFromDegree(d,2),s===14?'8n':'16n',time,.72);

 if(active.CHORDS && s===0)
   audio.pad.triggerAttackRelease(chordForBar(b),'1m',time,.58);

 if(active.MELODY && s%2===0){
   const n=noteFromDegree(melodyShape[(s/2)%8]+d,4);
   audio.lead.triggerAttackRelease(n,'16n',time,.42+energy*.18);
 }

 if(active.VOCAL && s===0 && b%4===2)
   audio.vocal.triggerAttackRelease(noteFromDegree(d+4,4),'2n',time,.28);

 if(active.FX && s===15 && b%4===3)
   audio.clap.triggerAttackRelease('32n',time,.16);

 step++;
 Tone.Draw.schedule(()=>q('#clock').textContent='BAR '+String(Math.floor(step/16)+1).padStart(2,'0')+' · '+String((s%16)+1).padStart(2,'0'),time);
}
async function startIfNeeded(){
 if(started)return;
 await initAudio();
 audio.loop.start(0);
 Tone.Transport.start('+0.05');
 started=true;
 q('#play').textContent='■ STOP';
 status('Running. Every lit stem is audible. Tap anything and it changes the live mix.');
}
async function togglePlay(){
 if(!started){await startIfNeeded();return;}
 Tone.Transport.stop();
 Tone.Transport.position=0;
 step=0; started=false;
 q('#play').textContent='▶ PLAY'; q('#clock').textContent='STOPPED';
 status('Stopped. Nothing should be playing now.');
}
async function ensureLiveAction(){if(!started)await startIfNeeded();}
async function toggleDeck(letter){
 await ensureLiveAction();
 const group=deckGroups[letter], anyOn=group.some(n=>active[n]);
 group.forEach(n=>setStem(n,!anyOn));
 status('Deck '+letter+' '+(!anyOn?'ON':'OFF')+' · '+group.join(' / '));
}
async function toggleDeckFilter(btn){
 await ensureLiveAction();
 btn.classList.toggle('on');
 const on=btn.classList.contains('on');
 audio.masterFilter.frequency.rampTo(on?2200:600+(+q('#filter').value)*17500,.12);
 status('Deck filter '+(on?'CUT':'OPEN')+'.');
}
async function mutate(){
 await ensureLiveAction();
 const shapes=[
 [0,2,4,2,5,4,2,1],[0,1,3,4,3,1,6,4],[4,3,2,0,2,3,5,4],[0,4,2,5,4,2,1,6]
 ];
 const progs=[[0,5,3,6],[0,3,5,4],[0,6,5,3],[0,4,3,5]];
 melodyShape=shapes[Math.floor(Math.random()*shapes.length)].slice();
 progression=progs[Math.floor(Math.random()*progs.length)].slice();
 q('#mutate').classList.add('on');setTimeout(()=>q('#mutate').classList.remove('on'),250);
 status('FUCK IT changed the chord movement and melody contour.');
}
function buildUI(){
 q('#stems').innerHTML=stems.map(n=>'<button class="stem '+(active[n]?'on':'')+'" data-stem="'+n+'">'+n+'<small>STEM</small></button>').join('');
 qa('[data-stem]').forEach(b=>b.onclick=async()=>{await ensureLiveAction();setStem(b.dataset.stem,!active[b.dataset.stem]);status(b.dataset.stem+' '+(active[b.dataset.stem]?'ON':'OFF'));});

 q('#mixer').innerHTML=['KICK','BASS','DRUMS','MUSIC','VOCAL','MASTER'].map((n,i)=>'<div class="chan">'+n+'<input type="range" min="0" max="1" step=".01" value="'+(i===5?'.9':'.75')+'" data-mix="'+n+'"></div>').join('');
 qa('[data-mix]').forEach(el=>el.oninput=async()=>{
   await ensureLiveAction();const v=+el.value,n=el.dataset.mix;
   if(n==='MASTER')audio.limiter.volume.rampTo((v-1)*18,.05);
   else if(n==='MUSIC'){audio.channels.CHORDS.gain.rampTo(v,.05);audio.channels.MELODY.gain.rampTo(v,.05);audio.channels.ATMOS.gain.rampTo(v*.8,.05);}
   else if(audio.channels[n])audio.channels[n].gain.rampTo(v,.05);
 });

 q('#play').onclick=togglePlay;
 qa('.scene').forEach(b=>b.onclick=async()=>{await ensureLiveAction();applyScene(+b.dataset.scene);});
 q('#mutate').onclick=mutate;
 q('#bpm').onchange=async()=>{await ensureLiveAction();Tone.Transport.bpm.rampTo(+q('#bpm').value,.2);status('Tempo '+q('#bpm').value+' BPM.');};
 q('#key').onchange=async()=>{await ensureLiveAction();status('Key '+q('#key').value+' '+q('#scale').value+'.');};
 q('#scale').onchange=async()=>{await ensureLiveAction();status('Scale '+q('#scale').value+'.');};
 ['energy','space','delay','filter'].forEach(id=>q('#'+id).oninput=async()=>{await ensureLiveAction();applyMacros();});

 qa('[data-deck]').forEach(b=>b.onclick=async()=>{
   if(b.dataset.act==='loop'){b.classList.toggle('on');await toggleDeck(b.dataset.deck);}
   else await toggleDeckFilter(b);
 });
 applyMacros();
}
buildUI();
})();