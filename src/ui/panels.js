import {bayesianUpdate,formatProbability} from '../algorithms/bayes.js';
import {createEncounter,chooseEncounterAction,applyEncounterMove,ENCOUNTER_ACTIONS} from '../game/tacticalEncounter.js';
const codeBank={
  python:[{q:'Что выводит print(len("QAMAL"))?',options:['4','5','6','Ошибка'],correct:1,why:'len() возвращает количество символов — 5.'},{q:'Что делает range(3)?',options:['0, 1, 2','1, 2, 3','0, 1, 2, 3','Ошибка'],correct:0,why:'Верхняя граница range не включается.'}],
  go:[{q:'Что напечатает fmt.Println(2 + 3)?',options:['23','5','Ошибка','0'],correct:1,why:'Складываются два целых числа.'},{q:'Чему равна длина []int{1,2,3}?',options:['2','3','4','0'],correct:1,why:'len() возвращает 3 элемента.'}]
};
const esc=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function createPanels(dialog,handlers){
  const inner=dialog.querySelector('#dialog-inner');
  let active=null;
  let codeIndex=0, currentQuestion=null;
  let encounter=null,encounterSummary='';
  function shell(title,content,tag='QAMAL / INTERACTIVE'){return `<div class="panel-top"><div><div class="section-kicker">${tag}</div><h2>${title}</h2></div><button class="icon-btn" data-close aria-label="Закрыть">✕</button></div>${content}`;}
  function close(){dialog.hidden=true;active=null;}
  async function open(name){active=name;dialog.hidden=false;inner.scrollTop=0;
    if(name==='intro')inner.innerHTML=shell('ГЛАВА 01 — ДЕЛО ЕРАСЫЛА',`<div class="chapter-intro"><div class="scene-number">01 / QAMAL</div><h3>Истина скрыта в системе.</h3><p>Ерасыл оказался в вымышленном комплексе QAMAL-01 после обвинения в утечке данных. В его электронном досье обнаружились противоречия.</p><p>Поговори с Арманом, изучи классы и виртуальные камеры, реши логический замок и найди путь к выходу.</p><p class="panel-note">Охранники двигаются после твоих ходов. Слишком высокая тревога возвращает героя к началу, но выполненные задания сохраняются.</p><button data-close>НАЧАТЬ ГЛАВУ →</button></div>`,'STORY / CHAPTER 01');
    if(name==='help')inner.innerHTML=shell('КАК ИГРАТЬ',`<p>Твой персонаж — Ерасыл. Камера следует за тобой, а комнаты открываются только в пределах обзора. Уже исследованные участки остаются затемнёнными на карте. WASD / стрелки: перемещение; <kbd>E</kbd> — взаимодействие рядом с объектом; <kbd>M</kbd> — карта; <kbd>Esc</kbd> — закрыть окно.</p><p class="panel-note">Быстрые кнопки справа открывают учебные демо-окна без необходимости искать комнату.</p>`);
    if(name==='code')await drawCode();
    if(name==='bayes')drawBayes();
    if(name==='map')drawMap();
    if(name==='planner')drawPlanner();
    if(name==='lock')await drawLock();
    if(name==='cctv')drawCCTV();
    if(name==='dossiers')handlers.dossiers.render();
    if(name==='lab')handlers.lab.render();
    if(name==='tactical'){encounter=createEncounter({guardPosition:0,playerPosition:5,maxTurns:10});encounterSummary='В этой мини-игре настоящий Minimax выбирает решение охранника.';drawTactical();}
    if(name==='success')inner.innerHTML=shell('МИССИЯ ВЫПОЛНЕНА',`<div class="result-hero">✦ QAMAL-01 ПРOЙДЕН ✦</div><p>Ты прошёл учебный этап, логический замок, CCTV и Bayesian Inference. Это учебный MVP; новые главы появятся позже.</p><button data-close>ВЕРНУТЬСЯ В ИГРУ</button>`,'MISSION / COMPLETE');
    dialog.querySelector('[data-close]')?.focus();
  }
  async function drawCode(){
    const lang=handlers.language();
    try{
      const response=await fetch('./data/questions-'+lang+'.json');
      if(!response.ok)throw new Error('HTTP '+response.status);
      const data=await response.json();
      const questions=Array.isArray(data)?data:data.questions;
      if(!Array.isArray(questions)||questions.length===0)throw new Error('Нет заданий');
      const q=questions[codeIndex%questions.length];
      currentQuestion=q;
      const control=q.choices
        ? '<div class="option-list">'+Object.entries(q.choices).map(([key,value])=>
            '<label><input type="radio" name="code-answer" value="'+esc(key)+'"> '+esc(key)+') '+esc(value)+'</label>').join('')+'</div>'
        : '<label>Напиши ответ<input id="code-free-answer" type="text" autocomplete="off" placeholder="Ответ"></label>';
      const snippet=q.codeSnippet?'<pre class="panel-note">'+esc(q.codeSnippet)+'</pre>':'';
      inner.innerHTML=shell('КОДОВОЕ ЗАДАНИЕ',
        '<p class="panel-note">Язык: '+esc(lang.toUpperCase())+' · Учебные ошибки не поднимают тревогу.</p>'+
        '<div class="quiz-question">'+esc(q.prompt)+'</div>'+snippet+control+
        '<button id="code-check">ПРОВЕРИТЬ</button><div id="code-feedback" class="panel-feedback" role="status"></div>',
        'LEARN / PYTHON + GO');
    }catch(err){
      currentQuestion=null;
      inner.innerHTML=shell('КОДОВОЕ ЗАДАНИЕ',
        '<p class="panel-note">Не удалось прочитать вопросы из data/questions-'+esc(lang)+'.json: '+esc(err.message)+'</p>',
        'LEARN / PYTHON + GO');
    }
  }
  function drawBayes(){inner.innerHTML=shell('BAYESIAN INFERENCE',`<p class="panel-note">Измени параметры игрового датчика: обновлённая вероятность рассчитывается по формуле Байеса, а не по фиксированному ответу.</p><div class="lab-grid"><label>Prior (0–1)<input id="prior" type="number" min="0" max="1" step="0.05" value="0.20"></label><label>Sensitivity<input id="sensitivity" type="number" min="0" max="1" step="0.05" value="0.90"></label><label>False Positive<input id="false-positive" type="number" min="0" max="1" step="0.05" value="0.10"></label><label>Сигнал<select id="signal"><option value="ALARM">ALARM</option><option value="NORMAL">NORMAL</option></select></label></div><button id="bayes-run">РАССЧИТАТЬ</button><div class="panel-feedback" id="bayes-result" role="status">P(Danger | Signal) = ?</div>`,'AI / WEEK 6');}
  function drawMap(){inner.innerHTML=shell('ИССЛЕДОВАННАЯ КАРТА',`<p>Исследовано: <strong>${handlers.seen().size}</strong> из ${handlers.dimensions().rows*handlers.dimensions().cols} клеток.</p><canvas id="panel-map" class="panel-canvas" width="300" height="200"></canvas><p class="panel-note">Чёрное — ещё не исследовано, тёмное — изучено раньше, светлое — видно сейчас. Поиск пути работает только с известной зоной.</p>`);const canvas=inner.querySelector('#panel-map');handlers.drawMap(canvas);}
  function drawPlanner(){inner.innerHTML=shell('ПЛАНИРОВЩИК МАРШРУТА',`<p class="panel-note">Настоящие BFS / DFS / UCS / A* участника №1. Алгоритм учитывает только открытые клетки карты.</p><div class="lab-grid"><label>Алгоритм<select id="search-algo"><option>BFS</option><option>DFS</option><option>UCS</option><option>A*</option></select></label><label>Цель (row,col)<input id="search-target" value="10,5"></label></div><button id="search-run">РАССЧИТАТЬ МАРШРУТ</button><div class="panel-feedback" id="search-result"></div>`,'AI / WEEK 2');}
  async function drawLock(){let puzzle=null;try{const m=await import('../game/puzzles.js');puzzle=m.createSecurityLockPuzzle();handlers.setPuzzleModule(m);}catch{/* unavailable */}
    inner.innerHTML=shell('CSP / ЛОГИЧЕСКИЙ ЗАМОК',`<p class="panel-note">Найди комбинацию из 4 цифр по ограничениям: все числа разные, A+B=5, C&gt;B, D чётное, A&gt;D.</p><div class="lock-inputs">${['A','B','C','D'].map(k=>`<label>${k}<input id="lock-${k}" type="number" min="1" max="4" value="" placeholder="?" aria-label="Значение ${k}"></label>`).join('')}</div><button id="lock-check">ПРОВЕРИТЬ КОМБИНАЦИЮ</button><div class="panel-feedback" id="lock-result">${puzzle?'CSP-модуль участника №2 подключён.':'Ожидается подключение puzzles.js участника №2.'}</div>`,'AI / WEEK 3');}
  function drawTactical(){
    if(!encounter)return;
    const cells=Array.from({length:11},(_,i)=>{
      const guard=i===encounter.guardPosition,hero=i===encounter.playerPosition;
      return '<div class="tactic-cell '+(guard?'guard ':'')+(hero?'hero':'')+'">'+(guard&&hero?'⚑':guard?'G':hero?'E':'·')+'</div>';
    }).join('');
    const controls=encounter.status==='active'
      ?encounter.turn==='guard'
        ?'<button id="tactic-guard">ХОД MINIMAX / AI</button>'
        :'<button id="tactic-hide">ПРОПУСТИТЬ ХОД / УКРЫТЬСЯ</button><button id="tactic-advance">ШАГ ВПЕРЁД</button>'
      :'<button id="tactic-reset">ПОВТОРИТЬ ЭПИЗОД</button>';
    inner.innerHTML=shell('МИНИ-ИГРА — MINIMAX',
      '<p class="panel-note">Небольшая учебная тактическая сцена. E — Ерасыл, G — охранник. Ходы игрока и алгоритма чередуются.</p>'+
      '<div class="tactic-board">'+cells+'</div>'+
      '<p class="panel-note">Ход: '+esc(encounter.turn)+' · Раунд: '+encounter.turnsPlayed+'/'+encounter.maxTurns+' · Результат: '+esc(encounter.status)+'</p>'+
      '<div class="panel-feedback">'+esc(encounterSummary)+'</div>'+
      '<div class="filter-row">'+controls+'</div>','AI / WEEK 4');
  }
  function drawCCTV(){inner.innerHTML=shell('QAMAL SURVEILLANCE',`<p class="panel-note">Виртуальные камеры показывают участки той же 2D-карты. Это игровые события, НЕ анализ настоящего видео.</p><div class="filter-row"><button data-camera="CAM-01">CAM-01</button><button data-camera="CAM-02">CAM-02</button><button data-camera="CAM-03">CAM-03</button></div><canvas id="camera-preview" width="288" height="192" class="panel-canvas"></canvas><p class="panel-note" id="camera-status">CAM-01 / ПРОГРАММНАЯ СИМУЛЯЦИЯ</p><button id="camera-visit">ОТМЕТИТЬ ИЗУЧЕНИЕ CCTV</button>`,'SIMULATION / CAMERAS');handlers.drawCamera(inner.querySelector('#camera-preview'),'CAM-01');}
  dialog.addEventListener('click',async e=>{
    if(e.target===dialog||e.target.closest('[data-close]')){close();return;}
    const id=e.target.id;
    if(e.target.dataset.camera){const cam=e.target.dataset.camera;handlers.drawCamera(inner.querySelector('#camera-preview'),cam);inner.querySelector('#camera-status').textContent=`${cam} / ВИРТУАЛЬНАЯ КАМЕРА`;return;}
    if(id==='code-check'){
      const fb=inner.querySelector('#code-feedback');
      if(!currentQuestion){fb.textContent='Задание ещё не загружено.';return;}
      const selected=inner.querySelector('[name=code-answer]:checked');
      const answer=selected?.value??inner.querySelector('#code-free-answer')?.value;
      if(!answer){fb.textContent='Сначала выбери или введи ответ.';return;}
      try{
        const {checkAnswer}=await import('../education/questionChecker.js');
        const result=checkAnswer(currentQuestion,answer);
        fb.textContent=result.feedback;
        if(result.correct){handlers.mark('learned');codeIndex++;}
      }catch(error){fb.textContent='Ошибка проверки: '+error.message;}
      return;
    }
    if(id==='bayes-run'){const v=k=>Number(inner.querySelector('#'+k).value);const fb=inner.querySelector('#bayes-result');
      try{const p=bayesianUpdate({prior:v('prior'),sensitivity:v('sensitivity'),falsePositive:v('false-positive'),signal:inner.querySelector('#signal').value});
        fb.textContent=`Evidence: ${formatProbability(p.evidenceProbability)} | Posterior: ${formatProbability(p.posterior)}`;
        if(p.defined)handlers.mark('bayesDone');
      }catch(err){fb.textContent=`Некорректные параметры: ${err.message}`;}return;
    }
    if(id==='lock-check'){const m=handlers.getPuzzleModule(),fb=inner.querySelector('#lock-result');if(!m){fb.textContent='Модуль CSP пока не подключён.';return;}
      const attempt=Object.fromEntries(['A','B','C','D'].map(k=>[k,inner.querySelector('#lock-'+k).value]));
      const result=m.checkLockAttempt(m.createSecurityLockPuzzle(),attempt);fb.textContent=result.message;
      if(result.unlocked)handlers.mark('lockOpen');else handlers.raiseAlarm(8);return;
    }
    if(id==='camera-visit'){handlers.mark('visitedCCTV');inner.querySelector('#camera-status').textContent='CCTV изучено — этап зачтён.';return;}
    if(id==='search-run'){const out=inner.querySelector('#search-result');try{const m=await import('../algorithms/search.js');
      if(typeof m.findPath!=='function')throw new Error('findPath не экспортируется');
      const coords=inner.querySelector('#search-target').value.split(',').map(x=>Number(x.trim()));
      if(coords.length!==2||coords.some(x=>!Number.isInteger(x)))throw new Error('Цель должна быть вида row,col');
      const blocks=new Set(['#','B','b','d','t','c']);
      const known=handlers.seen();
      const grid=handlers.map().map((row,r)=>row.map((tile,c)=>known.has(r+','+c)&&!blocks.has(tile)?tile:'#').join(''));
      const result=m.findPath({grid,start:handlers.position(),goal:{row:coords[0],col:coords[1]},algorithm:inner.querySelector('#search-algo').value});
      handlers.setRoute(result.path||[]);out.textContent=result.found?'Маршрут найден: '+result.steps+' шагов, стоимость '+result.cost+', изучено '+result.visited.length+' клеток.':'Пока нет известного маршрута. Открой больше клеток.';
    }catch(err){out.textContent='Ошибка расчёта маршрута: '+err.message;}return;}
    if(id==='tactic-reset'){
      encounter=createEncounter({guardPosition:0,playerPosition:5,maxTurns:10});
      encounterSummary='Новая тактическая сцена.';drawTactical();return;
    }
    if(id==='tactic-guard'&&encounter?.turn==='guard'&&encounter.status==='active'){
      const decision=chooseEncounterAction(encounter,4);
      encounter=applyEncounterMove(encounter,decision.move);
      encounterSummary='Minimax выбрал '+decision.move+' · оценка '+decision.score+
        ' · узлов '+decision.nodesExplored+' · Alpha-Beta отсечений '+decision.pruned;
      drawTactical();return;
    }
    if((id==='tactic-hide'||id==='tactic-advance')&&encounter?.turn==='player'&&encounter.status==='active'){
      const action=id==='tactic-hide'?ENCOUNTER_ACTIONS.PLAYER_HIDE:ENCOUNTER_ACTIONS.PLAYER_ADVANCE;
      encounter=applyEncounterMove(encounter,action);
      encounterSummary='Ерасыл выбрал '+action+'. Очередь хода переходит алгоритму.';
      drawTactical();return;
    }
  });
  return {open,close,isOpen:()=>!dialog.hidden};
}
