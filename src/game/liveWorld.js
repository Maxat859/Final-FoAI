/**
 * QAMAL autonomous prison security simulation.
 * Staff physically patrol the expanded fictional map even when the player
 * does not move. Fixed posts stay put. Police with dogs occupy the yard.
 * Schedule, weather-free lighting and events are game-only simulations.
 */
import {createGuard,canSeePlayer} from './guards.js';
import {createAlarm,changeAlarm} from './alarm.js';
import {isPassable} from '../config.js';
import {SECURITY_ROSTER,DOG_ROSTER} from './securityRoster.js';
import {nextPatrol,createK9Unit,advanceK9Unit} from './patrolSystem.js';
import {makePrisonClock,advancePrisonClock,getRoutine,staffOnDuty,MINUTES_PER_TICK} from './prisonSchedule.js';

const CAMERAS=[
  {id:"CAM-01",floor:1,x:27,y:1,radius:2},
  {id:"CAM-02",floor:1,x:27,y:9,radius:2},
  {id:"CAM-03",floor:1,x:26,y:16,radius:2},
  {id:"CAM-04",floor:2,x:35,y:5,radius:2},
  {id:"CAM-05",floor:2,x:44,y:19,radius:2},
  {id:"CAM-06",floor:1,x:66,y:10,radius:2},
  {id:"CAM-07",floor:1,x:92,y:22,radius:2},
  {id:"CAM-08",floor:1,x:20,y:47,radius:2},
  {id:"CAM-09",floor:1,x:94,y:38,radius:2},
  {id:"CAM-10",floor:2,x:66,y:10,radius:2},
  {id:"CAM-11",floor:2,x:92,y:22,radius:2},
  {id:"CAM-12",floor:2,x:20,y:47,radius:2},
  {id:"CAM-13",floor:2,x:94,y:38,radius:2}
];

export function createLiveWorld(){
  return {
    tick:0,status:'playing',clock:makePrisonClock(),
    alarm:createAlarm(0),
    guards:SECURITY_ROSTER.map(config=>({...createGuard(config),
      floor:config.floor,mode:config.mode,shift:config.shift,role:config.role,
      pathSteps:[],walkFrame:0,moving:false})),
    dogs:DOG_ROSTER.map(item=>createK9Unit(item)),
    events:[]
  };
}
export function restoreLiveWorld(raw){
  const fresh=createLiveWorld();
  if(!raw||typeof raw!=='object')return fresh;
  const tick=Number.isInteger(raw.tick)&&raw.tick>=0?raw.tick:0;
  const alarm=Number.isFinite(raw.alarm?.value)?createAlarm(Math.max(0,Math.min(100,raw.alarm.value))):fresh.alarm;
  const guardsById=new Map(Array.isArray(raw.guards)?
    raw.guards.filter(g=>g&&typeof g.id==='string').map(g=>[g.id,g]):[]);
  const dogsById=new Map(Array.isArray(raw.dogs)?
    raw.dogs.filter(d=>d&&typeof d.id==='string').map(d=>[d.id,d]):[]);
  const guards=fresh.guards.map(g=>{
    const old=guardsById.get(g.id);
    return old&&Number.isInteger(old.x)&&Number.isInteger(old.y)?
      {...g,...old,floor:g.floor,role:g.role,shift:g.shift,mode:g.mode,
        patrolRoute:g.patrolRoute,pathSteps:Array.isArray(old.pathSteps)?old.pathSteps.slice(0,240):[]} : g;
  });
  const dogs=fresh.dogs.map(d=>{
    const old=dogsById.get(d.id);
    return old&&Number.isInteger(old.x)&&Number.isInteger(old.y)?
      {...d,...old,handlerId:d.handlerId,floor:d.floor,role:'dog'}:d;
  });
  return {tick,status:'playing',clock:makePrisonClock(raw.clock),alarm,guards,dogs,
    events:Array.isArray(raw.events)?raw.events.slice(-25):[]};
}
function blocked(world,x,y){return !isPassable(world,y,x);}
function appendEvents(history,events){return [...history,...events].slice(-25);}

/**
 * Each call is one simulation tick. main.js drives this on a timer independently
 * of keyboard input; manual moves can also advance it immediately.
 */
