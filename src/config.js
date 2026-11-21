// QAMAL — two handcrafted 48×32 prison floors; all coordinates: {row,col}.
export const TILE_SIZE=32;
export const ROWS=32;
export const COLS=48;
export const VIEW_ROWS=15;
export const VIEW_COLS=23;
export const FLOORS=[1,2];
export const EXIT_POSITION=Object.freeze({row:29,col:45,floor:1});
export const STAIR_LINKS=Object.freeze([
  {id:'north',row:10,col:10,from:1,to:2},
  {id:'service',row:26,col:34,from:1,to:2}
]);

export const ASSET_IDS=Object.freeze({
  floor:'tile.floor.concrete',floorDark:'tile.floor.dark',wall:'tile.wall.concrete',
  reinforced:'tile.wall.reinforced',grille:'tile.door.grille',door:'tile.door.metal',
  bars:'tile.door.bars',exit:'tile.door.exit',bed:'tile.prop.bed',
  desk:'tile.prop.desk',terminal:'tile.prop.terminal',camera:'tile.prop.camera',
  toilet:'tile.prop.toilet',sink:'tile.prop.sink',locker:'tile.prop.locker',
  shower:'tile.prop.shower',table:'tile.prop.table',lamp:'tile.prop.lamp',
  vent:'tile.prop.vent',crate:'tile.prop.crate',pipes:'tile.prop.pipes',
  window:'tile.prop.window',stairsUp:'tile.stairs.up',stairsDown:'tile.stairs.down',
  player:'character.player.erasyl',guard:'character.guard.blue',
  senior:'character.guard.senior',prisoner:'character.prisoner.generic'
});

export const BLOCKED_TILES=new Set(['#','K','G','B','b','d','t','c','q','s','l','h','m','v','k','w']);
const newGrid=()=>Array.from({length:ROWS},(_,r)=>
  Array.from({length:COLS},(_,c)=>(r===0||c===0||r===ROWS-1||c===COLS-1)?'#':'.'));
const h=(map,r,a,b,kind='#')=>{for(let c=a;c<=b;c++)map[r][c]=kind;};
const v=(map,c,a,b,kind='#')=>{for(let r=a;r<=b;r++)map[r][c]=kind;};
const props=(map,points)=>{for(const [r,c,t] of points)map[r][c]=t;};

