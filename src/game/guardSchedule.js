import {isPassable} from '../config.js';
// Small bounded patrols, purely fictional NPC scheduling for the educational map.
const ROUTES={
  guard1:[[10,19],[10,26]],
  guard3:[[12,3],[12,10]],
  guard5:[[16,24],[16,28]]
};
const progress=new Map();
export function updateGuards(entities,world,player,night){
  for(const guard of entities){
    if(guard.role!=='guard')continue;
    const route=ROUTES[guard.id];
    if(!route){guard.aiState='post';continue;}
    const [[r1,c1],[r2,c2]]=route;
    const state=progress.get(guard.id)??{dir:1};
    // Each guard advances just one tile, and never enters an occupied tile.
    const nextCol=guard.col+state.dir;
    if(nextCol<c1||nextCol>c2||!isPassable(world,guard.row,nextCol)){
      state.dir*=-1;
    }else if(!(player.row===guard.row&&player.col===nextCol) &&
      !entities.some(other=>other!==guard&&other.row===guard.row&&other.col===nextCol)){
      guard.col=nextCol;
      guard.facing=state.dir===1?'right':'left';
    }
    guard.aiState=night?'night-patrol':'patrol';
    progress.set(guard.id,state);
  }
}
