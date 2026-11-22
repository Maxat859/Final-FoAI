/**
 * QAMAL's fictional evening roll-call, sleeping residents and morning routine.
 * These are simplified educational game mechanics, not real-world procedures.
 */
import {EXPANSION_ROOMS} from './complexExpansion.js';
import {planPatrol} from './patrolSystem.js';
import {isPassable} from '../config.js';
import {facingFromStep} from '../ui/characterSprite.js';
import {makePrisonClock} from './prisonSchedule.js';

export const CELL_BED=Object.freeze({row:10,col:4,floor:1});
export const CLASS_START=Object.freeze({row:4,col:15,floor:1});
export const ROLL_CALL_TIME=17*60;
export const CELL_RETURN_TIME=20*60;
export const LIGHTS_OUT_TIME=22*60;
export const MORNING_TIME=6*60;
export const BREAKFAST_TIME=7*60;
const inRange=(m,start,end)=>m>=start&&m<end;

export function nightPhase(clock){
  const {minutes:m}=makePrisonClock(clock);
  if(m<MORNING_TIME)return 'sleep';
  if(m<BREAKFAST_TIME)return 'wake';
  if(m<ROLL_CALL_TIME)return 'day';
  if(m<CELL_RETURN_TIME)return 'rollcall';
  if(m<LIGHTS_OUT_TIME)return 'return';
  return 'sleep';
}
export function cellsLocked(clock){
  const m=makePrisonClock(clock).minutes;
  return m>=CELL_RETURN_TIME||m<MORNING_TIME;
}
export function isQuietHours(clock){return nightPhase(clock)==='sleep';}
export function nearBunk(world,player){
  if(!world||!player)return false;
  for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
    if(Math.abs(dr)+Math.abs(dc)>1)continue;
    if(world[player.row+dr]?.[player.col+dc]==='b')return true;
  }
  return false;
}

/** Original hero cell + playable gates in all generated residential rooms. */
export const CELL_GATES=Object.freeze([
  {floor:1,row:9,col:6,kind:'bars'},
  {floor:2,row:4,col:6,kind:'door'},
  ...EXPANSION_ROOMS.filter(r=>r.type==='cell').map(r=>({
    floor:r.floor,row:r.row+r.height-1,col:r.col+Math.floor(r.width/2),kind:'door'
  }))
]);
export function nightGateAt(floor,row,col){return CELL_GATES.find(g=>g.floor===floor&&g.row===row&&g.col===col)||null;}
export function createNightWorld(world,floor,clock){
  if(!cellsLocked(clock))return world;
  const map=world.slice();
  for(const gate of CELL_GATES.filter(g=>g.floor===floor)){
    if(!map[gate.row]?.[gate.col])continue;
    if(map[gate.row]===world[gate.row])map[gate.row]=world[gate.row].slice();
    map[gate.row][gate.col]=gate.kind==='bars'?'G':'B';
  }
  return map;
}
const names=['Марат','Нурали','Санжар','Али','Мейрам','Олжас',
  'Асем','Лаура','Рауан','Дамир','Аяжан','Ерлан','Зарина','Бекзат'];
