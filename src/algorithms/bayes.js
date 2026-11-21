/** Posterior probability of a fictional alert event, from a binary sensor. */
export function bayesianUpdate({prior,sensitivity,falsePositive,signal='ALARM'}={}) {
  for(const [name,value] of Object.entries({prior,sensitivity,falsePositive})) {
    if(typeof value!=='number'||!Number.isFinite(value)||value<0||value>1)throw new RangeError(`${name} must be between 0 and 1`);
  }
  const positive=signal===true||signal==='ALARM'||signal==='positive';
  const negative=signal===false||signal==='NORMAL'||signal==='negative';
  if(!positive&&!negative)throw new RangeError('signal must be ALARM or NORMAL');
  const pGivenDanger=positive?sensitivity:1-sensitivity;
  const pGivenSafe=positive?falsePositive:1-falsePositive;
  const evidenceProbability=pGivenDanger*prior+pGivenSafe*(1-prior);
  if(evidenceProbability===0)return {posterior:null,evidenceProbability,defined:false};
  return {posterior:pGivenDanger*prior/evidenceProbability,evidenceProbability,defined:true};
}
export function formatProbability(x){return x===null?'Невозможно вычислить':`${(x*100).toFixed(1)}%`;}
