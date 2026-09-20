import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';

const server=spawn('python',['-m','http.server','8765','-d','app'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

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
  await page.goto('http://127.0.0.1:8765/pro-rig.html',{waitUntil:'domcontentloaded'});
  await page.waitForURL(/loop-deck\.html\?mode=pro/,{timeout:8000});
  await page.waitForSelector('#simplePlaySet',{timeout:12000});
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK?.health,null,{timeout:12000});
  return {browser,context,page,errors};
}

async function runUnifiedCase(label,contextOptions,{longRun=false}={}){
  const {browser,page,errors}=await bootPro(contextOptions);
  const title=await page.locator('.simple-title').innerText();
  if(title!=='PRO RIG')throw new Error(label+': Pro surface not active: '+title);
  if(await page.evaluate(()=>typeof window.Tone)!=='undefined')throw new Error(label+': legacy Tone runtime unexpectedly loaded');

  const playBox=await page.locator('#simplePlaySet').boundingBox();
  if(!playBox||playBox.width<44||playBox.height<44)throw new Error(label+': PLAY target too small');

  let h=await health(page);
  if(!h||h.playing||h.contextState!=='not-started')throw new Error(label+': bad initial health '+JSON.stringify(h));

  await page.click('#simplePlaySet');
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===true,null,{timeout:7000});
  const freshPlay=await page.evaluate(()=>({active:[...document.querySelectorAll('.simple-role')].filter(x=>x.classList.contains('active')).length,loops:window.TWIS_LOOP_DECK.state.loops.filter(l=>l.playing).length}));
  if(freshPlay.active||freshPlay.loops)throw new Error(label+': PLAY auto-started remembered layers/loops '+JSON.stringify(freshPlay));
  await page.click('#simpleDjSet');
  const startupNow=await page.evaluate(()=>({intro:document.querySelector('[data-performance-scene="INTRO"]')?.classList.contains('active'),hats:document.querySelectorAll('.simple-role')[2]?.classList.contains('active'),perc:document.querySelectorAll('.simple-role')[3]?.classList.contains('active')}));
  if(!startupNow.intro||startupNow.hats||startupNow.perc)throw new Error(label+': PLAY still starts like a click track '+JSON.stringify(startupNow));
  await page.evaluate(()=>window.TWIS_LOOP_DECK.commands.setBpm(240));
  const p=await samplePeak(page,18,90);
  if(p<0.00002)throw new Error(label+': PLAY produced no measurable audio');
  await page.waitForFunction(()=>['SAMPLED','HYBRID'].includes(window.TWIS_LOOP_DECK.health().sonicPackState),null,{timeout:12000});
  const sonic=await page.evaluate(()=>{
    const s=window.TWIS_LOOP_DECK.state,h=window.TWIS_LOOP_DECK.health();
    const rms=buf=>{if(!buf)return 0;const x=buf.getChannelData(0);let sum=0;for(let i=0;i<x.length;i+=8)sum+=x[i]*x[i];return Math.sqrt(sum/Math.ceil(x.length/8));};
    return {
      state:h.sonicPackState,
      roles:h.roles,
      sampled:h.roles.filter(x=>x.sampled).length,
      kickDuration:s.padBuffers[0]?.duration||0,
      bassDuration:s.padBuffers[1]?.duration||0,
      bassRms:rms(s.padBuffers[1]),
      padDuration:s.padBuffers[4]?.duration||0,
      melodyDuration:s.padBuffers[5]?.duration||0,
      vocalDuration:s.padBuffers[7]?.duration||0
    };
  });
  if(sonic.roles.map(x=>x.role).join(',')!=='KICK,BASS,HATS,PERC,PAD,MELODY,FX,VOCAL')throw new Error(label+': role map broken '+JSON.stringify(sonic));
  if(sonic.sampled<4)throw new Error(label+': sampled drum/voice layer did not load '+JSON.stringify(sonic));
  if(sonic.kickDuration<0.08)throw new Error(label+': kick sample missing/too short '+JSON.stringify(sonic));
  if(sonic.bassRms<0.02||sonic.bassDuration<0.3)throw new Error(label+': bass voice missing '+JSON.stringify(sonic));
  if(sonic.padDuration<1.5||sonic.melodyDuration<0.1||sonic.vocalDuration<0.1)throw new Error(label+': tonal/vocal roles missing '+JSON.stringify(sonic));

  const roles=await page.locator('.simple-role').count();
  if(roles!==8)throw new Error(label+': expected 8 performance roles');
  for(let i=0;i<roles;i++){await page.locator('.simple-role').nth(i).click();await page.locator('.simple-role').nth(i).click();}

  for(const scene of ['INTRO','DEEP','LIFT','BREAK','PEAK','OUTRO']){
    await page.click('[data-performance-scene="'+scene+'"]');
    await page.waitForFunction(s=>document.querySelector('[data-performance-scene="'+s+'"]')?.classList.contains('active'),scene,{timeout:2500});
  }

  for(const id of ['#simpleBuild','#simpleDrop','#simpleEcho','#simpleWash','#simpleVocalHit','#simpleFuck']){
    await page.click(id);
  }
  for(let i=0;i<16;i++)await page.click(i%2?'#simpleEcho':'#simpleWash');

  h=await health(page);
  if(!h.playing||h.contextState!=='running')throw new Error(label+': engine died under control pressure');

  for(let i=0;i<6;i++){
    await page.click('#simplePlaySet');
    await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===false,null,{timeout:3000});
    await sleep(300);
    await page.click('#simplePlaySet');
    await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===true,null,{timeout:5000});
  }

  if(longRun){
    const t0=(await health(page)).tickCount;
    const mem0=await page.evaluate(()=>performance.memory?.usedJSHeapSize||0);
    await sleep(12000);
    const h2=await health(page);
    const mem1=await page.evaluate(()=>performance.memory?.usedJSHeapSize||0);
    if(!h2.playing||h2.tickCount<=t0+20)throw new Error(label+': long run stalled '+JSON.stringify(h2));
    console.log(label+' long-run '+JSON.stringify({ticks:h2.tickCount-t0,memGrowth:mem0&&mem1?mem1-mem0:null}));
  }

  await page.evaluate(async()=>{
    const s=window.TWIS_LOOP_DECK.state;
    if(s.padBuffers[0])s.loops[0].buffer=s.padBuffers[0];
    localStorage.twisSimpleAuto=JSON.stringify({active:[true,true,true,true,true,true,true,true]});
    if(navigator.storage?.getDirectory){
      let d=await navigator.storage.getDirectory();
      d=await d.getDirectoryHandle('twis-loop-deck',{create:true});
      d=await d.getDirectoryHandle('loops',{create:true});
      const h=await d.getFileHandle('0.wav',{create:true});
      const w=await h.createWritable();
      await w.write(new Uint8Array([82,73,70,70,0,0,0,0,87,65,86,69]));
      await w.close();
    }
  });
  await page.click('#simplePlaySet');
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===false,null,{timeout:3000});
  await sleep(900);
  const stoppedPeak=await samplePeak(page,8,80);
  if(stoppedPeak>0.03)throw new Error(label+': STOP leaked measurable output '+stoppedPeak);

  h=await health(page);
  if(h.startCount!==7||h.stopCount!==7)throw new Error(label+': duplicate start/stop accounting '+JSON.stringify(h));
  const cleared=await page.evaluate(async()=>({
    loopBuffers:window.TWIS_LOOP_DECK.state.loops.filter(l=>l.buffer).length,
    importLoaded:!!window.TWIS_LOOP_DECK.state.importBuffer,
    patternHits:window.TWIS_LOOP_DECK.state.pattern.flat().filter(Boolean).length,
    autoSaved:!!localStorage.twisSimpleAuto,
    legacyLoopFile:await (async()=>{try{let d=await navigator.storage.getDirectory();d=await d.getDirectoryHandle('twis-loop-deck');d=await d.getDirectoryHandle('loops');await d.getFileHandle('0.wav');return true;}catch{return false;}})()
  }));
  if(cleared.loopBuffers||cleared.importLoaded||cleared.patternHits||cleared.autoSaved||cleared.legacyLoopFile)throw new Error(label+': STOP/CLEAR left session data behind '+JSON.stringify(cleared));

  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#simplePlaySet',{timeout:12000});
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK?.health,null,{timeout:12000});
  h=await health(page);
  if(h.playing||h.contextState!=='not-started')throw new Error(label+': reload not clean '+JSON.stringify(h));
  const afterReload=await page.evaluate(()=>({
    loops:window.TWIS_LOOP_DECK.state.loops.filter(l=>l.buffer).length,
    imported:!!window.TWIS_LOOP_DECK.state.importBuffer,
    hits:window.TWIS_LOOP_DECK.state.pattern.flat().filter(Boolean).length
  }));
  if(afterReload.loops||afterReload.imported||afterReload.hits)throw new Error(label+': stale audio/pattern restored after reload '+JSON.stringify(afterReload));
  if(errors.length)throw new Error(label+': browser errors '+errors.join(' | '));
  await browser.close();
  return {label,peak:p,roles,sonic};
}

