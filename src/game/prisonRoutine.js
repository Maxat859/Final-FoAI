import {isPassable} from '../config.js';

// Fictional NPC routines. Each movement is computed on the real map, one tile
// at a time; occupied cells, doors, walls, and the player are respected.
const PRISONER_TARGETS={
  arman:{sleep:[3,6],wake:[5,6],study:[4,14],meal:[10,8],activity:[10,10],evening:[3,6]},
  ruslan:{sleep:[16,7],wake:[16,9],study:[11,7],meal:[12,8],activity:[12,10],evening:[16,7]}
};
const GUARD_TARGETS={
  guard1:{day:[10,19],night:[10,24]},
  guard2:{day:[5,25],night:[5,25]},
  guard3:{day:[12,6],night:[10,6]},
  guard4:{day:[16,10],night:[16,10]},
  guard5:{day:[15,25],night:[15,27]}
};
const PATROLS={
  guard1:[[10,19],[10,26]],
  guard3:[[12,3],[12,10]],
  guard5:[[15,24],[15,28]]
};
const patrolDirection=new Map();
const SIDES=[[1,0],[-1,0],[0,1],[0,-1]];

export function routineForHour(hour){
  if(hour<6||hour>=20)return 'sleep';
  if(hour<8)return 'wake';
  if(hour<12)return 'study';
  if(hour<14)return 'meal';
  if(hour<18)return 'activity';
  return 'evening';
}

function nextStep(world,entity,target,entities,player){
  if(entity.row===target[0]&&entity.col===target[1])return null;
  const key=(r,c)=>r+','+c;
  const occupied=new Set(entities.filter(e=>e!==entity).map(e=>key(e.row,e.col)));
  occupied.add(key(player.row,player.col));
  const queue=[[entity.row,entity.col]],visited=new Set([key(entity.row,entity.col)]);
  const parent=new Map();
  for(let i=0;i<queue.length;i++){
    const [r,c]=queue[i];
    if(r===target[0]&&c===target[1]){
      let current=key(r,c),previous=parent.get(current);
      while(previous&&previous!==key(entity.row,entity.col)){
        current=previous;previous=parent.get(current);
      }
      return current.split(',').map(Number);
    }
    for(const [dr,dc] of SIDES){
      const nr=r+dr,nc=c+dc,k=key(nr,nc);
      if(!visited.has(k)&&isPassable(world,nr,nc)&&!occupied.has(k)){
        visited.add(k);parent.set(k,key(r,c));queue.push([nr,nc]);
      }
    }
  }
  return null;
}

function walk(entity,where,entities,world,player){
  const next=nextStep(world,entity,where,entities,player);
  if(!next)return false;
  const [r,c]=next;
  entity.facing=c>entity.col?'right':c<entity.col?'left':r>entity.row?'down':'up';
  entity.row=r;entity.col=c;
  return true;
}

export function updatePrisonLife(entities,world,player,clock){
  const phase=routineForHour(clock.hour);
  const isNight=clock.night;
  for(const entity of entities){
    if(entity.role!=='guard'){
      const targets=PRISONER_TARGETS[entity.id];
      if(!targets)continue;
      const [r,c]=targets[phase];
      entity.aiState=phase;
      walk(entity,[r,c],entities,world,player);
      continue;
    }
    const stations=GUARD_TARGETS[entity.id];
    if(!stations)continue;
    const station=isNight?stations.night:stations.day;
    const stationary=entity.id==='guard2'||entity.id==='guard4';
    // Static security posts stay occupied; mobile personnel travel to
    // their shift zone, then make bounded scenery patrols.
    if(stationary){entity.aiState=isNight?'night-post':'day-post';continue;}
    const route=PATROLS[entity.id];
    const low=route[0][1],high=route[1][1];
    if(entity.row!==station[0]||entity.col<low||entity.col>high){
      entity.aiState='changing-shift';
      walk(entity,station,entities,world,player);
      continue;
    }
    let direction=patrolDirection.get(entity.id)??1;
    if(entity.col+direction>high||entity.col+direction<low)direction*=-1;
    const moved=walk(entity,[entity.row,entity.col+direction],entities,world,player);
    entity.aiState=isNight?'night-patrol':'day-patrol';
    if(!moved)direction*=-1;
    patrolDirection.set(entity.id,direction);
  }
}

export function routineLabel(entity){
  const labels={
    sleep:'Отдыхает в блоке',wake:'Утренняя проверка',
    study:'Идёт на занятия',meal:'Обедает',
    activity:'Прогулка и работа',evening:'Возвращается в блок',
    'day-post':'На дневном посту','night-post':'На ночном посту',
    'day-patrol':'Дневной обход','night-patrol':'Ночной обход',
    'changing-shift':'Смена участка'
  };
  return labels[entity.aiState]||'По распорядку';
}
