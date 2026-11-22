import test from 'node:test';
import assert from 'node:assert/strict';
import {createClock,DAY_MS,HOUR_MS,WEEKDAYS} from '../src/game/clock.js';
import {createLevel,isPassable,DEFAULT_ENTITIES} from '../src/config.js';
import {updatePrisonLife,routineForHour} from '../src/game/prisonRoutine.js';
import {START_POSITION} from '../src/game/player.js';

test('The game starts on Monday at 06:00',()=>{
  const clock=createClock(6*HOUR_MS);
  assert.equal(clock.dayNumber,1);
  assert.equal(clock.weekday,'ПОНЕДЕЛЬНИК');
  assert.equal(clock.time,'06:00');
});

test('A complete in-game day lasts exactly 40 minutes of active play',()=>{
  assert.equal(DAY_MS,2_400_000);
  const clock=createClock(6*HOUR_MS);
  for(let i=0;i<2400;i++)clock.advance(1000);
  assert.equal(clock.dayNumber,2);
  assert.equal(clock.weekday,'ВТОРНИК');
  assert.equal(clock.time,'06:00');
});

test('Midnight changes the weekday and wraps after Sunday',()=>{
  const clock=createClock(DAY_MS-1);
  assert.equal(clock.weekday,'ПОНЕДЕЛЬНИК');
  assert.equal(clock.time,'23:59');
  clock.advance(1);
  assert.equal(clock.weekday,'ВТОРНИК');
  assert.equal(clock.time,'00:00');
  clock.setElapsed(7*DAY_MS);
  assert.equal(clock.dayNumber,8);
  assert.equal(clock.weekday,'ПОНЕДЕЛЬНИК');
  assert.equal(WEEKDAYS.length,7);
});

test('Restoring the saved elapsed time restores the weekday',()=>{
  const one=createClock(4*DAY_MS+13*HOUR_MS);
  const two=createClock();
  two.setElapsed(one.elapsedMs);
  assert.equal(two.time,one.time);
  assert.equal(two.dayNumber,one.dayNumber);
  assert.equal(two.weekday,one.weekday);
});

test('Daily routines cover waking, studying, meals and sleep',()=>{
  const phases=[[1,'sleep'],[6,'wake'],[8,'study'],[12,'meal'],
    [15,'activity'],[19,'evening'],[22,'sleep']];
  for(const [h,phase] of phases)assert.equal(routineForHour(h),phase);
});

test('NPCs do not enter walls, overlap or teleport during a 700-tick simulation',()=>{
  const world=createLevel(),player={...START_POSITION};
  const entities=DEFAULT_ENTITIES.map(e=>({...e}));
  const clock=createClock();
  const visited=new Map(entities.map(e=>[e.id,new Set([e.row+','+e.col])]));
  for(const hour of [1,6,8,12,14,19,21]){
    clock.setElapsed(hour*HOUR_MS);
    for(let t=0;t<100;t++){
      const before=new Map(entities.map(e=>[e.id,[e.row,e.col]]));
      updatePrisonLife(entities,world,player,clock);
      const positions=[player.row+','+player.col];
      for(const e of entities){
        assert.equal(isPassable(world,e.row,e.col),true,e.id+' entered a blocked tile');
        const [oldRow,oldCol]=before.get(e.id);
        assert.ok(Math.abs(e.row-oldRow)+Math.abs(e.col-oldCol)<=1,e.id+' teleported');
        positions.push(e.row+','+e.col);
        visited.get(e.id).add(e.row+','+e.col);
      }
      assert.equal(new Set(positions).size,positions.length,'NPC collision');
    }
  }
  for(const id of ['arman','ruslan','guard1','guard3','guard5'])
    assert.ok(visited.get(id).size>=3,id+' should move');
  for(const id of ['guard2','guard4'])
    assert.equal(visited.get(id).size,1,id+' should stay at a fixed post');
});
