/* QAMAL: PRISON BREAK — Participant #4 frontend, Pixel Art + Bayes + dossier UI.
   Search/CSP/Minimax/DecisionTree are separate participant modules and never silently faked. */
import {ASSET_IDS,COLS,DEFAULT_ENTITIES,ROWS,TILE_SIZE,createLevel,zoneAt} from './config.js';
import {START_POSITION,DIRECTIONS,discover,attemptMove,nearestInteraction} from './game/player.js';
import {DEFAULT_MISSION,objective,canFinish,markMission,OBJECTIVES} from './game/mission.js';
import {createStorage} from './storage/indexedDb.js';
import {createClock,HOUR_MS} from './game/clock.js';
import {updatePrisonLife,routineLabel} from './game/prisonRoutine.js';
import {loadAssetManifest} from './ui/assetLoader.js';
import {createRenderer} from './ui/gameCanvas.js';
import {createPanels} from './ui/panels.js';
import {createDossierStore} from './surveillance/dossierStore.js';
import {createDossierUI} from './ui/dossierUI.js';
import {createTrainingLabUI} from './ui/trainingLabUI.js';

const $=id=>document.getElementById(id);
const screens=[$('main-menu'),$('settings-screen'),$('game-screen')];
const canvas=$('game-canvas'),mini=$('mini-map');
const assets={images:new Map(),manifest:null};
const renderer=createRenderer(canvas,mini,assets);
const world=createLevel(),entities=DEFAULT_ENTITIES.map(e=>({...e}));
const storage=createStorage();
const clock=createClock(6*HOUR_MS);
let lastFrameTime=null;
let patrolAccumulator=0;
let player={...START_POSITION},seen=new Set(),mission={...DEFAULT_MISSION},alarm=0,route=[];
let cspModule=null,panels=null;
function show(screen){for(const item of screens)item.hidden=item!==screen;}
function message(value){$('game-message').textContent=value;}
function render(){
  renderer.frame({world,player,entities,seen,route,nightShade:clock.light});
  $('game-clock').textContent=clock.time;
  $('game-weekday').textContent=`ДЕНЬ ${clock.dayNumber} · ${clock.weekday}`;
  $('day-phase').textContent=clock.phase;
  $('routine-status').textContent=`Заключённые: ${clock.night?'отдых':'режим дня'} · Охрана: ${clock.night?'ночная смена':'дневная смена'}`;
  $('map-size-label').textContent=`${COLS} × ${ROWS} КЛЕТОК`;
  $('zone-name').textContent=zoneAt(player.row,player.col);
  $('pos-label').textContent=`R:${player.row} C:${player.col} · ${player.steps} ШАГОВ`;
  $('alert-value').textContent=`${alarm} / 100`;
  $('alert-fill').style.width=`${alarm}%`;
  $('objective').textContent=objective(mission);
  $('mission-progress').textContent=`${OBJECTIVES.filter(([key])=>mission[key]).length} / ${OBJECTIVES.length}`;
}
async function persist(){await storage.set('progress',{player,seen:[...seen],mission,alarm,elapsedMs:clock.elapsedMs});}
function mark(key){mission=markMission(mission,key);message('Задание выполнено: '+OBJECTIVES.find(x=>x[0]===key)?.[1]);render();void persist();}
function raiseAlarm(value){alarm=Math.min(100,alarm+value);render();void persist();}
function updateAssets(msg){$('asset-status').textContent=msg;}
function interact(){
  const target=nearestInteraction(player,world,entities);
  if(!target){message('Рядом нет объекта. Исследуй карту или используй меню справа.');return;}
  if(target.kind==='npc'){message(`${target.name}: ${routineLabel(target)}. `+(target.role==='mentor'?'Арман: «Начни с учебных задач, потом планируй путь».':'Следует расписанию тюрьмы.'));return;}
  const mapping={classroom:'code',lock:'lock',cctv:'cctv',dossier:'dossiers'};
  panels.open(mapping[target.kind]);
}
function move(direction){const outcome=attemptMove(player,direction,world,entities);
  if(!outcome.moved){message(outcome.reason);return;}
  player=outcome.player;
  discover(world,seen,player.row,player.col,3);
  if(world[player.row][player.col]==='E'){
    if(canFinish(mission)){mark('finished');panels.open('success');}
    else message('Выход найден! Сначала выполни учебные контрольные точки.');
  }else message(`${zoneAt(player.row,player.col)} · клетка (${player.row},${player.col}) · нажми E рядом с объектом.`);
  route=[];render();void persist();
}
async function init(){
  show($('main-menu'));
  const previous=await storage.get('progress',null);
  if(previous){
    if(Number.isInteger(previous.player?.row)&&Number.isInteger(previous.player?.col))player={...START_POSITION,...previous.player};
    if(Array.isArray(previous.seen))seen=new Set(previous.seen.filter(x=>typeof x==='string'));
    mission={...DEFAULT_MISSION,...previous.mission};
    alarm=Math.max(0,Math.min(100,Number(previous.alarm)||0));
    if(Number.isFinite(previous.elapsedMs))clock.setElapsed(previous.elapsedMs);
  }
  discover(world,seen,player.row,player.col,3);
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
    language:()=>$('language-select').value,mark,raiseAlarm,
    seen:()=>seen,dimensions:()=>({rows:ROWS,cols:COLS}),map:()=>world,
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
      }
      context.fillStyle='#f2c76e';context.fillRect(player.col*cellW-2,player.row*cellH-2,6,6);
    },
    setPuzzleModule:value=>{cspModule=value;},getPuzzleModule:()=>cspModule
  });
  $('play-btn').addEventListener('click',()=>{show($('game-screen'));render();message('Глава 1: используй WASD, E, M. Быстрые задания доступны справа.');});
  $('settings-btn').addEventListener('click',()=>show($('settings-screen')));
  $('back-btn').addEventListener('click',()=>show($('main-menu')));
  $('exit-btn').addEventListener('click',()=>show($('main-menu')));
  $('language-select').addEventListener('change',()=>{void storage.set('language',$('language-select').value);});
  const savedLang=await storage.get('language','python');if(['python','go'].includes(savedLang))$('language-select').value=savedLang;
  $('panel-actions').addEventListener('click',event=>{
    const button=event.target.closest('[data-panel]');if(button)void panels.open(button.dataset.panel);
  });
  document.addEventListener('keydown',event=>{
    if($('game-screen').hidden)return;
    if(event.code==='Escape'){if(panels.isOpen()){panels.close();event.preventDefault();}else{show($('main-menu'));}return;}
    if(event.target instanceof HTMLElement&&event.target.closest('input,select,textarea,button'))return;
    if(panels.isOpen())return;
    if(event.code==='KeyE'){event.preventDefault();interact();return;}
    if(event.code==='KeyM'){event.preventDefault();void panels.open('map');return;}
    const direction=DIRECTIONS[event.code];if(direction){event.preventDefault();move(direction);}
  });
  // Active-play clock: game time stops while the menu or a learning dialog is open.
  setInterval(()=>{
    const now=performance.now();
    const delta=lastFrameTime===null?0:Math.min(1000,now-lastFrameTime);
    lastFrameTime=now;
    if(!$('game-screen').hidden && !panels?.isOpen()){
      clock.advance(delta);
      patrolAccumulator+=delta;
      if(patrolAccumulator>=(clock.night?2200:3200)){
        updatePrisonLife(entities,world,player,clock);
        patrolAccumulator=0;
      }
      render();
    }
  },250);
  setInterval(()=>{if(!$('game-screen').hidden)void persist();},10000);
  render();
  message('Карта готова: исследуй тюрьму и открой задания через правую панель.');
  window.QAMAL_DEBUG={getNpcStates:()=>entities.map(e=>({id:e.id,row:e.row,col:e.col,state:e.aiState})),getClock:()=>({day:clock.dayNumber,weekday:clock.weekday,time:clock.time}),getPosition:()=>({...player}),getMission:()=>({...mission}),getDossierCount:()=>dossiersStore.count(),getAssets:()=>assets.images.size};
}
init().catch(error=>{console.error('[QAMAL]',error);updateAssets('Ошибка инициализации: '+error.message);});
