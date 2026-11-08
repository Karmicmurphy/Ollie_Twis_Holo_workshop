// Mocked transport/UI proof only. No real Access session, GitHub dispatch or model.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const playwright = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..', 'app');
const output = path.resolve(process.env.FOUNDATION_BROWSER_OUTPUT || 'output/playwright/foundation-hosted');
const origin = 'https://ollie-twis-holo-workshop.pages.dev';
const requestId = 'request-commissioning-002';

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await playwright.chromium.launch({ headless: true,
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  let page, posts = 0, gets = 0, phase = 'NOT_SUBMITTED', blockClient = false;
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    const delivery = { request_id: requestId, status: 'COMPLETE', run_id: 123, job_id: 'job:fixture',
      certificate_id: 'cert:fixture', output_sha256: 'f'.repeat(64), output: '# FABRICATED UI FIXTURE ONLY\n',
      receipt: { dispatch: { request_id: requestId, run_id: 123 },
        result: { job_id: 'job:fixture', receipt: { job_id: 'job:fixture' } } },
      manifest: { job_id: 'job:fixture' } };
    const intercept = async route => {
      const url = new URL(route.request().url());
      if (url.origin !== origin) return route.abort();
      if (blockClient && url.pathname.endsWith('/foundation-job-client.js')) return route.fulfill({ status: 404, body: '' });
      if (url.pathname.startsWith('/api/')) {
        if (url.pathname === '/api/foundation/hosted-commissioning-successor') {
          if (route.request().method() === 'POST') {
            posts++;
            assert.deepEqual(route.request().postDataJSON(), { request_id: requestId,
              instruction: 'Repair only the isolated AIOS path-containment test fixture.' });
            phase = 'PENDING';
          } else gets++;
          return route.fulfill({ json: phase === 'COMPLETE' ? delivery : { request_id: requestId, status: phase } });
        }
        return route.fulfill({ status: 404, json: { error: 'NO_LOCAL_COMPANION_IN_THIS_FIXTURE' } });
      }
      const rel = decodeURIComponent(url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
      const file = path.resolve(root, rel);
      if (!file.startsWith(root + path.sep)) return route.abort();
      try { await route.fulfill({ path: file }); } catch { await route.fulfill({ status: 404, body: '' }); }
    };
    await context.route('**/*', intercept);
    page = await context.newPage();page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      if (!localStorage.getItem('twisHolo.full.v1')) localStorage.setItem('twisHolo.full.v1', JSON.stringify({
        activeProject: 'originating-fixture-project', projects: [{ id: 'originating-fixture-project', title: 'Fixture origin' }],
      }));
    });
    await page.goto(origin);
    await page.locator('.nav[data-room="work"]').click();
    await page.waitForFunction(() => !document.querySelector('#contextSave').disabled);
    await page.locator('#contextText').fill('Deliver the original verified result without rerunning it.');
    await page.locator('#contextSave').click();
    await page.waitForFunction(() => document.querySelector('#contextStatus').textContent.startsWith('Context saved'));
    await page.locator('#contextKind').selectOption('correction');
    await page.locator('#contextText').fill('Preserve the failed first request and use the reviewed successor.');
    await page.locator('#contextSave').click();
    await page.waitForFunction(() => document.querySelectorAll('#contextEvents li').length === 2);
    await page.locator('.nav[data-room="talk"]').click();
    await page.locator('#chatInput').fill('repair only the isolated AIOS path-containment test fixture');
    await page.locator('#chatForm button.primary').click();
    await page.waitForFunction(() => document.querySelector('#messages').textContent.includes('Queued'));
    assert.equal(posts, 1);
    phase = 'COMPLETE';
    await page.locator('#chatInput').fill('Repair only the isolated AIOS path-containment test fixture.');
    await page.locator('#chatForm button.primary').click();
    await page.locator('.foundation-output').waitFor();
    assert.equal(posts, 1);
    await page.reload();
    await page.locator('.foundation-output').waitFor();
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('twisHolo.full.v1')));
    const record = stored.hostedJobs[requestId];
    assert.equal(record.projectId, 'originating-fixture-project');
    assert.equal(record.goalRef.revision, 2);
    assert.match(record.goalRef.sha256, /^[a-f0-9]{64}$/);
    assert.equal(stored.items.filter(i => i.type === 'foundation-job-result').length, 1);
    assert.equal(stored.activeProject, record.projectId);
    assert.equal(posts, 1);
    await page.locator('.nav[data-room="work"]').click();
    await page.locator('#workList [data-open="foundation-result-request-commissioning-002"]').click();
    await page.locator('.foundation-output').waitFor();
    assert.equal(posts, 1);
    assert.deepEqual(errors, []);
    await page.mouse.move(900, 60);
    await page.screenshot({ path: path.join(output, 'delivery.png'), fullPage: true });
    blockClient = true;
    const missing = await browser.newContext({ serviceWorkers: 'block' });
    await missing.route('**/*', intercept);
    const blockedPage = await missing.newPage();blockedPage.on('pageerror', error => errors.push(error.message));
    await blockedPage.goto(origin);
    await blockedPage.locator('.nav[data-room="talk"]').click();
    await blockedPage.locator('#chatInput').fill('Repair only the isolated AIOS path-containment test fixture.');
    await blockedPage.locator('#chatForm button.primary').click();
    await blockedPage.waitForFunction(() => document.querySelector('#messages').textContent.includes('Job client unavailable'));
    assert.equal(posts, 1);
    assert.deepEqual(errors, []);
    await missing.close();
    await fs.writeFile(path.join(output, 'result.json'), JSON.stringify({ status: 'PASS',
      scope: 'MOCKED_BROWSER_TRANSPORT_NOT_LIVE_OWNER_OR_JOB_PROOF', posts, gets,
      restoredProject: stored.activeProject, goalRevision: record.goalRef.revision,
      resultReopenedWithoutExecution: true, pageErrors: errors }, null, 2));
    console.log('PASS: mocked regular-Workshop UI, one POST, goal/correction reference, retained output and reopen without execution');
  } catch (error) {
    if (page) {
      await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
      await fs.writeFile(path.join(output, 'failure.txt'), JSON.stringify({ message: error.message, errors, posts, gets }));
    }
    throw error;
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
