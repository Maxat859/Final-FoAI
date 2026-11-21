import test from 'node:test';import assert from 'node:assert/strict';
import {createLevel,ROWS,COLS,isPassable,DEFAULT_ENTITIES} from '../src/config.js';
import {START_POSITION,DIRECTIONS,attemptMove,discover} from '../src/game/player.js';
import {canFinish,markMission,DEFAULT_MISSION,objective} from '../src/game/mission.js';
import {fallbackPrisoners,provisionalRisk} from '../src/surveillance/dossierStore.js';
import {makeAuditEntry,appendAudit} from '../src/surveillance/auditLog.js';
test('map dimensions, walls and traversable doors',()=>{
  const map=createLevel();assert.equal(map.length,ROWS);assert.ok(map.every(r=>r.length===COLS));
  assert.equal(isPassable(map,0,0),false);assert.equal(isPassable(map,10,5),true);
  assert.equal(isPassable(map,8,6),true);assert.equal(isPassable(map,3,3),false);
});
test('player movement uses bounds, obstacles and distinct entities',()=>{
  const map=createLevel();const good=attemptMove(START_POSITION,DIRECTIONS.KeyD,map,DEFAULT_ENTITIES);
  assert.equal(good.moved,true);assert.equal(good.player.col,5);
  const wall=attemptMove({row:1,col:1,steps:0},DIRECTIONS.KeyW,map);
  assert.equal(wall.moved,false);
});
test('fog-of-war only reveals nearby cells',()=>{
  const map=createLevel(),seen=discover(map,new Set(),10,4,3);
  assert.ok(seen.has('10,4'));assert.ok(!seen.has('1,25'));assert.ok(seen.size<ROWS*COLS);
});
test('mission needs checkpoints before exit',()=>{
  let m={...DEFAULT_MISSION};assert.equal(canFinish(m),false);
  for(const key of ['learned','lockOpen','visitedCCTV','bayesDone'])m=markMission(m,key);
  assert.equal(canFinish(m),true);assert.equal(objective(m),'Найти выход (зелёная клетка)');
});
test('fallback 1000 dossiers have unique IDs and correct tiers',()=>{
  const p=fallbackPrisoners();assert.equal(p.length,1000);
  assert.equal(new Set(p.map(x=>x.id)).size,1000);
  assert.equal(p.filter(x=>x.roleTier==='main').length,6);
  assert.equal(p.filter(x=>x.roleTier==='secondary').length,24);
  assert.equal(p.filter(x=>x.roleTier==='background').length,970);
});
test('audit entry copies old and new states',()=>{
  const prev={reviewStatus:'unreviewed'},next={reviewStatus:'incorrect'};
  const a=makeAuditEntry({prisonerId:'Q-01047',eventId:'EVT-4001',action:'mark_incorrect',previous:prev,next});
  next.reviewStatus='mutated';const log=appendAudit([],a);
  assert.equal(log[0].next.reviewStatus,'incorrect');
  assert.equal(provisionalRisk([{isActiveForAnalysis:true,severity:7}]),'HIGH');
});
