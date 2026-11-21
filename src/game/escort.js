import {BLOCKED_TILES,createLevel} from '../config.js';
import {findPath} from '../algorithms/search.js';

export const CLASSROOM_DESK=Object.freeze({row:4,col:15});
export const ESCORT_START=Object.freeze({row:10,col:4});
export const GUARD_APPROACH=Object.freeze([
  {row:8,col:6},{row:9,col:6},{row:10,col:6},{row:10,col:5}
]);

// The guard uses a temporary access pass. Player exercises on these doors
// remain available at other checkpoints; these two gates are opened by story.
export function makeEscortPath(world=createLevel(1),start=ESCORT_START,goal=CLASSROOM_DESK){
  const grid=world.map(row=>row.map(tile=>BLOCKED_TILES.has(tile)?'#':tile).join(''));
  const result=findPath({grid,start,goal,algorithm:'A*'});
  if(!result.found||result.path.length<2)throw new Error('Нет маршрута охранника к учебному классу');
  const gates=result.path.filter(p=>world[p.row][p.col]==='D').map(p=>p.row+':'+p.col);
  return {path:result.path,gates,steps:result.steps};
}
export function nextEscortPair(path,index){
  if(index<=0||index>=path.length)throw new RangeError('Некорректный шаг сопровождения');
  return {player:{...path[index]},guard:{...path[Math.min(index+1,path.length-1)]}};
}
