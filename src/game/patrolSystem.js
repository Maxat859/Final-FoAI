/**
 * Autonomous guard / police patrol AI for QAMAL's imaginary 2D prison.
 * The route planner walks around solid objects; a staff member may cross
 * a question door because it uses its own staff key.
 * This is a nonviolent classroom game simulation, not real-world tactics.
 */
import {isPassable} from '../config.js';
import {facingFromStep} from '../ui/characterSprite.js';
import {staffOnDuty} from './prisonSchedule.js';

const DIRS=[[0,1],[1,0],[-1,0],[0,-1]];
const coord=(x,y)=>y+','+x;
export function guardWalkable(world,x,y){
  return isPassable(world,y,x);
}
export function planPatrol(world,start,goal){
  if(!guardWalkable(world,start.x,start.y)||!guardWalkable(world,goal.x,goal.y))return [];
  if(start.x===goal.x&&start.y===goal.y)return [{x:start.x,y:start.y}];
  const rows=world.length,cols=world[0]?.length??0;
  const visited=new Uint8Array(rows*cols);
  const prev=new Int32Array(rows*cols).fill(-1);
  const startId=start.y*cols+start.x,finishId=goal.y*cols+goal.x;
  const queue=[startId];visited[startId]=1;
  for(let i=0;i<queue.length;i++){
    const current=queue[i],r=Math.floor(current/cols),c=current%cols;
    if(current===finishId)break;
    for(const [dr,dc] of DIRS){
      const rr=r+dr,cc=c+dc,idx=rr*cols+cc;
      if(rr<0||cc<0||rr>=rows||cc>=cols||visited[idx]||!isPassable(world,rr,cc))continue;
      visited[idx]=1;prev[idx]=current;queue.push(idx);
    }
  }
  if(!visited[finishId])return [];
  const result=[];
  for(let at=finishId;at!==-1;at=prev[at])result.push({x:at%cols,y:Math.floor(at/cols)});
  return result.reverse();
}

export function nextPatrol(guard,world,clock){
  const original={...guard,animation:'idle',moving:false};
  if(guard.mode==='post'||guard.mode==='dog'||!staffOnDuty(guard,clock))
    return original;
  const route=Array.isArray(guard.patrolRoute)?guard.patrolRoute:[];
  if(route.length<2)return original;
  let index=Number.isInteger(guard.patrolIndex)?guard.patrolIndex%route.length:0;
  let steps=Array.isArray(guard.pathSteps)?guard.pathSteps.slice():[];
  if(guard.x===route[index].x&&guard.y===route[index].y){
    index=(index+1)%route.length;steps=[];
  }
  const goal=route[index];
  if(!steps.length||!guardWalkable(world,steps[0].x,steps[0].y)){
    steps=planPatrol(world,{x:guard.x,y:guard.y},goal).slice(1);
  }
  if(!steps.length){
    return {...original,patrolIndex:(index+1)%route.length,pathSteps:[]};
  }
  const next=steps.shift();
  return {...original,x:next.x,y:next.y,patrolIndex:index,pathSteps:steps,
    facing:facingFromStep({col:guard.x,row:guard.y},{col:next.x,row:next.y},guard.facing),
    animation:'walk',moving:true,walkFrame:(guard.walkFrame??0)+1};
}

export function createK9Unit({id,floor,handlerId,x,y,name}){
  return {id,floor,handlerId,x,y,name,role:'dog',facing:'down',moving:false,walkFrame:0};
}
export function advanceK9Unit(unit,guards,world,clock){
  const owner=guards.find(g=>g.id===unit.handlerId);
  if(!owner||!staffOnDuty(owner,clock))return {...unit,moving:false};
  const distance=Math.abs(owner.x-unit.x)+Math.abs(owner.y-unit.y);
  if(distance===0){
    // Keep the human handler visible: never paint a dog over a police officer.
    const behind={left:[1,0],right:[-1,0],up:[0,1],down:[0,-1]}[owner.facing]||[1,0];
    const vectors=[behind,[1,0],[0,1],[-1,0],[0,-1]];
    for(const [dx,dy] of vectors){
      const nx=owner.x+dx,ny=owner.y+dy;
      if(guardWalkable(world,nx,ny)&&!guards.some(g=>g.x===nx&&g.y===ny)){
        return {...unit,x:nx,y:ny,moving:true,walkFrame:1-(unit.walkFrame||0),
          facing:facingFromStep({row:unit.y,col:unit.x},{row:ny,col:nx},unit.facing)};
      }
    }
    return {...unit,moving:false};
  }
  if(distance===1)return {...unit,moving:false};
  // Handler stays visible near their dog; no dog attacks are simulated.
  const route=planPatrol(world,{x:unit.x,y:unit.y},{x:owner.x,y:owner.y});
  if(route.length<2)return {...unit,moving:false};
  const point=route[1];
  return {...unit,x:point.x,y:point.y,moving:true,
    walkFrame:1-(unit.walkFrame||0),
    facing:facingFromStep({row:unit.y,col:unit.x},{row:point.y,col:point.x},unit.facing)};
}
