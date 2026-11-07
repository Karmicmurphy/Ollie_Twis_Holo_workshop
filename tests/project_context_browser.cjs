// Disposable local browser proof; no owner session, real worker or cloud service.
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { once } = require('node:events');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '..');
const output = path.resolve(process.env.CONTEXT_BROWSER_OUTPUT || 'output/playwright/project-context');
const bootstrap = `
import sys,json,os
from pathlib import Path
sys.path.insert(0,str(Path(sys.argv[1])/'companion'))
import server
base=Path(sys.argv[2]);server.DATA=base;server.DB=base/'workshop.sqlite3'
for name in ('PROJECTS','IMPORTS','BACKUPS','SOURCE_ARCHIVES','REGISTRY'):
    directory=base/name.lower();directory.mkdir();setattr(server,name,directory)
server.foundry_compile_human_signal_job=lambda *a,**k: (_ for _ in ()).throw(RuntimeError('OFFLINE_FIXTURE_NO_WORKER'))
server.create_generation_job=lambda *a,**k: (_ for _ in ()).throw(RuntimeError('OFFLINE_FIXTURE_NO_WORKER'))
server.connect().close()
http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler)
os.environ['TWIS_HOLO_PORT']=str(http.server_port)
print(json.dumps({'port':http.server_port}),flush=True)
http.serve_forever()
`;

(async () => {
  const data = await fs.mkdtemp(path.join(os.tmpdir(), 'foundation-context-browser-'));
  await fs.mkdir(output, { recursive: true });
  const child = spawn(process.env.PYTHON || 'python', ['-X', 'utf8', '-B', '-u', '-c', bootstrap, root, data],
    { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  let browser, page, logs = '', result;
  const errors = [];
  child.stderr.on('data', chunk => { logs += chunk.toString(); });
  try {
    const port = await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error('Local fixture startup timed out')), 30000);
      let text = '';
      child.stdout.on('data', chunk => {
        text += chunk.toString();
        if (text.includes('\n')) { clearTimeout(timeout); resolve(JSON.parse(text.split('\n')[0]).port); }
      });
      child.once('error', reject);
      child.once('exit', code => { clearTimeout(timeout); reject(Error('Fixture exited: ' + code)); });
    });
    const origin = `http://127.0.0.1:${port}`;
    browser = await playwright.chromium.launch({ headless: true,
      executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.route('**/*', route => new URL(route.request().url()).origin === origin ?
      route.continue() : route.abort());
    page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      if (!localStorage.getItem('twisHolo.full.v1')) {
        localStorage.setItem('twisHolo.full.v1', JSON.stringify({ activeProject: 'stale-project' }));
      }
    });
    await page.goto(origin);
    await page.locator('.nav[data-room="work"]').click();
    await page.locator('#contextSave').waitFor({ state: 'visible' });
    await page.waitForFunction(() => !document.querySelector('#contextSave').disabled);
    await page.locator('#contextText').fill('Recover the original asset with exact source provenance.');
    await page.locator('#contextSave').click();
    await page.waitForFunction(() => document.querySelector('#contextStatus').textContent === 'Context saved');
    assert.match(await page.locator('#contextReceipt').textContent(), /SHA-256 [0-9a-f]{64}/);
    await page.locator('#contextKind').selectOption('correction');
    await page.locator('#contextText').fill('Preserve the original asset and its source revision.');
    await page.locator('#contextSave').click();
    await page.waitForFunction(() => document.querySelector('#contextGoal').textContent === 'Preserve the original asset and its source revision.');
    await page.locator('#contextKind').selectOption('decision');
    await page.locator('#contextText').fill('Keep the existing commissioning request unchanged.');
    await page.locator('#contextSave').click();
    await page.waitForFunction(() => document.querySelectorAll('#contextEvents li').length === 3);
    await page.locator('#contextEnabled').uncheck();
    await page.waitForFunction(() => !document.querySelector('#contextEnabled').disabled);
    assert.equal(await page.locator('#contextEnabled').isChecked(), false);
    await page.reload();
    await page.locator('.nav[data-room="work"]').click();
    await page.waitForFunction(() => document.querySelectorAll('#contextEvents li').length === 4);
    assert.equal(await page.locator('#contextEnabled').isChecked(), false);
    await page.locator('#contextEvents').evaluate(e => e.parentElement.open = true);
    await page.mouse.move(900, 60);
    await page.screenshot({ path: path.join(output, 'desktop.png'), fullPage: true });
    const view = await page.evaluate(async () => {
      const projects = await (await fetch('/api/projects')).json();
      return (await fetch(`/api/projects/${projects[0].id}/foundation/context`)).json();
    });
    assert.equal(view.executionAuthority, 'NOT_GRANTED');
    assert.equal(view.proofScope, 'CONTEXT_STORAGE_NOT_JOB_CERTIFICATION');
    assert.equal(view.jobs.length, 0);
    await page.locator('.nav[data-room="home"]').click();
    await page.locator('#openDoorInput').fill('Do not start this paused local job.');
    await page.locator('#openDoorStart').click();
    assert.equal(await page.locator('#openDoorStatus').textContent(), 'New local jobs are paused for this project.');
    assert.equal(await page.locator('#openDoorInput').inputValue(), 'Do not start this paused local job.');
    await page.locator('.nav[data-room="work"]').click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, 'narrow.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
    const apiCache = await page.evaluate(async () => {
      const requests = (await Promise.all((await caches.keys()).map(async key => (await caches.open(key)).keys()))).flat();
      return requests.some(request => new URL(request.url).pathname.startsWith('/api/'));
    });
    assert.equal(apiCache, false);
    assert.deepEqual(errors, []);
    result = { status: 'PASS', scope: 'DISPOSABLE_LOCAL_BROWSER_NOT_HOSTED_OWNER_PROOF',
      assertions: ['save', 'correction', 'decision', 'pause', 'reopen', 'no-worker', 'storage-receipt',
        'paused-open-door', 'narrow-layout', 'private-api-not-cached', 'no-page-errors'],
      context: { revision: view.revision, revisionId: view.revisionId, snapshotSha256: view.snapshotSha256 },
      workerExecuted: false, serverShutdown: false };
  } catch (error) {
    if (page) {
      await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
      logs += `\nBROWSER: ${page.url()}\n`;
      logs += `PAGE_ERRORS: ${JSON.stringify(errors)}\n`;
      logs += await page.locator('body').innerText().catch(() => 'body unavailable');
    }
    throw error;
  } finally {
    if (browser) await browser.close();
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
    assert.equal(path.dirname(data), path.resolve(os.tmpdir()));
    assert.ok(path.basename(data).startsWith('foundation-context-browser-'));
    await fs.rm(data, { recursive: true, force: true });
    if (result) { result.serverShutdown = true; await fs.writeFile(path.join(output, 'result.json'), JSON.stringify(result, null, 2)); }
    await fs.writeFile(path.join(output, 'local-http.log'), logs);
  }
  console.log(JSON.stringify(result));
})().catch(error => { console.error(error); process.exitCode = 1; });
