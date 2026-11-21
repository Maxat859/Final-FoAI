// QAMAL-01: large 48 × 32 world, 32 px tiles, scrolling camera.
// Coordinates throughout the project are (row, col).
export const TILE_SIZE = 32;
export const ROWS = 32;
export const COLS = 48;
export const VIEW_ROWS = 15;
export const VIEW_COLS = 23;
export const EXIT_POSITION = Object.freeze({row:29,col:45});

export const ASSET_IDS = Object.freeze({
  floor:'tile.floor.concrete', floorDark:'tile.floor.dark', wall:'tile.wall.concrete',
  door:'tile.door.metal', bars:'tile.door.bars', exit:'tile.door.exit',
  bed:'tile.prop.bed', desk:'tile.prop.desk', terminal:'tile.prop.terminal',
  camera:'tile.prop.camera', player:'character.player.erasyl',
  guard:'character.guard.blue', senior:'character.guard.senior',
  prisoner:'character.prisoner.generic'
});
export const BLOCKED_TILES = new Set(['#','B','b','d','t','c']);

// Preserve the original chapter rooms and quests; extend the complex to
// two new wings, so existing checkpoint positions still work.
export function createLevel(){
  const map=Array.from({length:ROWS},(_,r)=>
    Array.from({length:COLS},(_,c)=>(r===0||c===0||r===ROWS-1||c===COLS-1)?'#':'.')
  );
  const h=(r,a,b)=>{for(let c=a;c<=b;c++)map[r][c]='#';};
  const v=(c,a,b)=>{for(let r=a;r<=b;r++)map[r][c]='#';};

  // Original sectors: cells, classroom, security room and archive.
  v(11,1,8);v(20,1,8);h(8,1,28);v(14,9,18);
  h(14,1,13);h(14,15,28);v(23,15,18);
  for(const [r,c] of [
    [4,11],[5,20],[8,6],[8,16],[8,25],
    [14,5],[14,19],[14,26],[17,14],[17,23]
  ])map[r][c]='D';
  map[11][14]='B'; // CSP puzzle opens this original gate.
  for(const [r,c,t] of [
    [3,3,'b'],[3,8,'b'],[3,15,'b'],[16,4,'b'],
    [4,16,'d'],[16,18,'d'],[3,25,'t'],[11,26,'t'],
    [1,27,'c'],[9,27,'c'],[16,26,'c']
  ])map[r][c]=t;

  // Separate the old building from the new eastern and southern wings.
  v(29,1,19);h(19,1,29);
  for(const [r,c] of [[10,29],[17,29],[19,7],[19,23]])map[r][c]='D';

  // East wing: observation halls, storage and final approach.
  h(8,30,46);h(17,30,46);h(25,30,46);
  v(38,1,8);v(38,9,16);v(38,18,24);v(38,26,30);
  for(const [r,c] of [
    [8,35],[8,43],[17,34],[17,42],[25,32],[25,45],
    [5,38],[12,38],[20,38],[28,38]
  ])map[r][c]='D';

  // South wing: workshops, archive annex and service corridors.
  v(13,20,30);v(27,20,30);
  h(25,1,29);h(29,1,27);
  for(const [r,c] of [
    [23,13],[26,27],[25,6],[25,18],[25,25],[29,9],[29,22]
  ])map[r][c]='D';

  // Props in the new, accessible rooms.
  for(const [r,c,t] of [
    [3,34,'b'],[4,43,'t'],[12,34,'c'],[14,43,'b'],
    [20,33,'d'],[22,42,'t'],[27,34,'b'],[28,44,'c'],
    [23,6,'b'],[28,19,'d']
  ])map[r][c]=t;
  map[EXIT_POSITION.row][EXIT_POSITION.col]='E';
  return map;
}

export const DEFAULT_ENTITIES=Object.freeze([
  {id:'arman',row:3,col:6,spriteId:ASSET_IDS.prisoner,name:'Арман',role:'mentor'},
  {id:'ruslan',row:16,col:7,spriteId:ASSET_IDS.prisoner,name:'Руслан',role:'npc'},
  {id:'guard1',row:10,col:21,spriteId:ASSET_IDS.guard,name:'Охранник',role:'guard'},
  {id:'guard2',row:5,col:25,spriteId:ASSET_IDS.senior,name:'Старший охранник',role:'guard'}
]);

export const ROOM_LABELS=[
  ['БЛОК A / КАМЕРЫ',1,1],['УЧЕБНЫЙ КЛАСС',12,1],
  ['ОХРАНА / CCTV',21,1],['ЦЕНТРАЛЬНЫЙ КОРИДОР',2,9],
  ['БЛОК B',2,15],['АРХИВ',15,15],
  ['ВОСТОЧНОЕ КРЫЛО',31,9],['МАСТЕРСКИЕ',2,21],
  ['СКЛАД',31,19],['ФИНАЛЬНЫЙ СЕКТОР',39,26]
];
export function inBounds(world,row,col){
  return row>=0&&row<world.length&&col>=0&&col<world[row].length;
}
export function isPassable(world,row,col){
  return inBounds(world,row,col)&&!BLOCKED_TILES.has(world[row][col]);
}
export function zoneAt(row,col){
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
