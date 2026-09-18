(()=>{'use strict';
const q=s=>document.querySelector(s), qa=s=>[...document.querySelectorAll(s)];
const stemNames=['KICK','BASS','DRUMS','CHORDS','MELODY','ATMOS','VOCAL','FX'];
const active={KICK:true,BASS:true,DRUMS:true,CHORDS:true,MELODY:false,ATMOS:true,VOCAL:false,FX:true};
const sceneStates=[
 {KICK:1,BASS:1,DRUMS:1,CHORDS:1,MELODY:0,ATMOS:1,VOCAL:0,FX:1},
 {KICK:1,BASS:1,DRUMS:1,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:0,FX:1},
 {KICK:0,BASS:0,DRUMS:0,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:1,FX:1},
 {KICK:1,BASS:1,DRUMS:1,CHORDS:1,MELODY:1,ATMOS:1,VOCAL:1,FX:1}
];
let started=false,bar=0,step=0,scene=0,energy=.45;
const roots={C:0,'C#':1,D:2,'D#':3,E:4,F:5,'F#':6,G:7,'G#':8,A:9,'A#':10,B:11};
const scaleMap={MINOR:[0,2,3,5,7,8,10],DORIAN:[0,2,3,5,7,9,10],PHRYGIAN:[0,1,3,5,7,8,10]};
const prog=[0,5,3,6];
const melodyShapes=[[0,2,4,2,5,4,2,1],[0,1,3,4,3,1,6,4],[4,3,2,0,2,3,5,4],[0,4,2,5,4,2,1,6]];
let melodyShape=melodyShapes[0].slice();

const limiter=new Tone.Limiter(-1).toDestination();
const comp=new Tone.Compressor(-12,3).connect(limiter);
const masterFilter=new Tone.Filter(15000,'lowpass').connect(comp);
const reverb=new Tone.Reverb({decay:5.8,wet:.52}).connect(masterFilter);
const delay=new Tone.FeedbackDelay('8n.',.32).connect(reverb);
const dry=new Tone.Gain(.95).connect(masterFilter);

const channels={};
['KICK','BASS','DRUMS','CHORDS','MELODY','ATMOS','VOCAL','FX'].forEach(n=>channels[n]=new Tone.Gain(active[n]?1:0).connect(dry));

const synthBass=new Tone.MonoSynth({oscillator:{type:'sawtooth'},envelope:{attack:.01,decay:.18,sustain:.32,release:.5},filterEnvelope:{attack:.01,decay:.18,sustain:.2,release:.3,baseFrequency:80,octaves:3}}).connect(channels.BASS);
const pad=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'triangle'},envelope:{attack:.35,decay:.5,sustain:.55,release:2.5}}).connect(new Tone.Gain(.42).connect(channels.CHORDS));
const lead=new Tone.PolySynth(Tone.Synth,{oscillator:{type:'sine'},envelope:{attack:.01,decay:.12,sustain:.18,release:.6}}).connect(new Tone.Gain(.32).connect(delay));
const atmosNoise=new Tone.Noise('pink').start();
const atmosFilter=new Tone.AutoFilter({frequency:.08,baseFrequency:260,octaves:4,depth:.75}).start().connect(new Tone.Gain(.08).connect(reverb));
atmosNoise.connect(atmosFilter);

const kickSynth=new Tone.MembraneSynth({pitchDecay:.03,octaves:6,envelope:{attack:.001,decay:.28,sustain:0,release:.05}}).connect(channels.KICK);
const hatSynth=new Tone.NoiseSynth({noise:{type:'white'},envelope:{attack:.001,decay:.04,sustain:0}}).connect(new Tone.Filter(6000,'highpass').connect(new Tone.Gain(.12).connect(channels.DRUMS)));
const clapSynth=new Tone.NoiseSynth({noise:{type:'pink'},envelope:{attack:.001,decay:.11,sustain:0}}).connect(new Tone.Filter(1000,'highpass').connect(new Tone.Gain(.12).connect(reverb)));

const sampleUrls={
 kick:'https://raw.githubusercontent.com/Boochi44/free-drum-samples/main/drum-samples/02-bounce/kicks/bounce-kick-01.wav',
 hat:'https://raw.githubusercontent.com/Boochi44/free-drum-samples/main/drum-samples/02-bounce/hi-hats/hi-hat-closed-01.wav',
 clap:'https://raw.githubusercontent.com/Boochi44/free-drum-samples/main/drum-samples/02-bounce/claps/clap-01.wav',
 vocal:'https://raw.githubusercontent.com/pdx-cs-sound/wavs/main/voice.wav'
};
const players={
 kick:new Tone.Player(sampleUrls.kick).connect(channels.KICK),
 hat:new Tone.Player(sampleUrls.hat).connect(new Tone.Gain(.32).connect(channels.DRUMS)),
 clap:new Tone.Player(sampleUrls.clap).connect(new Tone.Gain(.36).connect(reverb)),
 vocal:new Tone.Player({url:sampleUrls.vocal,fadeIn:.02,fadeOut:.2}).connect(new Tone.Gain(.22).connect(delay))
};

