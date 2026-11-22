import test from 'node:test';
import assert from 'node:assert/strict';
import {createLevel,DEFAULT_ENTITIES,isPassable} from '../src/config.js';
import {createLiveWorld,advanceLiveWorld} from '../src/game/liveWorld.js';
import {createResidentRoster,updateResidents,createNightWorld,CELL_GATES,CELL_BED,
  nightGateAt,cellsLocked,isQuietHours,nearBunk,nightPhase,nightlyAnnouncement,nextMorningClock}
  from '../src/game/nightRoutine.js';
const worlds={1:createLevel(1),2:createLevel(2)};
const at=(h,m=0,day=1)=>({minutes:h*60+m,day});
test('Time progresses through evening roll call, lockdown, lights-out and morning',()=>{
 assert.equal(nightPhase(at(16,55)),'day');
 assert.equal(nightPhase(at(17)),'rollcall');
 assert.equal(nightPhase(at(20)),'return');
 assert.equal(nightPhase(at(22)),'sleep');
 assert.equal(nightPhase(at(5,55)),'sleep');
 assert.equal(nightPhase(at(6)),'wake');
 assert.equal(nightPhase(at(7)),'day');
 assert.equal(nightlyAnnouncement(at(16,55),at(17)).type,'rollcall');
 assert.equal(nightlyAnnouncement(at(19,55),at(20)).type,'return');
 assert.equal(nightlyAnnouncement(at(21,55),at(22)).type,'lightsout');
 assert.equal(nightlyAnnouncement(at(5,55),at(6)).type,'morning');
 assert.equal(nightlyAnnouncement(at(6,55),at(7)).type,'breakfast');
 assert.equal(nightlyAnnouncement(at(8),at(8,5)),null);
 assert.equal(isQuietHours(at(23)),true);
 assert.equal(isQuietHours(at(10)),false);
});
test('Gates are real collision barriers at night, reopen at morning',()=>{
 assert.equal(cellsLocked(at(19,55)),false);
 assert.equal(cellsLocked(at(20)),true);
 assert.equal(cellsLocked(at(5,55)),true);
 assert.equal(cellsLocked(at(6)),false);
 assert.equal(worlds[1][9][6],'.');
 assert.ok(CELL_GATES.filter(g=>g.floor===1).length>=3);
 assert.ok(CELL_GATES.filter(g=>g.floor===2).length>=3);
 for(const floor of [1,2]){
   const original=worlds[floor],night=createNightWorld(original,floor,at(23));
   assert.notEqual(night,original);
   for(const gate of CELL_GATES.filter(g=>g.floor===floor)){
     assert.equal(isPassable(night,gate.row,gate.col),false,
        'locked floor '+floor+' at '+gate.row+','+gate.col);
     assert.equal(nightGateAt(floor,gate.row,gate.col)?.floor,floor);
     assert.equal(isPassable(createNightWorld(original,floor,at(6)),gate.row,gate.col),true);
   }
   assert.deepEqual(original,worlds[floor]);
 }
 assert.equal(createNightWorld(worlds[1],1,at(23))[9][6],'G');
 assert.equal(nearBunk(worlds[1],CELL_BED),true);
 assert.equal(nearBunk(worlds[1],{row:20,col:20}),false);
});
test('Residents return to bunk zones, get to bed and wake for morning',()=>{
 const roster=createResidentRoster(worlds,DEFAULT_ENTITIES);
 const expected=DEFAULT_ENTITIES.filter(x=>!['guard','police','dog'].includes(x.role)).length+24;
 assert.equal(roster.length,expected);
 assert.equal(roster.filter(x=>x.floor===1&&x.role==='resident').length,12);
 assert.equal(roster.filter(x=>x.floor===2&&x.role==='resident').length,12);
 const homes=new Set(roster.map(p=>p.floor+':'+p.home.row+':'+p.home.col));
 assert.equal(homes.size,roster.length,'different occupants need different sleeping places');
 for(const p of roster){
   assert.ok(isPassable(worlds[p.floor],p.home.row,p.home.col),p.name+' home');
   assert.ok(isPassable(worlds[p.floor],p.day.row,p.day.col),p.name+' day');
 }
 let state=updateResidents(roster,at(17),worlds,{steps:3});
 assert.ok(state.filter((p,i)=>p.row!==roster[i].row||p.col!==roster[i].col).length>10);
 assert.ok(state.every(p=>!p.sleeping));
 state=updateResidents(state,at(20),worlds);
 assert.ok(state.every(p=>p.row===p.home.row&&p.col===p.home.col&&!p.sleeping));
 state=updateResidents(state,at(22),worlds);
 assert.ok(state.every(p=>p.sleeping&&!p.moving));
 state=updateResidents(state,at(6),worlds);
 assert.ok(state.every(p=>!p.sleeping));
});
test('Sleep advances game clock without mutating quest doors',()=>{
 assert.deepEqual(nextMorningClock(at(22,30,3)),at(6,0,4));
 assert.deepEqual(nextMorningClock(at(1,15,4)),at(6,0,4));
 const w=createLevel(1);
 assert.equal(w[8][6],'D');
 const night=createNightWorld(w,1,at(20));
 assert.equal(night[8][6],'D');
 assert.equal(night[9][6],'G');
});
test('Night guard patrols remain live while occupants sleep',()=>{
 const live=createLiveWorld(),hero={row:CELL_BED.row,col:CELL_BED.col};
 const before={...live,clock:at(23)};
 const next=advanceLiveWorld(before,hero,worlds[1],1,{minutesPerTick:0});
 assert.equal(next.state.clock.minutes,23*60);
 assert.ok(next.state.guards.some((g,i)=>g.x!==before.guards[i].x||g.y!==before.guards[i].y));
 assert.equal(next.state.guards.find(g=>g.id==='post-entrance-1').moving,false);
 assert.equal(next.caught,false);
});
