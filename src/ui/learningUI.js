import {getCourse,lessonAt,diagnoseLessonError,isCorrectLessonAnswer} from '../education/curriculum.js';
import {checkAnswer} from '../education/questionChecker.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label={python:'Python',go:'Go'};

/**
 * In-world learning station used by the mandatory classroom, the library
 * and Arman's mentorship. No code gets executed: this is a guided checker.
 */
export function createLearningUI(inner,handlers){
  let mode='classroom',language='python',topicIndex=0,taskIndex=0,attempts=0;
  let opened=false,view='lesson',answered=false,feedback='';
  const lesson=()=>lessonAt(language,topicIndex);
  const course=()=>getCourse(language);
  const heading=()=>mode==='mentor'?'АРМАН / ЛИЧНЫЙ НАСТАВНИК':mode==='library'?'БИБЛИОТЕКА / САМОСТОЯТЕЛЬНО':'УЧЕБНЫЙ КЛАСС / ОСНОВЫ';
  const shell=body=>'<div class="panel-top learn-heading"><div><div class="section-kicker">'+esc(heading())+
    '</div><h2>'+esc(label[language])+' · обучение</h2></div>'+
    '<button class="icon-btn" data-close aria-label="Закрыть">✕</button></div>'+body;
  const progress=()=>handlers.getProgress?.()?.[language]??[];
  function toolbar(){
    return '<div class="learning-toolbar"><label>ЯЗЫК <select id="learn-language">'+
      '<option value="python" '+(language==='python'?'selected':'')+'>Python</option>'+
      '<option value="go" '+(language==='go'?'selected':'')+'>Go</option></select></label>'+
      '<span class="learning-counter">Пройдено: '+progress().length+' / '+course().length+' тем</span>'+
      '<button data-learn="catalog">ТЕМЫ</button>'+
      '<button data-learn="journal">МОИ ОШИБКИ</button></div>';
  }
  function renderCatalog(){
    const names={classroom:'Выбери тему для изучения',mentor:'Арман поможет с любым разделом',library:'Здесь можно учиться в собственном темпе'};
    const cards=course().map((x,i)=>{
      const done=progress().includes(i);
      return '<button class="learning-topic" data-learn-topic="'+i+'"><span class="topic-number">'+
        String(i+1).padStart(2,'0')+'</span><span><strong>'+esc(x.title)+'</strong>'+
        '<small>'+esc(x.short)+'</small></span><span class="topic-state">'+(done?'✓ ПРОЙДЕНО':'ОТКРЫТЬ →')+'</span></button>';
    }).join('');
    inner.innerHTML=shell(toolbar()+'<div class="learning-hero">'+
      (mode==='mentor'?'<img src="./assets/portraits/arman.svg" alt="Арман" class="learning-mentor-portrait">':'')+
      '<h3>'+names[mode]+'</h3><p>8 тем от первых команд до вложенных циклов. В каждой теме теория, пример и две задачи с подробным разбором.</p></div>'+
      '<div class="learning-catalog">'+cards+'</div>'+
      '<button data-learn="resume" class="learning-main-button">ПРОДОЛЖИТЬ УРОК →</button>');
  }
  function renderJournal(){
    const list=(handlers.getMistakes?.()??[]).filter(x=>x.language===language).slice().reverse();
    inner.innerHTML=shell(toolbar()+'<div class="learning-hero"><h3>Твои ошибки и решения</h3>'+
      '<p>Здесь сохраняются неправильные ответы из уроков, дверей и тренировок. Это личная шпаргалка для повторения.</p></div>'+
      (list.length?'<div class="learning-journal">'+list.slice(0,20).map(m=>
        '<article><div class="mistake-heading">'+esc(m.topic||'Задание')+' · '+esc(m.location||'Практика')+'</div>'+
        '<pre class="learning-code">'+esc(m.codeSnippet||'')+'</pre>'+
        '<p><strong>Твой ответ:</strong> '+esc(m.answer||'—')+'</p>'+
        '<p><strong>Верное решение:</strong> '+esc(m.expected||'—')+'</p>'+
        '<ol>'+((m.steps||[m.explanation||'Посмотри на порядок исполнения команд.']).map(st=>'<li>'+esc(st)+'</li>').join(''))+'</ol></article>').join('')+'</div>':
        '<div class="learning-empty">Ошибок пока нет. Пройди несколько задач — все сложные моменты будут собираться здесь.</div>')+
      '<button data-learn="catalog" class="learning-main-button">ВЕРНУТЬСЯ К ТЕМАМ</button>');
  }
  function renderLesson(){
    const l=lesson(),task=l.tasks[taskIndex],finished=progress().includes(topicIndex);
    const intro=mode==='mentor'?'<div class="mentor-note"><img src="./assets/portraits/arman.svg" alt="Портрет Армана">'+
      '<p><strong>Арман:</strong> '+esc(taskIndex===0?'Сперва разберём основу. Читай код по строкам, затем попробуй сам.':
      'Отлично, теперь дополни строку своими руками. Если возникнет ошибка, я объясню её.')+'</p></div>':
      mode==='classroom'?'<p class="lesson-story">Охранник привёл Ерасыла к учебному терминалу. Здесь начинается обучение выбранному языку.</p>':
      '<p class="lesson-story">Тихая библиотека: можешь вернуться к любому уроку без штрафов.</p>';
    inner.innerHTML=shell(toolbar()+
      '<div class="learning-lesson">'+
      '<div class="learning-lesson-status"><span>УРОК '+(topicIndex+1)+' / '+course().length+'</span>'+
      '<span>ЗАДАНИЕ '+(taskIndex+1)+' / '+l.tasks.length+'</span>'+
      (finished?'<span>✓ РАНЕЕ ПРОЙДЕН</span>':'')+'</div>'+
      intro+'<h3>'+esc(l.title)+'</h3>'+
      '<p class="learning-theory">'+esc(l.lesson)+'</p>'+
      '<div class="learning-example-title">ПРИМЕР</div><pre class="learning-code">'+esc(l.example)+'</pre>'+
      '<div class="learning-exercise"><div class="learning-example-title">ПОПРОБУЙ САМ</div>'+
      '<p class="learning-question">'+esc(task.prompt)+'</p>'+
      '<pre class="learning-code">'+esc(task.codeSnippet)+'</pre>'+
      '<label for="learn-answer">ТВОЙ ОТВЕТ ИЛИ СТРОКА КОДА</label>'+
      '<textarea id="learn-answer" rows="2" spellcheck="false" placeholder="Напиши ответ здесь..."></textarea>'+
      '<div class="learning-controls"><button id="learn-check" class="learning-main-button">ПРОВЕРИТЬ ОТВЕТ</button>'+
      '<button id="learn-explain">НЕ МОГУ РЕШИТЬ — РАЗОБРАТЬ</button></div>'+
      '<div id="learn-feedback" role="status" aria-live="polite" class="learning-feedback"></div>'+
      '</div><p class="learning-keyboard-tip">Если застрял, нажми «Разобрать»: увидишь правильный ответ и объяснение по шагам. Затем попробуй ещё раз.</p></div>');
    inner.querySelector('#learn-answer')?.focus();
  }
  function render(){
    if(!opened)return;
    if(view==='catalog')renderCatalog();
    else if(view==='journal')renderJournal();
    else renderLesson();
  }
  function open(nextMode,opts={}){
    mode=['classroom','library','mentor'].includes(nextMode)?nextMode:'classroom';
    language=['python','go'].includes(opts.language)?opts.language:(handlers.language?.()||'python');
    const completed=progress();
    topicIndex=Number.isInteger(opts.topicIndex)?Math.max(0,Math.min(course().length-1,opts.topicIndex)):
      (mode==='classroom'?course().findIndex((x,i)=>!completed.includes(i)):0);
    if(topicIndex===-1)topicIndex=0;
    taskIndex=0;attempts=0;answered=false;feedback='';opened=true;
    view=mode==='classroom'?'lesson':'catalog';
    render();
  }
  function showAnalysis(question,raw,force=false){
    const diagnosis=diagnoseLessonError(question,raw,force?2:attempts);
    const target=inner.querySelector('#learn-feedback');
    if(!target)return;
    target.className='learning-feedback '+(diagnosis.correct?'correct':'wrong');
    target.innerHTML='<strong>'+esc(diagnosis.title)+'</strong>'+
      '<p>'+esc(diagnosis.message)+'</p>'+
      (diagnosis.reveal?'<div class="learning-answer"><strong>Правильный ответ:</strong> <code>'+esc(diagnosis.answer)+'</code></div>': '')+
      '<ol>'+diagnosis.steps.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ol>';
    if(diagnosis.reveal)target.innerHTML+='<p>Попробуй переписать ответ самостоятельно, затем нажми «Проверить».</p>';
  }
  function check(){
    const q=lesson().tasks[taskIndex],answer=inner.querySelector('#learn-answer')?.value??'';
    if(!String(answer).trim()){showAnalysis(q,answer);return;}
    const result={correct:isCorrectLessonAnswer(q,answer)};
    if(result.correct){
      handlers.playSound?.(taskIndex+1>=lesson().tasks.length?'complete':'success');
      attempts=0;answered=true;
      const next=taskIndex+1;
      if(next>=lesson().tasks.length){
        handlers.onLessonComplete?.(language,topicIndex);
        inner.innerHTML=shell(toolbar()+'<div class="learning-success">'+
          '<div class="lesson-complete-icon">✓</div><h3>УРОК ПРОЙДЕН</h3>'+
          '<p>Ты разобрал тему «'+esc(lesson().title)+'». Ошибки — это часть обучения, главное понимать шаги решения.</p>'+
          (mode==='mentor'?'<p><strong>Арман:</strong> Хорошая работа. Заходи, когда нужна будет новая тема.</p>':'')+
          '<div class="learning-controls"><button data-learn="next" class="learning-main-button">СЛЕДУЮЩАЯ ТЕМА →</button>'+
          '<button data-learn="catalog">ВЫБРАТЬ ТЕМУ</button></div></div>');
      }else{
        inner.innerHTML=shell(toolbar()+'<div class="learning-success"><div class="lesson-complete-icon">✓</div>'+
          '<h3>Правильно!</h3><p>'+esc(q.explanation)+'</p>'+
          '<p>Теперь задание на самостоятельное написание строки или объяснение результата.</p>'+
          '<button data-learn="next-task" class="learning-main-button">СЛЕДУЮЩЕЕ ЗАДАНИЕ →</button></div>');
      }
    }else{
      handlers.playSound?.('error');
      attempts++;
      const details=diagnoseLessonError(q,answer,attempts);
      handlers.recordMistake?.({language,topic:lesson().title,location:heading(),codeSnippet:q.codeSnippet,
        answer,expected:q.expectedAnswer,steps:q.steps,explanation:q.explanation});
      showAnalysis(q,answer);
    }
  }
  function explain(){
    handlers.playSound?.('click');
    const q=lesson().tasks[taskIndex],answer=inner.querySelector('#learn-answer')?.value??'';
    if(String(answer).trim()&&!isCorrectLessonAnswer(q,answer)){
      handlers.recordMistake?.({language,topic:lesson().title,location:heading(),codeSnippet:q.codeSnippet,
        answer,expected:q.expectedAnswer,steps:q.steps});
    }
    showAnalysis(q,answer,true);
  }
  function act(action,value){
    if(!opened)return false;
    switch(action){
      case 'catalog':view='catalog';render();break;
      case 'journal':view='journal';render();break;
      case 'resume':view='lesson';render();break;
      case 'next-task':taskIndex++;attempts=0;view='lesson';render();break;
      case 'next':
        topicIndex=(topicIndex+1)%course().length;taskIndex=0;attempts=0;view='lesson';render();break;
      case 'topic':
        topicIndex=value;taskIndex=0;attempts=0;view='lesson';render();break;
      case 'check':check();break;
      case 'explain':explain();break;
      default:return false;
    }
    return true;
  }
  inner.addEventListener('click',e=>{
    const b=e.target.closest('[data-learn], [data-learn-topic], #learn-check, #learn-explain');
    if(!b||!opened)return;
    e.stopPropagation();
    const action=b.hasAttribute('data-learn-topic')?'topic':b.id==='learn-check'?'check':b.id==='learn-explain'?'explain':b.dataset.learn;
    const value=action==='topic'?Number(b.dataset.learnTopic):undefined;
    act(action,value);
  });
  inner.addEventListener('change',e=>{
    if(e.target.id!=='learn-language'||!opened)return;
    e.stopPropagation();language=e.target.value;handlers.setLanguage?.(language);
    topicIndex=0;taskIndex=0;attempts=0;view=mode==='classroom'?'lesson':'catalog';render();
  });
  return{open,render,close:()=>{opened=false;},getState:()=>({mode,language,topicIndex,taskIndex,attempts,view}),act};
}