function groundFloor(){
  const map=newGrid();
  // Historic areas remain at their old coordinates to preserve all team modules.
  v(map,11,1,8);v(map,20,1,8);h(map,8,1,28);v(map,14,9,18);
  h(map,14,1,13);h(map,14,15,28);v(map,23,15,18);
  props(map,[
    [4,11,'D'],[5,20,'D'],[8,6,'D'],[8,16,'D'],[8,25,'D'],
    [14,5,'D'],[14,19,'D'],[14,26,'D'],[17,14,'D'],[17,23,'D']
  ]);
  map[11][14]='B'; // CSP lock remains the shared checkpoint.
  props(map,[
    [3,3,'b'],[3,8,'b'],[3,15,'b'],[16,4,'b'],
    [4,16,'d'],[16,18,'d'],[3,25,'t'],[11,26,'t'],
    [1,27,'c'],[9,27,'c'],[16,26,'c']
  ]);
  v(map,29,1,19);h(map,19,1,29);
  props(map,[[10,29,'D'],[17,29,'D'],[19,7,'D'],[19,23,'D']]);
  h(map,8,30,46);h(map,17,30,46);h(map,25,30,46);
  v(map,38,1,8);v(map,38,9,16);v(map,38,18,24);v(map,38,26,30);
  props(map,[
    [8,35,'D'],[8,43,'D'],[17,34,'D'],[17,42,'D'],[25,32,'D'],
    [25,45,'D'],[5,38,'D'],[12,38,'D'],[20,38,'D'],[28,38,'D']
  ]);
  v(map,13,20,30);v(map,27,20,30);
  h(map,25,1,29);h(map,29,1,27);
  props(map,[
    [23,13,'D'],[26,27,'D'],[25,6,'D'],[25,18,'D'],[25,25,'D'],[29,9,'D'],[29,22,'D']
  ]);
  props(map,[
    [3,34,'b'],[4,43,'t'],[12,34,'c'],[14,43,'b'],
    [20,33,'d'],[22,42,'t'],[27,34,'b'],[28,44,'c'],
    [23,6,'b'],[28,19,'d']
  ]);

  // Prisoner cell at the start: bed, washbasin, toilet and iron bars.
  // Existing E2E path (10,4)→(10,6)→(9,6)→door(8,6) stays valid.
  h(map,9,2,8,'G');map[9][6]='.';
  v(map,9,9,12,'K');map[10][9]='D';
  h(map,12,2,9,'K');map[12][5]='w';
  props(map,[[10,3,'b'],[10,7,'l'],[11,3,'q'],[11,7,'s']]);
  // Neighboring barred cells along the block's upper corridor.
  props(map,[
    [2,3,'b'],[2,8,'q'],[6,3,'s'],[6,8,'l'],
    [3,9,'l'],[6,17,'m'],[2,17,'q'],[2,23,'l'],[6,24,'s'],
    [15,3,'h'],[15,8,'s'],[17,5,'q'],[17,10,'l'],
    [20,5,'m'],[21,11,'k'],[27,7,'l'],[28,8,'s'],
    [3,32,'k'],[6,35,'l'],[10,34,'h'],[14,34,'m'],
    [20,40,'s'],[23,43,'l'],[27,41,'v'],[28,42,'p']
  ]);
  // More believable lighting and environmental details.
  props(map,[[6,9,'L'],[10,18,'L'],[12,24,'L'],[21,18,'L'],[27,36,'L']]);
  map[10][10]='U';
  map[26][34]='U';
  map[EXIT_POSITION.row][EXIT_POSITION.col]='E';
  return map;
}
function upperFloor(){
  const map=newGrid();
  // Public corridors and distinct upper-level rooms, linked by puzzle doors.
  for(const c of [12,26,39])v(map,c,1,30,'K');
  for(const r of [8,17,25])h(map,r,1,46,'K');
  props(map,[
    [10,12,'D'],[10,26,'D'],[10,39,'D'],
    [8,10,'D'],[8,20,'D'],[8,32,'D'],[8,44,'D'],
    [17,10,'D'],[17,20,'D'],[17,32,'D'],[17,44,'D'],
    [25,10,'D'],[25,20,'D'],[25,32,'D'],[25,44,'D'],
    [4,12,'D'],[22,26,'D'],[28,39,'D']
  ]);
  // Special confinement cells upstairs.
  v(map,6,2,7,'G');map[4][6]='D';
  h(map,5,2,5,'G');map[5][4]='D';
  // Training, infirmary, kitchen, offices, storage, surveillance.
  props(map,[
    [2,3,'b'],[3,4,'q'],[6,3,'s'],[6,9,'b'],
    [2,17,'h'],[3,18,'s'],[4,23,'q'],[6,22,'l'],
    [2,30,'d'],[3,35,'d'],[5,33,'c'],[6,43,'t'],
    [3,44,'c'],[12,5,'m'],[14,7,'m'],[11,16,'d'],[13,20,'d'],
    [15,24,'t'],[12,32,'m'],[13,34,'s'],[15,43,'l'],
    [21,5,'d'],[22,8,'d'],[23,11,'k'],[19,18,'m'],
    [21,22,'l'],[23,24,'h'],[20,30,'l'],[21,33,'k'],[22,35,'k'],
    [19,43,'c'],[21,44,'t'],[27,5,'b'],[28,8,'b'],
    [29,15,'d'],[28,23,'v'],[29,30,'k'],[29,43,'t']
  ]);
  props(map,[[6,16,'L'],[12,23,'L'],[18,31,'L'],[27,19,'L'],[27,42,'L']]);
  map[10][10]='N';
  map[26][34]='N';
  return map;
}
export function createLevel(floor=1){
  if(floor===1)return groundFloor();
  if(floor===2)return upperFloor();
  throw new RangeError('QAMAL floor must be 1 or 2');
}
export const DEFAULT_ENTITIES=Object.freeze([
  {id:'arman',floor:1,row:3,col:6,spriteId:ASSET_IDS.prisoner,name:'Арман',role:'mentor'},
  {id:'ruslan',floor:1,row:16,col:7,spriteId:ASSET_IDS.prisoner,name:'Руслан',role:'npc'},
  {id:'daniyar',floor:1,row:5,col:16,spriteId:ASSET_IDS.prisoner,name:'Данияр',role:'technician'},
  {id:'madina',floor:1,row:16,col:9,spriteId:ASSET_IDS.prisoner,name:'Мадина',role:'analyst'},
  {id:'timur',floor:1,row:22,col:19,spriteId:ASSET_IDS.prisoner,name:'Тимур',role:'witness'},
  {id:'guard1',floor:1,row:10,col:21,spriteId:ASSET_IDS.guard,name:'Охранник',role:'guard'},
  {id:'guard2',floor:1,row:5,col:25,spriteId:ASSET_IDS.senior,name:'Старший охранник',role:'guard'},
  {id:'guard3',floor:2,row:12,col:31,spriteId:ASSET_IDS.guard,name:'Охрана второго этажа',role:'guard'},
  {id:'guard4',floor:2,row:19,col:43,spriteId:ASSET_IDS.senior,name:'Инспектор',role:'guard'}
]);
export const ROOM_LABELS=[
  ['БЛОК A / КАМЕРЫ',1,1],['УЧЕБНЫЙ КЛАСС',12,1],
  ['ОХРАНА / CCTV',21,1],['ЦЕНТРАЛЬНЫЙ КОРИДОР',2,9],
  ['БЛОК B',2,15],['АРХИВ',15,15],['ВОСТОЧНОЕ КРЫЛО',31,9],
  ['МАСТЕРСКИЕ',2,21],['СКЛАД',31,19],['ФИНАЛЬНЫЙ СЕКТОР',39,26]
];
export const UPPER_ROOM_LABELS=[
  ['ИЗОЛЯТОР',2,1],['МЕДПУНКТ',14,1],['КОМНАТА КАМЕР',27,1],
  ['СЕРВЕРНАЯ',40,1],['БИБЛИОТЕКА',2,9],['УЧЕБНЫЙ ЗАЛ',14,9],
  ['СТОЛОВАЯ',27,9],['ДИСПЕТЧЕРСКАЯ',40,9],
  ['МАСТЕРСКАЯ',2,18],['ДОСЬЕ И АРХИВ',14,18],
  ['СКЛАД СНАБЖЕНИЯ',27,18],['ПОСТ ОХРАНЫ',40,18],
  ['СПАЛЬНЫЙ БЛОК',2,26],['КАНЦЕЛЯРИЯ',14,26],
  ['ТЕХНИЧЕСКАЯ ЗОНА',27,26],['ДАЛЬНИЙ КОРИДОР',40,26]
];
export function roomLabelsFor(floor=1){return floor===2?UPPER_ROOM_LABELS:ROOM_LABELS;}
export function inBounds(world,row,col){return row>=0&&row<world.length&&col>=0&&col<world[row].length;}
export function isPassable(world,row,col){return inBounds(world,row,col)&&!BLOCKED_TILES.has(world[row][col]);}
export function zoneAt(row,col,floor=1){
  if(floor===2){
    const section=col<13?0:col<27?1:col<40?2:3;
    const rowSection=row<9?0:row<18?1:row<26?2:3;
    return ['ИЗОЛЯТОР','МЕДПУНКТ','КАМЕРЫ','СЕРВЕРНАЯ',
      'БИБЛИОТЕКА','УЧЕБНЫЙ ЗАЛ','СТОЛОВАЯ','ДИСПЕТЧЕРСКАЯ',
      'МАСТЕРСКИЕ','АРХИВ','СКЛАД','ОХРАНА',
      'СПАЛЬНЫЙ БЛОК','КАНЦЕЛЯРИЯ','ТЕХНИЧЕСКИЙ СЕКТОР','КОРИДОР'][rowSection*4+section];
  }
  if(row>=9&&row<=12&&col<=9)return 'КАМЕРА ЕРАСЫЛА';
  if(row>=26&&col>=30)return 'ФИНАЛЬНЫЙ СЕКТОР';
  if(row>=20&&col>=30)return 'ВОСТОЧНЫЙ СКЛАД';
  if(row>=20)return 'МАСТЕРСКИЕ';
  if(col>=30)return 'ВОСТОЧНОЕ КРЫЛО';
  if(row<=7&&col<=10)return 'БЛОК А';
  if(row<=7&&col>=12&&col<=19)return 'УЧЕБНЫЙ КЛАСС';
  if(row<=7&&col>=21)return 'CCTV';
  if(row>=15&&col<=13)return 'БЛОК Б';
  if(row>=15&&col>=15&&col<=22)return 'АРХИВ';
  if(row>=15&&col>=24)return 'СЛУЖЕБНЫЙ ПРОХОД';
  return 'КОРИДОР';
}
