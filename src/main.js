/* QAMAL: PRISON BREAK — Participant #4 frontend, Pixel Art + Bayes + dossier UI.
   Search/CSP/Minimax/DecisionTree are separate participant modules and never silently faked. */
import {ASSET_IDS,COLS,DEFAULT_ENTITIES,ROWS,TILE_SIZE,VIEW_COLS,VIEW_ROWS,createLevel,zoneAt,isPassable} from './config.js';
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
const world=createLevel(),entities=DEFAULT_ENTITIES.map(e=>({...e}));
const storage=createStorage();
let player={...START_POSITION},seen=new Set(),visible=new Set(),mission={...DEFAULT_MISSION},alarm=0,route=[];
let cspModule=null,panels=null,live=createLiveWorld(),introSeen=false,unlockedDoors=new Set();
function show(screen){for(const item of screens)item.hidden=item!==screen;}
function message(value){$('game-message').textContent=value;}
function updateVision(){
  visible=computeFieldOfView(world,player.row,player.col);
  for(const tile of visible)seen.add(tile);
}
function render(){
  renderer.frame({world,player,entities,seen,visible,route,alarm,mission,unlockedDoors:[...unlockedDoors]});
  $('map-size-label').textContent=`${COLS} × ${ROWS} КЛЕТОК`;
  $('zone-name').textContent=zoneAt(player.row,player.col);
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
    const door=adjacentDoor(world,player,unlockedDoors);
    const target=nearestInteraction(player,world,entities);
    hint.textContent=door?'E — ДВЕРЬ '+DIFFICULTY_LABEL[door.difficulty]+' · РЕШИТЬ ЗАДАНИЕ':
      target?.kind==='npc'?'E — ПОГОВОРИТЬ С '+target.name.toUpperCase():
      target?'E — '+target.name.toUpperCase():
      'WASD — ХОДИТЬ · E — ВЗАИМОДЕЙСТВИЕ · M — КАРТА';
  }
}
async function persist(){await storage.set('progress',{mapVersion:2,player,seen:[...seen],mission,alarm,live,introSeen,unlockedDoors:[...unlockedDoors]});}
function mark(key){
  mission=markMission(mission,key);
  if(key==='lockOpen'){world[11][14]='D';unlockedDoors.add(doorId(11,14));updateVision();message('CSP-замок открыт! Центральная решётка больше не блокирует проход.');}
  else message('Задание выполнено: '+OBJECTIVES.find(x=>x[0]===key)?.[1]);
  render();void persist();
}
function unlockDoor(door){
  unlockedDoors.add(door.id);
  if(!mission.learned)mark('learned');
  message('ДВЕРЬ '+door.id+' ОТКРЫТА! Вернись на карту и пройди дальше.');
  render();void persist();
}
function syncGuards(){for(const guard of guardEntities(live)){const entity=entities.find(e=>e.id===guard.id);if(entity)Object.assign(entity,guard);}}
function resetAttempt(){
  live=releaseAfterCheckpoint(live);alarm=live.alarm.value;player={...START_POSITION};
  updateVision();syncGuards();route=[];
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
  const simulation=advanceLiveWorld(live,player,world);
  live=simulation.state;alarm=live.alarm.value;
  syncGuards();
  if(simulation.caught){resetAttempt();return;}
  if(world[player.row][player.col]==='E'){
    if(canFinish(mission)){mark('finished');panels.open('success');}
    else message('Выход найден! Сначала выполни учебные контрольные точки.');
  }else if(simulation.events.length){message(simulation.events.map(e=>e.description).join(' · ')+' · Тревога '+alarm+'/100');}
  else message(zoneAt(player.row,player.col)+' · клетка ('+player.row+','+player.col+') · нажми E рядом с объектом.');
  route=[];render();void persist();
}
async function init(){
  show($('main-menu'));
  const previous=await storage.get('progress',null);
  if(previous){
    if(Number.isInteger(previous.player?.row)&&Number.isInteger(previous.player?.col)
       &&isPassable(world,previous.player.row,previous.player.col)){
      player={...START_POSITION,...previous.player};
    }
    // Old saves used a small map and a different discovery algorithm.
    // Start the new world with genuine line-of-sight, not its obsolete explored cells.
    if(previous.mapVersion===2 && Array.isArray(previous.seen))
      seen=new Set(previous.seen.filter(x=>typeof x==='string'&&/^\d+,\d+$/.test(x)));
    mission={...DEFAULT_MISSION,...previous.mission};
    if(Array.isArray(previous.unlockedDoors))unlockedDoors=new Set(previous.unlockedDoors.filter(x=>/^\d+:\d+$/.test(x)));
    alarm=Math.max(0,Math.min(100,Number(previous.alarm)||0));
    live=restoreLiveWorld(previous.live);
    live={...live,alarm:changeAlarm(live.alarm,alarm-live.alarm.value)};
    introSeen=Boolean(previous.introSeen);
    if(mission.lockOpen){world[11][14]='D';unlockedDoors.add(doorId(11,14));}
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
      'CAM-01':{row:3,col:25},'CAM-02':{row:11,col:21},'CAM-03':{row:16,col:18}
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
    message('Глава 1: QAMAL-01. Исследуй помещения, поговори с Арманом, пройди контрольные точки.');
    if(!introSeen){introSeen=true;void panels.open('intro');void persist();}
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
    if(event.target instanceof HTMLElement&&event.target.closest('input,select,textarea,button'))return;
    if(!$('tools-popup').hidden)return;
    if(event.code==='KeyE'){event.preventDefault();interact();return;}
    if(event.code==='KeyM'){event.preventDefault();void panels.open('map');return;}
    const direction=DIRECTIONS[event.code];if(direction){event.preventDefault();move(direction);}
  });
  render();
  message('Подходи к дверям со звёздами: 1 — лёгкая, 2 — средняя, 3 — сложная. E — открыть задание.');
  window.QAMAL_DEBUG={getPosition:()=>({...player}),getMission:()=>({...mission}),getDossierCount:()=>dossiersStore.count(),getAssets:()=>assets.images.size,getWorldState:()=>structuredClone(live),getVisibleCount:()=>visible.size,getExploredCount:()=>seen.size,getUnlockedDoors:()=>[...unlockedDoors]};
}
init().catch(error=>{console.error('[QAMAL]',error);updateAssets('Ошибка инициализации: '+error.message);});
