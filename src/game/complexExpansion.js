/**
 * QAMAL / PRISON EXPANSION
 * Fictional, playable 104×72 pixel prison complex built around the existing
 * 48×32 Chapter 1. All old story triggers, NPCs and teaching rooms are intact.
 *
 * Layout:
 *  - North-west: original cells, classroom, CCTV, archive, two staircases.
 *  - North-east: extra cell blocks, visiting, hospital, security, services.
 *  - South-west: workshops, laundry, library, dining and administration.
 *  - South-east: a 44×23 fenced yard, exercise yard and a final service gate.
 */
export const WORLD_COLS=104;
export const WORLD_ROWS=72;
export const LEGACY_COLS=48;
export const LEGACY_ROWS=32;
export const LAST_EXIT=Object.freeze({row:68,col:100});
export const EXTRA_STAIRS=Object.freeze([
  {id:'east-service',row:12,col:61,from:1,to:2},
  {id:'south-wing',row:49,col:35,from:1,to:2},
  {id:'yard-gallery',row:61,col:84,from:1,to:2}
]);

// Type is also the default educational interaction for each space.
const east1=[
 ['БЛОК C / КАМЕРЫ','cell'],['БЛОК D / КАМЕРЫ','cell'],['ПОСТ ОХРАНЫ C','security'],['ЦЕНТР СВЯЗИ','server'],
 ['КОМНАТА СВИДАНИЙ','visiting'],['ПРИЁМНАЯ','office'],['ОБЩАЯ СТОЛОВАЯ','canteen'],['ПИЩЕБЛОК','kitchen'],
 ['МЕДПУНКТ','medical'],['ПРАКТИКА GO','study'],['СКЛАД ИНСТРУМЕНТОВ','storage'],['ЭНЕРГОУЗЕЛ','engineering']
];
const east2=[
 ['ИЗОЛЯТОР C','cell'],['СПАЛЬНЫЙ БЛОК','cell'],['НАБЛЮДАТЕЛЬНЫЙ ПОСТ','security'],['ОПЕРАТОРНАЯ','surveillance'],
 ['КЛАСС PYTHON','study'],['КОМНАТА КУРАТОРА','office'],['АРХИВ ДОСЬЕ','archive'],['СЕРВЕРНАЯ II','server'],
 ['ПЕРЕВЯЗОЧНАЯ','medical'],['КОМНАТА ОТДЫХА','recreation'],['ТЕХНИЧЕСКИЙ СКЛАД','storage'],['ЩИТОВАЯ','engineering']
];
const south1=[
 ['ЛАБОРАТОРИЯ AI','study'],['МЕХАНИЧЕСКАЯ МАСТЕРСКАЯ','workshop'],['ПРАЧЕЧНАЯ','laundry'],['СУШИЛКА','laundry'],
 ['КОМНАТА ОТДЫХА','recreation'],['ОФИС ПЕРСОНАЛА','office'],['СКЛАД УБОРКИ','storage'],['СТОЛЯРНАЯ МАСТЕРСКАЯ','workshop'],
 ['ЧИТАЛЬНЫЙ ЗАЛ','library'],['КОМНАТА ДАННЫХ','server'],['САНИТАРНЫЙ БЛОК','wash'],['ДЕЖУРНАЯ ЧАСТЬ','security']
];
const south2=[
 ['БИБЛИОТЕКА II','library'],['ЗАЛ САМОПОДГОТОВКИ','study'],['КОМНАТА ПРЕПОДАВАТЕЛЕЙ','office'],['КОМНАТА АРМАНА','library'],
 ['ИНФОРМАЦИОННЫЙ АРХИВ','archive'],['СТУДИЯ ЗАДАНИЙ','study'],['ТРЕНАЖЁРНЫЙ ЗАЛ','recreation'],['МЕДИЦИНСКИЙ СКЛАД','medical'],
 ['КОМНАТА ПСИХОЛОГА','visiting'],['СЕТЕВОЙ ЦЕНТР','server'],['ДИСПЕТЧЕРСКАЯ','surveillance'],['ОТДЕЛ ДОКУМЕНТОВ','archive']
];
const edge1=[
 ['ИНВЕНТАРНЫЙ СКЛАД','storage'],['ГАРАЖ СЛУЖБЫ','engineering'],['ПРОПУСКНОЙ ПУНКТ','security']
];
const edge2=[
 ['РЕМОНТНАЯ БРИГАДА','workshop'],['ИНЖЕНЕРНАЯ КОМНАТА','engineering'],['ПОСТ НАРУЖНОГО КОНТРОЛЯ','surveillance']
];

