/* QAMAL: PRISON BREAK — Participant #4 frontend, Pixel Art + Bayes + dossier UI.
   Search/CSP/Minimax/DecisionTree are separate participant modules and never silently faked. */
import {ASSET_IDS,COLS,DEFAULT_ENTITIES,FLOORS,STAIR_LINKS,ROWS,TILE_SIZE,VIEW_COLS,VIEW_ROWS,createLevel,zoneAt,isPassable} from './config.js';
import {START_POSITION,DIRECTIONS,computeFieldOfView,attemptMove,nearestInteraction} from './game/player.js';
import {getCameraOffset} from './game/camera.js';
import {DEFAULT_MISSION,objective,canFinish,markMission,OBJECTIVES} from './game/mission.js';
import {createStorage} from './storage/indexedDb.js';
import {loadAssetManifest} from './ui/assetLoader.js';
import {createRenderer} from './ui/gameCanvas.js';
import {createPanels} from './ui/panels.js';
import {createDossierStore} from './surveillance/dossierStore.js';
import {createDossierUI} from './ui/dossierUI.js';
import {createTrainingLabUI} from './ui/trainingLabUI.js';
import {createLiveWorld,restoreLiveWorld,advanceLiveWorld,releaseAfterCheckpoint,guardEntities} from './game/liveWorld.js';
import {changeAlarm} from './game/alarm.js';
import {adjacentDoor,findDoor,doorId,DIFFICULTY_LABEL} from './game/doorChallenges.js';

