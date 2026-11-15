// Real Chromium UI; simulated microphone, synthesis, and AI. No live network.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..', 'app');
const output = path.resolve(process.env.FRIDAY_VOICE_EVIDENCE || 'output/playwright/friday-voice');
const origin = 'https://ollie-twis-holo-workshop.pages.dev';
const fixed = 'Repair only the isolated AIOS path-containment test fixture.';
const answer = 'This is the mocked AI reply.';

(async () => {
  await fs.mkdir(output, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const results = [];
  try {
    for (const [device, viewport] of [['laptop', {width: 1366, height: 768}],
      ['mobile-layout', {width: 390, height: 844}]]) {
      const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
      const errors = [], ai = [], dispatch = [];
      await context.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== origin) return route.abort();
        if (url.pathname === '/api/ai/chat' && route.request().method() === 'POST') {
          ai.push(route.request().postDataJSON());
          return route.fulfill({ json: { ok: true, text: answer } });
        }
        if (url.pathname.startsWith('/api/')) {
          if (url.pathname.includes('hosted-') && route.request().method() === 'POST') dispatch.push(url.pathname);
          return route.fulfill({ status: 404, json: { error: 'Offline test fixture' } });
        }
        const file = path.resolve(root, url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1)));
        if (!file.startsWith(root + path.sep)) return route.abort();
        try { await route.fulfill({ path: file }); }
        catch { await route.fulfill({ status: 404, body: '' }); }
      });
      await context.addInitScript(() => {
        const hardware = window.voiceFixture = { recognizers: [], utterances: [], cancellations: 0 };
        window.SpeechRecognition = class {
          constructor() { hardware.recognizers.push(this); }
          start() { this.onstart?.(); }
          abort() { this.onend?.(); }
        };
        const synth = Object.assign(new EventTarget(), {
          getVoices: () => [{ name: 'Fixture voice', voiceURI: 'fixture', lang: 'en-US' }],
          cancel: () => hardware.cancellations++,
          speak: utterance => { hardware.utterances.push(utterance); utterance.onstart?.(); },
        });
        Object.defineProperty(window, 'speechSynthesis', { value: synth });
        window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
        localStorage.setItem('twisHolo.full.v1', JSON.stringify({
          settings: { endpoint: '/api/ai/chat', model: '@cf/openai/gpt-oss-20b' },
        }));
      });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin);
      await page.locator('#fridayVoiceChoice').selectOption('fixture');
      await page.locator('#fridayTestVoice').click();
      await page.waitForFunction(() => window.voiceFixture.utterances.length === 1);
      let spoken = await page.evaluate(() => window.voiceFixture.utterances[0].voice.voiceURI);
      assert.equal(spoken, 'fixture');
      await page.evaluate(() => window.voiceFixture.utterances[0].onend());
      await page.locator('#fridayPushTalk').click();
      await page.evaluate(text => window.voiceFixture.recognizers.at(-1).onresult({
        results: [[{ transcript: text }]],
      }), 'Dictation stays in the review box.');
      assert.equal(await page.locator('#openDoorInput').inputValue(), 'Dictation stays in the review box.');
      assert.equal(ai.length, 0);
      await page.locator('#fridayLiveVoice').click();
      await page.evaluate(text => window.voiceFixture.recognizers.at(-1).onresult({
        results: [[{ transcript: text }]],
      }), fixed);
      await page.waitForFunction(() => window.voiceFixture.utterances.length === 2);
      assert.equal(await page.evaluate(() => window.voiceFixture.utterances[1].text), answer);
      assert.deepEqual(ai[0].messages, [{ role: 'user', content: fixed }]);
      assert.equal(ai.length, 1);
      assert.deepEqual(dispatch, []);
      await page.locator('#fridayStopVoice').click();
      await page.evaluate(() => window.voiceFixture.utterances[1].onend());
      assert.equal(await page.locator('#fridayVoiceStatus').textContent(), 'Voice stopped.');
      assert.equal(await page.locator('#fridayLiveVoice').getAttribute('aria-pressed'), 'false');
      assert.deepEqual(errors, []);
      await page.locator('#fridayVoiceStatus').screenshot({ path: path.join(output, device + '-status.png') });
      results.push({ device, mock_ai_calls: ai.length, job_dispatches: dispatch.length, page_errors: errors });
      await context.close();
    }
    const report = { verdict: 'PASS', scope: 'REAL_CHROMIUM_MOCKED_VOICE_AND_AI', results };
    await fs.writeFile(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