function specification(floor){
  const list=[];
  const east=floor===1?east1:east2;
  for(let i=0;i<east.length;i++){
    list.push({id:'E'+floor+'-'+(i+1),floor,name:east[i][0],type:east[i][1],
      row:2+Math.floor(i/4)*12,col:50+(i%4)*14,width:10,height:9});
  }
  const south=floor===1?south1:south2;
  for(let i=0;i<south.length;i++){
    const rr=Math.floor(i/4),cc=i%4;
    list.push({id:'S'+floor+'-'+(i+1),floor,name:south[i][0],type:south[i][1],
      row:[39,52,64][rr],col:2+cc*14,width:12,height:rr===2?6:9});
  }
  for(let i=0;i<3;i++){
    const entry=(floor===1?edge1:edge2)[i];
    list.push({id:'P'+floor+'-'+(i+1),floor,name:entry[0],type:entry[1],
      row:64,col:58+i*14,width:12,height:6});
  }
  // On floor 2 this is a roof-level exercise/gallery instead of ground yard.
  list.push({id:'YARD-'+floor,floor,name:floor===1?'ПРОГУЛОЧНЫЙ ДВОР':'КРЫША / ПРОГУЛОЧНАЯ ГАЛЕРЕЯ',
    type:'yard',row:38,col:58,width:44,height:23});
  return list;
}
export const EXPANSION_ROOMS=Object.freeze([...specification(1),...specification(2)]);
const BLOCKING=new Set(['#','K','G','B','b','d','t','c','q','s','l','h','m','v','k','w','r','j','o','g','F','X']);

function wall(map,r,c,kind='K'){if(map[r]?.[c]!==undefined)map[r][c]=kind;}
function H(map,r,a,b,t='#'){for(let c=a;c<=b;c++)wall(map,r,c,t);}
function V(map,c,a,b,t='#'){for(let r=a;r<=b;r++)wall(map,r,c,t);}
function furniture(map,r,c,t){
  if(map[r]?.[c]==='.')map[r][c]=t;
}
const styles={
  cell:['b','b','q','s','l'],
  office:['d','t','l','m','L'],
  security:['t','c','l','d','L'],
  surveillance:['c','t','t','d','v'],
  server:['t','t','p','v','c'],
  archive:['r','r','l','d','k'],
  library:['r','r','d','m','L'],
  study:['d','d','t','r','L'],
  workshop:['d','k','p','l','v'],
  engineering:['p','v','t','k','l'],
  storage:['k','k','l','k','v'],
  medical:['b','s','q','t','L'],
  visiting:['m','m','d','L','l'],
  canteen:['m','m','m','s','L'],
  kitchen:['m','k','s','p','h'],
  laundry:['h','s','k','p','l'],
  wash:['h','h','q','s','L'],
  recreation:['j','m','l','j','L']
};

function buildRoom(map,room,index){
  const {row:r,col:c,width:w,height:h,type}=room;
  const isCell=type==='cell';
  // A real room is enclosed by reinforced walls, with a visible metal gate.
  H(map,r,c,c+w-1,'K');H(map,r+h-1,c,c+w-1,isCell?'G':'K');
  V(map,c,r,r+h-1,'K');V(map,c+w-1,r,r+h-1,'K');
  // Some rooms have two doorways; all are connected to the corridor network.
  const center=c+Math.floor(w/2);
  wall(map,r+h-1,center,'D');
  if(index%3===0)wall(map,r,center,'D');
  if(isCell){
    H(map,r+2,c+2,c+w-3,'G');
    wall(map,r+2,c+Math.floor(w/2),'.');
  }
  const items=styles[type]||styles.office;
  const spots=[
    [r+2,c+2],[r+2,c+w-3],
    [r+h-3,c+2],[r+h-3,c+w-3],
    [r+Math.floor(h/2),c+3]
  ];
  spots.forEach(([rr,cc],i)=>furniture(map,rr,cc,items[i]));
  if(type==='cell')furniture(map,r+1,c+w-4,'w');
  if(type==='library'||type==='archive'){
    furniture(map,r+2,c+4,'r');
    furniture(map,r+2,c+6,'r');
  }
  if(type==='canteen'){
    furniture(map,r+Math.floor(h/2),c+6,'m');
    furniture(map,r+Math.floor(h/2),c+8,'m');
  }
}

function buildYard(map,room,floor){
  const {row:r,col:c,width:w,height:h}=room;
  for(let y=r+1;y<r+h-1;y++)for(let x=c+1;x<c+w-1;x++)map[y][x]='Y';
  for(let y=r+6;y<=r+16;y++)
    for(let x=c+13;x<=c+34;x++)map[y][x]='Z';
  H(map,r,c,c+w-1,'F');H(map,r+h-1,c,c+w-1,'F');
  V(map,c,r,r+h-1,'F');V(map,c+w-1,r,r+h-1,'F');
  // Fenced exercise ground with two guarded entrances and a west walkway.
  wall(map,r,c+8,'D');
  wall(map,r+h-1,c+20,'D');
  wall(map,r+10,c,'D');
  // Draw a playing court, benches, planters and sports equipment.
  for(const [rr,cc,t] of [
    [r+2,c+3,'j'],[r+2,c+39,'j'],[r+19,c+4,'j'],
    [r+18,c+39,'j'],[r+3,c+18,'o'],[r+19,c+18,'o'],
    [r+3,c+30,'g'],[r+19,c+30,'g'],
    [r+2,c+40,'X'],[r+20,c+40,'X']
  ])map[rr][cc]=t;
  if(floor===2){
    // Roof gallery, marked by perimeter lights; still playable.
    map[r+4][c+7]='L';map[r+18][c+7]='L';
  }
}

