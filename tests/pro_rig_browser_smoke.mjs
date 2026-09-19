import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('python', ['-m','http.server','8765','-d','app'], {stdio:'ignore'});
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitServer(){
  for(let i=0;i<40;i++){
    try{
      const r=await fetch('http://127.0.0.1:8765/pro-rig.html');
      if(r.ok)return;
    }catch{}
    await sleep(250);
  }
  throw new Error('local server did not start');
}

async function sampleHealth(page, count=12, delay=120){
  const out=[];
  for(let i=0;i<count;i++){
    out.push(await page.evaluate(() => window.__TWIS_PRO_RIG__?.snapshot()));
    await sleep(delay);
  }
  return out.filter(Boolean);
}

function maxLevel(rows){
  return Math.max(0, ...rows.map(x => Number(x.level)||0));
}

async function runCase(label, contextOptions, opts={}){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext(contextOptions);

  if(opts.blockSamples){
    await context.route(/raw\.githubusercontent\.com\/(Boochi44|n33kos)\//, route => route.abort('failed'));
  }

  if(opts.slowSamples){
    await context.route(/raw\.githubusercontent\.com\/(Boochi44|n33kos)\//, async route => {
      const response=await route.fetch();
      await sleep(7600);
      await route.fulfill({response});
    });
  }

  const page=await context.newPage();
  const errors=[];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('response', res => {
    if(res.status()>=400 && res.url().startsWith('http://127.0.0.1:8765/')){
      errors.push('local '+res.status()+' '+res.url());
    }
  });

  await page.goto('http://127.0.0.1:8765/pro-rig.html', {waitUntil:'domcontentloaded'});
  await page.waitForSelector('#play');

  const box=await page.locator('#play').boundingBox();
  if(!box || box.width<44 || box.height<44) throw new Error(label+': PLAY touch target too small');
  if(await page.locator('#clock').innerText()!=='SILENT') throw new Error(label+': page not silent on entry');

  const initial=await page.evaluate(() => window.__TWIS_PRO_RIG__?.snapshot());
  if(!initial || initial.running || initial.contextState!=='not-started'){
    throw new Error(label+': bad initial health '+JSON.stringify(initial));
  }

  await page.click('#play');
  await page.waitForFunction(() => window.__TWIS_PRO_RIG__?.snapshot().running===true, null, {timeout:12000});
  let live=await sampleHealth(page,16,120);
  if(maxLevel(live)<0.00005) throw new Error(label+': PLAY produced no measurable output');

  for(const sel of ['[data-stem="KICK"]','[data-stem="BASS"]','[data-stem="PERC"]','[data-stem="CHORDS"]','[data-stem="MELODY"]','[data-stem="ATMOS"]','[data-stem="VOCAL"]','[data-stem="FX"]']){
    await page.click(sel);
    await page.click(sel);
  }

  for(const scene of ['INTRO','DEEP','LIFT','BREAK','PEAK','OUTRO']){
    await page.click('[data-scene="'+scene+'"]');
  }

  for(const id of ['#vocalHit','#build','#drop','#echo','#wash','#variation']){
    await page.click(id);
  }

  for(let i=0;i<24;i++) await page.click(i%2 ? '#echo' : '#wash');
  for(let i=0;i<12;i++) await page.click('#variation');

  let rapid=await page.evaluate(() => window.__TWIS_PRO_RIG__.snapshot());
  if(!rapid.running || rapid.contextState!=='running') throw new Error(label+': engine died under rapid interaction');

  for(let i=0;i<8;i++){
    await page.click('#play');
    await sleep(160);

    let stopped=await page.evaluate(() => window.__TWIS_PRO_RIG__.snapshot());
    if(stopped.running || stopped.transportState!=='stopped'){
      throw new Error(label+': STOP failed on cycle '+i+' '+JSON.stringify(stopped));
    }

    const silentRows=await sampleHealth(page,5,80);
    if(maxLevel(silentRows)>0.02) throw new Error(label+': STOP leaked audio on cycle '+i+' level='+maxLevel(silentRows));

    await page.click('#play');
    await page.waitForFunction(() => window.__TWIS_PRO_RIG__?.snapshot().running===true, null, {timeout:5000});
    const restartRows=await sampleHealth(page,5,80);
    if(maxLevel(restartRows)<0.00002) throw new Error(label+': restart '+i+' produced silence');
  }

  let repeated=await page.evaluate(() => window.__TWIS_PRO_RIG__.snapshot());
  if(repeated.startCount!==9 || repeated.stopCount!==8){
    throw new Error(label+': start/stop duplication detected '+JSON.stringify(repeated));
  }
  if(repeated.maxTickJitter>0.03){
    throw new Error(label+': scheduler jitter too high '+repeated.maxTickJitter);
  }

  if(opts.longRun){
    const mem0=await page.evaluate(() => performance.memory?.usedJSHeapSize||0);
    await sleep(20000);
    const mem1=await page.evaluate(() => performance.memory?.usedJSHeapSize||0);
    const h=await page.evaluate(() => window.__TWIS_PRO_RIG__.snapshot());
    if(!h.running || h.tickCount<100) throw new Error(label+': duration run stalled '+JSON.stringify(h));
    if(h.maxTickJitter>0.03) throw new Error(label+': duration scheduler drift '+h.maxTickJitter);
    console.log(label+' duration health '+JSON.stringify({tickCount:h.tickCount,maxTickJitter:h.maxTickJitter,memGrowth:mem1&&mem0?mem1-mem0:null}));
  }

  const pack=await page.evaluate(() => window.__TWIS_PRO_RIG__.snapshot().packState);
  if(opts.blockSamples && pack!=='FALLBACK OK'){
    throw new Error(label+': forced sample failure did not enter FALLBACK OK, got '+pack);
  }

  await page.click('#play');
  await sleep(260);
  const finalStop=await page.evaluate(() => window.__TWIS_PRO_RIG__.snapshot());
  const finalSilence=await sampleHealth(page,8,80);
  if(finalStop.running || maxLevel(finalSilence)>0.02){
    throw new Error(label+': final STOP is not silent');
  }

  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('#play');
  const reloaded=await page.evaluate(() => window.__TWIS_PRO_RIG__?.snapshot());
  if(!reloaded || reloaded.running || reloaded.contextState!=='not-started' || await page.locator('#clock').innerText()!=='SILENT'){
    throw new Error(label+': reload did not return clean state '+JSON.stringify(reloaded));
  }

  if(errors.length) throw new Error(label+': browser errors '+errors.join(' | '));

  const diag=await page.locator('#diag').innerText();
  await browser.close();
  return {label,diag,pack};
}


