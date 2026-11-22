import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  REAL_DAY_MS,REAL_MS_PER_GAME_MINUTE,GAME_MINUTES_PER_DAY,MINUTES_PER_TICK,
  START_TIME,makePrisonClock,advancePrisonClock,advancePrisonClockByRealTime,
  formatPrisonClock,lightLevel
} from '../src/game/prisonSchedule.js';
import {characterPalette,drawDirectionalCharacter} from '../src/ui/characterSprite.js';
import {createLiveWorld,advanceLiveWorld,restoreLiveWorld} from '../src/game/liveWorld.js';
import {createLevel} from '../src/config.js';

test('One full prison day takes exactly 40 active minutes, with no per-step time bonus',()=>{
  assert.equal(REAL_DAY_MS,40*60*1000);
  assert.equal(GAME_MINUTES_PER_DAY,1440);
  assert.equal(REAL_MS_PER_GAME_MINUTE,5000/3);
  assert.equal(MINUTES_PER_TICK,0);
  const first=makePrisonClock();
  assert.equal(first.minutes,START_TIME);
  assert.equal(advancePrisonClock(first).minutes,START_TIME);
  assert.equal(advancePrisonClockByRealTime(first,REAL_DAY_MS).day,2);
  assert.equal(advancePrisonClockByRealTime(first,REAL_DAY_MS).minutes,START_TIME);
  assert.equal(advancePrisonClockByRealTime(first,100*1000).minutes,START_TIME+60);
  assert.equal(advancePrisonClockByRealTime(first,200*1000).minutes,START_TIME+120);
  assert.equal(advancePrisonClockByRealTime(first,0).minutes,START_TIME);
});
test('Daytime is 23m20s and night 16m40s of active play; sleeping can skip',()=>{
  const dayStart=makePrisonClock({minutes:6*60});
  const dayEnd=advancePrisonClockByRealTime(dayStart,1400*1000);
  assert.equal(dayEnd.minutes,20*60); // 14 game hours take 23m20s
  const nextDay=advancePrisonClockByRealTime(dayEnd,1000*1000);
  assert.equal(nextDay.minutes,6*60); // 10 game hours take 16m40s
  assert.equal(nextDay.day,2);
  assert.ok(lightLevel({minutes:23*60})>lightLevel({minutes:12*60}));
});
test('Clock retains fractional minutes across saves, menu pauses and small ticks',()=>{
  let clock=makePrisonClock();
  clock=advancePrisonClockByRealTime(clock,900);
  assert.equal(clock.minutes,START_TIME);
  assert.ok(clock.minuteFraction>.5&&clock.minuteFraction<.6);
  const snapshot=JSON.parse(JSON.stringify(clock));
  let resumed=makePrisonClock(snapshot);
  resumed=advancePrisonClockByRealTime(resumed,900);
  assert.equal(resumed.minutes,START_TIME+1);
  // A paused menu does not call this function, so no time advances.
  const pauseClock=makePrisonClock(resumed);
  assert.deepEqual(pauseClock,resumed);
  assert.equal(advancePrisonClockByRealTime(pauseClock,-100),pauseClock);
  assert.equal(formatPrisonClock(resumed).time,'06:31');
});
test('Guards still patrol on movement without altering time',()=>{
  const world=createLevel(1),initial=createLiveWorld();
  const moved=advanceLiveWorld(initial,{row:10,col:4},world,1);
  assert.equal(moved.state.tick,initial.tick+1);
  assert.deepEqual(moved.state.clock,initial.clock);
  const clock=advancePrisonClockByRealTime(initial.clock,500);
  const next=advanceLiveWorld({...initial,clock},{row:10,col:4},world,1,{minutesPerTick:0});
  const restored=restoreLiveWorld(JSON.parse(JSON.stringify(next.state)));
  assert.deepEqual(restored.clock,next.state.clock);
});
function paint(kind,id,direction='down',frame=1){
  const rectangles=[];
  const canvas={
    fillStyle:'',save(){},restore(){},translate(){},scale(){},
    fillRect(x,y,w,h){rectangles.push([x,y,w,h,this.fillStyle]);}
  };
  drawDirectionalCharacter(canvas,0,0,{kind,characterId:id,facing:direction,walkFrame:frame,moving:true});
  return rectangles;
}
test('Same pixel-art rig, distinct palettes for the protagonist, Arman, residents and police',()=>{
  const people=['erasyl','arman','ruslan','daniyar','madina','timur','svetlana','bakyt'];
  const shirts=new Set(people.map(id=>characterPalette(id==='erasyl'?'player':'prisoner',id).cloth));
  assert.equal(shirts.size,people.length);
  assert.notEqual(characterPalette('guard','guard1').cloth,characterPalette('police','police-yard-a').cloth);
  assert.notEqual(characterPalette('player','erasyl').cloth,characterPalette('prisoner','arman').cloth);
  for(const id of people){
    for(const dir of ['up','down','left','right']){
      assert.ok(paint(id==='erasyl'?'player':'prisoner',id,dir).length>18,id+' '+dir);
    }
  }
  assert.notDeepEqual(paint('prisoner','arman','up'),paint('prisoner','arman','down'));
  assert.notDeepEqual(paint('prisoner','arman','down',0),paint('prisoner','arman','down',1));
});
test('Renderer draws all human NPCs with the same directional rig, not generic bitmap',()=>{
  const renderer=readFileSync(new URL('../src/ui/gameCanvas.js',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(renderer,/const humanSprite=playerSprite\|\|guardSprite/);
  assert.match(renderer,/characterId:entity\.id/);
  assert.match(renderer,/kind:entity\.role==='police'/);
  assert.match(main,/advancePrisonClockByRealTime/);
  assert.match(main,/minutesPerTick:0/);
});
