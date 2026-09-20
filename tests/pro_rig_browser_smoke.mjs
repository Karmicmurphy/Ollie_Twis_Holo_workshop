import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const server=spawn('python',['-m','http.server','8765','-d','app'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const wavData=readFileSync('app/assets/samples/twis/909-kick.wav').toString('base64');

function mockSoundfontSource(){
  const notes=['A#1','C2','D2','F2','G2','A#2','C3','D3','F3','G3','A#3','C4','D4','F4','G4','A4','C5'];
  const rows=notes.map(n=>JSON.stringify(n)+':'+JSON.stringify('data:audio/wav;base64,'+wavData)+',').join('\n');
  return "if(typeof(MIDI)==='undefined')var MIDI={};if(typeof(MIDI.Soundfont)==='undefined')MIDI.Soundfont={};MIDI.Soundfont.test={\n"+rows+"\n}";
}

async function waitServer(){
  for(let i=0;i<40;i++){
    try{const r=await fetch('http://127.0.0.1:8765/pro-rig.html');if(r.ok)return;}catch{}
    await sleep(250);
  }
  throw new Error('server did not start');
}
async function health(page){return page.evaluate(()=>window.TWIS_LOOP_DECK?.health?.());}
async function samplePeak(page,count=12,delay=80){
  let max=0;
  for(let i=0;i<count;i++){const h=await health(page);max=Math.max(max,Number(h?.peak)||0);await sleep(delay);}
  return max;
}
async function bootPro(contextOptions){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext(contextOptions);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://gleitz.github.io/midi-js-soundfonts/FluidR3_GM/*-mp3.js',route=>
    route.fulfill({status:200,contentType:'application/javascript',body:mockSoundfontSource()})
  );
  await page.goto('http://127.0.0.1:8765/pro-rig.html',{waitUntil:'domcontentloaded'});
  await page.waitForURL(/loop-deck\.html\?mode=pro/,{timeout:8000});
  await page.waitForSelector('#simplePlaySet',{timeout:12000});
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK?.health,null,{timeout:12000});
  return {browser,context,page,errors};
}

