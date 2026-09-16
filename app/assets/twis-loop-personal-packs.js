(()=>{
'use strict';
const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
let installed=false;
const PACKS={
 'NOTHING LEFT RED':[0,3,5,7,8,9,13,14,15,16,17,18,19,20,23,22],
 'ROAD SIGNAL':[2,3,5,6,8,10,11,13,15,16,18,19,21,20,23,22],
 'INDUSTRIAL BLUES':[0,3,4,7,9,10,11,14,15,18,19,20,21,17,23,22],
 'SCARRED RELEASE':[0,3,5,7,8,10,13,15,16,17,18,19,20,11,23,22],
 'NIGHT DRIVE':[1,3,5,6,8,9,11,13,14,15,17,18,19,20,23,22]
};
const DESCS={
 'NOTHING LEFT RED':'Deep kick, tribal pressure, dirty bass, dark pad, cello/violin shadows, detuned guitar and machine noise. Built around your Nothing Left Blinking Red DNA.',
 'ROAD SIGNAL':'Night-road pulse: tight kick, hats, sub, warm synth, lead, clean/dirty guitar, strings and noise/riser texture.',
 'INDUSTRIAL BLUES':'Dirtier and more human: deep kick, clap, low tom, dirty/pluck bass, warm synth, keys, cello and guitar weight.',
 'SCARRED RELEASE':'Starts dark but gives you more melodic room: sub/pluck bass, pad, soft keys, bell, violin, cello, clean guitar and noise.',
 'NIGHT DRIVE':'808/sub foundation with open-air hats, warm synth, lead, keys, strings, guitars and late-night FX.'
};
function status(t){const e=q('#ldStatus');if(e)e.textContent=t;}
async function loadPack(name){const map=PACKS[name];if(!map)return;const grid=qa('#soundPadGrid [data-sound-pad]'),sel=q('#soundPreset'),load=q('#soundLoad');if(grid.length<16||!sel||!load)return status('Open SOUND once so the Sound Rack can finish loading.');for(let i=0;i<16;i++){grid[i].click();sel.value=String(map[i]);load.click();await new Promise(r=>setTimeout(r,8));}status(`${name} loaded across all 16 pads. Hit PADS to play it or SEQ to program it.`);}
function build(){const page=q('[data-page="sound"]');if(!page||q('#twisPersonalPacks'))return false;const card=document.createElement('div');card.className='ld-sound-card';card.id='twisPersonalPacks';card.innerHTML=`<strong>MY TWIS SOUND PACKS</strong><div class="ld-sound-note">One tap loads all 16 pads. These are built around your dark industrial / road-night / detuned guitar / deep bass / tribal drum / cello-violin sound identity.</div><select id="twisPackSel">${Object.keys(PACKS).map(n=>`<option>${n}</option>`).join('')}</select><div id="twisPackDesc" class="ld-sound-note"></div><button id="twisPackLoad">LOAD WHOLE 16-PAD PACK</button>`;const own=page.querySelector('.ld-sound-card:last-child');page.querySelector('.ld-section')?.insertBefore(card,own||null);const sel=q('#twisPackSel'),desc=q('#twisPackDesc');const paint=()=>desc.textContent=DESCS[sel.value]||'';sel.onchange=paint;paint();q('#twisPackLoad').onclick=()=>loadPack(sel.value);return true}
function install(){if(installed)return;if(!build()){setTimeout(install,150);return}installed=true}
window.TWIS_LOOP_PERSONAL_PACKS={install};
})();