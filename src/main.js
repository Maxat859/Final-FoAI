/* QAMAL: PRISON BREAK — Participant #4 frontend, Pixel Art + Bayes + dossier UI.
   Search/CSP/Minimax/DecisionTree are separate participant modules and never silently faked. */
import {ASSET_IDS,BLOCKED_TILES,COLS,DEFAULT_ENTITIES,FLOORS,STAIR_LINKS,ROWS,TILE_SIZE,VIEW_COLS,VIEW_ROWS,createLevel,zoneAt,isPassable} from './config.js';
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
import {createLiveWorld,restoreLiveWorld,advanceLiveWorld,releaseAfterCheckpoint,guardEntities,dogEntities,securitySummary} from './game/liveWorld.js';
import {formatPrisonClock,makePrisonClock,getRoutine} from './game/prisonSchedule.js';
import {changeAlarm} from './game/alarm.js';
import {adjacentDoor,findDoor,doorId,DIFFICULTY_LABEL} from './game/doorChallenges.js';
import {makeEscortPath,GUARD_APPROACH,CLASSROOM_DESK} from './game/escort.js';
import {validateProgress} from './education/curriculum.js';
import {createSoundEngine,sanitizeAudioSettings} from './audio/soundEngine.js';
import {facingFromStep} from './ui/characterSprite.js';
import {CELL_BED,CLASS_START,nightPhase,cellsLocked,nearBunk,createNightWorld,
  nightGateAt,createResidentRoster,updateResidents,nightlyAnnouncement,
  nextMorningClock} from './game/nightRoutine.js';

