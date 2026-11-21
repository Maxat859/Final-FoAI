// QAMAL-01: 30 x 20 cells, 32 px each; coordinates are (row, col).
export const TILE_SIZE = 32;
export const ROWS = 20;
export const COLS = 30;
export const ASSET_IDS = Object.freeze({
  floor:'tile.floor.concrete', floorDark:'tile.floor.dark', wall:'tile.wall.concrete',
  door:'tile.door.metal', bars:'tile.door.bars', exit:'tile.door.exit',
  bed:'tile.prop.bed', desk:'tile.prop.desk', terminal:'tile.prop.terminal',
  camera:'tile.prop.camera', player:'character.player.erasyl',
  guard:'character.guard.blue', senior:'character.guard.senior',
  prisoner:'character.prisoner.generic'
});
export const BLOCKED_TILES = new Set(['#','B','b','d','t','c']);
export function createLevel() {
  const map = Array.from({length:ROWS}, (_,r)=>Array.from({length:COLS},(_,c)=>(r===0||c===0||r===ROWS-1||c===COLS-1)?'#':'.'));
  const h=(r,a,b)=>{for(let c=a;c<=b;c++)map[r][c]='#';};
  const v=(c,a,b)=>{for(let r=a;r<=b;r++)map[r][c]='#';};
  v(11,1,8); v(20,1,8); h(8,1,28); v(14,9,18);
  h(14,1,13); h(14,15,28); v(23,15,18);
  for(const [r,c] of [[4,11],[5,20],[8,6],[8,16],[8,25],[14,5],[14,19],[14,26],[17,14],[17,23]])map[r][c]='D';
  map[11][14]='B';
  for(const [r,c,t] of [[3,3,'b'],[3,8,'b'],[3,15,'b'],[16,4,'b'],[4,16,'d'],[16,18,'d'],[3,25,'t'],[11,26,'t'],[1,27,'c'],[9,27,'c'],[16,26,'c'],[17,28,'E']])map[r][c]=t;
  return map;
}
export const DEFAULT_ENTITIES = Object.freeze([
  {id:'arman',row:3,col:6,spriteId:ASSET_IDS.prisoner,name:'Арман',role:'mentor'},
  {id:'ruslan',row:16,col:7,spriteId:ASSET_IDS.prisoner,name:'Руслан',role:'npc'},
  {id:'guard1',row:10,col:21,spriteId:ASSET_IDS.guard,name:'Охранник',role:'guard'},
  {id:'guard2',row:5,col:25,spriteId:ASSET_IDS.senior,name:'Старший охранник',role:'guard'}
]);
export const ROOM_LABELS = [
  ['БЛОК A / КАМЕРЫ',1,1],['УЧЕБНЫЙ КЛАСС',12,1],['ОХРАНА / CCTV',21,1],
  ['ЦЕНТРАЛЬНЫЙ КОРИДОР',2,9],['БЛОК B',2,15],['АРХИВ',15,15],['ВЫХОД',24,15]
];
export function inBounds(world,row,col){return row>=0&&row<world.length&&col>=0&&col<world[row].length;}
export function isPassable(world,row,col){return inBounds(world,row,col)&&!BLOCKED_TILES.has(world[row][col]);}
export function zoneAt(row,col){
  if(row<=7&&col<=10)return 'БЛОК А';
  if(row<=7&&col>=12&&col<=19)return 'УЧЕБНЫЙ КЛАСС';
  if(row<=7&&col>=21)return 'CCTV';
  if(row>=15&&col<=13)return 'БЛОК Б';
  if(row>=15&&col>=15&&col<=22)return 'АРХИВ';
  if(row>=15&&col>=24)return 'ВЫХОД';
  return 'КОРИДОР';
}
