import {selectQuestion} from '../education/questionBank.js';

// Every marked D tile is a challenge gate; the central B gate stays CSP-only.
export const DIFFICULTY_LABEL={easy:'ЛЁГКИЙ',medium:'СРЕДНИЙ',hard:'СЛОЖНЫЙ'};
export function doorId(row,col){return row+':'+col;}
export function doorDifficulty(row,col){
  if(col>=30&&row>=18)return 'hard';
  if(row>=25&&col>=13)return 'hard';
  if(col>=25||row>=17)return 'medium';
  return 'easy';
}
export function listChallengeDoors(world){
  const doors=[];
  for(let row=0;row<world.length;row++)
    for(let col=0;col<world[row].length;col++){
      if(world[row][col]!=='D')continue;
      const difficulty=doorDifficulty(row,col);
      doors.push({id:doorId(row,col),row,col,difficulty,
        label:DIFFICULTY_LABEL[difficulty]+' · '+(difficulty==='easy'?'1 звезда':difficulty==='medium'?'2 звезды':'3 звезды')});
    }
  return doors;
}
export function findDoor(world,row,col){
  if(world[row]?.[col]!=='D')return null;
  return {id:doorId(row,col),row,col,difficulty:doorDifficulty(row,col),
    label:DIFFICULTY_LABEL[doorDifficulty(row,col)]};
}
export function adjacentDoor(world,player,unlocked=[]){
  const keys=unlocked instanceof Set?unlocked:new Set(unlocked);
  const candidates=[[0,1],[1,0],[0,-1],[-1,0]];
  for(const [dr,dc] of candidates){
    const door=findDoor(world,player.row+dr,player.col+dc);
    if(door&&!keys.has(door.id))return door;
  }
  return null;
}
export function getDoorQuestion(door,language,attempt=0){
  if(!door)throw new Error('Дверь не указана');
  const seed=door.row*97+door.col*37+Math.max(0,attempt)*11;
  return selectQuestion(language,door.difficulty,seed);
}
export function canPassDoor(door,unlocked){
  if(!door)return true;
  return unlocked instanceof Set?unlocked.has(door.id):unlocked.includes(door.id);
}