function seat(room,index){
  return {row:room.row+3+(index%2),col:room.col+3+Math.floor(index/2)*2};
}
function station(room,i){
  return {row:room.row+room.height-2,col:room.col+2+(i%3)};
}
function chooseCell(floor,i){
  const rooms=EXPANSION_ROOMS.filter(r=>r.floor===floor&&r.type==='cell');
  return rooms[i%rooms.length];
}
function choosePublicSpace(floor,i){
  const rooms=EXPANSION_ROOMS.filter(r=>r.floor===floor&&
    ['canteen','study','recreation','library','workshop','visiting'].includes(r.type));
  return rooms[(i*3+floor)%rooms.length];
}
export function createResidentRoster(worlds,original=[]){
  const residents=[],floorCounters={1:0,2:0};
  const originals=original.filter(x=>x&&x.id&&!['guard','police','dog'].includes(x.role));
  for(const e of originals){
    const floor=e.floor||1,index=floorCounters[floor]++;
    const room=chooseCell(floor,index),home=seat(room,index%4);
    const day={row:e.row,col:e.col};
    residents.push({id:e.id,name:e.name,role:e.role||'npc',floor,
      row:day.row,col:day.col,day,home,walkFrame:0,moving:false,sleeping:false,facing:'down'});
  }
  for(const floor of [1,2]){
    for(let i=0;i<12;i++){
      const index=floorCounters[floor]++;
      const room=chooseCell(floor,index),home=seat(room,index%4);
      const day=station(choosePublicSpace(floor,i),i);
      residents.push({id:'resident-'+floor+'-'+String(i+1).padStart(2,'0'),
        name:names[(i+(floor-1)*7)%names.length],role:'resident',floor,
        row:day.row,col:day.col,day,home,walkFrame:0,moving:false,sleeping:false,facing:'down'});
    }
  }
  // If a floor-plan changed, seek a free tile in the same room rather than
  // producing NPCs inside bunk furniture, walls or toilets.
  for(const p of residents){
    const w=worlds[p.floor];
    for(const key of ['home','day']){
      if(isPassable(w,p[key].row,p[key].col))continue;
      const center=p[key];
      let found=null;
      for(let distance=1;distance<=6&&!found;distance++){
        for(let dr=-distance;dr<=distance&&!found;dr++)for(let dc=-distance;dc<=distance;dc++){
          if(Math.abs(dr)+Math.abs(dc)>distance)continue;
          if(isPassable(w,center.row+dr,center.col+dc)){found={row:center.row+dr,col:center.col+dc};break;}
        }
      }
      if(!found)throw Error('No room for resident '+p.id);
      p[key]=found;
    }
  }
  return residents;
}
export function updateResidents(current,clock,worlds,{steps=3}={}){
  const phase=nightPhase(clock);
  return current.map(p=>{
    const target=phase==='day'||phase==='wake'?p.day:p.home;
    const sleeping=phase==='sleep';
    if(sleeping||phase==='return'){
      return {...p,row:p.home.row,col:p.home.col,sleeping,
        moving:false,animation:sleeping?'sleep':'idle'};
    }
    if(p.row===target.row&&p.col===target.col)
      return {...p,sleeping:false,moving:false,animation:'idle'};
    const world=worlds[p.floor];
    const route=planPatrol(world,{x:p.col,y:p.row},{x:target.col,y:target.row});
    // Roll-call is a visible return-to-cells sequence, with NPCs moving
    // in-world rather than instant teleportation.
    const point=route[Math.min(Math.max(1,steps),route.length-1)];
    if(!point)return {...p,sleeping:false,moving:false};
    const next={row:point.y,col:point.x};
    return {...p,...next,sleeping:false,moving:true,animation:'walk',
      walkFrame:(p.walkFrame||0)+1,facing:facingFromStep(p,next,p.facing)};
  });
}
export function nightlyAnnouncement(oldClock,newClock){
  const before=nightPhase(oldClock),after=nightPhase(newClock);
  if(before===after)return null;
  if(after==='rollcall')return {type:'rollcall',title:'ВЕЧЕРНЯЯ ПЕРЕКЛИЧКА',
    message:'Дежурный охранник проводит вечернюю проверку. Заключённые возвращаются в жилые блоки.'};
  if(after==='return')return {type:'return',title:'ВОЗВРАЩЕНИЕ В КАМЕРЫ',
    message:'Жилые блоки закрываются. Персонал сопровождает заключённых в камеры.'};
  if(after==='sleep')return {type:'lightsout',title:'ОТБОЙ',
    message:'Тишина в корпусах. Заключённые спят, охрана продолжает ночное дежурство.'};
  if(after==='wake')return {type:'morning',title:'УТРЕННИЙ ПОДЪЁМ',
    message:'Начинается новый день. Открываются двери камер, впереди завтрак и занятия.'};
  if(after==='day'&&before==='wake')return {type:'breakfast',title:'ЗАВТРАК',
    message:'После подъёма заключённые идут на завтрак, затем в учебные помещения.'};
  return null;
}
export function nextMorningClock(clock){
  const {minutes,day}=makePrisonClock(clock);
  return {minutes:6*60,day:day+(minutes>=CELL_RETURN_TIME?1:0)};
}
