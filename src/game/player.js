import {isPassable,inBounds} from '../config.js';

export const START_POSITION=Object.freeze({row:10,col:4,facing:'right',steps:0});
export const VISION_RADIUS=6;
export const DIRECTIONS=Object.freeze({
  KeyW:[-1,0,'up'],ArrowUp:[-1,0,'up'],KeyS:[1,0,'down'],ArrowDown:[1,0,'down'],
  KeyA:[0,-1,'left'],ArrowLeft:[0,-1,'left'],KeyD:[0,1,'right'],ArrowRight:[0,1,'right']
});

// Opaque tiles block vision, but the wall itself is still visible.
// Locked bars are not treated as solid walls for line of sight.
const OPAQUE=new Set(['#']);
function lineOfSight(world,startRow,startCol,endRow,endCol){
  let x=startCol,y=startRow;
  const dx=Math.abs(endCol-startCol),dy=Math.abs(endRow-startRow);
  const sx=startCol<endCol?1:-1,sy=startRow<endRow?1:-1;
  let error=dx-dy;
  while(x!==endCol||y!==endRow){
    const twice=2*error;
    if(twice>-dy){error-=dy;x+=sx;}
    if(twice<dx){error+=dx;y+=sy;}
    if(!inBounds(world,y,x))return false;
    if(x===endCol&&y===endRow)return true;
    if(OPAQUE.has(world[y][x]))return false;
  }
  return true;
}

// Current field of view, recalculated from scratch after EVERY movement.
// Distant walls and rooms remain hidden until the hero can see them.
export function computeFieldOfView(world,row,col,radius=VISION_RADIUS){
  if(!inBounds(world,row,col))return new Set();
  const visible=new Set();
  const radius2=radius*radius;
  for(let r=Math.max(0,row-radius);r<=Math.min(world.length-1,row+radius);r++){
    for(let c=Math.max(0,col-radius);c<=Math.min(world[r].length-1,col+radius);c++){
      if((r-row)**2+(c-col)**2>radius2)continue;
      if(lineOfSight(world,row,col,r,c))visible.add(r+','+c);
    }
  }
  return visible;
}

// Explored tiles are permanently remembered (and rendered dimly), not
// confused with tiles currently in the character's direct field of view.
export function discover(world,seen,row,col,radius=VISION_RADIUS){
  for(const key of computeFieldOfView(world,row,col,radius))seen.add(key);
  return seen;
}

export function attemptMove(player,direction,world,entities=[]){
  const [dr,dc,facing]=direction;
  const row=player.row+dr,col=player.col+dc;
  if(!isPassable(world,row,col))return {moved:false,reason:'Проход закрыт: стена, мебель или решётка.'};
  if(entities.some(e=>e.row===row&&e.col===col))return {moved:false,reason:'На этой клетке находится персонаж. Нажми E рядом с ним.'};
  return {moved:true,player:{...player,row,col,facing,steps:player.steps+1}};
}
export function nearestInteraction(player,world,entities=[]){
  const targets=[
    {row:4,col:16,kind:'classroom',name:'Учебный класс'},
    {row:11,col:26,kind:'lock',name:'Кодовый терминал'},
    {row:3,col:25,kind:'cctv',name:'Пост CCTV'},
    {row:16,col:18,kind:'dossier',name:'Архив досье'},
    ...entities.map(e=>({...e,kind:'npc'}))
  ];
  return targets.find(t=>Math.abs(t.row-player.row)+Math.abs(t.col-player.col)<=1)||null;
}
