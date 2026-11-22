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
  // Each small block has 15 unique floor spots beside bunks.
  return {row:room.row+3+Math.floor((index%15)/5),
    col:room.col+2+(index%5)};
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
    const room=chooseCell(floor,index),home=seat(room,Math.floor(index/2));
    const day={row:e.row,col:e.col};
    residents.push({id:e.id,name:e.name,role:e.role||'npc',floor,
      row:day.row,col:day.col,day,home,walkFrame:0,moving:false,sleeping:false,facing:'down'});
  }
  for(const floor of [1,2]){
    for(let i=0;i<12;i++){
      const index=floorCounters[floor]++;
      const room=chooseCell(floor,index),home=seat(room,Math.floor(index/2));
      const day=station(choosePublicSpace(floor,i),i);
      residents.push({id:'resident-'+floor+'-'+String(i+1).padStart(2,'0'),
        name:names[(i+(floor-1)*7)%names.length],role:'resident',floor,
        row:day.row,col:day.col,day,home,walkFrame:0,moving:false,sleeping:false,facing:'down'});
    }
  }
  // Reserve a distinct passable place beside bunks for each person.
  // This prevents overlapping sleeping sprites and blocked wardrobe spots.
  const occupied=new Set(),dayOccupied=new Set();
  for(const p of residents){
    const w=worlds[p.floor],room=chooseCell(p.floor,0);
    const key=position=>p.floor+':'+position.row+':'+position.col;
    if(!isPassable(w,p.day.row,p.day.col)||dayOccupied.has(key(p.day))){
      const center=p.day;
      const alternatives=[];
      for(let radius=1;radius<=12;radius++)
        for(let dr=-radius;dr<=radius;dr++)for(let dc=-radius;dc<=radius;dc++){
          if(Math.abs(dr)+Math.abs(dc)!==radius)continue;
          const row=center.row+dr,col=center.col+dc;
          if(isPassable(w,row,col)&&!dayOccupied.has(key({row,col})))
            alternatives.push({row,col});
        }
      if(!alternatives.length)throw Error('No free daytime location for '+p.id);
      p.day=alternatives[0];
      p.row=p.day.row;p.col=p.day.col;
    }
    dayOccupied.add(key(p.day));
    if(!isPassable(w,p.home.row,p.home.col)||occupied.has(key(p.home))){
      const center=p.home;
      let options=[];
      for(let r=center.row-4;r<=center.row+4;r++)
        for(let c=center.col-4;c<=center.col+4;c++){
          const cellRoom=EXPANSION_ROOMS.find(x=>x.floor===p.floor&&x.type==='cell'&&
            r>x.row+2&&r<x.row+x.height-1&&c>x.col&&c<x.col+x.width-1);
          if(!cellRoom||!isPassable(w,r,c)||occupied.has(key({row:r,col:c})))continue;
          options.push({row:r,col:c,distance:Math.abs(r-center.row)+Math.abs(c-center.col)});
        }
      options.sort((a,b)=>a.distance-b.distance||a.row-b.row||a.col-b.col);
      const found=options[0];
      if(!found)throw Error('No free sleeping location for '+p.id);
      p.home={row:found.row,col:found.col};
    }
    occupied.add(key(p.home));
  }

  // Separate everyday locations: meals, studies and activities.
  // Select real walkable floor tiles in each destination room.
  const allocations={breakfast:new Set(),study:new Set(),activity:new Set()};
  for(const p of residents){
    const index=residents.filter(other=>other.floor===p.floor).indexOf(p);
    const breakfast=activityPlace(worlds[p.floor],p.floor,['canteen','kitchen'],index,allocations.breakfast,p.day);
    const study=activityPlace(worlds[p.floor],p.floor,['study','library'],index,allocations.study,p.day);
    const activity=activityPlace(worlds[p.floor],p.floor,['workshop','recreation','yard'],index,allocations.activity,p.day);
    p.stations={wake:p.day,breakfast,study,lunch:breakfast,activity,
      rollcall:p.home,dinner:breakfast,return:p.home,sleep:p.home};
  }
  return residents;
}

