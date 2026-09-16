(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
let installed=false,last=null;
const st=()=>window.TWIS_LOOP_DECK?.state;
function status(t){const e=q('#ldStatus');if(e)e.textContent=t}
function snap(){const s=st();return s?{bpm:s.bpm,pattern:s.pattern.map(r=>r.slice()),ratchets:s.ratchets.map(r=>r.slice())}:null}
function restore(){const s=st();if(!s||!last)return;s.bpm=last.bpm;s.pattern=last.pattern.map(r=>r.slice());s.ratchets=last.ratchets.map(r=>r.slice());const b=q('#ldBpm');if(b)b.value=s.bpm;paint();status('FUCK IT undo restored the previous groove.');}
function paint(){const s=st();if(!s)return;qa('.ld-step').forEach(b=>{const p=+b.dataset.row,k=+b.dataset.step,v=s.pattern[p]?.[k]||0,r=s.ratchets[p]?.[k]||1;b.classList.toggle('on',!!v);b.style.opacity=v?String(.35+.65*v):'1';b.textContent=r>1?String(r):''})}
const pick=a=>a[Math.floor(Math.random()*a.length)];
function fill(row,steps,vel=.82){for(const k of steps)row[k]=vel}
function build(){const s=st();if(!s)return;last=snap();s.pattern=Array.from({length:16},()=>Array(16).fill(0));s.ratchets=Array.from({length:16},()=>Array(16).fill(1));s.bpm=pick([82,88,92,96,100,104,108,112]);
  const kick=s.pattern[0],snare=s.pattern[1],hat=s.pattern[2],open=s.pattern[3];fill(kick,[0,8]);if(Math.random()>.35)fill(kick,[6,14],.68);fill(snare,[4,12],.9);fill(hat,[0,2,4,6,8,10,12,14],.48);if(Math.random()>.5)fill(open,[7,15],.42);
  const low=s.pattern[pick([4,5,6])];fill(low,pick([[0,3,7,10],[0,6,8,14],[0,5,9,13],[0,4,11,15]]),.72);
  const bass=s.pattern[pick([5,6,7])];fill(bass,pick([[0,3,8,10],[0,6,8,11,14],[0,4,7,12],[0,5,10,15]]),.82);
  const mel=s.pattern[pick([8,9,10,11])];fill(mel,pick([[0,4,7,12],[0,3,8,11],[2,6,10,14],[0,5,9,13]]),.62);
  const texture=s.pattern[pick([12,13,14,15])];fill(texture,pick([[0,8],[4,12],[3,11],[7,15]]),.48);
  if(Math.random()>.45){const active=[];s.pattern.forEach((r,p)=>r.forEach((v,k)=>v&&active.push([p,k])));for(let i=0;i<Math.min(3,active.length);i++){const [p,k]=pick(active);s.ratchets[p][k]=pick([2,2,4])}}
  const bpm=q('#ldBpm');if(bpm)bpm.value=s.bpm;paint();status(`FUCK IT built a full ${s.bpm} BPM starting scene: drums + low end + melody + texture. Hit it again for another.`);
}
function css(){if(q('#twisFuckStyle'))return;const e=document.createElement('style');e.id='twisFuckStyle';e.textContent=`.twis-fuck-wrap{position:sticky;bottom:8px;z-index:40;display:grid;grid-template-columns:2fr 1fr;gap:8px;margin:10px 0}.twis-fuck-main{min-height:72px!important;font-size:1.35rem!important;font-weight:1000!important;background:#6b1717!important;border:2px solid #ff6b6b!important;color:#fff!important;box-shadow:0 0 24px #6b171766}.twis-fuck-undo{min-height:72px!important;font-weight:800!important}@media(max-width:600px){.twis-fuck-wrap{grid-template-columns:1fr}.twis-fuck-main,.twis-fuck-undo{min-height:62px!important}}`;document.head.appendChild(e)}
function install(){if(installed)return;const host=q('#twisLoopDeck'),body=host?.querySelector('.ld-body');if(!host||!body){setTimeout(install,100);return}try{css();const wrap=document.createElement('div');wrap.className='twis-fuck-wrap';wrap.innerHTML='<button class="twis-fuck-main" id="twisBigFuck">FUCK IT — BUILD ME SOMETHING</button><button class="twis-fuck-undo" id="twisBigUndo">UNDO</button>';const stEl=q('#ldStatus');body.insertBefore(wrap,stEl||null);q('#twisBigFuck').onclick=build;q('#twisBigUndo').onclick=restore;window.TWIS_FUCK_IT={build,restore};installed=true}catch(e){console.error('TWIS big FUCK IT install failed',e);setTimeout(install,250)}}
window.TWIS_LOOP_FUCK_IT={install};
})();