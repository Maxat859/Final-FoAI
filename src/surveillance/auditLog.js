export function makeAuditEntry({prisonerId,eventId,action,previous,next,gameTick=0}){
  if(!prisonerId||!eventId||!action)throw new Error('Incomplete audit entry');
  return {id:`AUD-${Date.now()}-${Math.floor(Math.random()*100000)}`,gameTick,actor:'player',prisonerId,eventId,action,previous:{...previous},next:{...next}};
}
export function appendAudit(log,entry){return [...log,entry];}