async function runLoopDeckCase(){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({...devices['Pixel 7'],viewport:{width:412,height:915}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://127.0.0.1:8765/pro-rig.html',{waitUntil:'domcontentloaded'});
  await page.click('#loops');
  await page.waitForURL(/loop-deck\.html/);
  await page.waitForSelector('.simple-shell',{timeout:12000});
  const roles=await page.locator('.simple-role').count();
  if(roles!==8) throw new Error('loop-deck: expected 8 simple roles, got '+roles);
  const playTarget=await page.locator('.simple-role').first().boundingBox();
  if(!playTarget||playTarget.width<44||playTarget.height<44) throw new Error('loop-deck: touch target too small');
  await page.locator('.simple-role').first().click();
  await page.waitForFunction(()=>window.TWIS_LOOP_DECK?.state?.playing===true,null,{timeout:5000});
  await page.click('#simpleStop');
  if(errors.length) throw new Error('loop-deck browser errors '+errors.join(' | '));
  await browser.close();
  return {roles,playingPath:true};
}

async function runOfflineWarmCase(){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:1366,height:768}});
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:8765/pro-rig.html',{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>navigator.serviceWorker?.ready);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.click('#play');
  await page.waitForFunction(()=>window.__TWIS_PRO_RIG__?.snapshot().running===true,null,{timeout:12000});
  await page.click('#play');
  await sleep(250);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:12000});
  await page.waitForSelector('#play',{timeout:5000});
  if(await page.locator('#clock').innerText()!=='SILENT') throw new Error('offline warm reload not silent');
  await page.click('#play');
  await page.waitForFunction(()=>window.__TWIS_PRO_RIG__?.snapshot().running===true,null,{timeout:12000});
  const rows=await sampleHealth(page,8,100);
  if(maxLevel(rows)<0.00002) throw new Error('offline warm fallback produced no audio');
  await page.click('#play');
  await browser.close();
  return {warmOffline:true};
}

await waitServer();

try{
  const desktop=await runCase('desktop',{viewport:{width:1366,height:768}},{longRun:true});
  const mobile=await runCase('mobile',{...devices['Pixel 7'],viewport:{width:412,height:915}});
  const fallback=await runCase('sample-failure',{viewport:{width:1366,height:768}},{blockSamples:true});
  const slow=await runCase('slow-samples',{viewport:{width:1366,height:768}},{slowSamples:true});
  const loopDeck=await runLoopDeckCase();
  const offline=await runOfflineWarmCase();
  console.log('PRO RIG FINISH BROWSER PROOF PASS '+JSON.stringify({desktop,mobile,fallback,slow,loopDeck,offline}));
}finally{
  server.kill('SIGTERM');
}
