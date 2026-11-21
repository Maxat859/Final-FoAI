import test from "node:test";
import assert from "node:assert/strict";
import { createLevel, isPassable } from "../src/config.js";
import { createLiveWorld, advanceLiveWorld, restoreLiveWorld, guardEntities, releaseAfterCheckpoint } from "../src/game/liveWorld.js";

test("Новая глава содержит двух игровых охранников и нормальный уровень тревоги",()=>{
  const live=createLiveWorld();
  assert.equal(live.guards.length,4);
  assert.equal(live.alarm.value,0);
  assert.equal(live.status,"playing");
  assert.equal(guardEntities(live).length,2);
});

test("Охранники участвуют в обновлении мира после ходов игрока",()=>{
  const level=createLevel();
  let state=createLiveWorld();
  for(let i=0;i<4;i++){
    const next=advanceLiveWorld(state,{row:10,col:4},level);
    state=next.state;
  }
  assert.equal(state.tick,4);
  assert.equal(state.guards.length,4);
  assert.ok(state.guards.every(g=>["patrol","suspicion","search","chase"].includes(g.state)));
});

test("Виртуальная камера изменяет тревогу только рядом со своей зоной",()=>{
  const level=createLevel();
  const baseline=advanceLiveWorld(createLiveWorld(),{row:10,col:4},level);
  const camera=advanceLiveWorld(createLiveWorld(),{row:9,col:27},level);
  assert.equal(baseline.state.alarm.value,0);
  assert.ok(camera.state.alarm.value>=5);
  assert.ok(camera.events.some(e=>e.type==="camera_signal"));
});

test("Охранник замечает игрового персонажа по алгоритму Guard AI",()=>{
  const level=createLevel();
  const next=advanceLiveWorld(createLiveWorld(),{row:10,col:22},level);
  assert.ok(next.state.alarm.value>0);
  assert.ok(next.events.some(e=>e.type==="guard_spotted"));
});

test("Сохранение и возврат к контрольной точке сохраняет журнал",()=>{
  const level=createLevel();
  const spotted=advanceLiveWorld(createLiveWorld(),{row:10,col:22},level).state;
  const restored=restoreLiveWorld(JSON.parse(JSON.stringify(spotted)));
  assert.equal(restored.tick,1);
  assert.equal(restored.events.length,spotted.events.length);
  const retry=releaseAfterCheckpoint(restored);
  assert.equal(retry.status,"playing");
  assert.equal(retry.alarm.value,25);
  assert.equal(retry.events.length,spotted.events.length);
});

test("После решения CSP центральный проход можно открыть на игровой карте",()=>{
  const level=createLevel();
  assert.equal(isPassable(level,11,14),false);
  level[11][14]="D";
  assert.equal(isPassable(level,11,14),true);
});