function activityPlace(world,floor,types,index,used,fallback){
  const rooms=EXPANSION_ROOMS.filter(room=>room.floor===floor&&types.includes(room.type));
  if(types.includes('canteen')&&floor===2)
    rooms.push({row:9,col:27,width:12,height:8,type:'canteen'});
  if(!rooms.length)return {...fallback};
  const start=index%rooms.length;
  for(let i=0;i<rooms.length;i++){
    const room=rooms[(start+i)%rooms.length],spots=[];
    for(let r=room.row+2;r<room.row+room.height-1;r++)
      for(let c=room.col+2;c<room.col+room.width-1;c++)
        if(isPassable(world,r,c)&&!used.has(floor+':'+r+':'+c))spots.push({row:r,col:c});
    if(spots.length){
      const place=spots[Math.floor(index/rooms.length)%spots.length];
      used.add(floor+':'+place.row+':'+place.col);
      return place;
    }
  }
  return {...fallback};
}

export function residentRoutine(clock){
  const m=makePrisonClock(clock).minutes;
  if(m<6*60)return 'sleep';
  if(m<7*60)return 'wake';
  if(m<9*60)return 'breakfast';
  if(m<12*60)return 'study';
  if(m<13*60)return 'lunch';
  if(m<17*60)return 'activity';
  if(m<18*60)return 'rollcall';
  if(m<20*60)return 'dinner';
  if(m<22*60)return 'return';
  return 'sleep';
}
const residentPosition=p=>p.floor+':'+p.row+','+p.col;
export function restoreResidents(fresh,saved,worlds){
  if(!Array.isArray(saved))return fresh;
  const previous=new Map(saved.filter(p=>p&&typeof p.id==='string').map(p=>[p.id,p]));
  const used=new Set();
  return fresh.map(p=>{
    const old=previous.get(p.id);
    if(!old||old.floor!==p.floor||!Number.isInteger(old.row)||!Number.isInteger(old.col)||
       !isPassable(worlds[p.floor],old.row,old.col)){
      used.add(residentPosition(p));return p;
    }
    const place=p.floor+':'+old.row+','+old.col;
    if(used.has(place)){used.add(residentPosition(p));return p;}
    used.add(place);
    return {...p,row:old.row,col:old.col,
      facing:['up','down','left','right'].includes(old.facing)?old.facing:p.facing,
      walkFrame:Number.isInteger(old.walkFrame)?old.walkFrame:0,
      moving:false,sleeping:Boolean(old.sleeping),routeTarget:null,pathSteps:[]};
  });
}
/** Move one tile per simulation update; never teleport on a shift transition. */
export function updateResidents(current,clock,worlds,{steps=1,blockedPositions=[]}={}){
  const routine=residentRoutine(clock);
  const occupied=new Set(current.map(residentPosition));
  for(const place of blockedPositions)
    if(place&&Number.isInteger(place.floor)&&Number.isInteger(place.row)&&Number.isInteger(place.col))
      occupied.add(place.floor+':'+place.row+','+place.col);
  return current.map(p=>{
    const target=p.stations?.[routine]||((routine==='sleep'||routine==='return')?p.home:p.day);
    const home=p.row===p.home.row&&p.col===p.home.col;
    const atTarget=p.row===target.row&&p.col===target.col;
    const sleeping=routine==='sleep'&&home;
    if(atTarget)return {...p,sleeping,moving:false,animation:sleeping?'sleep':'idle',pathSteps:[]};
    const world=worlds[p.floor],key=target.row+','+target.col;
    const cached=p.routeTarget===key&&Array.isArray(p.pathSteps)&&p.pathSteps.length
      ?p.pathSteps:[];
    let path=cached.length?cached:planPatrol(world,{x:p.col,y:p.row},{x:target.col,y:target.row}).slice(1);
    // Route cache can contain stale moves after a save or an interrupted walk.
    if(path.length&&Math.abs(path[0].x-p.col)+Math.abs(path[0].y-p.row)!==1)
      path=planPatrol(world,{x:p.col,y:p.row},{x:target.col,y:target.row}).slice(1);
    const point=path[0],nextKey=point&&p.floor+':'+point.y+','+point.x;
    if(!point||!isPassable(world,point.y,point.x)||occupied.has(nextKey))
      return {...p,sleeping:false,moving:false,animation:'idle',routeTarget:key,pathSteps:path};
    occupied.delete(residentPosition(p));
    occupied.add(nextKey);
    const next={row:point.y,col:point.x};
    return {...p,...next,sleeping:false,moving:true,animation:'walk',
      routeTarget:key,pathSteps:path.slice(1),
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