async function runUnifiedCase(label,contextOptions,{longRun=false}={}){
  const {browser,page,errors}=await bootPro(contextOptions);
  if((await page.locator('.simple-title').innerText())!=='PRO RIG')throw new Error(label+': Pro surface missing');
  if(await page.locator('#simpleDjSet').count())throw new Error(label+': automatic DJ generator still exposed');
  if(await page.locator('#simpleFuck').count())throw new Error(label+': randomizer still exposed');
  if(await page.locator('#simpleVocalHit').count())throw new Error(label+': fake vocal trigger still exposed');
  if(await page.evaluate(()=>typeof window.Tone)!=='undefined')throw new Error(label+': legacy Tone runtime loaded');

  const playBox=await page.locator('#simplePlaySet').boundingBox();
  if(!playBox||playBox.width<44||playBox.height<44)throw new Error(label+': PLAY target too small');

  let h=await health(page);
  if(!h||h.playing||h.contextState!=='not-started')throw new Error(label+': dirty initial state '+JSON.stringify(h));

  // PLAY must be transport-only: no music, no loop, no role is allowed to self-start.
  await page.click('#simplePlaySet');
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===true,null,{timeout:7000});
  const fresh=await page.evaluate(()=>({
    active:[...document.querySelectorAll('.simple-role')].filter(x=>x.classList.contains('active')).length,
    loops:window.TWIS_LOOP_DECK.state.loops.filter(l=>l.playing).length,
    hits:window.TWIS_LOOP_DECK.state.pattern.flat().filter(Boolean).length
  }));
  if(fresh.active||fresh.loops||fresh.hits)throw new Error(label+': PLAY invented music '+JSON.stringify(fresh));
  const silent=await samplePeak(page,8,70);
  if(silent>0.01)throw new Error(label+': PLAY was not silent '+silent);

  // Explicit KICK must be the first audible thing, using the vendored sample.
  await page.locator('.simple-role').nth(0).click();
  await page.waitForFunction(()=>document.querySelectorAll('.simple-role')[0]?.classList.contains('active'),null,{timeout:5000});
  let peak=await samplePeak(page,18,90);
  if(peak<0.00002)throw new Error(label+': explicit KICK produced no audio');

  // Explicit BASS must load a sampled instrument; no oscillator/fake fallback.
  await page.locator('.simple-role').nth(1).click();
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().sampledRoles?.roles?.BASS?.ready===true,null,{timeout:12000});
  await page.waitForFunction(()=>document.querySelectorAll('.simple-role')[1]?.classList.contains('active'),null,{timeout:5000});
  peak=Math.max(peak,await samplePeak(page,18,90));

  // PAD and MELODY use the same sampled-instrument contract.
  for(const idx of [4,5]){
    await page.locator('.simple-role').nth(idx).click();
  }
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().sampledRoles?.roles?.PAD?.ready&&window.TWIS_LOOP_DECK.health().sampledRoles?.roles?.MELODY?.ready,null,{timeout:12000});

  h=await health(page);
  const roleNames=h.roles.map(x=>x.role).join(',');
  if(roleNames!=='KICK,BASS,HATS,CLAP,PAD,MELODY,FX,VOCAL')throw new Error(label+': wrong role map '+roleNames);
  if(h.roles.filter(x=>x.sampled).length<4)throw new Error(label+': local drum kit incomplete '+JSON.stringify(h.roles));
  for(const role of ['BASS','PAD','MELODY']){
    if(!h.sampledRoles.roles[role].ready||h.sampledRoles.roles[role].decoded<1)throw new Error(label+': '+role+' sampled instrument not ready');
  }

  // Explicit scenes are allowed; nothing should advance scenes by itself.
  for(const scene of ['INTRO','DEEP','LIFT','BREAK','PEAK','OUTRO']){
    await page.click('[data-performance-scene="'+scene+'"]');
    await page.waitForFunction(s=>document.querySelector('[data-performance-scene="'+s+'"]')?.classList.contains('active'),scene,{timeout:7000});
  }
  for(const id of ['#simpleBuild','#simpleDrop','#simpleEcho','#simpleWash'])await page.click(id);
  for(let i=0;i<8;i++)await page.click(i%2?'#simpleEcho':'#simpleWash');

  if(longRun){
    const t0=(await health(page)).tickCount;
    await sleep(10000);
    const h2=await health(page);
    if(!h2.playing||h2.tickCount<=t0+20)throw new Error(label+': long run stalled '+JSON.stringify(h2));
  }

  // STOP is not CLEAR.
  await page.click('#simplePlaySet');
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===false,null,{timeout:4000});
  if((await samplePeak(page,8,70))>0.03)throw new Error(label+': STOP leaked output');

  // Inject stale state and prove CLEAR EVERYTHING destroys it.
  await page.evaluate(async()=>{
    const s=window.TWIS_LOOP_DECK.state;
    if(s.padBuffers[0])s.loops[0].buffer=s.padBuffers[0];
    localStorage.twisSimpleAuto=JSON.stringify({active:[true,true,true,true,true,true,true,true]});
    if(navigator.storage?.getDirectory){
      let d=await navigator.storage.getDirectory();
      d=await d.getDirectoryHandle('twis-loop-deck',{create:true});
      d=await d.getDirectoryHandle('loops',{create:true});
      const fh=await d.getFileHandle('0.wav',{create:true});
      const w=await fh.createWritable();await w.write(new Uint8Array([82,73,70,70,0,0,0,0,87,65,86,69]));await w.close();
    }
  });
  await page.click('#simpleStop');
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.state.loops.every(l=>!l.buffer)&&window.TWIS_LOOP_DECK.state.pattern.flat().every(v=>!v),null,{timeout:6000});
  const cleared=await page.evaluate(async()=>({
    loops:window.TWIS_LOOP_DECK.state.loops.filter(l=>l.buffer).length,
    imported:!!window.TWIS_LOOP_DECK.state.importBuffer,
    hits:window.TWIS_LOOP_DECK.state.pattern.flat().filter(Boolean).length,
    autoSaved:!!localStorage.twisSimpleAuto,
    legacyLoopFile:await (async()=>{try{let d=await navigator.storage.getDirectory();d=await d.getDirectoryHandle('twis-loop-deck');d=await d.getDirectoryHandle('loops');await d.getFileHandle('0.wav');return true;}catch{return false;}})()
  }));
  if(cleared.loops||cleared.imported||cleared.hits||cleared.autoSaved||cleared.legacyLoopFile)throw new Error(label+': CLEAR left stale state '+JSON.stringify(cleared));

  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#simplePlaySet',{timeout:12000});
  h=await health(page);
  if(h.playing||h.contextState!=='not-started')throw new Error(label+': reload dirty '+JSON.stringify(h));
  if(errors.length)throw new Error(label+': browser errors '+errors.join(' | '));
  await browser.close();
  return {label,peak,roles:8,sampled:h.sampledRoles};
}

