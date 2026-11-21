import {isPassable,inBounds} from '../config.js';
export const START_POSITION=Object.freeze({row:10,col:4,facing:'right',steps:0});
export const DIRECTIONS=Object.freeze({
  KeyW:[-1,0,'up'],ArrowUp:[-1,0,'up'],KeyS:[1,0,'down'],ArrowDown:[1,0,'down'],
  KeyA:[0,-1,'left'],ArrowLeft:[0,-1,'left'],KeyD:[0,1,'right'],ArrowRight:[0,1,'right']
});
export function discover(world,seen,row,col,radius=3){
  for(let r=row-radius;r<=row+radius;r++)for(let c=col-radius;c<=col+radius;c++){
    if(inBounds(world,r,c)&&Math.abs(row-r)+Math.abs(col-c)<=radius+1)seen.add(`${r},${c}`);
  }
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
