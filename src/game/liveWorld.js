/**
 * Chapter 1 — lightweight in-game simulation.
 * Uses participant #3's real guard and alarm modules.
 * Coordinates: guard.x = map column, guard.y = map row.
 * All cameras and events are fictional gameplay mechanisms.
 */
import { createGuard, updateGuard, canSeePlayer } from "./guards.js";
import { createAlarm, changeAlarm } from "./alarm.js";
import { isPassable } from "../config.js";

const INITIAL_GUARDS = [
  {
    id: "guard1", floor:1, x: 21, y: 10, detectionRadius: 4,
    patrolRoute: [{x:21,y:10},{x:26,y:10},{x:26,y:12},{x:21,y:12}]
  },
  {
    id: "guard2", floor:1, x: 25, y: 5, detectionRadius: 4,
    patrolRoute: [{x:25,y:5},{x:26,y:5},{x:26,y:6},{x:22,y:6},{x:22,y:5}]
  },
  {id:"guard3",floor:2,x:31,y:12,detectionRadius:4,patrolRoute:[{x:31,y:12},{x:35,y:12},{x:35,y:15},{x:31,y:15}]},
  {id:"guard4",floor:2,x:42,y:19,detectionRadius:4,patrolRoute:[{x:43,y:19},{x:45,y:19},{x:45,y:23},{x:42,y:23}]},
  {id:"guard5",floor:1,x:62,y:12,detectionRadius:4,
    patrolRoute:[{x:62,y:12},{x:68,y:12},{x:73,y:12},{x:62,y:12}]},
  {id:"guard6",floor:1,x:20,y:49,detectionRadius:4,
    patrolRoute:[{x:20,y:49},{x:26,y:49},{x:35,y:49},{x:20,y:49}]},
  {id:"guard7",floor:2,x:76,y:23,detectionRadius:4,
    patrolRoute:[{x:76,y:23},{x:83,y:23},{x:88,y:23},{x:76,y:23}]},
  {id:"guard8",floor:2,x:42,y:61,detectionRadius:4,
    patrolRoute:[{x:42,y:61},{x:49,y:61},{x:55,y:61},{x:42,y:61}]}
];

const CAMERAS = [
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

export function createLiveWorld() {
  return {
    tick:0,
    status:"playing",
    alarm:createAlarm(0),
    guards:INITIAL_GUARDS.map(config=>({...createGuard(config),floor:config.floor})), 
    events:[]
  };
}

export function restoreLiveWorld(raw) {
  const fresh=createLiveWorld();
  if (!raw || typeof raw!=="object")return fresh;
  const tick=Number.isInteger(raw.tick)&&raw.tick>=0?raw.tick:0;
  const alarm=Number.isFinite(raw.alarm?.value)?createAlarm(Math.min(100,Math.max(0,raw.alarm.value))):fresh.alarm;
  const saved=new Map(Array.isArray(raw.guards)?raw.guards.filter(g=>g&&typeof g.id==='string').map(g=>[g.id,g]):[]);
  const guards=fresh.guards.map(defaultGuard=>{
    const existing=saved.get(defaultGuard.id);
    return existing&&Number.isInteger(existing.x)&&Number.isInteger(existing.y)
      ?{...defaultGuard,...existing,floor:defaultGuard.floor}
      :defaultGuard;
  });
  return {tick,status:"playing",alarm,guards,events:Array.isArray(raw.events)?raw.events.slice(-25):[]};
}

function blocked(world,x,y) {
  return !isPassable(world,y,x);
}

function appendEvents(history,events) {
  return [...history,...events].slice(-25);
}

export function advanceLiveWorld(previous,player,world,floor=1) {
  if (!player || !world)throw new Error("Missing player or world");
  if (previous.status!=="playing")return {state:previous,events:[],caught:true};
  const tick=previous.tick+1;
  const events=[];
  const isBlocked=(x,y)=>blocked(world,x,y);
  let alarm=previous.alarm;

  const guards=previous.guards.map(g=>{
    if((g.floor??1)!==floor)return g;
    const next=tick%2===0
      ?updateGuard(g,{player:{x:player.col,y:player.row},isBlocked,searchDuration:5})
      :g;
    const visible=canSeePlayer(next,{x:player.col,y:player.row},{isBlocked,maxDistance:next.detectionRadius});
    if (visible) {
      alarm=changeAlarm(alarm,12);
      if (tick===1 || previous.guards.find(old=>old.id===g.id)?.state!=="chase") {
        events.push({tick,type:"guard_spotted",source:g.id,description:"Охранник заметил персонажа"});
      }
    }
    return next;
  });

  for (const cam of CAMERAS) {
    if(cam.floor!==floor)continue;
    const near=Math.abs(player.col-cam.x)+Math.abs(player.row-cam.y)<=cam.radius;
    if (near) {
      alarm=changeAlarm(alarm,5);
      if (tick%3===1)events.push({tick,type:"camera_signal",source:cam.id,description:"Срабатывание игровой камеры"});
    }
  }

  if (!events.length && tick%5===0)alarm=changeAlarm(alarm,-2);
  const caught=alarm.value>=100 || guards.some(g=>(g.floor??1)===floor&&g.x===player.col&&g.y===player.row);
  if (caught)events.push({tick,type:"caught",source:"QAMAL",description:"Попытка закончена, возврат к контрольной точке"});

  return {
    state:{tick,status:caught?"caught":"playing",alarm,guards,events:appendEvents(previous.events,events)},
    events,caught
  };
}

export function releaseAfterCheckpoint(previous) {
  const fresh=createLiveWorld();
  return {...fresh,tick:previous.tick,alarm:createAlarm(25),events:previous.events};
}

export function guardEntities(state,floor=1) {
  return state.guards.filter(g=>(g.floor??1)===floor).map(g=>({id:g.id,row:g.y,col:g.x,facing:g.facing,state:g.state,animation:g.animation}));
}