const $=id=>document.getElementById(id);
const screens=[$('main-menu'),$('settings-screen'),$('game-screen')];
const canvas=$('game-canvas'),mini=$('mini-map');
const assets={images:new Map(),manifest:null};
const renderer=createRenderer(canvas,mini,assets);
const audio=createSoundEngine();
const worlds={1:createLevel(1),2:createLevel(2)};
const entitiesByFloor=Object.fromEntries(FLOORS.map(f=>[f,DEFAULT_ENTITIES.filter(e=>(e.floor||1)===f).map(e=>({...e}))]));
let floor=1,world=worlds[1],entities=entitiesByFloor[1];
const storage=createStorage();
const seenByFloor={1:new Set(),2:new Set()},unlockedByFloor={1:new Set(),2:new Set()};
let player={...START_POSITION},seen=seenByFloor[1],visible=new Set(),mission={...DEFAULT_MISSION},alarm=0,route=[];
let unlockedDoors=unlockedByFloor[1];
let cspModule=null,panels=null,live=createLiveWorld(),introSeen=false;
let storyStage='wake',escorting=false,learningProgress=validateProgress(null),mistakeJournal=[];
let moveAnimationToken=0;
let patrolTimer=null;
let residents=createResidentRoster(worlds,DEFAULT_ENTITIES);
function show(screen){
  for(const item of screens)item.hidden=item!==screen;
  if(screen===$('main-menu')||screen===$('settings-screen'))audio.stopAmbient();
}
function updateAudioControls(){
  const settings=audio.getSettings();
  const soundButton=$('sound-toggle');
  if(soundButton){
    soundButton.textContent=settings.enabled?'🔊':'🔇';
    soundButton.title=settings.enabled?'Выключить звуки':'Включить звуки';
    soundButton.setAttribute('aria-label',soundButton.title);
    soundButton.setAttribute('aria-pressed',String(settings.enabled));
  }
  $('audio-enabled').checked=settings.enabled;
  $('audio-volume').value=String(Math.round(settings.volume*100));
  $('audio-volume-value').textContent=String(Math.round(settings.volume*100))+'%';
  $('audio-volume').disabled=!settings.enabled;
  $('audio-voice').checked=settings.voice;
  $('audio-voice').disabled=!settings.enabled;
  $('audio-info').textContent=audio.getState().available
    ?'Звуки запускаются после нажатия «Начать игру». Озвучка зависит от голосов в браузере.'
    :'Этот браузер не поддерживает Web Audio. Игра продолжит работать без звуков.';
}
function configureAudio(next){
  audio.setSettings(next);updateAudioControls();
  void storage.set('audioSettings',audio.getSettings());
}
function message(value){$('game-message').textContent=value;}
function visibleWorld(){return createNightWorld(world,floor,live.clock);}
function syncResidents(){
  for(const p of residents){
    const list=entitiesByFloor[p.floor],current=list.find(x=>x.id===p.id);
    const payload={...p,spriteId:ASSET_IDS.prisoner};
    if(current)Object.assign(current,payload);
    else list.push(payload);
  }
}
function updateVision(){
  visible=computeFieldOfView(visibleWorld(),player.row,player.col);
  for(const tile of visible)seen.add(tile);
}
function render(){
  const currentWorld=visibleWorld();
  renderer.frame({world:currentWorld,player,entities,seen,visible,route,alarm,mission,unlockedDoors:[...unlockedDoors],floor,clock:live.clock});
  const now=formatPrisonClock(live.clock);
  const clockDisplay=$('prison-clock');if(clockDisplay)clockDisplay.textContent=now.time;
  const scheduleDisplay=$('prison-routine');if(scheduleDisplay)scheduleDisplay.textContent=now.name;
  $('game-screen').dataset.timeOfDay=now.phase;
  const phase=nightPhase(live.clock);
  $('game-screen').dataset.prisonPhase=phase;
  const routineStatus=$('night-status');
  if(routineStatus)routineStatus.textContent=phase==='sleep'?'СОН / НОЧНОЕ ДЕЖУРСТВО':
    phase==='rollcall'?'ВЕЧЕРНЯЯ ПЕРЕКЛИЧКА':
    phase==='return'?'ЖИЛЫЕ БЛОКИ ЗАКРЫТЫ':
    phase==='wake'?'УТРЕННИЙ ПОДЪЁМ':'СВОБОДНЫЕ ЗАНЯТИЯ';
  $('map-size-label').textContent=`${COLS} × ${ROWS} КЛЕТОК`;
  $('zone-name').textContent=zoneAt(player.row,player.col,floor);
  const indicator=$('floor-indicator');if(indicator)indicator.textContent='ЭТАЖ '+floor+' / 2';
  $('pos-label').textContent=`R:${player.row} C:${player.col} · ${player.steps} ШАГОВ`;
  $('alert-value').textContent=`${alarm} / 100`;
  $('alert-fill').style.width=`${alarm}%`;
  const mode=alarm>=75?'КРИТИЧЕСКАЯ ТРЕВОГА':alarm>=60?'ПОИСК':alarm>=40?'ПОДОЗРЕНИЕ':'ПАТРУЛЬ';
  const guardLabel=$('guard-state');if(guardLabel)guardLabel.textContent=mode;
  const guards=securitySummary(live,floor);
  const staff=$('staff-count');if(staff)staff.textContent='ПАТРУЛЬ '+guards.moving+' / ПОСТ '+guards.posts+' · СОБАКИ '+guards.dogs;
  const logEl=$('live-events');if(logEl)logEl.textContent=live.events.slice(-2).map(e=>`${e.source}: ${e.description}`).join(' · ') || 'СИСТЕМА: ПАТРУЛИ В ДВИЖЕНИИ';
  $('objective').textContent=storyStage==='wake'?'Проснуться в камере':
    storyStage==='guard'?'Поговорить с охранником':
    storyStage==='escort'?'Следовать за охранником до учебного класса':
    storyStage==='classroom'?'Пройти первый урок '+$('language-select').value.toUpperCase():objective(mission);
  $('mission-progress').textContent=`${OBJECTIVES.filter(([key])=>mission[key]).length} / ${OBJECTIVES.length}`;
  const hint=$('action-prompt');
  if(hint){
    const stair=stairAtPlayer();
    const door=adjacentDoor(currentWorld,player,unlockedDoors);
    const target=nearestInteraction(player,currentWorld,entities,floor);
    const bed=nearBunk(world,player)&&cellsLocked(live.clock);
    hint.textContent=escorting?'ОХРАННИК ПРОВОДИТ В КЛАСС · СЮЖЕТНЫЙ ЭПИЗОД':
      storyStage==='guard'?'E — ПОГОВОРИТЬ С ОХРАННИКОМ':
      bed?'E — ЛЕЧЬ СПАТЬ ДО УТРА · Z — СОН':
      target?.sleeping?'ТИХО: '+target.name.toUpperCase()+' СПИТ':
      target?.kind==='library'?'E — ЗАЙТИ В БИБЛИОТЕКУ · УЧИТЬСЯ':
      stair?'E — '+(floor===1?'ПОДНЯТЬСЯ НА 2 ЭТАЖ':'СПУСТИТЬСЯ НА 1 ЭТАЖ')+' · ЛЕСТНИЦА':
      door?'E — ДВЕРЬ '+DIFFICULTY_LABEL[door.difficulty]+' · РЕШИТЬ ЗАДАНИЕ':
      target?.kind==='dog'?'E — СЛУЖЕБНАЯ СОБАКА '+target.name.toUpperCase():
      target?.kind==='npc'?'E — ПОГОВОРИТЬ С '+target.name.toUpperCase():
      target?'E — '+target.name.toUpperCase():
      'WASD — ХОДИТЬ · E — ВЗАИМОДЕЙСТВИЕ · M — КАРТА';
  }
}
async function persist(){
  await storage.set('progress',{
    mapVersion:5,floor,player,mission,alarm,live,introSeen,storyStage,learningProgress,mistakeJournal,
    seenByFloor:Object.fromEntries(FLOORS.map(f=>[f,[...seenByFloor[f]]])),
    unlockedByFloor:Object.fromEntries(FLOORS.map(f=>[f,[...unlockedByFloor[f]]])),
    seen:[...seenByFloor[1]],unlockedDoors:[...unlockedByFloor[1]]
  });
}
function mark(key){
  mission=markMission(mission,key);
  if(key==='lockOpen'){worlds[1][11][14]='D';unlockedByFloor[1].add(doorId(11,14));updateVision();message('CSP-замок открыт! Центральная решётка больше не блокирует проход.');}
  else message('Задание выполнено: '+OBJECTIVES.find(x=>x[0]===key)?.[1]);
  audio.play(key==='finished'?'complete':'success');
  render();void persist();
}
function unlockDoor(door){
  unlockedDoors.add(door.id);
  audio.play('door');audio.play('success');
  if(!mission.learned)mark('learned');
  message('ДВЕРЬ '+door.id+' ОТКРЫТА! Вернись на карту и пройди дальше.');
  render();void persist();
}
function syncGuards(){
  for(const f of FLOORS){
    const list=entitiesByFloor[f],mapped=new Map(list.map(e=>[e.id,e]));
    for(const unit of [...guardEntities(live,f),...dogEntities(live,f)]){
      const entity=mapped.get(unit.id);
      if(entity)Object.assign(entity,unit);
      else{
        const created={...unit,floor:f,
          spriteId:unit.role==='police'||unit.role==='guard'?ASSET_IDS.guard:ASSET_IDS.prisoner};
        list.push(created);mapped.set(unit.id,created);
      }
    }
  }
}
function showRollCallInspector(show=true){
  for(const f of FLOORS){
    const list=entitiesByFloor[f],id='rollcall-inspector-'+f;
    const pos=list.findIndex(e=>e.id===id);
    if(!show&&pos>=0){list.splice(pos,1);continue;}
    if(show){
      const inspecting=nightPhase(live.clock)==='rollcall';
      const stops=f===1?
        [{row:8,col:6},{row:7,col:6},{row:7,col:5},{row:7,col:6}]:
        [{row:4,col:6},{row:4,col:7},{row:4,col:8},{row:4,col:7}];
      const point=stops[inspecting?live.tick%stops.length:0];
      if(pos>=0){
        const officer=list[pos];
        officer.facing=facingFromStep(officer,point,officer.facing);
        officer.moving=inspecting&&(officer.row!==point.row||officer.col!==point.col);
        officer.walkFrame=(officer.walkFrame||0)+(officer.moving?1:0);
        officer.row=point.row;officer.col=point.col;
      }else{
        list.push({id,floor:f,...point,role:'escort',spriteId:ASSET_IDS.guard,
          name:'Дежурный на перекличке',mode:'patrol',facing:'down'});
      }
    }
  }
}
function returnHeroToCell(){
  activateFloor(1,false);
  player={...player,row:CELL_BED.row,col:CELL_BED.col,facing:'down',moving:false};
  route=[];updateVision();
  audio.play('bars');
  message('20:00 — ВОЗВРАЩЕНИЕ В КАМЕРЫ. Решётки закрыты до 06:00.');
}
function handleNightChange(oldClock){
  residents=updateResidents(residents,live.clock,worlds);
  syncResidents();
  if(['rollcall','return'].includes(nightPhase(live.clock)))showRollCallInspector(true);
  const event=nightlyAnnouncement(oldClock,live.clock);
  if(!event)return;
  if(event.type==='rollcall'){
    showRollCallInspector(true);
    audio.play('guard');message(event.message);
    if(panels&&storyStage==='free')void panels.open('night-rollcall');
  }else if(event.type==='return'){
    showRollCallInspector(true);returnHeroToCell();
    if(panels&&['free','classroom'].includes(storyStage))void panels.open('night-return');
  }else if(event.type==='lightsout'){
    showRollCallInspector(false);
    audio.play('bars');
    message('22:00 — ОТБОЙ. Подойди к койке и нажми E, чтобы перейти к утру.');
    if(panels)void panels.open('night-lightsout');
  }else if(event.type==='morning'){
    showRollCallInspector(false);
    audio.play('wake');
    updateVision();
    message('06:00 — ПОДЪЁМ. Решётки открыты. Сотрудник зовёт на занятия.');
    if(panels)void panels.open('morning-wakeup',{day:live.clock.day});
  }else{
    message(event.message);
  }
  updateVision();
  render();void persist();
}
async function sleepToMorning(){
  if(!cellsLocked(live.clock))return;
  if(!nearBunk(world,player)){
    if(floor!==1||Math.abs(player.row-CELL_BED.row)>2||
       Math.abs(player.col-CELL_BED.col)>4){
      message('Подойди к своей кровати и нажми E, чтобы отдохнуть.');return;
    }
    player={...player,row:CELL_BED.row,col:CELL_BED.col};
  }
  const previous=live.clock;
  live={...live,clock:nextMorningClock(previous)};
  residents=updateResidents(residents,live.clock,worlds,{steps:1});
  syncResidents();showRollCallInspector(false);
  player={...player,moving:false,facing:'down'};
  audio.play('wake');updateVision();
  message('НОВЫЙ ДЕНЬ — '+formatPrisonClock(live.clock).time+
    '. Открываются жилые блоки, охранник зовёт на занятия.');
  render();await persist();void panels.open('morning-wakeup',{day:live.clock.day});
}
async function escortToMorningClass(){
  if(escorting)return;
  escorting=true;
  showRollCallInspector(false);
  activateFloor(1);
  const guard={id:'morning-guide',floor:1,row:9,col:6,spriteId:ASSET_IDS.guard,
    name:'Утренний дежурный',role:'escort',facing:'down',walkFrame:0,moving:true};
  entitiesByFloor[1].push(guard);
  try{
    // Same A* used by the original story escort, now repeated for morning classes.
    const path=makeEscortPath(world,{row:player.row,col:player.col},CLASS_START).path;
    for(let i=1;i<path.length;i++){
      const current=path[i],ahead=path[Math.min(i+1,path.length-1)];
      guard.facing=facingFromStep(guard,ahead,guard.facing);
      guard.row=ahead.row;guard.col=ahead.col;guard.walkFrame++;
      player={...player,row:current.row,col:current.col,
        facing:facingFromStep(player,current,player.facing),
        moving:true,walkFrame:(player.walkFrame??0)+1,steps:player.steps+1};
      updateVision();render();await sleep(90);
    }
  }catch(error){
    console.warn('[QAMAL morning escort]',error);
    player={...player,row:CLASS_START.row,col:CLASS_START.col};
    updateVision();
  }finally{
    const list=entitiesByFloor[1],i=list.findIndex(e=>e.id==='morning-guide');
    if(i>=0)list.splice(i,1);
    escorting=false;player={...player,moving:false};render();
    message('УТРЕННИЕ ЗАНЯТИЯ. Выбери урок '+$('language-select').value.toUpperCase()+'.');
    audio.play('lesson');await persist();
    void panels.open('classroom');
  }
}