async function runAdvancedPath(){
  const {browser,page,errors}=await bootPro({viewport:{width:412,height:915}});
  await page.click('#simpleAdvanced');
  await page.waitForSelector('#ldLoops');
  const loops=await page.locator('.ld-loop').count();
  if(loops!==8)throw new Error('advanced: expected 8 loop tracks, got '+loops);
  if(await page.locator('[data-rec]').count()!==8)throw new Error('advanced: recording controls missing');
  if(await page.locator('#ldFile').count()!==1)throw new Error('advanced: import control missing');
  const micText=await page.locator('#ldMicEnable').innerText();
  if(!/MIC OFF/.test(micText))throw new Error('advanced: mic control is not an explicit off/on toggle: '+micText);
  const loopTexts=await page.locator('.ld-loop').allInnerTexts();
  if(!loopTexts.every(x=>/LOOP \d+ · (EMPTY|READY|PLAYING|RECORDING|ARMED)/.test(x)))throw new Error('advanced: loop state labels are unclear '+JSON.stringify(loopTexts));

  if(errors.length)throw new Error('advanced browser errors '+errors.join(' | '));
  await browser.close();
  return {loops};
}

async function runOfflineWarm(){
  const {browser,context,page}=await bootPro({viewport:{width:1366,height:768}});
  await page.evaluate(()=>navigator.serviceWorker?.ready);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#simplePlaySet',{timeout:12000});
  await page.click('#simplePlaySet');
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===true,null,{timeout:7000});
  await page.click('#simplePlaySet');
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===false,null,{timeout:3000});
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:12000});
  await page.waitForSelector('#simplePlaySet',{timeout:8000});
  await page.click('#simplePlaySet');
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===true,null,{timeout:7000});
  await page.waitForFunction(()=>document.querySelector('[data-performance-scene="INTRO"]')?.classList.contains('active'),null,{timeout:7000});
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().roles?.[0]?.role==='KICK',null,{timeout:7000});
  let peak=await samplePeak(page,20,100);
  if(peak<0.00002){
    await page.evaluate(()=>window.TWIS_LOOP_DECK.commands.triggerPad(0,.9,window.TWIS_LOOP_DECK.state.ctx.currentTime+.03));
    peak=await samplePeak(page,12,80);
  }
  if(peak<0.00002)throw new Error('offline: local core produced no audio');
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
  console.log('UNIFIED LOOP DECK / PRO RIG BROWSER PROOF PASS '+JSON.stringify({desktop,mobile,advanced,offline}));
}finally{
  server.kill('SIGTERM');
}
