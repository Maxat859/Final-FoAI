const escapeHTML=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function createTrainingLabUI(root){
  let model=null,lib=null,samples=[];
  async function load(){
    try{const [dt,metrics]=await Promise.all([import('../algorithms/decisionTree.js'),import('../algorithms/mlMetrics.js')]);lib={...dt,...metrics};}
    catch{lib=null;}
    return !!lib;
  }
  function render(){root.innerHTML=`<div class="panel-top"><div><div class="section-kicker">AI / WEEK 8</div><h2>DECISION TREE TRAINING LAB</h2></div><button class="icon-btn" data-close aria-label="Закрыть">✕</button></div>
    <p class="panel-note">Обучение проводится только на синтетических событиях. Никакой оценки реальных людей.</p>
    <div class="lab-grid"><label>Записей<input type="number" id="lab-count" min="30" max="2000" value="200"></label><label>Test доля<input type="number" id="lab-ratio" min="10" max="40" value="20"></label></div>
    <div class="filter-row"><button id="lab-generate">GENERATE</button><button id="lab-train">TRAIN / TEST</button><button id="lab-predict">PREDICT</button></div>
    <div class="lab-result" id="lab-result" role="status">${lib?'Модуль ML подключён. Нажми GENERATE.':'Интерфейс готов, но исходники Decision Tree и ML Metrics пока отсутствуют в этой ветке. Добавить модули участника №2 для запуска обучения.'}</div>`;}
  function sample(count){let s=2026;const rand=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
    return Array.from({length:count},()=>{const warningsCount=Math.floor(rand()*5),restrictedVisits=Math.floor(rand()*4),ruleViolations=Math.floor(rand()*3),alertLevel=Math.floor(rand()*101);
      const score=warningsCount+2*restrictedVisits+3*ruleViolations+alertLevel/20;
      return {warningsCount,restrictedVisits,ruleViolations,alertLevel,label:score>13?'HIGH':score>6?'MEDIUM':'LOW'};
    });
  }
  root.addEventListener('click',e=>{
    const id=e.target.id;if(!id.startsWith('lab-'))return;
    const count=Math.max(30,Math.min(2000,Number(root.querySelector('#lab-count').value)||200));
    const result=root.querySelector('#lab-result');
    if(id==='lab-generate'){samples=sample(count);result.textContent=`Сгенерировано ${samples.length} учебных примеров с независимыми синтетическими метками.`;return;}
    if(!lib){result.textContent='Нужно подключить src/algorithms/decisionTree.js и mlMetrics.js от участника №2.';return;}
    if(!samples.length){result.textContent='Сначала нажми GENERATE.';return;}
    if(id==='lab-train'){
      try{const split=lib.splitDataset(samples,{testRatio:Number(root.querySelector('#lab-ratio').value)/100,seed:2026});
        model=lib.trainTree(split.train,{maxDepth:5,minLeaf:5});const m=lib.evaluateClassifier(model,split.test);
        result.innerHTML=`<strong>TEST RESULTS</strong><p>Train: ${split.train.length} / Test: ${split.test.length}</p><pre>${escapeHTML(JSON.stringify(m,null,2).slice(0,1800))}</pre>`;
      }catch(err){result.textContent=`Не удалось обучить модель: ${err.message}`;}
    }
    if(id==='lab-predict'){
      if(!model){result.textContent='Сначала обучи модель.';return;}
      const features={warningsCount:2,restrictedVisits:1,ruleViolations:1,alertLevel:45};
      try{result.textContent=`Prediction: ${JSON.stringify(lib.predictTree(model,features))} · Features: ${JSON.stringify(features)}`;}
      catch(err){result.textContent=`Ошибка: ${err.message}`;}
    }
  });
  return {load,render};
}
