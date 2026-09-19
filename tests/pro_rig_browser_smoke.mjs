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
  await page.evaluate(()=>window.TWIS_LOOP_DECK.commands.setBpm(240));
  const p=await samplePeak(page,18,90);
  if(p<0.00002)throw new Error(label+': PLAY produced no measurable audio');

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

  await page.click('#simplePlaySet');
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK.health().playing===false,null,{timeout:3000});
  await sleep(900);
  const stoppedPeak=await samplePeak(page,8,80);
  if(stoppedPeak>0.03)throw new Error(label+': STOP leaked measurable output '+stoppedPeak);

  h=await health(page);
  if(h.startCount!==7||h.stopCount!==7)throw new Error(label+': duplicate start/stop accounting '+JSON.stringify(h));

  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#simplePlaySet',{timeout:12000});
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK?.health,null,{timeout:12000});
  h=await health(page);
  if(h.playing||h.contextState!=='not-started')throw new Error(label+': reload not clean '+JSON.stringify(h));
  if(errors.length)throw new Error(label+': browser errors '+errors.join(' | '));
  await browser.close();
  return {label,peak:p,roles};
}

async function runAdvancedPath(){
  const {browser,page,errors}=await bootPro({viewport:{width:412,height:915}});
  await page.click('#simpleAdvanced');
  await page.waitForSelector('#ldLoops');
  const loops=await page.locator('.ld-loop').count();
  if(loops!==8)throw new Error('advanced: expected 8 loop tracks, got '+loops);
  if(await page.locator('[data-rec]').count()!==8)throw new Error('advanced: recording controls missing');
  if(await page.locator('#ldFile').count()!==1)throw new Error('advanced: import control missing');
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
  const peak=await samplePeak(page,12,80);
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
