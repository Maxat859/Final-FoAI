import test from 'node:test';
import assert from 'node:assert/strict';
import {BLOCKED_TILES,COLS,ROWS,VIEW_COLS,VIEW_ROWS,EXIT_POSITION,createLevel,isPassable} from '../src/config.js';
import {START_POSITION,VISION_RADIUS,computeFieldOfView,discover} from '../src/game/player.js';
import {getCameraOffset} from '../src/game/camera.js';
import {findPath} from '../src/algorithms/search.js';

test('new QAMAL level is 48x32 and preserves the original checkpoints',()=>{
  const world=createLevel();
  assert.equal(COLS,48);assert.equal(ROWS,32);
  assert.equal(world.length,ROWS);
  assert.ok(world.every(row=>row.length===COLS));
  assert.equal(world[EXIT_POSITION.row][EXIT_POSITION.col],'E');
  assert.equal(world[11][14],'B');
  assert.equal(world[4][16],'d');
  assert.equal(world[3][25],'t');
  assert.equal(world[16][18],'d');
});

test('new wings are connected: exit reachable without crossing walls',()=>{
  const world=createLevel();
  const blocked=BLOCKED_TILES;
  const grid=world.map(row=>row.map(x=>blocked.has(x)?'#':x).join(''));
  const route=findPath({grid,start:START_POSITION,goal:EXIT_POSITION,algorithm:'A*'});
  assert.equal(route.found,true);
  assert.ok(route.steps>30);
  assert.deepEqual(route.path.at(-1),EXIT_POSITION);
  assert.ok(route.path.every(cell=>isPassable(world,cell.row,cell.col)));
});

test('character sees local radius, not the full world',()=>{
  const world=createLevel();
  const visible=computeFieldOfView(world,START_POSITION.row,START_POSITION.col);
  assert.equal(visible.has('10,4'),true);
  assert.equal(visible.has('29,45'),false);
  assert.ok(visible.size<130);
  for(const key of visible){
    const [r,c]=key.split(',').map(Number);
    assert.ok((r-START_POSITION.row)**2+(c-START_POSITION.col)**2<=VISION_RADIUS**2);
  }
});

test('walls are visible but hide the cells behind them',()=>{
  const room=[
    '#########',
    '#.......#',
    '#..#....#',
    '#.......#',
    '#########'
  ].map(row=>row.split(''));
  const left=computeFieldOfView(room,2,2,4);
  assert.equal(left.has('2,3'),true);  // Wall itself
  assert.equal(left.has('2,4'),false); // Behind wall
  const other=computeFieldOfView(room,2,5,4);
  assert.equal(other.has('2,4'),true);
});

test('explored cells persist while immediate visibility changes',()=>{
  const room=[
    '#########',
    '#.......#',
    '#..#....#',
    '#.......#',
    '#########'
  ].map(row=>row.split(''));
  const seen=discover(room,new Set(),2,2,4);
  const oldCount=seen.size;
  assert.equal(seen.has('2,2'),true);
  assert.equal(seen.has('2,4'),false);
  discover(room,seen,2,5,4);
  assert.ok(seen.size>oldCount);
  assert.equal(seen.has('2,4'),true);
  assert.equal(seen.has('2,2'),true);
  const current=computeFieldOfView(room,2,5,4);
  assert.equal(current.has('2,2'),false);
});

test('camera tracks the hero without ever going outside world borders',()=>{
  const world=createLevel();
  assert.deepEqual(getCameraOffset(START_POSITION,world),{row:3,col:0});
  assert.deepEqual(getCameraOffset({row:20,col:25},world),{row:13,col:14});
  assert.deepEqual(getCameraOffset(EXIT_POSITION,world),{row:ROWS-VIEW_ROWS,col:COLS-VIEW_COLS});
  for(const p of [START_POSITION,EXIT_POSITION,{row:1,col:1}]){
    const {row,col}=getCameraOffset(p,world);
    assert.ok(row>=0&&col>=0&&row+VIEW_ROWS<=ROWS&&col+VIEW_COLS<=COLS);
  }
});
