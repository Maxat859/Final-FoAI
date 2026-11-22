import test from 'node:test';
import assert from 'node:assert/strict';
import {COLS,ROWS,STAIR_LINKS,EXIT_POSITION,BLOCKED_TILES,
  createLevel,isPassable,zoneAt} from '../src/config.js';
import {EXPANSION_ROOMS,expansionInteractions,nearestExpansionInteraction} from '../src/game/complexExpansion.js';
import {SECURITY_ROSTER,DOG_ROSTER,SECURITY_COUNT} from '../src/game/securityRoster.js';
import {createLiveWorld,restoreLiveWorld,advanceLiveWorld,
  guardEntities,dogEntities,securitySummary} from '../src/game/liveWorld.js';
import {planPatrol,nextPatrol,advanceK9Unit} from '../src/game/patrolSystem.js';
import {makePrisonClock,advancePrisonClock,formatPrisonClock,getRoutine,
  lightLevel,staffOnDuty} from '../src/game/prisonSchedule.js';
import {drawDog} from '../src/ui/dogSprite.js';

test('The prison now has two complete 104×72 floor plans and 56 new rooms',()=>{
  assert.equal(COLS,104);
  assert.equal(ROWS,72);
  assert.equal(EXPANSION_ROOMS.length,56);
  for(const floor of [1,2]){
    const w=createLevel(floor);
    assert.equal(w.length,72);
    assert.ok(w.every(row=>row.length===104));
    const rooms=EXPANSION_ROOMS.filter(x=>x.floor===floor);
    assert.equal(rooms.length,28);
    assert.ok(rooms.some(x=>x.type==='library'));
    assert.ok(rooms.some(x=>x.type==='yard'));
    assert.ok(rooms.some(x=>x.type==='study'));
    assert.ok(rooms.some(x=>x.type==='cell'));
    assert.ok(rooms.some(x=>x.type==='medical'));
    assert.ok(rooms.some(x=>x.type==='security'));
    for(const interaction of expansionInteractions(floor)){
      assert.ok(isPassable(w,interaction.row,interaction.col),interaction.id+' must be accessible');
      assert.equal(nearestExpansionInteraction(
        {row:interaction.row,col:interaction.col},floor)?.id,interaction.id);
    }
    for(const p of STAIR_LINKS)assert.ok(isPassable(w,p.row,p.col));
    assert.equal(w[50][80],'Z');
  }
  assert.equal(STAIR_LINKS.length,5);
  assert.equal(createLevel(1)[EXIT_POSITION.row][EXIT_POSITION.col],'E');
  assert.equal(createLevel(1)[29][45],'.');
  assert.match(zoneAt(49,80,1),/ДВОР/);
});

test('Map is connected from the hero to the far outdoor sector and final gate',()=>{
  const w=createLevel(1);
  const from={x:4,y:10},to={x:100,y:68};
  const route=planPatrol(w,from,to);
  assert.ok(route.length>95,'must be a genuinely large playable route');
  assert.deepEqual(route[0],from);
  assert.deepEqual(route.at(-1),to);
  assert.ok(route.every(p=>isPassable(w,p.y,p.x)));
});

test('Every guard, police officer and K9 has a valid physical starting tile',()=>{
  assert.equal(SECURITY_COUNT,33);
  assert.equal(DOG_ROSTER.length,3);
  const worlds={1:createLevel(1),2:createLevel(2)};
  for(const entity of [...SECURITY_ROSTER,...DOG_ROSTER]){
    assert.ok(isPassable(worlds[entity.floor],entity.y,entity.x),entity.id);
    if('patrolRoute'in entity){
      for(const p of entity.patrolRoute)
        assert.ok(isPassable(worlds[entity.floor],p.y,p.x),entity.id+' route');
    }
  }
  assert.ok(SECURITY_ROSTER.filter(x=>x.mode==='patrol').length>=20);
  assert.ok(SECURITY_ROSTER.filter(x=>x.mode==='post').length>=8);
  assert.equal(SECURITY_ROSTER.filter(x=>x.role==='police').length,5);
});

