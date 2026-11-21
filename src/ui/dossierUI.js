const escapeHTML=s=>String(s).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export function createDossierUI(root,store){
  let query='',page=0,selected=null;
  function render(){
    const result=store.search(query,page,12);
    root.innerHTML=`<div class="panel-top"><div><div class="section-kicker">QAMAL / DATA FILES</div><h2>БАЗА ДОСЬЕ <small>1000 записей</small></h2></div><button class="icon-btn" data-close aria-label="Закрыть">✕</button></div>
      <p class="panel-note">Синтетические игровые профили. Изменения сохраняются и записываются в журнал.</p>
      <div class="filter-row"><input id="dossier-search" placeholder="Имя или ID (например Q-01047)" value="${escapeHTML(query)}" aria-label="Поиск досье"><button data-search>НАЙТИ</button><button data-audit>ЖУРНАЛ ПРАВОК (${store.audit().length})</button></div>
      <div class="dossier-layout"><div class="dossier-list">${result.items.map(p=>`<button class="dossier-entry ${selected===p.id?'active':''}" data-dossier="${escapeHTML(p.id)}"><span>${escapeHTML(p.id)}</span><strong>${escapeHTML(p.displayName)}</strong><small>${escapeHTML(p.roleTier)} · ${escapeHTML(p.blockId)}</small></button>`).join('')||'<p>Совпадений нет.</p>'}
      <div class="pagination"><button data-page="prev" ${page===0?'disabled':''}>◀</button><span>${result.total?`${page+1} / ${Math.ceil(result.total/12)}`:'0'} (${result.total})</span><button data-page="next" ${(page+1)*12>=result.total?'disabled':''}>▶</button></div></div>
      <div id="dossier-details" class="dossier-details">${selected?renderDetails(selected):'<p class="panel-note">Выбери профиль слева.</p>'}</div></div>`;
  }
  function renderDetails(id){const p=store.find(id);if(!p)return '<p>Досье не найдено</p>';
    const events=store.events(id);
    return `<div class="dossier-card"><div class="portrait-fallback" aria-label="Пиксельный портрет">${escapeHTML(p.displayName.slice(0,1))}</div><div><strong>${escapeHTML(p.displayName)}</strong><p>${escapeHTML(p.id)} · БЛОК ${escapeHTML(p.blockId)}</p><p>${escapeHTML(p.roleTier)}</p></div></div>
      <p class="panel-note">Демо-риск: <strong>${store.risk(id)}</strong>. Это временное правило интерфейса, НЕ обученный Decision Tree.</p>
      <h3>ИГРОВЫЕ НАБЛЮДЕНИЯ</h3>${events.map(e=>`<div class="event-line"><span>${escapeHTML(e.id)} · ${escapeHTML(e.type)} · ${escapeHTML(e.reviewStatus)}</span><select data-event="${escapeHTML(e.id)}" aria-label="Статус события ${escapeHTML(e.id)}"><option value="unreviewed" ${e.reviewStatus==='unreviewed'?'selected':''}>Не проверено</option><option value="confirmed" ${e.reviewStatus==='confirmed'?'selected':''}>Подтверждено</option><option value="incorrect" ${e.reviewStatus==='incorrect'?'selected':''}>Ошибочная запись</option></select></div>`).join('')||'<p>Нет событий</p>'}
      <div id="dossier-feedback" role="status"></div>`;
  }
  root.addEventListener('click',e=>{
    const btn=e.target.closest('button');if(!btn)return;
    if(btn.dataset.dossier){selected=btn.dataset.dossier;render();}
    else if(btn.dataset.search!==undefined){query=root.querySelector('#dossier-search').value;page=0;selected=null;render();}
    else if(btn.dataset.page){page=Math.max(0,page+(btn.dataset.page==='next'?1:-1));selected=null;render();}
    else if(btn.dataset.audit!==undefined){const log=store.audit().slice(-20).reverse();const el=root.querySelector('#dossier-details');if(el)el.innerHTML=`<h3>ПОСЛЕДНИЕ ПРАВКИ</h3>${log.map(a=>`<p class="audit-item">${escapeHTML(a.id)} · ${escapeHTML(a.prisonerId)} · ${escapeHTML(a.eventId)} · ${escapeHTML(a.action)}</p>`).join('')||'<p>Правок пока нет.</p>'}`;}
  });
  root.addEventListener('change',async e=>{
    const id=e.target.dataset.event;if(!id||!selected)return;
    try{const res=await store.updateObservation(selected,id,e.target.value,Date.now()%10000);render();const msg=root.querySelector('#dossier-feedback');if(msg)msg.textContent=`Запись сохранена. Демо-риск: ${res.provisionalRisk}.`;}catch(error){const msg=root.querySelector('#dossier-feedback');if(msg)msg.textContent=error.message;}
  });
  root.addEventListener('keydown',e=>{if(e.code==='Enter'&&e.target.id==='dossier-search'){query=e.target.value;page=0;selected=null;render();}});
  return {render};
}
