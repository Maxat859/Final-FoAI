import test from 'node:test';
import assert from 'node:assert/strict';
import {createLevel,COLS,ROWS,STAIR_LINKS,
  DEFAULT_ENTITIES,FLOORS,isPassable,zoneAt,BLOCKED_TILES,roomLabelsFor} from '../src/config.js';
import {START_POSITION,computeFieldOfView} from '../src/game/player.js';
import {createLiveWorld,advanceLiveWorld,guardEntities,restoreLiveWorld} from '../src/game/liveWorld.js';
import {paintPrisonTile} from '../src/ui/prisonTextures.js';
import {findPath} from '../src/algorithms/search.js';

test('Two complete 48×32 maps exist and have different prison layouts',()=>{
  assert.deepEqual(FLOORS,[1,2]);
  const lower=createLevel(1),upper=createLevel(2);
  for(const map of [lower,upper]){
    assert.equal(map.length,ROWS);
    assert.ok(map.every(row=>row.length===COLS));
    assert.equal(map[0][0],'#');
  }
  assert.notDeepEqual(lower,upper);
  assert.ok(roomLabelsFor(2).length>=12);
  assert.match(zoneAt(10,4,1),/КАМЕРА/);
  assert.notEqual(zoneAt(10,4,1),zoneAt(10,4,2));
});

test('Prisoner wakes next to a bed in a locked cell with actual bars',()=>{
  const w=createLevel(1);
  assert.equal(w[10][4],'.');
  assert.equal(w[10][3],'b');
  assert.equal(w[11][3],'q');
  assert.equal(w[11][7],'s');
  assert.equal(w[9][4],'G');
  assert.equal(w[9][6],'.');
  assert.equal(w[8][6],'D');
  assert.equal(isPassable(w,10,4),true);
  assert.equal(isPassable(w,9,4),false);
  assert.equal(isPassable(w,11,3),false);
  assert.ok(computeFieldOfView(w,10,4).size<100);
});

test('Paired staircases are on passable tiles on both floors',()=>{
  const maps={1:createLevel(1),2:createLevel(2)};
  assert.equal(STAIR_LINKS.length,2);
  for(const s of STAIR_LINKS){
    assert.equal(maps[1][s.row][s.col],'U');
    assert.equal(maps[2][s.row][s.col],'N');
    assert.ok(isPassable(maps[1],s.row,s.col));
    assert.ok(isPassable(maps[2],s.row,s.col));
  }
  assert.equal(maps[1][29][45],'E');
});

test('Both staircases are navigable on upper floor with opened doors',()=>{
  const w=createLevel(2);
  const grid=w.map(row=>row.map(t=>BLOCKED_TILES.has(t)?'#':t).join(''));
  const start={row:10,col:10},goal={row:26,col:34};
  const route=findPath({grid,start,goal,algorithm:'A*'});
  assert.equal(route.found,true);
  assert.ok(route.steps>20);
});

test('Both floors have convincing props and challenge doors',()=>{
  const a=createLevel(1).flat(),b=createLevel(2).flat();
  for(const tiles of [a,b]){
    assert.ok(tiles.filter(t=>t==='D').length>=12);
    assert.ok(tiles.some(t=>t==='b'));
    assert.ok(tiles.some(t=>t==='c'));
    assert.ok(tiles.some(t=>t==='l'));
  }
  assert.ok(a.filter(t=>t==='G').length>=5);
  assert.ok(b.filter(t=>t==='G').length>=5);
  assert.equal(typeof paintPrisonTile,'function');
});

test('Guards patrol and detect only the current floor',()=>{
  const first=createLevel(1),second=createLevel(2);
  const state=createLiveWorld();
  assert.equal(state.guards.length,4);
  assert.equal(guardEntities(state,1).length,2);
  assert.equal(guardEntities(state,2).length,2);
  const upper=advanceLiveWorld(state,{row:12,col:30},second,2);
  assert.ok(upper.state.alarm.value>0);
  assert.ok(upper.events.some(e=>e.type==='guard_spotted'));
  const lowerGuards=state.guards.filter(g=>g.floor===1);
  assert.deepEqual(upper.state.guards.filter(g=>g.floor===1),lowerGuards);
  const restored=restoreLiveWorld(JSON.parse(JSON.stringify(upper.state)));
  assert.equal(guardEntities(restored,2).length,2);
  assert.deepEqual(first[10][10],'U');
});
