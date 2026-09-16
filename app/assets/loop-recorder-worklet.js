class TwisLoopRecorderProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{ name: 'recording', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' }];
  }
  constructor() {
    super();
    this.wasRecording = false;
    this.channels = [];
    this.frames = 0;
    this.startedFrame = 0;
    this.port.onmessage = event => {
      if (event.data === 'reset') this.reset();
    };
  }
  reset() {
    this.channels = [];
    this.frames = 0;
    this.startedFrame = 0;
    this.wasRecording = false;
  }
  finish() {
    if (!this.frames || !this.channels.length) {
      this.port.postMessage({ type: 'complete', sampleRate, frames: 0, startedFrame: this.startedFrame, channels: [] });
      this.channels = [];
      this.frames = 0;
      return;
    }
    const channelCount = this.channels.length;
    const merged = [];
    const transfer = [];
    for (let c = 0; c < channelCount; c++) {
      const out = new Float32Array(this.frames);
      let offset = 0;
      for (const chunk of this.channels[c]) {
        out.set(chunk, offset);
        offset += chunk.length;
      }
      merged.push(out.buffer);
      transfer.push(out.buffer);
    }
    this.port.postMessage({ type: 'complete', sampleRate, frames: this.frames, startedFrame: this.startedFrame, channels: merged }, transfer);
    this.channels = [];
    this.frames = 0;
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0] || [];
    const output = outputs[0] || [];
    for (let c = 0; c < output.length; c++) {
      const src = input[c % Math.max(1, input.length)];
      if (src) output[c].set(src); else output[c].fill(0);
    }
    const recording = (parameters.recording[0] || 0) >= 0.5;
    if (recording && !this.wasRecording) {
      this.channels = Array.from({ length: Math.max(1, input.length) }, () => []);
      this.frames = 0;
      this.startedFrame = currentFrame;
      this.port.postMessage({ type: 'started', frame: currentFrame });
    }
    if (recording && input.length && input[0]?.length) {
      if (!this.channels.length) this.channels = Array.from({ length: input.length }, () => []);
      const block = input[0].length;
      for (let c = 0; c < this.channels.length; c++) {
        const src = input[c % input.length] || input[0];
        const copy = new Float32Array(block);
        copy.set(src);
        this.channels[c].push(copy);
      }
      this.frames += block;
    }
    if (!recording && this.wasRecording) this.finish();
    this.wasRecording = recording;
    return true;
  }
}
registerProcessor('twis-loop-recorder', TwisLoopRecorderProcessor);
