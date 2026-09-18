(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
let installed=false;
function css(){if(q('#twisGuideStyle'))return;const s=document.createElement('style');s.id='twisGuideStyle';s.textContent=`.ld-guide{display:grid;gap:9px}.ld-guide-card{border:1px solid #2c3a40;background:#0b1115;border-radius:14px;padding:11px}.ld-guide-card h4{margin:0 0 6px}.ld-guide-card p{margin:4px 0;color:#b7c4ca;line-height:1.35}.ld-guide-card b{color:#fff}.ld-guide-start{border-color:#35c889;background:#10261e}.ld-guide-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.ld-guide-go{min-height:48px;border:1px solid #314047;border-radius:11px;background:#11181d;color:#fff;font-weight:800}.ld-guide-go small{display:block;color:#94a6ae;font-size:9px;margin-top:2px}.ld-guide-more{border:1px solid #2c3a40;border-radius:12px;background:#0b1115;padding:10px}.ld-guide-more summary{cursor:pointer;font-weight:900;color:#dce8ed}.ld-guide-more p{margin:7px 0;color:#aebcc3;line-height:1.35}@media(max-width:600px){.ld-guide{gap:7px}.ld-guide-card{padding:9px}.ld-guide-start p{font-size:12px}.ld-guide-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.ld-guide-go{min-height:52px;font-size:12px;padding:6px}.ld-guide-more{font-size:12px}}`;document.head.appendChild(s)}
function go(tab){qa('.ld-tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));qa('.ld-page').forEach(x=>x.classList.toggle('active',x.dataset.page===tab));}
function build(){const host=q('#twisLoopDeck');if(!host||q('[data-page="guide"]'))return false;css();const tabs=host.querySelector('.ld-tabs'),body=host.querySelector('.ld-body');if(!tabs||!body)return false;const tab=document.createElement('button');tab.className='ld-tab';tab.dataset.tab='guide';tab.textContent='START HERE';tab.onclick=()=>go('guide');tabs.insertBefore(tab,tabs.firstChild);const page=document.createElement('div');page.className='ld-page';page.dataset.page='guide';page.innerHTML=`<div class="ld-section"><h3>START HERE · WTF STUPID SIMPLE</h3><div class="ld-guide">
<div class="ld-guide-card ld-guide-start"><h4>MAKE SOMETHING FAST</h4><p><b>1.</b> Tap ▶ once to wake the audio engine.</p><p><b>2.</b> Want instant results? Hit <b>FUCK IT — BUILD ME SOMETHING</b>.</p><p><b>3.</b> Want control? Pick sounds, tap pads, or draw a pattern in SEQ.</p></div>
<div class="ld-guide-actions">
<button class="ld-guide-go" data-go="sound">SOUND<small>pick what pads play</small></button>
<button class="ld-guide-go" data-go="pads">PADS<small>play with your fingers</small></button>
<button class="ld-guide-go" data-go="seq">SEQ<small>build a repeating beat</small></button>
<button class="ld-guide-go" data-go="loop">LOOP<small>record + stack yourself</small></button>
<button class="ld-guide-go" data-go="import">IMPORT<small>chop your own audio</small></button>
<button class="ld-guide-go" data-go="forge">FORGE<small>ghost / scrap / breed</small></button>
<button class="ld-guide-go" data-go="mix">MIX<small>shape + capture it</small></button>
</div>
<details class="ld-guide-more"><summary>WHAT DOES ALL THIS SHIT DO?</summary><p><b>LOOP:</b> record yourself, guitar, voice, or room noise and make it repeat.</p><p><b>PADS:</b> 16 playable buttons.</p><p><b>SEQ:</b> 16-step repeating grid.</p><p><b>SOUND:</b> change each pad sound or load a TWIS pack.</p><p><b>IMPORT:</b> bring in your own audio and cut it into pieces.</p><p><b>MIX:</b> volume, filter, effects, and finished capture.</p><p><b>FORGE:</b> GHOST catches recent playing, SCRAP finds useful pieces, BREED mutates rhythm, FOLLOW ME follows your pulse, MORPH blends states, and the small FORGE FUCK IT mutates one thing.</p></details>
</div></div>`;const status=q('#ldStatus');body.insertBefore(page,status||null);page.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));return true}
function install(){if(installed)return;try{if(!build()){setTimeout(install,120);return}installed=true}catch(e){console.error('TWIS guide install failed',e);setTimeout(install,250)}}
window.TWIS_LOOP_GUIDE={install};
})();