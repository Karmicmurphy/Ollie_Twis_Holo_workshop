import { chromium, devices } from 'playwright';
import { spawn } from 'node:child_process';

const server = spawn('python', ['-m','http.server','8765','-d','app'], {stdio:'ignore'});
const sleep = ms => new Promise(r=>setTimeout(r,ms));

async function waitServer(){
  for(let i=0;i<30;i++){
    try{
      const r=await fetch('http://127.0.0.1:8765/pro-rig.html');
      if(r.ok)return;
    }catch{}
    await sleep(250);
  }
  throw new Error('local server did not start');
}

async function runCase(label, contextOptions){
  const browser=await chromium.launch({headless:true});
  const context=await browser.newContext(contextOptions);
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',msg=>{ if(msg.type()==='error') errors.push(msg.text()); });

  await page.goto('http://127.0.0.1:8765/pro-rig.html',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#play');
  const before=await page.locator('#clock').innerText();
  if(before!=='SILENT') throw new Error(label+': expected SILENT on entry, got '+before);

  await page.click('#play');
  await page.waitForFunction(()=>document.querySelector('#play')?.textContent.includes('STOP SET'),null,{timeout:12000});
  await page.waitForFunction(()=>/AUDIO:\s*RUNNING/.test(document.querySelector('#diag')?.textContent||''),null,{timeout:12000});

  await page.click('[data-scene="BREAK"]');
  await page.waitForFunction(()=>/queued|LIVE/.test(document.querySelector('#status')?.textContent||''),null,{timeout:5000});
  await page.click('#vocalHit');
  await page.click('#build');
  await page.click('#echo');
  await page.click('#wash');

  const diag=await page.locator('#diag').innerText();
  const status=await page.locator('#status').innerText();
  const playText=await page.locator('#play').innerText();
  if(!playText.includes('STOP SET')) throw new Error(label+': transport did not stay running');
  if(errors.length) throw new Error(label+': browser errors: '+errors.join(' | '));

  await page.click('#play');
  await page.waitForFunction(()=>document.querySelector('#clock')?.textContent==='SILENT',null,{timeout:5000});
  await browser.close();
  return {label,diag,status};
}

await waitServer();
try{
  const desktop=await runCase('desktop',{viewport:{width:1366,height:768}});
  const mobile=await runCase('mobile',{
    ...devices['Pixel 7'],
    viewport:{width:412,height:915}
  });
  console.log('PRO RIG BROWSER PROOF PASS', JSON.stringify({desktop,mobile}));
}finally{
  server.kill('SIGTERM');
}
