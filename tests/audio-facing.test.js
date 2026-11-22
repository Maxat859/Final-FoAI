import test from 'node:test';
import assert from 'node:assert/strict';
import {createSoundEngine,sanitizeAudioSettings,SOUND_EVENTS} from '../src/audio/soundEngine.js';
import {drawDirectionalCharacter,facingFromStep,normalizeFacing,FACING_DIRECTIONS} from '../src/ui/characterSprite.js';

class MockParam{
  value=0;
  setValueAtTime(v){this.value=v;}
  exponentialRampToValueAtTime(v){this.value=v;}
  cancelScheduledValues(){}
}
class MockNode{
  connect(){return this;}
  disconnect(){}
  start(){}
  stop(){}
  gain=new MockParam();
  frequency=new MockParam();
  type='sine';
  onended=null;
  loop=false;
}
class MockAudioContext{
  state='running';
  currentTime=0;
  destination=new MockNode();
  sampleRate=10000;
  createGain(){return new MockNode();}
  createOscillator(){return new MockNode();}
  createBufferSource(){return new MockNode();}
  createBiquadFilter(){return new MockNode();}
  createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}
  async resume(){this.state='running';}
}

test('audio settings safely clamp volume and honor mute, even on unsupported browsers',()=>{
  assert.deepEqual(sanitizeAudioSettings(null),{enabled:true,volume:.42,voice:false});
  assert.deepEqual(sanitizeAudioSettings({volume:10,enabled:false,voice:true}),
    {enabled:false,volume:1,voice:true});
  assert.deepEqual(sanitizeAudioSettings({volume:-10}),{enabled:true,volume:0,voice:false});
  assert.equal(SOUND_EVENTS.includes('step'),true);
  const engine=createSoundEngine({AudioContextClass:null});
  assert.equal(engine.getState().available,false);
  assert.equal(engine.play('step'),false);
});

test('Web Audio engine plays original footsteps, metal doors, alarms and answer cues',async()=>{
  const audio=createSoundEngine({AudioContextClass:MockAudioContext});
  assert.equal(await audio.unlock(),true);
  assert.equal(audio.getState().ambient,true);
  for(const event of ['step','door','bars','alarm','success','error','keyboard','dialogue','stairs','wake','lesson'])
    assert.equal(audio.play(event),true,event);
  const count=audio.getState().played;
  assert.ok(count>=11);
  audio.setSettings({enabled:false});
  assert.equal(audio.getState().ambient,false);
  assert.equal(audio.play('step'),false);
  assert.equal(audio.getState().played,count);
  audio.setSettings({enabled:true,volume:.64});
  assert.equal(audio.getState().volume,.64);
  assert.equal(audio.getState().ambient,true);
  assert.equal(audio.play('step'),true);
  audio.stopAmbient();
  assert.equal(audio.getState().ambient,false);
});

test('audio is quiet until the player activates it; voices can be toggled off',async()=>{
  let voiceCount=0,cancelCount=0;
  class MockUtterance{constructor(text){this.text=text;}}
  const speech={speak(){voiceCount++;},cancel(){cancelCount++;}};
  const audio=createSoundEngine({AudioContextClass:MockAudioContext,
    speech,UtteranceClass:MockUtterance,initialSettings:{enabled:true,voice:false,volume:.3}});
  assert.equal(audio.play('step'),false);
  assert.equal(audio.speak('Здравствуйте'),false);
  await audio.unlock();
  audio.setSettings({voice:true});
  assert.equal(audio.speak('Здравствуйте'),true);
  assert.equal(voiceCount,1);
  audio.cancelSpeech();
  assert.ok(cancelCount>=2);
  audio.setSettings({enabled:false});
  assert.equal(audio.speak('Здравствуйте'),false);
});

function painting(facing,walkFrame=0,moving=true){
  const operations=[];
  const ctx={
    fillStyle:'',
    save(){operations.push(['save']);},
    restore(){operations.push(['restore']);},
    translate(x,y){operations.push(['translate',x,y]);},
    scale(x,y){operations.push(['scale',x,y]);},
    fillRect(x,y,w,h){operations.push(['rect',x,y,w,h,this.fillStyle]);}
  };
  drawDirectionalCharacter(ctx,12,17,{facing,walkFrame,moving});
  return operations;
}
test('player clearly faces all four directions, and legs animate as steps alternate',()=>{
  assert.deepEqual(FACING_DIRECTIONS,['up','down','left','right']);
  for(const d of FACING_DIRECTIONS)assert.ok(painting(d).length>10,d);
  assert.notDeepEqual(painting('up'),painting('down'));
  assert.notDeepEqual(painting('left'),painting('right'));
  assert.notDeepEqual(painting('down',0),painting('down',1));
  assert.equal(normalizeFacing('north'),'down');
});

test('facing follows real movement and supports escort guards',()=>{
  const p={row:10,col:10};
  assert.equal(facingFromStep(p,{row:9,col:10}),'up');
  assert.equal(facingFromStep(p,{row:11,col:10}),'down');
  assert.equal(facingFromStep(p,{row:10,col:9}),'left');
  assert.equal(facingFromStep(p,{row:10,col:11}),'right');
  assert.equal(facingFromStep(p,p,'up'),'up');
});
