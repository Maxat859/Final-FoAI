/**
 * QAMAL original procedural soundtrack + sound effects.
 * No external recordings, copyrighted audio or network requests.
 * AudioContext starts only from a user gesture (Play / sound toggle).
 */
export const SOUND_EVENTS=Object.freeze([
  'click','step','blocked','door','bars','stairs','alarm',
  'success','error','keyboard','dialogue','wake','guard','lesson','complete'
]);
export const DEFAULT_AUDIO_SETTINGS=Object.freeze({enabled:true,volume:0.42,voice:false});

export function sanitizeAudioSettings(raw={}){
  const x=raw&&typeof raw==='object'?raw:{};
  const vol=Number(x.volume);
  return {
    enabled:typeof x.enabled==='boolean'?x.enabled:true,
    volume:Number.isFinite(vol)?Math.max(0,Math.min(1,vol)):DEFAULT_AUDIO_SETTINGS.volume,
    voice:typeof x.voice==='boolean'?x.voice:false
  };
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createSoundEngine({
  AudioContextClass=typeof window!=='undefined'?(window.AudioContext||window.webkitAudioContext):null,
  speech=typeof window!=='undefined'?window.speechSynthesis:null,
  UtteranceClass=typeof window!=='undefined'?window.SpeechSynthesisUtterance:null,
  initialSettings=DEFAULT_AUDIO_SETTINGS
}={}){
  let settings=sanitizeAudioSettings(initialSettings);
  let ctx=null,master=null,ambientNodes=[],ambientOn=false,stepCounter=0;
  let played=0,lastEvent=null;
  function connectedGain(value=1){
    const node=ctx.createGain();
    node.gain.value=value;
    node.connect(master);
    return node;
  }
  function envelope(node,at,end,peak){
    const g=node.gain;
    g.cancelScheduledValues?.(at);
    g.setValueAtTime(0.0001,at);
    g.exponentialRampToValueAtTime(Math.max(peak,0.0002),at+0.007);
    g.exponentialRampToValueAtTime(0.0001,end);
  }
  function tone({f=330,endF=f,type='sine',time=0,len=.12,amp=.11}={}){
    const now=ctx.currentTime+time;
    const osc=ctx.createOscillator(),gain=connectedGain();
    osc.type=type;
    osc.frequency.setValueAtTime(f,now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(25,endF),now+len);
    envelope(gain,now,now+len,amp);
    osc.connect(gain);osc.start(now);osc.stop(now+len+.03);
    osc.onended=()=>{try{osc.disconnect();gain.disconnect();}catch{}};
  }
  function noise({len=.1,amp=.15,filterHz=900,time=0}={}){
    if(!ctx.createBufferSource||!ctx.createBuffer||!ctx.createBiquadFilter)return;
    const rate=ctx.sampleRate||44100,buffer=ctx.createBuffer(1,Math.max(128,Math.ceil(rate*len)),rate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1);
    const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=connectedGain();
    source.buffer=buffer;filter.type='lowpass';filter.frequency.value=filterHz;
    source.connect(filter);filter.connect(gain);
    const now=ctx.currentTime+time;
    envelope(gain,now,now+len,amp);
    source.start(now);
    source.stop(now+len+.01);
    source.onended=()=>{try{source.disconnect();filter.disconnect();gain.disconnect();}catch{}};
  }
  function stopAmbient(){
    if(!ambientOn)return;
    ambientOn=false;
    for(const item of ambientNodes){
      try{item.stop?.();}catch{}
      try{item.disconnect?.();}catch{}
    }
    ambientNodes=[];
  }
  function startAmbient(){
    if(!settings.enabled||ambientOn||!ctx||ctx.state!=='running')return;
    ambientOn=true;
    // Quiet original 2-note hum and ventilation underneath the gameplay.
    for(const [freq,volume] of [[54,.018],[80.8,.009]]){
      const o=ctx.createOscillator(),g=connectedGain(volume);
      o.type='triangle';o.frequency.value=freq;o.connect(g);o.start();
      ambientNodes.push(o,g);
    }
    if(ctx.createBufferSource&&ctx.createBuffer&&ctx.createBiquadFilter){
      const rate=ctx.sampleRate||44100;
      const buffer=ctx.createBuffer(1,Math.max(2048,Math.round(rate*.7)),rate);
      const values=buffer.getChannelData(0);
      for(let i=0;i<values.length;i++)values[i]=(Math.random()*2-1);
      const source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=connectedGain(.013);
      source.buffer=buffer;source.loop=true;filter.type='lowpass';filter.frequency.value=340;
      source.connect(filter);filter.connect(gain);source.start();
      ambientNodes.push(source,filter,gain);
    }
  }
  async function unlock(){
    if(!AudioContextClass||!settings.enabled)return false;
    try{
      if(!ctx){
        ctx=new AudioContextClass();
        master=ctx.createGain();
        master.gain.value=settings.volume;
        master.connect(ctx.destination);
      }
      if(ctx.state==='suspended'&&typeof ctx.resume==='function')await ctx.resume();
      if(ctx.state==='running'){startAmbient();return true;}
    }catch(error){console.warn('[QAMAL audio unavailable]',error);}
    return false;
  }
  function play(event){
    if(!SOUND_EVENTS.includes(event)||!settings.enabled||!ctx||ctx.state!=='running')return false;
    played++;lastEvent=event;
    switch(event){
      case 'step':
        stepCounter++;noise({len:.065,amp:.07,filterHz:480});
        tone({f:stepCounter%2?105:120,endF:65,len:.075,amp:.057});break;
      case 'blocked':
        tone({f:130,endF:85,type:'triangle',len:.08,amp:.06});break;
      case 'click':
        tone({f:430,endF:260,len:.045,amp:.032});break;
      case 'keyboard':
        tone({f:500,endF:400,len:.028,amp:.025});break;
      case 'dialogue':
        tone({f:360,endF:320,len:.028,amp:.015});break;
      case 'door':
        tone({f:185,endF:68,type:'sawtooth',len:.23,amp:.1});
        noise({len:.18,amp:.12,filterHz:720});break;
      case 'bars':
        tone({f:680,endF:275,type:'triangle',len:.35,amp:.095});
        tone({f:920,endF:410,type:'sine',len:.27,amp:.048,time:.045});
        noise({len:.12,amp:.13,filterHz:2300});break;
      case 'stairs':
        tone({f:185,endF:215,len:.12,amp:.05});
        tone({f:275,endF:310,len:.17,amp:.055,time:.12});break;
      case 'alarm':
        for(let i=0;i<3;i++){
          tone({f:i%2?545:410,endF:i%2?440:600,type:'triangle',
            len:.16,amp:.095,time:i*.18});
        }break;
      case 'success':
        for(const [i,f] of [392,494,588].entries())tone({f,endF:f*1.02,len:.18,amp:.077,time:i*.1});
        break;
      case 'error':
        tone({f:255,endF:178,type:'square',len:.12,amp:.044});
        tone({f:213,endF:135,type:'square',len:.14,amp:.042,time:.14});break;
      case 'wake':
        for(let i=0;i<3;i++)tone({f:720,endF:590,len:.09,amp:.04,time:i*.19});
        break;
      case 'guard':
        tone({f:90,endF:66,type:'triangle',len:.19,amp:.058});
        tone({f:135,endF:96,type:'triangle',len:.19,amp:.032,time:.13});
        break;
      case 'lesson':
        tone({f:410,endF:440,len:.12,amp:.046});
        tone({f:548,endF:570,len:.11,amp:.038,time:.13});break;
      case 'complete':
        for(const [i,f] of [330,440,554,660].entries())
          tone({f,endF:f*1.035,len:.32,amp:.07,time:i*.15});
        break;
    }
    return true;
  }
  function speak(text){
    if(!settings.enabled||!settings.voice||!speech||!UtteranceClass)return false;
    try{
      speech.cancel();
      const phrase=new UtteranceClass(String(text).slice(0,320));
      phrase.lang='ru-RU';phrase.rate=.93;phrase.pitch=.83;phrase.volume=settings.volume;
      speech.speak(phrase);
      return true;
    }catch{return false;}
  }
  function setSettings(next){
    settings=sanitizeAudioSettings({...settings,...next});
    if(master)master.gain.value=settings.enabled?settings.volume:0;
    if(!settings.enabled){
      stopAmbient();try{speech?.cancel?.();}catch{}
    }else if(ctx?.state==='running')startAmbient();
    return {...settings};
  }
  function pause(){
    stopAmbient();
    try{speech?.cancel?.();}catch{}
  }
  function getState(){
    return {...settings,available:Boolean(AudioContextClass),ready:ctx?.state==='running',
      ambient:ambientOn,played,lastEvent};
  }
  return {unlock,play,speak,setSettings,getSettings:()=>({...settings}),
    getState,startAmbient,stopAmbient,pause};
}