async function runAdvancedPath(){
  const {browser,page,errors}=await bootPro({viewport:{width:412,height:915}});
  await page.click('#simpleAdvanced');
  await page.waitForSelector('#ldLoops');
  if(await page.locator('.ld-loop').count()!==8)throw new Error('advanced: expected 8 loop tracks');
  if(await page.locator('[data-rec]').count()!==8)throw new Error('advanced: recording controls missing');
  if(await page.locator('#ldFile').count()!==1)throw new Error('advanced: import control missing');
  if(await page.locator('#ldClearAll').count()!==1)throw new Error('advanced: CLEAR ALL LOOPS missing');
  if(!/MIC OFF/.test(await page.locator('#ldMicEnable').innerText()))throw new Error('advanced: mic toggle unclear');
  const loopTexts=await page.locator('.ld-loop').allInnerTexts();
  if(!loopTexts.every(x=>/LOOP \d+ · (EMPTY|READY|PLAYING|RECORDING|ARMED)/.test(x)))throw new Error('advanced: loop states unclear '+JSON.stringify(loopTexts));
  if(errors.length)throw new Error('advanced browser errors '+errors.join(' | '));
  await browser.close();
  return {loops:8};
}

async function runOfflineWarm(){
  const {browser,context,page}=await bootPro({viewport:{width:1366,height:768}});
  await page.evaluate(()=>navigator.serviceWorker?.ready);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#simplePlaySet',{timeout:12000});
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:12000});
  await page.waitForSelector('#simplePlaySet',{timeout:8000});
  await page.click('#simplePlaySet');
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===true,null,{timeout:7000});
  const silent=await samplePeak(page,6,70);
  if(silent>0.01)throw new Error('offline: PLAY invented audio');
  await page.locator('.simple-role').nth(0).click();
  const peak=await samplePeak(page,18,90);
  if(peak<0.00002)throw new Error('offline: vendored kick produced no audio');
  await page.click('#simplePlaySet');
  await browser.close();
  return {offline:true,peak};
}

await waitServer();
try{
  const desktop=await runUnifiedCase('desktop',{viewport:{width:1366,height:768}},{longRun:true});
  const mobile=await runUnifiedCase('mobile',{...devices['Pixel 7'],viewport:{width:412,height:915}});
  const advanced=await runAdvancedPath();
  const offline=await runOfflineWarm();
  console.log('SAMPLE-FIRST LOOP DECK / PRO RIG BROWSER PROOF PASS '+JSON.stringify({desktop,mobile,advanced,offline}));
}finally{
  server.kill('SIGTERM');
}
