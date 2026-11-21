// Door-based educational checkpoints in the fictional QAMAL game.
// Every visible D tile becomes an interactive terminal. The original CSP gate is unchanged.
export const DOOR_DIFFICULTIES=Object.freeze({easy:{label:"ЛЁГКО",steps:1,penalty:0},medium:{label:"СРЕДНЕ",steps:2,penalty:2},hard:{label:"СЛОЖНО",steps:3,penalty:4}});

export function difficultyForDoor(row,col){
  if(row>=24||col>=38)return "hard";
  if(row>=14||col>=27)return "medium";
  return "easy";
}
export const doorId=(row,col)=>"door-"+row+"-"+col;
export function createDoorQuests(world,saved={}){
  if(!Array.isArray(world)||!world.length)throw new Error("World grid is required");
  const doors=[];
  for(let row=0;row<world.length;row++){
    for(let col=0;col<world[row].length;col++){
      if(world[row][col]!=="D")continue;
      const difficulty=difficultyForDoor(row,col);
      doors.push({id:doorId(row,col),row,col,difficulty,required:DOOR_DIFFICULTIES[difficulty].steps});
    }
  }
  const map=new Map(doors.map(door=>[door.id,door]));
  const progress={};
  for(const door of doors){
    const prior=Number(saved?.[door.id])||0;
    progress[door.id]=Math.max(0,Math.min(door.required,Math.floor(prior)));
  }
  function find(row,col){return map.get(doorId(row,col))||null;}
  function steps(door){return door?progress[door.id]??0:0;}
  function isUnlocked(door){return Boolean(door)&&steps(door)>=door.required;}
  function isLocked(row,col){const door=find(row,col);return Boolean(door)&&!isUnlocked(door);}
  function nearest(player){
    const nearby=doors.filter(door=>Math.abs(player.row-door.row)+Math.abs(player.col-door.col)<=1&&!isUnlocked(door));
    return nearby.find(door=>{
      const dr=door.row-player.row,dc=door.col-player.col;
      return (player.facing==="right"&&dc===1)||(player.facing==="left"&&dc===-1)||
       (player.facing==="up"&&dr===-1)||(player.facing==="down"&&dr===1);
    })||nearby[0]||null;
  }
  function award(door){
    if(!door||!map.has(door.id))throw new Error("Unknown door");
    progress[door.id]=Math.min(door.required,steps(door)+1);
    return {solved:steps(door),required:door.required,unlocked:isUnlocked(door)};
  }
  function question(door,language,bank){
    if(!door||!map.has(door.id))throw new Error("Unknown door");
    if(!["python","go"].includes(language))throw new Error("Unknown language");
    const level=door.difficulty;
    const available=bank.filter(q=>q.language===language&&q.difficulty===level);
    if(!available.length)throw new Error("Question bank missing "+language+"/"+level);
    const seed=door.row*97+door.col*23+steps(door)*37;
    return available[seed%available.length];
  }
  return {
    doors,find,steps,isUnlocked,isLocked,nearest,award,question,
    snapshot:()=>({...progress}),
    completed:()=>doors.filter(isUnlocked).length
  };
}
