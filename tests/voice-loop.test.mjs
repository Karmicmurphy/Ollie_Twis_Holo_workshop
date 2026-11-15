import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { setImmediate as settle } from 'node:timers/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = readFileSync(new URL('../app/assets/voice-loop.js', import.meta.url), 'utf8');
const testVoice = { name: 'Fixture voice', lang: 'en-US', voiceURI: 'fixture' };

test('one registered service worker and matching legacy cache both include the exact voice asset', () => {
  const read = path => readFileSync(new URL('../app/' + path, import.meta.url), 'utf8');
  const html = read('index.html');
  const app = read('assets/app.js');
  const worker = read('service-worker.js');
  const asset = html.match(/src="(assets\/voice-loop\.js\?v=[^"]+)"/)?.[1];
  assert.ok(asset);
  assert.equal(worker, read('sw.js'));
  assert.ok(worker.includes('"./' + asset + '"'));
  assert.ok(worker.indexOf('url.pathname.startsWith("/api/")') < worker.indexOf('event.respondWith'));
  assert.ok(worker.includes('url.pathname.startsWith("/api/")'));
  assert.equal((app.match(/serviceWorker\.register\(/g) || []).length, 1);
  assert.ok(!html.includes('serviceWorker.register('));
});

function fixture({ voices = [testVoice], supported = true } = {}) {
  class Element extends EventTarget {
    constructor() { super(); this.options = []; this.value = ''; this.attributes = {}; }
    setAttribute(key, value) { this.attributes[key] = value; }
    replaceChildren(...options) { this.options = options; }
    append(child) { this.child = child; }
    add(option) { this.options.push(option); }
    before(label) { this.label = label; }
    closest() { return this; }
    after() {}
  }
  const elements = Object.fromEntries([
    'fridayVoiceStatus', 'fridayPushTalk', 'fridayLiveVoice', 'fridayStopVoice',
    'fridayTestVoice', 'micBtn', 'openDoorInput', 'chatInput',
  ].map(id => [id, new Element()]));
  const document = Object.assign(new EventTarget(), {
    readyState: 'complete', hidden: false, getElementById: id => elements[id],
    createElement: () => new Element(),
  });
  const recognizers = [], spoken = [], timers = new Map();
  let timerId = 0;
  class Rec {
    constructor() { recognizers.push(this); }
    start() { this.onstart?.(); }
    abort() { this.aborted = true; this.onend?.(); }
    hear(text) { this.onresult?.({ results: [[{ transcript: text }]] }); }
  }
  const synth = Object.assign(new EventTarget(), {
    getVoices: () => voices,
    cancel() {},
    speak: utterance => spoken.push(utterance),
  });
  class Utterance { constructor(text) { this.text = text; } }
  const window = Object.assign(new EventTarget(), {
    SpeechRecognition: supported ? Rec : undefined, SpeechSynthesisUtterance: Utterance,
    speechSynthesis: synth, isSecureContext: true,
    workshopVoiceReply: async text => 'Reply to ' + text,
  });
  const storage = new Map();
  vm.runInNewContext(source, {
    window, document, Event, AbortController, SpeechSynthesisUtterance: Utterance,
    Option: class { constructor(label, value) { this.label = label; this.value = value; } },
    localStorage: { getItem: k => storage.get(k), setItem: (k, v) => storage.set(k, v) },
    setTimeout(fn, delay) { const id = ++timerId; timers.set(id, {fn, delay}); return id; },
    clearTimeout: id => timers.delete(id),
  });
  return { window, document, elements, recognizers, spoken, synth, storage,
    click: id => elements[id].dispatchEvent(new Event('click')),
    status: () => elements.fridayVoiceStatus.textContent,
    timer: delay => {
      const [id, task] = [...timers].find(([, task]) => task.delay === delay);
      timers.delete(id);
      task.fn();
    },
  };
}

test('push to talk only fills the review box and releases recognition', () => {
  const f = fixture();
  f.window.workshopVoiceReply = () => assert.fail('dictation must not call AI');
  f.click('fridayPushTalk');
  assert.match(f.status(), /Listening/);
  f.recognizers[0].hear('Review this first.');
  assert.equal(f.elements.openDoorInput.value, 'Review this first.');
  assert.equal(f.recognizers[0].aborted, true);
  assert.match(f.status(), /Review it before submitting/);
});

test('live voice speaks only the new reply, including repeated text across turns', async () => {
  const f = fixture();
  const spoken = 'The current reply.';
  let turns = 0;
  f.window.workshopVoiceReply = async () => { turns++; return spoken; };
  f.click('fridayLiveVoice');
  assert.equal(f.spoken.length, 0);
  f.recognizers[0].hear('First');
  await settle();
  assert.equal(f.spoken[0].text, spoken);
  f.spoken[0].onstart();
  f.spoken[0].onend();
  f.timer(600);
  f.recognizers[1].hear('Second');
  await settle();
  assert.equal(turns, 2);
  assert.deepEqual(f.spoken.map(item => item.text), [spoken, spoken]);
});

test('stop aborts a pending reply and late completion cannot speak or restart', async () => {
  const f = fixture();
  let resolve, signal;
  f.window.workshopVoiceReply = (_, s) => {
    signal = s;
    return new Promise(r => { resolve = r; });
  };
  f.click('fridayLiveVoice');
  f.recognizers[0].hear('Pending');
  f.click('fridayStopVoice');
  assert.equal(signal.aborted, true);
  resolve('Stale response');
  await settle();
  assert.equal(f.spoken.length, 0);
  assert.equal(f.recognizers.length, 1);
  assert.equal(f.status(), 'Voice stopped.');
});

test('denied microphone and unavailable recognition are visible; speaker still works', () => {
  const denied = fixture();
  denied.click('fridayPushTalk');
  denied.recognizers[0].onerror({ error: 'not-allowed' });
  assert.match(denied.status(), /Microphone access was denied/);
  assert.equal(denied.elements.fridayPushTalk.attributes['aria-pressed'], 'false');
  const f = fixture({ supported: false });
  f.click('fridayLiveVoice');
  assert.match(f.status(), /recognition is unavailable/);
  f.click('fridayTestVoice');
  f.spoken[0].onend();
  assert.match(f.status(), /Speaker test finished/);
});

test('late device voices are selectable and playback failures are visible', () => {
  const voices = [];
  const f = fixture({ voices });
  const picker = f.elements.fridayVoiceStatus.label.child;
  voices.push(testVoice);
  f.synth.dispatchEvent(new Event('voiceschanged'));
  assert.equal(picker.options[1].value, 'fixture');
  picker.value = 'fixture';
  picker.onchange();
  f.click('fridayTestVoice');
  assert.equal(f.spoken[0].voice, testVoice);
  f.spoken[0].onerror({error: 'not-allowed'});
  assert.match(f.status(), /Speech playback failed/);
  assert.equal(f.storage.get('twisHolo.voiceURI'), 'fixture');
});

test('AI denial and missing playback start are not reported as successful', async () => {
  const f = fixture();
  f.window.workshopVoiceReply = async () => { throw Error('The AI adapter is unavailable.'); };
  f.click('fridayLiveVoice');
  f.recognizers[0].hear('Hello');
  await settle();
  assert.equal(f.status(), 'The AI adapter is unavailable.');
  assert.equal(f.spoken.length, 0);
  f.click('fridayTestVoice');
  f.timer(5000);
  assert.match(f.status(), /Playback did not start/);
});
