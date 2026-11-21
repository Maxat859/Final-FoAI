import {makeAuditEntry,appendAudit} from './auditLog.js';
export function fallbackPrisoners(){
  const main=[['Q-01047','Ерасыл'],['Q-01002','Арман'],['Q-01003','Руслан'],['Q-01004','Данияр'],['Q-01005','Тимур'],['Q-01006','Мадина']];
  const people=main.map(([id,displayName])=>({id,displayName,roleTier:'main',blockId:'A',status:'active',portraitAssetId:id==='Q-01047'?'portrait.erasyl':'portrait.default',spriteId:'character.prisoner.generic',observations:[`EVT-${id.slice(-4)}`],riskAssessment:{label:'LOW',modelVersion:'not-trained'},storyFlags:{},lastUpdatedAt:'game-day-1-08:00'}));
  const names=['Айдар','Нурлан','Диас','Санжар','Ернар','Мирас','Азамат','Рауан','Бекзат','Жандос','Медет','Али'];
  let i=1;while(people.length<1000){const id=`Q-${String(i).padStart(5,'0')}`;i++;if(people.some(p=>p.id===id))continue;
    const idx=people.length;people.push({id,displayName:`${names[idx%names.length]} ${String.fromCharCode(65+idx%22)}.`,roleTier:idx<30?'secondary':'background',blockId:'ABCD'[idx%4],status:'active',portraitAssetId:'portrait.default',spriteId:'character.prisoner.generic',observations:[`EVT-${5000+idx}`],riskAssessment:{label:'LOW',modelVersion:'not-trained'},storyFlags:{},lastUpdatedAt:'game-day-1-08:00'});
  }
  return people;
}
export function provisionalRisk(events=[]){const active=events.filter(e=>e.isActiveForAnalysis);
  const severity=active.reduce((sum,e)=>sum+e.severity,0);return severity>=6?'HIGH':severity>=3?'MEDIUM':'LOW';
}
export async function createDossierStore(storage,manifest=null){
  let profiles=await storage.get('dossiers',null);
  if(!Array.isArray(profiles)||profiles.length!==1000){
    try{const generator=await import('../data/prisonerGenerator.js');profiles=generator.generatePrisoners({seed:2026,manifest});}
    catch{profiles=fallbackPrisoners();}
    await storage.set('dossiers',profiles);
  }
  let observations=await storage.get('observations',null);
  if(!observations||typeof observations!=='object'){
    observations={};
    for(const p of profiles)for(const ref of p.observations||[]){const id=typeof ref==='string'?ref:ref.id;
      if(!observations[id])observations[id]={id,prisonerId:p.id,cameraId:'CAM-01',gameTick:10,type:'warning',severity:1+(id.charCodeAt(id.length-1)%3),reviewStatus:'unreviewed',isActiveForAnalysis:true};
    }
    await storage.set('observations',observations);
  }
  let audit=await storage.get('audit',[]);
  if(!Array.isArray(audit))audit=[];
  const index=new Map(profiles.map((p,i)=>[p.id,i]));
  const api={
    count:()=>profiles.length,
    all:()=>profiles,
    find:id=>profiles[index.get(id)]||null,
    search:(query='',page=0,size=12)=>{
      const q=String(query).trim().toLowerCase();const filtered=profiles.filter(p=>!q||p.id.toLowerCase().includes(q)||p.displayName.toLowerCase().includes(q));
      return {total:filtered.length,page,items:filtered.slice(page*size,(page+1)*size)};
    },
    events:id=>{const p=api.find(id);return p?(p.observations||[]).map(ref=>observations[typeof ref==='string'?ref:ref.id]).filter(Boolean):[];},
    risk:id=>provisionalRisk(api.events(id)),
    audit:()=>[...audit],
    async updateObservation(id,eventId,reviewStatus,gameTick=0){
      if(!['incorrect','confirmed','unreviewed'].includes(reviewStatus))throw new RangeError('Invalid review status');
      const p=api.find(id),current=observations[eventId];
      if(!p||!current||current.prisonerId!==id)throw new Error('Event not found');
      const next={...current,reviewStatus,isActiveForAnalysis:reviewStatus!=='incorrect'};
      observations[eventId]=next;
      const entry=makeAuditEntry({prisonerId:id,eventId,action:reviewStatus==='incorrect'?'mark_incorrect':'restore',previous:current,next,gameTick});
      audit=appendAudit(audit,entry);
      p.lastUpdatedAt=`game-day-3-${String(gameTick%24).padStart(2,'0')}:00`;
      p.riskAssessment={label:api.risk(id),modelVersion:'provisional-ui-only'};
      await Promise.all([storage.set('observations',observations),storage.set('audit',audit),storage.set('dossiers',profiles)]);
      return {event:next,audit:entry,provisionalRisk:p.riskAssessment.label};
    }
  };
  return api;
}