const $=id=>document.getElementById(id);
const screens=[$('main-menu'),$('settings-screen'),$('game-screen')];
const canvas=$('game-canvas'),mini=$('mini-map');
const assets={images:new Map(),manifest:null};
const renderer=createRenderer(canvas,mini,assets);
const worlds={1:createLevel(1),2:createLevel(2)};
const entitiesByFloor=Object.fromEntries(FLOORS.map(f=>[f,DEFAULT_ENTITIES.filter(e=>(e.floor||1)===f).map(e=>({...e}))]));
let floor=1,world=worlds[1],entities=entitiesByFloor[1];
const storage=createStorage();
const seenByFloor={1:new Set(),2:new Set()},unlockedByFloor={1:new Set(),2:new Set()};
let player={...START_POSITION},seen=seenByFloor[1],visible=new Set(),mission={...DEFAULT_MISSION},alarm=0,route=[];
let unlockedDoors=unlockedByFloor[1];
let cspModule=null,panels=null,live=createLiveWorld(),introSeen=false;
function show(screen){for(const item of screens)item.hidden=item!==screen;}
function message(value){$('game-message').textContent=value;}
function updateVision(){
  visible=computeFieldOfView(world,player.row,player.col);
  for(const tile of visible)seen.add(tile);
}
function render(){
  renderer.frame({world,player,entities,seen,visible,route,alarm,mission,unlockedDoors:[...unlockedDoors],floor});
  $('map-size-label').textContent=`${COLS} × ${ROWS} КЛЕТОК`;
  $('zone-name').textContent=zoneAt(player.row,player.col,floor);
  const indicator=$('floor-indicator');if(indicator)indicator.textContent='ЭТАЖ '+floor+' / 2';
  $('pos-label').textContent=`R:${player.row} C:${player.col} · ${player.steps} ШАГОВ`;
  $('alert-value').textContent=`${alarm} / 100`;
  $('alert-fill').style.width=`${alarm}%`;
  const mode=alarm>=75?'КРИТИЧЕСКАЯ ТРЕВОГА':alarm>=60?'ПОИСК':alarm>=40?'ПОДОЗРЕНИЕ':'ПАТРУЛЬ';
  const guardLabel=$('guard-state');if(guardLabel)guardLabel.textContent=mode;
  const logEl=$('live-events');if(logEl)logEl.textContent=live.events.slice(-2).map(e=>`${e.source}: ${e.description}`).join(' · ') || 'СИСТЕМА: ПАТРУЛИ В ДВИЖЕНИИ';
  $('objective').textContent=objective(mission);
  $('mission-progress').textContent=`${OBJECTIVES.filter(([key])=>mission[key]).length} / ${OBJECTIVES.length}`;
  const hint=$('action-prompt');
  if(hint){
    const stair=stairAtPlayer();
    const door=adjacentDoor(world,player,unlockedDoors);
    const target=nearestInteraction(player,world,entities);
    hint.textContent=stair?'E — '+(floor===1?'ПОДНЯТЬСЯ НА 2 ЭТАЖ':'СПУСТИТЬСЯ НА 1 ЭТАЖ')+' · ЛЕСТНИЦА':
      door?'E — ДВЕРЬ '+DIFFICULTY_LABEL[door.difficulty]+' · РЕШИТЬ ЗАДАНИЕ':
      target?.kind==='npc'?'E — ПОГОВОРИТЬ С '+target.name.toUpperCase():
      target?'E — '+target.name.toUpperCase():
      'WASD — ХОДИТЬ · E — ВЗАИМОДЕЙСТВИЕ · M — КАРТА';
  }
}
async function persist(){
  await storage.set('progress',{
    mapVersion:3,floor,player,mission,alarm,live,introSeen,
    seenByFloor:Object.fromEntries(FLOORS.map(f=>[f,[...seenByFloor[f]]])),
    unlockedByFloor:Object.fromEntries(FLOORS.map(f=>[f,[...unlockedByFloor[f]]])),
    seen:[...seenByFloor[1]],unlockedDoors:[...unlockedByFloor[1]]
  });
}
function mark(key){
  mission=markMission(mission,key);
  if(key==='lockOpen'){worlds[1][11][14]='D';unlockedByFloor[1].add(doorId(11,14));updateVision();message('CSP-замок открыт! Центральная решётка больше не блокирует проход.');}
  else message('Задание выполнено: '+OBJECTIVES.find(x=>x[0]===key)?.[1]);
  render();void persist();
}
function unlockDoor(door){
  unlockedDoors.add(door.id);
  if(!mission.learned)mark('learned');
  message('ДВЕРЬ '+door.id+' ОТКРЫТА! Вернись на карту и пройди дальше.');
  render();void persist();
}
function syncGuards(){
  for(const f of FLOORS){
    for(const guard of guardEntities(live,f)){
      const entity=entitiesByFloor[f].find(e=>e.id===guard.id);
      if(entity)Object.assign(entity,guard);
    }
  }
}
function activateFloor(next,withVision=true){
  floor=next;world=worlds[next];entities=entitiesByFloor[next];
  seen=seenByFloor[next];unlockedDoors=unlockedByFloor[next];
  route=[];if(withVision)updateVision();
}
function stairAtPlayer(){
  const tile=world[player.row]?.[player.col];
  if(tile!=='U'&&tile!=='N')return null;
  return STAIR_LINKS.find(x=>x.row===player.row&&x.col===player.col)||null;
}
function changeFloor(){
  const link=stairAtPlayer();if(!link)return false;
  const next=floor===1?2:1;
  activateFloor(next);
  // Paired staircases have the same coordinates, so the character arrives safely.
  message('ЛЕСТНИЦА: ЭТАЖ '+floor+'. Ты в зоне «'+zoneAt(player.row,player.col,floor)+'». Исследуй новый уровень.');
  render();void persist();return true;
}
function resetAttempt(){
  live=releaseAfterCheckpoint(live);alarm=live.alarm.value;player={...START_POSITION};
  activateFloor(1);syncGuards();route=[];
  message('Тревога достигла предела! Герой вернулся к контрольной точке. Пройденные задания сохранены.');
  render();void persist();
}
function raiseAlarm(value){
  live={...live,alarm:changeAlarm(live.alarm,value)};alarm=live.alarm.value;
  if(alarm>=100){resetAttempt();return;}
  render();void persist();
}
function updateAssets(msg){$('asset-status').textContent=msg;}
function interact(){
  if(stairAtPlayer()){changeFloor();return;}
  const door=adjacentDoor(world,player,unlockedDoors);
  if(door){void panels.open('door',door);return;}
  const target=nearestInteraction(player,world,entities);
  if(!target){message('Подойди к двери или персонажу. Нажми E или кнопку ДЕЙСТВИЕ.');return;}
  if(target.kind==='npc'){void panels.open('npc',target);return;}
  const mapping={classroom:'code',lock:'lock',cctv:'cctv',dossier:'dossiers'};
  if(mapping[target.kind])void panels.open(mapping[target.kind]);
  else message('Нажми E возле отмеченного объекта.');
}
function move(direction){
  const targetRow=player.row+direction[0],targetCol=player.col+direction[1];
  const door=findDoor(world,targetRow,targetCol);
  if(door&&!unlockedDoors.has(door.id)){
    message('Закрытая дверь: '+DIFFICULTY_LABEL[door.difficulty]+'. Реши задание, чтобы пройти.');
    void panels.open('door',door);return;
  }
  const outcome=attemptMove(player,direction,world,entities);
  if(!outcome.moved){message(outcome.reason);return;}
  player=outcome.player;
  updateVision();
  const simulation=advanceLiveWorld(live,player,world,floor);
  live=simulation.state;alarm=live.alarm.value;
  syncGuards();
  if(simulation.caught){resetAttempt();return;}
  if(world[player.row][player.col]==='U'||world[player.row][player.col]==='N'){
    message('Лестница на другой этаж. Нажми E или кнопку ДЕЙСТВИЕ, чтобы перейти.');
  }else if(floor===1&&world[player.row][player.col]==='E'){
    if(canFinish(mission)){mark('finished');panels.open('success');}
    else message('Выход найден! Сначала выполни учебные контрольные точки.');
  }else if(simulation.events.length){message(simulation.events.map(e=>e.description).join(' · ')+' · Тревога '+alarm+'/100');}
  else message(zoneAt(player.row,player.col,floor)+' · этаж '+floor+' · клетка ('+player.row+','+player.col+') · E возле объектов.');
  route=[];render();void persist();
}
async function init(){
  show($('main-menu'));
  const previous=await storage.get('progress',null);
  if(previous){
    const validCells=values=>Array.isArray(values)
      ?values.filter(x=>typeof x==='string'&&/^\d+,\d+$/.test(x)): [];
    const validDoors=values=>Array.isArray(values)
      ?values.filter(x=>typeof x==='string'&&/^\d+:\d+$/.test(x)): [];
    if(previous.mapVersion===3){
      for(const f of FLOORS){
        seenByFloor[f]=new Set(validCells(previous.seenByFloor?.[f]));
        unlockedByFloor[f]=new Set(validDoors(previous.unlockedByFloor?.[f]));
      }
      floor=FLOORS.includes(previous.floor)?previous.floor:1;
    }else if(previous.mapVersion===2){
      seenByFloor[1]=new Set(validCells(previous.seen));
      unlockedByFloor[1]=new Set(validDoors(previous.unlockedDoors));
    }
    activateFloor(floor,false);
    if(Number.isInteger(previous.player?.row)&&Number.isInteger(previous.player?.col)
       &&isPassable(world,previous.player.row,previous.player.col)){
      player={...START_POSITION,...previous.player};
    }
    mission={...DEFAULT_MISSION,...previous.mission};
    alarm=Math.max(0,Math.min(100,Number(previous.alarm)||0));
    live=restoreLiveWorld(previous.live);
    live={...live,alarm:changeAlarm(live.alarm,alarm-live.alarm.value)};
    // Show the new wake-up scene once to players migrating old saves too.
    introSeen=Boolean(previous.introSeen&&previous.mapVersion===3);
    if(mission.lockOpen){
      worlds[1][11][14]='D';
      unlockedByFloor[1].add(doorId(11,14));
    }
  }
  updateVision();
  syncGuards();
  let manifest=null;
  try{const loaded=await loadAssetManifest();manifest=loaded.manifest;
    assets.images=loaded.images;assets.manifest=manifest;
    updateAssets(`PIXEL ART: ${loaded.loaded}/${loaded.total} · ${loaded.errors.length?'Недоступны: '+loaded.errors.join(', '):'все спрайты загружены'}`);
  }catch(error){updateAssets(`Текстуры недоступны: ${error.message}. Используются пиксельные заглушки.`);}
  const dossiersStore=await createDossierStore(storage,manifest);
  const inner=$('dialog-inner');
  const dossierUI=createDossierUI(inner,dossiersStore);
  const labUI=createTrainingLabUI(inner);await labUI.load();
  panels=createPanels($('game-dialog'),{
    dossiers:dossierUI,lab:labUI,
    language:()=>$('language-select').value,mark,raiseAlarm,unlockDoor,
    portraitFor:(person)=>{
      const named=new Set(['erasyl','arman','ruslan','guard','daniyar','madina','timur']);
      if(named.has(person))return './assets/portraits/'+person+'.svg';
      const key='portrait.'+person;
      return './'+(assets.manifest?.sprites?.[key]||'assets/characters/prisoners/prisoner.png');
    },
    seen:()=>seen,dimensions:()=>({rows:ROWS,cols:COLS}),map:()=>world.map((row,r)=>row.map((tile,c)=>tile==='D'&&!unlockedDoors.has(doorId(r,c))?'#':tile)),
    position:()=>({row:player.row,col:player.col}),setRoute:value=>{route=value;render();},
    drawCamera:(target,cam)=>renderer.cameraPreview(target,world,entities,{
      'CAM-01':{row:3,col:25},'CAM-02':{row:11,col:21},'CAM-03':{row:16,col:18},
      'CAM-04':{row:5,col:35},'CAM-05':{row:19,col:44}
    }[cam]),
    drawMap:target=>{
      const context=target.getContext('2d'),cellW=target.width/COLS,cellH=target.height/ROWS;
      context.fillStyle='#08111c';context.fillRect(0,0,target.width,target.height);
      for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(seen.has(`${r},${c}`)){
        context.fillStyle=world[r][c]==='#'?'#617587':world[r][c]==='E'?'#76c69d':'#2d4858';
        context.fillRect(c*cellW,r*cellH,cellW+1,cellH+1);
        if(!visible.has(`${r},${c}`)){
          context.fillStyle='rgba(2,8,16,.65)';
          context.fillRect(c*cellW,r*cellH,cellW+1,cellH+1);
        }
      }
      const viewport=renderer.getViewport();
      const camera=getCameraOffset(player,world,viewport.rows,viewport.cols);
      context.strokeStyle='#d8ad59';context.lineWidth=1;
      context.strokeRect(camera.col*cellW+.5,camera.row*cellH+.5,viewport.cols*cellW,viewport.rows*cellH);
      context.fillStyle='#f2c76e';context.fillRect(player.col*cellW-2,player.row*cellH-2,6,6);
    },
    setPuzzleModule:value=>{cspModule=value;},getPuzzleModule:()=>cspModule
  });
  $('play-btn').addEventListener('click',()=>{
    show($('game-screen'));$('tools-popup').hidden=true;renderer.resize();render();
    message('Этаж '+floor+'. Выходи из камеры, изучай тюрьму и находи лестницы U / N.');
    if(!introSeen){introSeen=true;void panels.open('wake');void persist();}
  });
  $('settings-btn').addEventListener('click',()=>show($('settings-screen')));
  $('back-btn').addEventListener('click',()=>show($('main-menu')));
  $('exit-btn').addEventListener('click',()=>show($('main-menu')));
  $('language-select').addEventListener('change',()=>{void storage.set('language',$('language-select').value);});
  const savedLang=await storage.get('language','python');if(['python','go'].includes(savedLang))$('language-select').value=savedLang;
  $('panel-actions').addEventListener('click',event=>{
    const button=event.target.closest('[data-panel]');
    if(button){$('tools-popup').hidden=true;void panels.open(button.dataset.panel);}
  });
  $('tools-toggle').addEventListener('click',()=>{$('tools-popup').hidden=!$('tools-popup').hidden;});
  $('tools-close').addEventListener('click',()=>{$('tools-popup').hidden=true;});
  $('action-btn').addEventListener('click',()=>{if(!panels.isOpen())interact();});
  $('map-btn').addEventListener('click',()=>{if(!panels.isOpen())void panels.open('map');});
  $('help-btn').addEventListener('click',()=>{if(!panels.isOpen())void panels.open('help');});
  $('fullscreen-btn').addEventListener('click',()=>{
    if(document.fullscreenElement)void document.exitFullscreen?.();
    else void document.documentElement.requestFullscreen?.().catch(()=>{});
  });
  document.querySelectorAll('[data-move]').forEach(button=>button.addEventListener('click',()=>{
    if($('game-screen').hidden||panels.isOpen())return;
    const direction=DIRECTIONS[button.dataset.move];if(direction)move(direction);
  }));
  window.addEventListener('resize',()=>{renderer.resize();render();});
  document.addEventListener('keydown',event=>{
    if($('game-screen').hidden)return;
    if(event.code==='Escape'){if(panels.isOpen()){panels.close();event.preventDefault();}else if(!$('tools-popup').hidden){$('tools-popup').hidden=true;}else{show($('main-menu'));}return;}
    if(panels.isOpen()){
      if(event.code==='KeyE'||event.code==='Enter'){
        if(event.target instanceof HTMLElement&&event.target.closest('input,select,textarea'))return;
        if(panels.advanceNpc?.())event.preventDefault();
      }
      return;
    }
    if(event.target instanceof HTMLElement&&event.target.closest('input,select,textarea'))return;
    if(!$('tools-popup').hidden)return;
    if(event.code==='KeyE'){event.preventDefault();interact();return;}
    if(event.code==='KeyM'){event.preventDefault();void panels.open('map');return;}
    const direction=DIRECTIONS[event.code];if(direction){event.preventDefault();move(direction);}
  });
  render();
  message('Ты проснулся в камере. Ищи двери с заданиями, а на лестнице нажимай E для смены этажа.');
  window.QAMAL_DEBUG={getPosition:()=>({...player}),getMission:()=>({...mission}),getDossierCount:()=>dossiersStore.count(),getAssets:()=>assets.images.size,getWorldState:()=>structuredClone(live),getVisibleCount:()=>visible.size,getExploredCount:()=>seen.size,getUnlockedDoors:()=>[...unlockedDoors],getFloor:()=>floor,getExploredByFloor:()=>Object.fromEntries(FLOORS.map(f=>[f,seenByFloor[f].size])),getTile:(r,c,f=floor)=>worlds[f]?.[r]?.[c],warpTo:(r,c,f=floor)=>{if(!FLOORS.includes(f)||!isPassable(worlds[f],r,c))return false;activateFloor(f);player={...player,row:r,col:c};updateVision();syncGuards();render();return true;}};
}
init().catch(error=>{console.error('[QAMAL]',error);updateAssets('Ошибка инициализации: '+error.message);});