test('Patrols move while stationary posts remain in place',()=>{
  const w=createLevel(1),live=createLiveWorld();
  const patrol=live.guards.find(g=>g.id==='watch-a1');
  const post=live.guards.find(g=>g.id==='post-entrance-1');
  const after=advanceLiveWorld(live,{row:10,col:4},w,1);
  const moved=after.state.guards.find(g=>g.id==='watch-a1');
  const stationary=after.state.guards.find(g=>g.id==='post-entrance-1');
  assert.notDeepEqual([moved.x,moved.y],[patrol.x,patrol.y]);
  assert.deepEqual([stationary.x,stationary.y],[post.x,post.y]);
  assert.equal(stationary.moving,false);
  assert.equal(moved.animation,'walk');
  assert.ok(moved.walkFrame>0);
  assert.ok(planPatrol(w,{x:55,y:12},{x:65,y:12}).length>5);
  assert.ok(nextPatrol(post,w,live.clock).x===post.x);
});

test('Outdoor police and three dogs appear together on the correct floor',()=>{
  let state=createLiveWorld();
  const lower=createLevel(1);
  assert.equal(guardEntities(state,1).length,19);
  assert.equal(guardEntities(state,2).length,14);
  assert.equal(dogEntities(state,1).length,3);
  assert.equal(dogEntities(state,2).length,0);
  for(let i=0;i<6;i++)state=advanceLiveWorld(state,{row:10,col:4},lower,1).state;
  const dog=state.dogs.find(x=>x.id==='k9-rex');
  assert.ok(dog);
  assert.equal(dog.floor,1);
  assert.ok(isPassable(lower,dog.y,dog.x));
  assert.ok(['up','down','left','right'].includes(dog.facing));
  assert.equal(typeof drawDog,'function');
  const summary=securitySummary(state,1);
  assert.equal(summary.police,5);
  assert.equal(summary.dogs,3);
});

test('Prison day/night timetable changes lighting and staff shift schedules',()=>{
  const morning=makePrisonClock();
  assert.equal(formatPrisonClock(morning).time,'06:30');
  const daytime=makePrisonClock({minutes:10*60});
  const nighttime=makePrisonClock({minutes:23*60});
  assert.equal(getRoutine(daytime).phase,'day');
  assert.equal(getRoutine(nighttime).phase,'night');
  assert.ok(lightLevel(nighttime)>lightLevel(daytime));
  assert.equal(staffOnDuty({shift:'day'},daytime),true);
  assert.equal(staffOnDuty({shift:'day'},nighttime),false);
  assert.equal(staffOnDuty({shift:'night'},daytime),false);
  assert.equal(staffOnDuty({shift:'night'},nighttime),true);
  assert.deepEqual(advancePrisonClock({minutes:1435,day:2},10),{minutes:5,day:3});
  assert.equal(formatPrisonClock({minutes:0,day:3}).name,'НОЧНАЯ ТИШИНА');
});

test('Shift-specific guards switch activity and a loaded save restores time, dogs and posts',()=>{
  const w=createLevel(1),p={row:10,col:4};
  const original=createLiveWorld();
  const night={...original,clock:makePrisonClock({minutes:23*60})};
  const next=advanceLiveWorld(night,p,w,1,{minutesPerTick:0});
  const daytime=next.state.guards.find(g=>g.id==='watch-a1');
  const nightly=next.state.guards.find(g=>g.id==='watch-a3');
  assert.equal(daytime.moving,false);
  assert.equal(nightly.moving,true);
  const copy=restoreLiveWorld(JSON.parse(JSON.stringify(next.state)));
  assert.deepEqual(copy.clock,next.state.clock);
  assert.equal(copy.guards.length,33);
  assert.equal(copy.dogs.length,3);
  assert.deepEqual(copy.dogs.map(x=>x.handlerId),next.state.dogs.map(x=>x.handlerId));
});