export function advanceLiveWorld(previous,player,world,floor=1,options={}){
  if(!player||!world)throw new Error('Missing player or world');
  if(previous.status!=='playing')return {state:previous,events:[],caught:true};
  const tick=previous.tick+1,clock=advancePrisonClock(previous.clock,
    options.minutesPerTick??MINUTES_PER_TICK);
  const prevRoutine=getRoutine(previous.clock??makePrisonClock()),routine=getRoutine(clock);
  const events=[];
  if(prevRoutine.name!==routine.name){
    events.push({tick,type:'schedule',source:'РАСПИСАНИЕ',
      description:'Режим тюрьмы: '+routine.name});
  }
  const isBlocked=(x,y)=>blocked(world,x,y);
  let alarm=previous.alarm;
  const guards=previous.guards.map(g=>{
    if((g.floor??1)!==floor)return g;
    let next=nextPatrol(g,world,clock);
    // A scheduled patrol doesn't walk through the protagonist. This also
    // avoids instant capture from a guard moving into a stationary player.
    if(next.x===player.col&&next.y===player.row)
      next={...next,x:g.x,y:g.y,moving:false,animation:'idle',pathSteps:[]};
    if(!staffOnDuty(g,clock))return {...next,state:'patrol'};
    const visible=canSeePlayer(next,{x:player.col,y:player.row},
      {isBlocked,maxDistance:next.detectionRadius});
    if(visible){
      alarm=changeAlarm(alarm,5);
      if(g.state!=='chase'){
        events.push({tick,type:'guard_spotted',source:g.id,
          description:(g.role==='police'?'Полицейский':'Охранник')+' заметил персонажа'});
      }
      return {...next,state:'chase'};
    }
    return {...next,state:'patrol'};
  });
  const dogs=(previous.dogs||[]).map(unit=>
    unit.floor===floor?advanceK9Unit(unit,guards,world,clock):unit);

  // Cameras signal fictional alarms only near their current-floor sensors.
  for(const cam of CAMERAS){
    if(cam.floor!==floor)continue;
    const near=Math.abs(player.col-cam.x)+Math.abs(player.row-cam.y)<=cam.radius;
    if(near){
      alarm=changeAlarm(alarm,5);
      if(tick%3===1)events.push({tick,type:'camera_signal',source:cam.id,
        description:'Сигнал игровой камеры'});
    }
  }
  if(!events.some(e=>e.type==='guard_spotted'||e.type==='camera_signal')&&tick%5===0)
    alarm=changeAlarm(alarm,-2);
  const caught=alarm.value>=100 ||
    guards.some(g=>g.floor===floor&&g.x===player.col&&g.y===player.row);
  if(caught)events.push({tick,type:'caught',source:'QAMAL',
    description:'Попытка закончена, возврат к контрольной точке'});
  return {state:{tick,status:caught?'caught':'playing',clock,alarm,guards,dogs,
    events:appendEvents(previous.events,events)},events,caught};
}

export function releaseAfterCheckpoint(previous){
  const fresh=createLiveWorld();
  return {...fresh,tick:previous.tick,clock:makePrisonClock(previous.clock),
    alarm:createAlarm(25),events:previous.events};
}
export function guardEntities(state,floor=1){
  return state.guards.filter(g=>g.floor===floor).map(g=>({
    id:g.id,row:g.y,col:g.x,facing:g.facing,
    role:g.role||'guard',mode:g.mode,shift:g.shift,
    state:g.state,animation:g.animation,moving:g.moving,
    walkFrame:g.walkFrame??0,
    name:g.role==='police'?'Патрульный полицейский':
      g.mode==='post'?'Постовой охранник':'Патрульный охранник'
  }));
}
export function dogEntities(state,floor=1){
  return (state.dogs||[]).filter(d=>d.floor===floor).map(d=>({
    id:d.id,row:d.y,col:d.x,facing:d.facing,moving:d.moving,
    role:'dog',name:d.name,walkFrame:d.walkFrame??0
  }));
}
export function securitySummary(state,floor=1){
  const staff=state.guards.filter(g=>g.floor===floor);
  return {
    moving:staff.filter(g=>g.mode==='patrol'&&staffOnDuty(g,state.clock)).length,
    posts:staff.filter(g=>g.mode==='post'||!staffOnDuty(g,state.clock)).length,
    police:staff.filter(g=>g.role==='police').length,
    dogs:(state.dogs||[]).filter(d=>d.floor===floor).length
  };
}
