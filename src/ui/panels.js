import {bayesianUpdate,formatProbability} from '../algorithms/bayes.js';
import {createEncounter,chooseEncounterAction,applyEncounterMove,ENCOUNTER_ACTIONS} from '../game/tacticalEncounter.js';
import {selectQuestion,questionsFor} from '../education/questionBank.js';
import {getDoorQuestion,DIFFICULTY_LABEL} from '../game/doorChallenges.js';
import {checkAnswer} from '../education/questionChecker.js';
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
  let selectedDoor=null,doorAttempt=0,doorLanguage='python',doorQuestion=null;
  let npcScript=[],npcIndex=0,npcTimer=null,npcFullyTyped=false;
  let practiceDifficulty='easy',practiceIndex=0;
  function shell(title,content,tag='QAMAL / INTERACTIVE'){return `<div class="panel-top"><div><div class="section-kicker">${tag}</div><h2>${title}</h2></div><button class="icon-btn" data-close aria-label="Закрыть">✕</button></div>${content}`;}
  function close(){if(npcTimer)clearInterval(npcTimer);npcTimer=null;dialog.classList.remove('npc-open');dialog.hidden=true;active=null;}
  async function open(name,data=null){active=name;dialog.hidden=false;dialog.classList.toggle('npc-open',name==='npc');inner.scrollTop=0;
    if(name==='door'){selectedDoor=data;doorAttempt=0;doorLanguage=handlers.language();drawDoor();}
    if(name==='npc'){npcScript=getNpcScript(data);npcIndex=0;renderNpc();}
    if(name==='intro')inner.innerHTML=shell('ГЛАВА 01 — ДЕЛО ЕРАСЫЛА',`<div class="chapter-intro"><div class="scene-number">01 / QAMAL</div><h3>Истина скрыта в системе.</h3><p>Ерасыл оказался в вымышленном комплексе QAMAL-01 после обвинения в утечке данных. В его электронном досье обнаружились противоречия.</p><p>Поговори с Арманом, изучи классы и виртуальные камеры, реши логический замок и найди путь к выходу.</p><p class="panel-note">Охранники двигаются после твоих ходов. Слишком высокая тревога возвращает героя к началу, но выполненные задания сохраняются.</p><button data-close>НАЧАТЬ ГЛАВУ →</button></div>`,'STORY / CHAPTER 01');
    if(name==='help')inner.innerHTML=shell('КАК ИГРАТЬ',`<p>Твой персонаж — Ерасыл. Камера следует за тобой, а комнаты открываются только в пределах обзора. Уже исследованные участки остаются затемнёнными на карте. WASD / стрелки: перемещение; <kbd>E</kbd> — взаимодействие рядом с объектом; <kbd>M</kbd> — карта; <kbd>Esc</kbd> — закрыть окно.</p><p class="panel-note">Быстрые кнопки справа открывают учебные демо-окна без необходимости искать комнату.</p>`);
    if(name==='code')drawCode();
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
  function drawCode(){
    const language=handlers.language();
    const questions=questionsFor(language,practiceDifficulty);
    currentQuestion=selectQuestion(language,practiceDifficulty,practiceIndex);
    const q=currentQuestion;
    const options=['easy','medium','hard'].map(d=>'<option value="'+d+'" '+(practiceDifficulty===d?'selected':'')+'>'+
      DIFFICULTY_LABEL[d]+'</option>').join('');
    inner.innerHTML=shell('ТРЕНИРОВОЧНЫЙ ТЕРМИНАЛ',
      '<p class="panel-note">Всего по 240 вопросов на каждом языке. Здесь можно тренироваться без тревоги.</p>'+
      '<div class="quest-topline"><label>Уровень сложности<select id="practice-difficulty">'+options+'</select></label>'+
      '<span class="difficulty-badge">'+language.toUpperCase()+' · '+questions.length+' задач</span></div>'+
      '<h3>'+esc(q.title)+'</h3><p>'+esc(q.prompt)+'</p><pre class="quest-code">'+esc(q.codeSnippet)+'</pre>'+
      '<label>Твой ответ<input id="code-free-answer" type="text" autocomplete="off" placeholder="Введи результат программы"></label>'+
      '<div class="quest-actions"><button id="code-check">ПРОВЕРИТЬ</button><button id="practice-next">ДРУГОЙ ВОПРОС →</button></div>'+
      '<div id="code-feedback" class="panel-feedback" role="status"></div>',
      'LEARN / PYTHON + GO');
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
  function drawDoor(){
    if(!selectedDoor)return;
    doorQuestion=getDoorQuestion(selectedDoor,doorLanguage,doorAttempt);
    const q=doorQuestion,level=DIFFICULTY_LABEL[selectedDoor.difficulty];
    const choices='<button type="button" data-door-language="python" class="'+(doorLanguage==='python'?'selected':'')+'">PYTHON</button>'+
      '<button type="button" data-door-language="go" class="'+(doorLanguage==='go'?'selected':'')+'">GO</button>';
    inner.innerHTML=shell('ДВЕРЬ '+selectedDoor.id+' · '+level,
      '<div class="quest-door-title"><span class="lock-symbol">▣</span><div>'+
      '<strong>'+esc(level)+' УРОВЕНЬ</strong><p>Правильный ответ открывает дверь. Сложность зависит от сектора карты.</p></div></div>'+
      '<div class="quest-language">'+choices+'</div>'+
      '<div class="quest-topline"><span class="difficulty-badge">'+doorLanguage.toUpperCase()+' / '+esc(q.title)+'</span>'+
      '<span class="quest-number">ЗАДАНИЕ #'+(doorAttempt+1)+'</span></div>'+
      '<h3>'+esc(q.prompt)+'</h3><pre class="quest-code">'+esc(q.codeSnippet)+'</pre>'+
      '<label class="quest-label">Введи результат программы<input id="door-answer" type="text" autocomplete="off" placeholder="Например: 5"></label>'+
      '<div class="quest-actions"><button id="door-check">ПРОВЕРИТЬ И ОТКРЫТЬ</button>'+
      '<button id="door-next">ДРУГОЕ ЗАДАНИЕ</button></div>'+
      '<div class="panel-feedback" id="door-feedback" role="status">Подсказка: '+esc(q.hint)+'</div>',
      'QAMAL / DOOR CHALLENGE');
    inner.querySelector('#door-answer')?.focus();
  }

  function getNpcScript(npc){
    const person=npc?.id??'unknown';
    const scripts={
      arman:[
        ['Арман','Ерасыл! Я надеялся, что ты меня услышишь. Твой файл в системе выглядит подозрительно.'],
        ['Ерасыл','Кто-то изменил моё досье? Как мне это проверить?'],
        ['Арман','Ищи жёлтые значки на дверях. Подойди и нажми E: каждая дверь проверяет код на Python или Go.'],
        ['Арман','Начни с лёгких заданий, затем иди к комнате камер. Нажми M, чтобы видеть уже изученную территорию.']
      ],
      ruslan:[
        ['Руслан','Тихо, Ерасыл. Здесь постоянно меняются данные наблюдений.'],
        ['Ерасыл','И в чём именно проблема?'],
        ['Руслан','Посмотри виртуальные камеры и открой архив досье. Там есть записи, которые нужно проверить.'],
        ['Руслан','Если результат не сходится, отметь неверное наблюдение — журнал сохранит изменение.']
      ],
      guard1:[
        ['Охранник','Задержись у терминала. Проход закрыт, пока система не увидит верный ответ.'],
        ['Ерасыл','Я могу выбрать язык?'],
        ['Охранник','Да. Python или Go. Чем дальше крыло, тем сложнее задачи.']
      ],
      guard2:[
        ['Старший охранник','Система патрулирования включена. Не торопись с ответами.'],
        ['Ерасыл','Почему у меня повышается тревога?'],
        ['Старший охранник','На некоторых контрольных точках неверное решение вызывает сигнал. Проверяй код внимательно.']
      ],
      daniyar:[
        ['Данияр','Привет, Ерасыл! Терминалы открываются задачами на Python или Go.'],
        ['Ерасыл','Сложность случайная?'],
        ['Данияр','Нет, она зависит от сектора. Начальные двери — лёгкие, дальше — средние и сложные.'],
        ['Данияр','Если не понимаешь ответ, попробуй другой вариант задания на том же терминале.']
      ],
      madina:[
        ['Мадина','Данные датчиков бывают неточными. Один сигнал тревоги ещё не доказывает опасность.'],
        ['Ерасыл','И как проверить вероятность?'],
        ['Мадина','Открой инструмент Bayes в меню ☰. Измени начальную вероятность и чувствительность датчика — увидишь результат.']
      ],
      timur:[
        ['Тимур','Я видел твоё досье в архиве. Там есть запись, которая вызывает сомнения.'],
        ['Ерасыл','Можно ли её изменить?'],
        ['Тимур','Открой виртуальный архив и отметь неверные наблюдения. Каждое действие попадёт в журнал.']
      ]
    };
    return scripts[person]??[
      [npc?.name||'Заключённый','Ты видел новые двери? У каждой есть задача по программированию.'],
      ['Ерасыл','Спасибо, теперь я понимаю, куда идти.']
    ];
  }
  function renderNpc(){
    if(npcTimer)clearInterval(npcTimer);
    npcTimer=null; npcFullyTyped=false;
    if(npcIndex>=npcScript.length){close();return;}
    const [speaker,phrase]=npcScript[npcIndex];
    const portraitId=({Ерасыл:'erasyl',Арман:'arman',Руслан:'ruslan',Данияр:'daniyar',Мадина:'madina',Тимур:'timur',Охранник:'guard','Старший охранник':'guard'})[speaker]||'default';
    const portrait=handlers.portraitFor?.(portraitId)||'./assets/characters/prisoners/prisoner.png';
    inner.innerHTML='<div class="npc-dialog">'+
      '<div class="npc-portrait portrait-'+portraitId+'"><img src="'+esc(portrait)+'" alt="Портрет '+esc(speaker)+'"></div>'+
      '<div class="npc-dialog-content"><div class="npc-speaker">'+esc(speaker)+'</div>'+
      '<div class="npc-words" id="npc-words" role="status"></div>'+
      '<div class="npc-footer"><span>ДИАЛОГ '+(npcIndex+1)+'/'+npcScript.length+' · E / ENTER — ДАЛЕЕ</span>'+
      '<button id="npc-next">'+(npcIndex+1<npcScript.length?'ДАЛЕЕ →':'ЗАКРЫТЬ ✓')+'</button></div></div></div>';
    const el=inner.querySelector('#npc-words');
    let length=0;
    npcTimer=setInterval(()=>{
      length=Math.min(phrase.length,length+2);
      el.textContent=phrase.slice(0,length);
      if(length===phrase.length){clearInterval(npcTimer);npcTimer=null;npcFullyTyped=true;}
    },20);
  }
  function advanceNpc(){
    if(active!=='npc')return false;
    if(!npcFullyTyped){
      if(npcTimer)clearInterval(npcTimer);npcTimer=null;
      inner.querySelector('#npc-words').textContent=npcScript[npcIndex][1];
      npcFullyTyped=true;
    }else{npcIndex++;renderNpc();}
    return true;
  }
  function drawCCTV(){inner.innerHTML=shell('QAMAL SURVEILLANCE',`<p class="panel-note">Виртуальные камеры показывают участки той же 2D-карты. Это игровые события, НЕ анализ настоящего видео.</p><div class="filter-row"><button data-camera="CAM-01">CAM-01</button><button data-camera="CAM-02">CAM-02</button><button data-camera="CAM-03">CAM-03</button></div><canvas id="camera-preview" width="288" height="192" class="panel-canvas"></canvas><p class="panel-note" id="camera-status">CAM-01 / ПРОГРАММНАЯ СИМУЛЯЦИЯ</p><button id="camera-visit">ОТМЕТИТЬ ИЗУЧЕНИЕ CCTV</button>`,'SIMULATION / CAMERAS');handlers.drawCamera(inner.querySelector('#camera-preview'),'CAM-01');}
  dialog.addEventListener('change',e=>{
    if(e.target.id==='practice-difficulty'){practiceDifficulty=e.target.value;practiceIndex=0;drawCode();}
  });
  dialog.addEventListener('click',async e=>{
    if(e.target===dialog||e.target.closest('[data-close]')){close();return;}
    const id=e.target.id;
    if(e.target.dataset.camera){const cam=e.target.dataset.camera;handlers.drawCamera(inner.querySelector('#camera-preview'),cam);inner.querySelector('#camera-status').textContent=`${cam} / ВИРТУАЛЬНАЯ КАМЕРА`;return;}
    if(id==='npc-next'){advanceNpc();return;}
    if(e.target.dataset.doorLanguage){
      doorLanguage=e.target.dataset.doorLanguage;doorAttempt=0;drawDoor();return;
    }
    if(id==='door-next'){doorAttempt++;drawDoor();return;}
    if(id==='door-check'){
      if(!doorQuestion)return;
      const answer=inner.querySelector('#door-answer')?.value;
      const feedback=inner.querySelector('#door-feedback');
      if(!answer?.trim()){feedback.textContent='Введи ответ перед проверкой.';return;}
      const result=checkAnswer(doorQuestion,answer);
      if(result.correct){
        handlers.unlockDoor?.(selectedDoor);
        inner.innerHTML=shell('ДВЕРЬ ОТКРЫТА ✓',
          '<div class="quest-unlocked">✓ ДОСТУП РАЗРЕШЁН</div>'+
          '<p>'+esc(doorQuestion.explanation)+'</p>'+
          '<p class="panel-note">Вернись к карте и пройди через открытую дверь.</p>'+
          '<button data-close>ПРОДОЛЖИТЬ ИГРУ →</button>',
          'QAMAL / CHECKPOINT COMPLETE');
      }else{
        feedback.textContent='Пока неверно. '+doorQuestion.hint+
          (selectedDoor.difficulty==='easy'?' В лёгком секторе нет штрафа тревоги.':' Сигнал контрольной точки немного повысил тревогу.');
        if(selectedDoor.difficulty!=='easy')handlers.raiseAlarm(selectedDoor.difficulty==='medium'?5:8);
      }
      return;
    }
    if(id==='code-check'){
      const feedback=inner.querySelector('#code-feedback');
      const answer=inner.querySelector('#code-free-answer')?.value;
      if(!answer?.trim()){feedback.textContent='Сначала введи ответ.';return;}
      const result=checkAnswer(currentQuestion,answer);
      feedback.textContent=result.feedback;
      if(result.correct)handlers.mark('learned');
      return;
    }
    if(id==='practice-next'){practiceIndex++;drawCode();return;}
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
  return {open,close,advanceNpc,isOpen:()=>!dialog.hidden};
}
