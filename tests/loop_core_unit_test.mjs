import '../app/assets/twis-loop-core.js';
import assert from 'node:assert/strict';

const {TransportClock,LoopStateMachine,PPQN}=globalThis.TWIS_LOOP_CORE;
assert.equal(PPQN,960);

const clock=new TransportClock({bpm:120});
clock.start(10,0);
assert.equal(Math.round(clock.tickAt(10.5)),960);
assert.equal(Math.round(clock.quantizeTick(961,'beat','ceil')),1920);
assert.ok(Math.abs(clock.nextBoundary('bar',10.51)-12)<1e-9);

const before=clock.tickAt(11);
clock.setBpm(60,11);
assert.ok(Math.abs(clock.tickAt(11)-before)<1e-9);
assert.equal(Math.round(clock.tickAt(12)-clock.tickAt(11)),960);
clock.stop(12);
assert.equal(clock.running,false);
const frozen=clock.tickAt(20);
assert.equal(frozen,clock.originTick);

const empty=new LoopStateMachine('EMPTY');
assert.equal(empty.transition('ARM_RECORD',{hasAsset:false}),'RECORD_ARMED');
assert.equal(empty.transition('RECORD_START',{hasAsset:false}),'RECORDING');
assert.equal(empty.transition('RECORD_DONE',{hasAsset:true}),'PLAYING');
assert.equal(empty.transition('ARM_OVERDUB',{hasAsset:true}),'OVERDUB_ARMED');
assert.equal(empty.transition('OVERDUB_START',{hasAsset:true}),'OVERDUBBING');
assert.equal(empty.transition('OVERDUB_DONE',{hasAsset:true}),'PLAYING');
assert.equal(empty.transition('STOP',{hasAsset:true}),'STOPPED');
assert.equal(empty.transition('UNDO',{hasAsset:true}),'UNDOING');
assert.equal(empty.transition('UNDO_DONE',{hasAsset:true,playing:false}),'STOPPED');
assert.equal(empty.transition('CLEAR',{hasAsset:true}),'EMPTY');
assert.throws(()=>empty.transition('PLAY',{hasAsset:false}),/Illegal loop transition/);

const loaded=new LoopStateMachine('EMPTY');
loaded.transition('LOAD',{hasAsset:false});
loaded.transition('LOAD_OK',{hasAsset:true});
loaded.transition('QUEUE_PLAY',{hasAsset:true});
assert.equal(loaded.transition('PLAY',{hasAsset:true}),'PLAYING');

console.log('Loop Core deterministic unit tests PASS');
