(()=>{
'use strict';
const PPQN=960;
const LOOP_STATES=Object.freeze([
  'EMPTY','LOADING','STOPPED','PLAY_QUEUED','PLAYING',
  'RECORD_ARMED','RECORDING','OVERDUB_ARMED','OVERDUBBING',
  'REPLACE_ARMED','REPLACING','UNDOING','ERROR'
]);

class TransportClock{
  constructor({bpm=120,ppqn=PPQN,beatsPerBar=4}={}){
    this.ppqn=ppqn;
    this.beatsPerBar=beatsPerBar;
    this.bpm=this._clampBpm(bpm);
    this.running=false;
    this.originTime=0;
    this.originTick=0;
  }
  _clampBpm(v){return Math.max(40,Math.min(240,Number(v)||120));}
  secondsPerTick(){return 60/this.bpm/this.ppqn;}
  ticksPerBeat(){return this.ppqn;}
  ticksPerBar(){return this.ppqn*this.beatsPerBar;}
  ticksPerSixteenth(){return this.ppqn/4;}
  stepSeconds(){return this.ticksPerSixteenth()*this.secondsPerTick();}
  beatSeconds(){return this.ticksPerBeat()*this.secondsPerTick();}
  barSeconds(bars=1){return this.ticksPerBar()*Math.max(.0001,Number(bars)||1)*this.secondsPerTick();}
  start(atTime,tick=0){
    this.running=true;
    this.originTime=Number(atTime)||0;
    this.originTick=Number(tick)||0;
    return this.originTime;
  }
  stop(atTime){
    if(this.running)this.originTick=this.tickAt(atTime);
    this.originTime=Number(atTime)||this.originTime;
    this.running=false;
    return this.originTick;
  }
  reset(atTime=0){
    this.running=false;this.originTime=Number(atTime)||0;this.originTick=0;
  }
  setBpm(next,atTime){
    const now=Number(atTime);
    const tick=Number.isFinite(now)?this.tickAt(now):this.originTick;
    if(Number.isFinite(now))this.originTime=now;
    this.originTick=tick;
    this.bpm=this._clampBpm(next);
    return this.bpm;
  }
  tickAt(time){
    const t=Number(time)||0;
    if(!this.running)return this.originTick;
    return this.originTick+(t-this.originTime)/this.secondsPerTick();
  }
  timeAtTick(tick){
    return this.originTime+(Number(tick)-this.originTick)*this.secondsPerTick();
  }
  transportSeconds(time){
    return Math.max(0,this.tickAt(time)*this.secondsPerTick());
  }
  quantizeTick(tick,kind='bar',mode='ceil'){
    const unit=kind==='16n'?this.ticksPerSixteenth():kind==='beat'?this.ticksPerBeat():this.ticksPerBar();
    const value=(Number(tick)||0)/unit;
    const fn=mode==='floor'?Math.floor:mode==='round'?Math.round:Math.ceil;
    return fn(value)*unit;
  }
  nextBoundary(kind='bar',now,epsilonTicks=2){
    const t=Number(now)||0;
    if(!this.running)return t+.03;
    const current=this.tickAt(t)+epsilonTicks;
    return this.timeAtTick(this.quantizeTick(current,kind,'ceil'));
  }
  snapshot(now=0){
    const tick=this.tickAt(now);
    return {
      bpm:this.bpm,ppqn:this.ppqn,running:this.running,
      tick,beat:Math.floor(tick/this.ppqn),
      bar:Math.floor(tick/this.ticksPerBar()),
      tickInBar:((Math.floor(tick)%this.ticksPerBar())+this.ticksPerBar())%this.ticksPerBar()
    };
  }
}

class LoopStateMachine{
  constructor(initial='EMPTY'){
    if(!LOOP_STATES.includes(initial))throw new Error('Invalid loop state '+initial);
    this.state=initial;
    this.lastStable=initial;
    this.error=null;
  }
  can(event){
    return !!this._target(event,false);
  }
  transition(event,meta={}){
    const next=this._target(event,true,meta);
    if(!next)throw new Error('Illegal loop transition '+this.state+' -> '+event);
    this.state=next;
    if(!['LOADING','PLAY_QUEUED','RECORD_ARMED','OVERDUB_ARMED','REPLACE_ARMED','UNDOING'].includes(next)){
      this.lastStable=next;
    }
    if(next!=='ERROR')this.error=null;
    if(next==='ERROR')this.error=meta.error||'unknown';
    return next;
  }
  _target(event,commit,meta={}){
    const s=this.state;
    const hasAsset=meta.hasAsset!==false;
    const map={
      EMPTY:{LOAD:'LOADING',ARM_RECORD:'RECORD_ARMED',FAIL:'ERROR'},
      LOADING:{LOAD_OK:'STOPPED',FAIL:'ERROR',CANCEL:'EMPTY'},
      STOPPED:{QUEUE_PLAY:'PLAY_QUEUED',ARM_RECORD:'RECORD_ARMED',ARM_REPLACE:'REPLACE_ARMED',UNDO:'UNDOING',CLEAR:'EMPTY',FAIL:'ERROR'},
      PLAY_QUEUED:{PLAY:'PLAYING',CANCEL:'STOPPED',FAIL:'ERROR'},
      PLAYING:{STOP:'STOPPED',ARM_OVERDUB:'OVERDUB_ARMED',ARM_REPLACE:'REPLACE_ARMED',UNDO:'UNDOING',CLEAR:'EMPTY',FAIL:'ERROR'},
      RECORD_ARMED:{RECORD_START:'RECORDING',CANCEL:hasAsset?'STOPPED':'EMPTY',FAIL:'ERROR'},
      RECORDING:{RECORD_DONE:'PLAYING',CANCEL:hasAsset?'STOPPED':'EMPTY',FAIL:'ERROR'},
      OVERDUB_ARMED:{OVERDUB_START:'OVERDUBBING',CANCEL:'PLAYING',FAIL:'ERROR'},
      OVERDUBBING:{OVERDUB_DONE:'PLAYING',CANCEL:'PLAYING',FAIL:'ERROR'},
      REPLACE_ARMED:{REPLACE_START:'REPLACING',CANCEL:hasAsset?'PLAYING':'EMPTY',FAIL:'ERROR'},
      REPLACING:{REPLACE_DONE:'PLAYING',CANCEL:hasAsset?'PLAYING':'EMPTY',FAIL:'ERROR'},
      UNDOING:{UNDO_DONE:meta.playing?'PLAYING':(hasAsset?'STOPPED':'EMPTY'),FAIL:'ERROR'},
      ERROR:{RECOVER:hasAsset?'STOPPED':'EMPTY'}
    };
    return map[s]?.[event]||null;
  }
  snapshot(){return {state:this.state,lastStable:this.lastStable,error:this.error};}
}

globalThis.TWIS_LOOP_CORE=Object.freeze({PPQN,LOOP_STATES,TransportClock,LoopStateMachine});
})();
