import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {START_TIME,REAL_DAY_MS,WEEKDAY_NAMES,weekdayForDay,
  makePrisonClock,formatPrisonClock,advancePrisonClockByRealTime} from '../src/game/prisonSchedule.js';
import {createLevel,DEFAULT_ENTITIES,isPassable} from '../src/config.js';
import {createResidentRoster,restoreResidents,updateResidents,residentRoutine}
  from '../src/game/nightRoutine.js';

const worlds={1:createLevel(1),2:createLevel(2)};

test('Complete game starts on Monday at 06:00 and has a seven-day calendar',()=>{
  assert.equal(START_TIME,360);
  assert.equal(REAL_DAY_MS,40*60*1000);
  assert.equal(WEEKDAY_NAMES.length,7);
  assert.deepEqual(formatPrisonClock(makePrisonClock()).time,'06:00');
  for(let day=1;day<=14;day++){
    assert.equal(weekdayForDay(day),WEEKDAY_NAMES[(day-1)%7]);
  }
  const nextDay=advancePrisonClockByRealTime(makePrisonClock(),REAL_DAY_MS);
  assert.equal(nextDay.day,2);
  assert.equal(formatPrisonClock(nextDay).weekday,'ВТОРНИК');
  assert.equal(formatPrisonClock(nextDay).time,'06:00');
  assert.equal(weekdayForDay(8),'ПОНЕДЕЛЬНИК');
});

test('Weekday, day number and fractional time survive saving and loading',()=>{
  const current=advancePrisonClockByRealTime({day:7,minutes:1439},5_000);
  const resumed=makePrisonClock(JSON.parse(JSON.stringify(current)));
  assert.deepEqual(formatPrisonClock(resumed),formatPrisonClock(current));
  assert.equal(formatPrisonClock(resumed).weekday,'ПОНЕДЕЛЬНИК');
  assert.equal(resumed.day,8);
});

test('HUD exposes the calendar, resident routine and real time',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  for(const id of ['prison-weekday','prison-clock','prison-routine','night-status'])
    assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(main,/weekdayDisplay\.textContent/);
  assert.match(main,/residentTilesOnCurrentFloor/);
  assert.match(main,/restoreResidents\(residents,previous\?\.residents,worlds\)/);
});

test('Every NPC has a valid daily destination and no shared sleeping location',()=>{
  const people=createResidentRoster(worlds,DEFAULT_ENTITIES);
  const beds=new Set(people.map(p=>p.floor+':'+p.home.row+','+p.home.col));
  assert.equal(beds.size,people.length);
  assert.equal(people.length,31);
  for(const p of people)
    for(const [phase,place] of Object.entries(p.stations)){
      assert.ok(isPassable(worlds[p.floor],place.row,place.col),p.id+' '+phase);
    }
  for(const [hour,phase] of [[1,'sleep'],[6,'wake'],[7,'breakfast'],
    [9,'study'],[12,'lunch'],[13,'activity'],[17,'rollcall'],
    [18,'dinner'],[20,'return'],[22,'sleep']])
    assert.equal(residentRoutine({minutes:hour*60}),phase);
});

test('Returning prisoners do not teleport, collide or lose their beds on save',()=>{
  const initial=createResidentRoster(worlds,DEFAULT_ENTITIES);
  let residents=updateResidents(initial,{day:1,minutes:17*60},worlds);
  for(let i=0;i<350;i++){
    const old=residents;
    residents=updateResidents(residents,{day:1,minutes:20*60},worlds);
    const positions=new Set();
    for(let j=0;j<residents.length;j++){
      const p=residents[j],before=old[j],pos=p.floor+':'+p.row+','+p.col;
      assert.ok(!positions.has(pos),'NPC overlap at step '+i);
      positions.add(pos);
      assert.ok(isPassable(worlds[p.floor],p.row,p.col),p.id+' entered wall');
      assert.ok(Math.abs(p.row-before.row)+Math.abs(p.col-before.col)<=1,
        p.id+' teleported');
    }
  }
  assert.ok(residents.every(p=>p.row===p.home.row&&p.col===p.home.col));
  residents=updateResidents(residents,{day:1,minutes:22*60},worlds);
  assert.ok(residents.every(p=>p.sleeping));
  const restored=restoreResidents(createResidentRoster(worlds,DEFAULT_ENTITIES),
    JSON.parse(JSON.stringify(residents)),worlds);
  assert.deepEqual(restored.map(p=>[p.row,p.col,p.home.row,p.home.col]),
    residents.map(p=>[p.row,p.col,p.home.row,p.home.col]));
});