function connectOriginalWorld(map){
  // Enclose the preserved old chapter and create realistic gated connections.
  V(map,47,1,31,'K');
  H(map,31,1,47,'K');
  for(const r of [12,23])wall(map,r,47,'D');
  for(const c of [7,20,34])wall(map,31,c,'D');
}

export function expandComplex(map,floor){
  if(floor!==1&&floor!==2)throw new RangeError('Unknown prison floor');
  if(map.length!==WORLD_ROWS||map[0]?.length!==WORLD_COLS)
    throw new Error('Wrong world dimensions for expansion');
  connectOriginalWorld(map);
  const rooms=EXPANSION_ROOMS.filter(x=>x.floor===floor);
  rooms.forEach((room,i)=>room.type==='yard'
    ?buildYard(map,room,floor):buildRoom(map,room,i));

  // Gated entrances link original east wing to north-eastern corridors.
  // South passages link the old cell blocks to workshops and the yard.
  // Corridor tiles remain unblocked, including the crossings.
  for(const [r,c] of [[12,48],[23,48],[32,7],[32,20],[32,34],
    [12,61],[49,35],[61,84]]){
    if(map[r]?.[c]==='K'||map[r]?.[c]==='F')map[r][c]='.';
  }
  for(const [r,c] of [[12,61],[49,35],[61,84]]){
    map[r][c]=floor===1?'U':'N';
  }
  // The old green exit becomes a security terminal; the real finale is far
  // beyond the yard, at the end of the service lane in the southern extension.
  if(floor===1){map[29][45]='t';map[LAST_EXIT.row][LAST_EXIT.col]='E';}
  return map;
}

export function expansionRoomAt(row,col,floor=1){
  return EXPANSION_ROOMS.find(x=>x.floor===floor&&row>=x.row&&
    row<x.row+x.height&&col>=x.col&&col<x.col+x.width)||null;
}
export function expansionLabels(floor){
  return EXPANSION_ROOMS.filter(x=>x.floor===floor).map(x=>[
    x.name,x.col+2,x.row+1
  ]);
}

const interactions={
  cell:null,office:'dossiers',security:'cctv',surveillance:'cctv',
  server:'bayes',archive:'dossiers',library:'library',study:'classroom',
  workshop:'code',engineering:'planner',storage:'code',medical:null,
  visiting:null,canteen:null,kitchen:null,laundry:null,wash:null,
  recreation:'tactical',yard:'tactical'
};
export function expansionInteractions(floor){
  return EXPANSION_ROOMS.filter(x=>x.floor===floor).map(room=>{
    let row,col;
    if(room.type==='yard'){row=room.row+11;col=room.col+21;}
    else{row=room.row+room.height-2;col=room.col+Math.floor(room.width/2);}
    return {id:room.id,row,col,floor,kind:interactions[room.type]||'room',
      name:room.name,description:roomDescription(room)};
  });
}
export function roomDescription(room){
  const text={
    cell:'Жилой блок с койками, санитарным уголком и решётчатыми проходами.',
    office:'Рабочее место сотрудников с документами и внутренним терминалом.',
    security:'Пост охраны с мониторами, металлическими дверями и сигнализацией.',
    surveillance:'Операторская виртуальных камер. Здесь можно проверить записи.',
    server:'Вычислительный блок: учебный анализ сигналов и вероятностей.',
    archive:'Архив досье и электронных записей заключённых.',
    library:'Книги по Python и Go, самостоятельные уроки и журнал ошибок.',
    study:'Учебный класс с терминалами и практическими задачами на код.',
    workshop:'Технические занятия: упражнения, инструменты и ремонт оборудования.',
    engineering:'Инженерная комната с трубами, щитками и планами переходов.',
    storage:'Складской сектор с ящиками и регистрационным терминалом.',
    medical:'Помещение с койками и медицинским оборудованием.',
    visiting:'Комната встреч с перегородками, столами и журналом посещений.',
    canteen:'Общая столовая с рядами столов.',
    kitchen:'Кухонный блок с мойкой, припасами и оборудованием.',
    laundry:'Прачечная: стеллажи, мойки, сушильное оборудование.',
    wash:'Санитарный блок с душевыми и умывальниками.',
    recreation:'Пространство отдыха и учебных тактических мини-игр.',
    yard:'Огороженная прогулочная зона с местами отдыха и спортивной площадкой.'
  };
  return text[room.type]||'Дополнительное помещение комплекса QAMAL.';
}

export function nearestExpansionInteraction(player,floor=1){
  return expansionInteractions(floor).find(item=>
    Math.abs(item.row-player.row)+Math.abs(item.col-player.col)<=1)||null;
}
export {BLOCKING as EXPANSION_BLOCKED};
