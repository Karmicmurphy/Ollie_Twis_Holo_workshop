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
 const bpm=q('#ldBpm');if(bpm)bpm.value=s.bpm;paint();status(`FUCK IT built a full ${s.bpm} BPM RUSTWIRE starting scene. Tap again for another.`);
}
function css(){if(q('#twisFuckStyle'))return;const e=document.createElement('style');e.id='twisFuckStyle';e.textContent=`
.twis-fuck-wrap{position:fixed;right:14px;bottom:74px;z-index:10040;display:flex;align-items:center;gap:7px;pointer-events:none}
.twis-fuck-main{pointer-events:auto;width:58px!important;height:58px!important;min-width:58px!important;min-height:58px!important;border-radius:50%!important;padding:0!important;font-size:.72rem!important;line-height:1.02!important;font-weight:1000!important;background:radial-gradient(circle at 35% 30%,#d92d2d,#6b0f0f 72%)!important;border:2px solid #ff8a8a!important;color:#fff!important;box-shadow:0 5px 20px #000b,0 0 0 3px #2a0909,0 0 18px #c21d1d88;transform:rotate(-4deg)}
.twis-fuck-main::before{content:'DON\'T';display:block;font-size:.52rem;letter-spacing:.08em;opacity:.78}.twis-fuck-main::after{content:'PUSH';display:block;font-size:.48rem;letter-spacing:.08em;opacity:.7}
.twis-fuck-undo{pointer-events:auto;min-height:34px!important;padding:6px 9px!important;border-radius:17px!important;font-size:.62rem!important;font-weight:800!important;opacity:.78}
@media(max-width:600px){.twis-fuck-wrap{right:10px;bottom:70px}.twis-fuck-main{width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important}.twis-fuck-undo{display:none}}
`;document.head.appendChild(e)}
function install(){if(installed)return;const host=q('#twisLoopDeck');if(!host){setTimeout(install,100);return}try{css();const wrap=document.createElement('div');wrap.className='twis-fuck-wrap';wrap.innerHTML='<button class="twis-fuck-main" id="twisBigFuck" aria-label="FUCK IT build me something">FUCK<br>IT</button><button class="twis-fuck-undo" id="twisBigUndo">UNDO</button>';host.appendChild(wrap);q('#twisBigFuck').onclick=build;q('#twisBigUndo').onclick=restore;window.TWIS_FUCK_IT={build,restore};installed=true}catch(e){console.error('TWIS big FUCK IT install failed',e);setTimeout(install,250)}}
window.TWIS_LOOP_FUCK_IT={install};
})();