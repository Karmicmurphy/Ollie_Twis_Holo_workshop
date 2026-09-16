(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
let installed=false;
const COLORS=[
 {name:'RED · DRUM CORE',pads:[0,1,2,3],color:'#b64b4b',hint:'kick / snare / hats — your rhythmic backbone'},
 {name:'ORANGE · LOW END',pads:[4,5,6,7],color:'#c47b35',hint:'toms / bass / sub — weight and movement'},
 {name:'BLUE · MELODY',pads:[8,9,10,11],color:'#4c77c7',hint:'synth / keys / lead / pluck — melodic pieces that tend to work together'},
 {name:'PURPLE · TEXTURE',pads:[12,13,14,15],color:'#8559b5',hint:'strings / guitar / FX / atmosphere — character and lift'}
];
function css(){if(q('#twisColorStyle'))return;const s=document.createElement('style');s.id='twisColorStyle';s.textContent=`
.ld-pad[data-family="0"],#soundPadGrid button[data-family="0"]{border-color:#b64b4b!important;box-shadow:inset 0 0 0 1px #b64b4b55}.ld-pad[data-family="1"],#soundPadGrid button[data-family="1"]{border-color:#c47b35!important;box-shadow:inset 0 0 0 1px #c47b3555}.ld-pad[data-family="2"],#soundPadGrid button[data-family="2"]{border-color:#4c77c7!important;box-shadow:inset 0 0 0 1px #4c77c755}.ld-pad[data-family="3"],#soundPadGrid button[data-family="3"]{border-color:#8559b5!important;box-shadow:inset 0 0 0 1px #8559b555}.ld-step[data-family="0"].on{background:#b64b4b!important}.ld-step[data-family="1"].on{background:#c47b35!important}.ld-step[data-family="2"].on{background:#4c77c7!important}.ld-step[data-family="3"].on{background:#8559b5!important}.twis-color-legend{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin:8px 0}.twis-color-chip{padding:8px;border-radius:10px;font-size:.72rem;border:1px solid #314047;background:#0d1418}.twis-color-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px}@media(max-width:600px){.twis-color-legend{grid-template-columns:1fr}}
`;document.head.appendChild(s)}
function familyForPad(i){return Math.floor(i/4)}
function paint(){css();qa('.ld-pad[data-pad]').forEach(el=>el.dataset.family=String(familyForPad(+el.dataset.pad)));qa('#soundPadGrid button[data-sound-pad]').forEach(el=>el.dataset.family=String(familyForPad(+el.dataset.soundPad)));qa('.ld-step[data-row]').forEach(el=>el.dataset.family=String(familyForPad(+el.dataset.row)));const sound=q('[data-page="sound"] .ld-section');if(sound&&!q('#twisColorLegend')){const d=document.createElement('div');d.id='twisColorLegend';d.className='twis-color-legend';d.innerHTML=COLORS.map((c,i)=>`<div class="twis-color-chip"><span class="twis-color-dot" style="background:${c.color}"></span><b>${c.name}</b><br>${c.hint}</div>`).join('');sound.insertBefore(d,sound.firstChild?.nextSibling||null)}}
function install(){if(installed)return;installed=true;paint();new MutationObserver(()=>paint()).observe(document.body,{childList:true,subtree:true})}
window.TWIS_LOOP_COLORS={install,COLORS};
})();