function noteFromDegree(deg,oct=4){
 const key=q('#key').value, scale=scaleMap[q('#scale').value], midi=12*(oct+1)+roots[key]+scale[((deg%7)+7)%7]+12*Math.floor(deg/7);
 return Tone.Frequency(midi,'midi').toNote();
}
function chordForBar(b){
 const degree=prog[b%4], root=noteFromDegree(degree,3), third=noteFromDegree(degree+2,3), fifth=noteFromDegree(degree+4,3);
 return [root,third,fifth];
}
function hitPlayer(name,time,fallback){
 const p=players[name]; if(p?.loaded){try{p.start(time)}catch{fallback()}} else fallback();
}
function tick(time){
 const s=step%16,b=Math.floor(step/16);
 if(active.KICK && [0,4,8,12].includes(s)) hitPlayer('kick',time,()=>kickSynth.triggerAttackRelease('C1','8n',time,.95));
 if(active.DRUMS && s%2===1) hitPlayer('hat',time,()=>hatSynth.triggerAttackRelease('32n',time,.55));
 if(active.DRUMS && [4,12].includes(s)) hitPlayer('clap',time,()=>clapSynth.triggerAttackRelease('16n',time,.45));
 if(active.BASS && [0,3,6,8,11,14].includes(s)){
   const d=prog[b%4], n=noteFromDegree(d,2); synthBass.triggerAttackRelease(n,s===14?'8n':'16n',time,.72);
 }
 if(active.CHORDS && s===0) pad.triggerAttackRelease(chordForBar(b),'1m',time,.62);
 if(active.MELODY && s%2===0){
   const idx=(s/2)%8,deg=melodyShape[idx]+prog[b%4],n=noteFromDegree(deg,4);
   lead.triggerAttackRelease(n,'16n',time,.46+energy*.22);
 }
 if(active.VOCAL && s===0 && b%4===2 && players.vocal.loaded){try{players.vocal.start(time,0,.65)}catch{}}
 if(active.FX && s===15 && b%4===3) clapSynth.triggerAttackRelease('32n',time,.18);
 step++; bar=Math.floor(step/16);
 Tone.Draw.schedule(()=>{q('#clock').textContent='BAR '+String(bar+1).padStart(2,'0')+' · '+String((s%16)+1).padStart(2,'0');},time);
}
const seq=new Tone.Loop(tick,'16n');

function setStem(n,on){active[n]=!!on;channels[n].gain.rampTo(on?1:0,.05);const b=q('[data-stem="'+n+'"]');b?.classList.toggle('on',!!on);}
function applyScene(i){scene=i;const st=sceneStates[i];stemNames.forEach(n=>setStem(n,!!st[n]));qa('.scene').forEach((b,k)=>b.classList.toggle('on',k===i));}
function mutate(){melodyShape=melodyShapes[Math.floor(Math.random()*melodyShapes.length)].slice(); if(Math.random()>.5)melodyShape.reverse(); energy=Math.max(.18,Math.min(.92,energy+(Math.random()-.5)*.3));q('#energy').value=energy;applyMacros();q('#status').textContent='New musical variation: melody contour + energy changed.';}
function applyMacros(){
 energy=+q('#energy').value; const space=+q('#space').value,dly=+q('#delay').value,f=+q('#filter').value;
 reverb.wet.rampTo(space,.08); delay.wet.rampTo(dly,.08); masterFilter.frequency.rampTo(700+f*17000,.08);
 synthBass.filterEnvelope.octaves=2+energy*3; lead.volume.rampTo(-18+energy*10,.08);
 ['energy','space','delay','filter'].forEach(id=>q('#'+id+'V').textContent=Math.round(+q('#'+id).value*100));
}
async function togglePlay(){
 await Tone.start();
 if(!started){Tone.Transport.bpm.value=+q('#bpm').value;seq.start(0);Tone.Transport.start('+0.05');started=true;q('#play').textContent='■ STOP';q('#status').textContent='Running. Mix stems, scenes, decks and macros.';}
 else{Tone.Transport.stop();Tone.Transport.position=0;step=0;bar=0;started=false;q('#play').textContent='▶ PLAY';q('#clock').textContent='STOPPED';}
}
function buildUI(){
 q('#stems').innerHTML=stemNames.map(n=>'<button class="stem '+(active[n]?'on':'')+'" data-stem="'+n+'">'+n+'<small>STEM</small></button>').join('');
 qa('[data-stem]').forEach(b=>b.onclick=()=>setStem(b.dataset.stem,!active[b.dataset.stem]));
 q('#mixer').innerHTML=['KICK','BASS','DRUMS','MUSIC','VOCAL','MASTER'].map((n,i)=>'<div class="chan">'+n+'<input type="range" min="0" max="1" step=".01" value="'+(i===5?'.9':'.75')+'" data-mix="'+n+'"></div>').join('');
 qa('[data-mix]').forEach(el=>el.oninput=()=>{const v=+el.value,n=el.dataset.mix;if(n==='MASTER')limiter.volume.rampTo((v-1)*18,.05);else if(n==='MUSIC'){channels.CHORDS.gain.rampTo(v,.05);channels.MELODY.gain.rampTo(v,.05);channels.ATMOS.gain.rampTo(v*.8,.05);}else if(channels[n])channels[n].gain.rampTo(v,.05);});
 qa('.scene').forEach(b=>b.onclick=()=>applyScene(+b.dataset.scene));q('#mutate').onclick=mutate;q('#play').onclick=togglePlay;
 q('#bpm').onchange=()=>Tone.Transport.bpm.rampTo(+q('#bpm').value,.2);['energy','space','delay','filter'].forEach(id=>q('#'+id).oninput=applyMacros);
 qa('[data-deck]').forEach(b=>b.onclick=()=>{b.classList.toggle('on'); if(b.dataset.act==='filter'){const on=b.classList.contains('on');masterFilter.frequency.rampTo(on?2400:700+q('#filter').value*17000,.12);} else q('#status').textContent='Deck '+b.dataset.deck+' loop mode '+(b.classList.contains('on')?'armed':'released')+'.';});
 applyMacros();
}
buildUI();
})();