/** Security simulation runs independently of the player's keyboard. */
function startPrisonSimulation(){
  if(patrolTimer!==null)return;
  patrolTimer=window.setInterval(()=>{
    if($('game-screen').hidden||document.hidden||!panels||panels.isOpen()||
       escorting||!['free','classroom'].includes(storyStage)||mission.finished)return;
    const was=getRoutine(live.clock).name;
    const beforeClock=live.clock;
    const result=advanceLiveWorld(live,player,world,floor);
    live=result.state;alarm=live.alarm.value;
    handleNightChange(beforeClock);
    syncGuards();
    if(result.caught){resetAttempt();return;}
    if(panels.isOpen()){render();void persist();return;}
    const now=getRoutine(live.clock).name;
    if(now!==was)message('РАСПИСАНИЕ: '+now+'. Время '+formatPrisonClock(live.clock).time);
    if(live.tick%14===0&&live.dogs?.some(d=>d.floor===floor&&
      Math.abs(d.x-player.col)+Math.abs(d.y-player.row)<=5))audio.play('dog');
    render();
    if(live.tick%12===0)void persist();
  },900);
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
  audio.play('stairs');
  message('ЛЕСТНИЦА: ЭТАЖ '+floor+'. Ты в зоне «'+zoneAt(player.row,player.col,floor)+'». Исследуй новый уровень.');
  render();void persist();return true;
}
function resetAttempt(){
  live=releaseAfterCheckpoint(live);alarm=live.alarm.value;player={...START_POSITION};
  activateFloor(1);syncGuards();route=[];
  audio.play('alarm');
  message('Тревога достигла предела! Герой вернулся к контрольной точке. Пройденные задания сохранены.');
  render();void persist();
}
function raiseAlarm(value){
  const previous=alarm;
  live={...live,alarm:changeAlarm(live.alarm,value)};alarm=live.alarm.value;
  if(previous<40&&alarm>=40)audio.play('alarm');
  if(alarm>=100){resetAttempt();return;}
  render();void persist();
}
function updateAssets(msg){$('asset-status').textContent=msg;}
function interact(){
  if(escorting)return;
  audio.play('click');
  if(nearBunk(world,player)&&cellsLocked(live.clock)){void panels.open('sleep-bunk');return;}
  if(storyStage==='guard'){void panels.open('guard-arrival');return;}
  if(stairAtPlayer()){changeFloor();return;}
  const nightMap=visibleWorld();
  const adjacentLock=[[1,0],[-1,0],[0,1],[0,-1]].some(([dr,dc])=>
    nightGateAt(floor,player.row+dr,player.col+dc)&&cellsLocked(live.clock));
  if(adjacentLock){audio.play('bars');message('НОЧНАЯ ПРОВЕРКА: камера закрыта до утреннего подъёма.');return;}
  const door=adjacentDoor(nightMap,player,unlockedDoors);
  if(door){audio.play('bars');void panels.open('door',door);return;}
  const target=nearestInteraction(player,nightMap,entities,floor);
  if(!target){message('Подойди к двери или персонажу. Нажми E или кнопку ДЕЙСТВИЕ.');return;}
  if(target.sleeping){message(target.name+' сейчас спит. Поговорите утром.');return;}
  if(target.kind==='dog'){audio.play('dog');message('Служебная собака '+target.name+' ждёт рядом с полицейским.');return;}
  if(target.kind==='npc'){void panels.open('npc',target);return;}
  const mapping={classroom:'classroom',library:'library',lock:'lock',cctv:'cctv',
    dossier:'dossiers',dossiers:'dossiers',code:'code',bayes:'bayes',
    tactical:'tactical',planner:'planner'};
  if(mapping[target.kind])void panels.open(mapping[target.kind]);
  else if(target.kind==='room')void panels.open('room-info',target);
  else message('Нажми E возле отмеченного объекта.');
}
function move(direction){
  if(escorting)return;
  // Turning also works when walking into a wall or a locked gate.
  const facing=direction[2]||player.facing;
  if(player.facing!==facing){player={...player,facing};render();}
  const targetRow=player.row+direction[0],targetCol=player.col+direction[1];
  const nightMap=visibleWorld();
  if(cellsLocked(live.clock)&&nightGateAt(floor,targetRow,targetCol)){
    audio.play('bars');message('КАМЕРА ЗАКРЫТА НА НОЧЬ. Дверь откроют утром.');return;
  }
  const door=findDoor(nightMap,targetRow,targetCol);
  if(door&&!unlockedDoors.has(door.id)){
    audio.play('bars');
    message('Закрытая дверь: '+DIFFICULTY_LABEL[door.difficulty]+'. Реши задание, чтобы пройти.');
    void panels.open('door',door);return;
  }
  const outcome=attemptMove(player,direction,nightMap,entities);
  if(!outcome.moved){audio.play('blocked');message(outcome.reason);render();return;}
  player={...outcome.player,moving:true,walkFrame:((player.walkFrame??0)+1)%2};
  audio.play('step');
  const token=++moveAnimationToken;
  window.setTimeout(()=>{
    if(token===moveAnimationToken){player={...player,moving:false};render();}
  },145);
  updateVision();
  const beforeClock=live.clock;
  const simulation=advanceLiveWorld(live,player,world,floor);
  live=simulation.state;alarm=live.alarm.value;
  handleNightChange(beforeClock);
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
function escortGuardEntity(){
  return entitiesByFloor[1].find(e=>e.id==='escort-story');
}
function ensureEscortGuard(){
  let e=escortGuardEntity();
  if(!e){
    e={id:'escort-story',floor:1,row:8,col:6,spriteId:ASSET_IDS.guard,name:'Дежурный охранник',role:'escort'};
    entitiesByFloor[1].push(e);
  }
  return e;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function guardArrives(){
  if(storyStage!=='wake')return;
  storyStage='guard';escorting=true;
  activateFloor(1);
  const guard=ensureEscortGuard();
  unlockedByFloor[1].add(doorId(8,6));
  message('Звенят ключи. Охранник открывает решётку и подходит к твоей камере...');
  render();
  audio.play('bars');
  for(const p of GUARD_APPROACH){
    guard.facing=facingFromStep(guard,p,guard.facing);
    guard.row=p.row;guard.col=p.col;
    guard.walkFrame=(guard.walkFrame??0)+1;guard.moving=true;
    audio.play('step');render();await sleep(220);
  }
  guard.moving=false;audio.play('guard');
  escorting=false;
  await persist();
  await panels.open('guard-arrival');
}
async function beginEscort(){
  if(storyStage!=='guard')return;
  storyStage='escort';escorting=true;
  const guard=ensureEscortGuard();
  try{
    const passage=makeEscortPath(world,{row:player.row,col:player.col},CLASSROOM_DESK);
    for(let i=1;i<passage.path.length;i++){
      const point=passage.path[i],ahead=passage.path[Math.min(i+1,passage.path.length-1)];
      if(world[point.row][point.col]==='D')unlockedDoors.add(doorId(point.row,point.col));
      if(world[ahead.row][ahead.col]==='D')unlockedDoors.add(doorId(ahead.row,ahead.col));
      const previousGuard={row:guard.row,col:guard.col};
      guard.facing=facingFromStep(previousGuard,ahead,guard.facing);
      guard.row=ahead.row;guard.col=ahead.col;
      guard.walkFrame=(guard.walkFrame??0)+1;guard.moving=true;
      const nextFacing=facingFromStep(player,point,player.facing);
      player={...player,row:point.row,col:point.col,
        facing:nextFacing,moving:true,walkFrame:((player.walkFrame??0)+1)%2,
        steps:player.steps+1};
      audio.play('step');
      if(world[point.row][point.col]==='D')audio.play('door');
      updateVision();
      route=passage.path.slice(i,Math.min(i+4,passage.path.length));
      if(i===4)message('Охранник открыл дверь служебным пропуском. Двигайся к учебному классу.');
      render();
      await sleep(165);
    }
    message('Ты в учебном классе. Начни с основ '+$('language-select').value.toUpperCase()+'.');
  }catch(error){
    console.error('[QAMAL escort]',error);
    // Safe recovery: always arrive at the real classroom even if path data changes.
    player={...player,row:CLASSROOM_DESK.row,col:CLASSROOM_DESK.col};
    updateVision();
    message('Сопровождение завершено. Приступай к уроку.');
  }finally{
    const guardIndex=entitiesByFloor[1].findIndex(e=>e.id==='escort-story');
    if(guardIndex>=0)entitiesByFloor[1].splice(guardIndex,1);
    storyStage='classroom';escorting=false;route=[];player={...player,moving:false};render();
    audio.play('lesson');
    await persist();await panels.open('classroom');
  }
}
function onLessonCompleted(language,index){
  if(!learningProgress[language].includes(index)){
    learningProgress[language].push(index);
    learningProgress[language].sort((a,b)=>a-b);
  }
  if(storyStage==='classroom')storyStage='free';
  if(!mission.learned)mark('learned');
  render();void persist();
}
function recordMistake(mistake){
  const safe={language:mistake.language,topic:String(mistake.topic||'Задача').slice(0,140),
    location:String(mistake.location||'Практика').slice(0,80),
    answer:String(mistake.answer||'').slice(0,400),
    expected:String(mistake.expected||'').slice(0,200),
    explanation:String(mistake.explanation||'').slice(0,700),
    codeSnippet:String(mistake.codeSnippet||'').slice(0,1100),
    steps:Array.isArray(mistake.steps)?mistake.steps.slice(0,6).map(x=>String(x).slice(0,300)):[]};
  mistakeJournal.push(safe);
  if(mistakeJournal.length>45)mistakeJournal.shift();
  void persist();
}

async function init(){
  show($('main-menu'));
  const previous=await storage.get('progress',null);
  if(previous){
    const validCells=values=>Array.isArray(values)
      ?values.filter(x=>typeof x==='string'&&/^\d+,\d+$/.test(x)): [];
    const validDoors=values=>Array.isArray(values)
      ?values.filter(x=>typeof x==='string'&&/^\d+:\d+$/.test(x)): [];
    if([3,4,5].includes(previous.mapVersion)){
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
    introSeen=Boolean(previous.introSeen&&[3,4,5].includes(previous.mapVersion));
    learningProgress=validateProgress(previous.learningProgress);
    mistakeJournal=Array.isArray(previous.mistakeJournal)?previous.mistakeJournal.slice(-45):[];
    const stored=previous.storyStage;
    storyStage=stored==='free'||stored==='classroom'?stored:(typeof stored==='string'?'wake':(introSeen?'free':'wake'));
    if(storyStage==='classroom'&&floor!==1){
      activateFloor(1,false);
      player={...START_POSITION,row:CLASSROOM_DESK.row,col:CLASSROOM_DESK.col};
    }
    if(mission.lockOpen){
      worlds[1][11][14]='D';
      unlockedByFloor[1].add(doorId(11,14));
    }
  }
  if(cellsLocked(live.clock)&&storyStage==='free'){
    // Old saves are still playable: if loaded outside the cell during
    // lockdown, bring the hero back to the night dormitory.
    if(floor!==1||Math.abs(player.row-CELL_BED.row)>2||Math.abs(player.col-CELL_BED.col)>3)
      returnHeroToCell();
  }
  residents=updateResidents(residents,live.clock,worlds);
  syncResidents();
  if(nightPhase(live.clock)==='rollcall'||nightPhase(live.clock)==='return')
    showRollCallInspector(true);
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
    language:()=>$('language-select').value,
    setLanguage:value=>{if(value==='python'||value==='go'){$('language-select').value=value;void storage.set('language',value);render();}},
    getProgress:()=>learningProgress,getMistakes:()=>mistakeJournal,
    onLessonComplete:onLessonCompleted,recordMistake,
    onWake:()=>{void guardArrives();},onEscortStart:()=>{void beginEscort();},
    onSleepUntilMorning:()=>{void sleepToMorning();},
    onMorningClass:()=>{void escortToMorningClass();},
    playSound:event=>audio.play(event),speak:text=>audio.speak(text),stopVoice:()=>audio.cancelSpeech(),
    soundState:()=>audio.getState(),
    mark,raiseAlarm,unlockDoor,
    portraitFor:(person)=>{
      const named=new Set(['erasyl','arman','ruslan','guard','daniyar','madina','timur']);
      if(named.has(person))return './assets/portraits/'+person+'.svg';
      const key='portrait.'+person;
      return './'+(assets.manifest?.sprites?.[key]||'assets/characters/prisoners/prisoner.png');
    },
    seen:()=>seen,dimensions:()=>({rows:ROWS,cols:COLS}),map:()=>world.map((row,r)=>row.map((tile,c)=>BLOCKED_TILES.has(tile)||(tile==='D'&&!unlockedDoors.has(doorId(r,c)))?'#':tile)),
    position:()=>({row:player.row,col:player.col}),setRoute:value=>{route=value;render();},
    drawCamera:(target,cam)=>renderer.cameraPreview(target,world,entities,{
      'CAM-01':{row:3,col:25},'CAM-02':{row:11,col:21},'CAM-03':{row:16,col:18},
      'CAM-04':{row:5,col:35},'CAM-05':{row:19,col:44},
      'CAM-06':{row:10,col:66},'CAM-07':{row:22,col:92},
      'CAM-08':{row:47,col:20},'CAM-09':{row:38,col:94},
      'CAM-10':{row:10,col:66},'CAM-11':{row:22,col:92},
      'CAM-12':{row:47,col:20},'CAM-13':{row:38,col:94}
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
    void audio.unlock().then(ok=>{if(ok)audio.play(storyStage==='wake'?'wake':'click');});
    show($('game-screen'));$('tools-popup').hidden=true;renderer.resize();render();
    message('Этаж '+floor+'. Основы языков доступны в классе, библиотеке и у Армана.');
    if(storyStage==='wake'){
      introSeen=true;void panels.open('wake');void persist();
    }else if(storyStage==='classroom'){
      void panels.open('classroom');
    }
  });
  $('new-game-btn').addEventListener('click',async()=>{
    if(!window.confirm('Начать новую игру? Пройденные уроки, открытые двери и журнал ошибок будут сброшены. Язык обучения сохранится.'))return;
    await storage.set('progress',null);
    window.location.reload();
  });
  $('settings-btn').addEventListener('click',()=>{audio.play('click');show($('settings-screen'));});
  $('audio-enabled').addEventListener('change',event=>{
    configureAudio({enabled:event.target.checked});
    if(event.target.checked)void audio.unlock().then(ok=>{if(ok)audio.play('click');});
  });
  $('audio-volume').addEventListener('input',event=>{
    configureAudio({volume:Number(event.target.value)/100});
  });
  $('audio-voice').addEventListener('change',event=>{
    configureAudio({voice:event.target.checked});
  });
  $('sound-toggle').addEventListener('click',()=>{
    const next=!audio.getSettings().enabled;
    configureAudio({enabled:next});
    if(next)void audio.unlock().then(ok=>{if(ok)audio.play('click');});
  });
  $('back-btn').addEventListener('click',()=>show($('main-menu')));
  $('exit-btn').addEventListener('click',()=>show($('main-menu')));
  $('language-select').addEventListener('change',()=>{void storage.set('language',$('language-select').value);});
  const savedLang=await storage.get('language','python');if(['python','go'].includes(savedLang))$('language-select').value=savedLang;
  audio.setSettings(sanitizeAudioSettings(await storage.get('audioSettings',null)));
  updateAudioControls();
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
  startPrisonSimulation();
  message('Ты проснулся в камере. Ищи двери с заданиями, а на лестнице нажимай E для смены этажа.');
  window.QAMAL_DEBUG={getPosition:()=>({...player}),getMission:()=>({...mission}),getDossierCount:()=>dossiersStore.count(),getAssets:()=>assets.images.size,getWorldState:()=>structuredClone(live),getVisibleCount:()=>visible.size,getExploredCount:()=>seen.size,getUnlockedDoors:()=>[...unlockedDoors],getStoryStage:()=>storyStage,getLearningProgress:()=>structuredClone(learningProgress),getMistakeCount:()=>mistakeJournal.length,getAudioState:()=>audio.getState(),getNightPhase:()=>nightPhase(live.clock),getResidents:()=>structuredClone(residents),getFloor:()=>floor,getStaff:()=>securitySummary(live,floor),getPrisonTime:()=>formatPrisonClock(live.clock),setPrisonTime:minutes=>{live={...live,clock:makePrisonClock({minutes,day:live.clock?.day})};residents=updateResidents(residents,live.clock,worlds);syncResidents();updateVision();render();},getExploredByFloor:()=>Object.fromEntries(FLOORS.map(f=>[f,seenByFloor[f].size])),getTile:(r,c,f=floor)=>(f===floor?visibleWorld():createNightWorld(worlds[f],f,live.clock))?.[r]?.[c],warpTo:(r,c,f=floor)=>{if(!FLOORS.includes(f)||!isPassable(worlds[f],r,c))return false;activateFloor(f);player={...player,row:r,col:c};updateVision();syncGuards();render();return true;}};
}
init().catch(error=>{console.error('[QAMAL]',error);updateAssets('Ошибка инициализации: '+error.message);});
