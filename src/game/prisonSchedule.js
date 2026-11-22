/** Fictional prison timetable; time advances when gameplay runs, not by wall clock. */
export const START_TIME=6*60+30;
export const MINUTES_PER_TICK=5;
export const SCHEDULE=[
  {from:0,name:'НОЧНАЯ ТИШИНА',phase:'night',duty:'night'},
  {from:6*60,name:'ПОДЪЁМ / ПЕРЕКЛИЧКА',phase:'dawn',duty:'day'},
  {from:7*60,name:'ЗАВТРАК',phase:'day',duty:'day'},
  {from:9*60,name:'УЧЁБНЫЕ ЗАНЯТИЯ',phase:'day',duty:'day'},
  {from:12*60,name:'ОБЕД',phase:'day',duty:'day'},
  {from:13*60,name:'ПРОГУЛКА И МАСТЕРСКИЕ',phase:'day',duty:'day'},
  {from:17*60,name:'ВЕЧЕРНЯЯ ПРОВЕРКА',phase:'dusk',duty:'day'},
  {from:18*60,name:'УЖИН',phase:'dusk',duty:'night'},
  {from:20*60,name:'ВОЗВРАЩЕНИЕ В КАМЕРЫ',phase:'night',duty:'night'},
  {from:22*60,name:'ОТБОЙ / НОЧНОЙ РЕЖИМ',phase:'night',duty:'night'}
];
export function makePrisonClock(raw){
  const minutes=Number.isFinite(raw?.minutes)?Math.max(0,Math.floor(raw.minutes))%1440:START_TIME;
  const day=Number.isInteger(raw?.day)&&raw.day>0?raw.day:1;
  return {minutes,day};
}
export function advancePrisonClock(clock,step=MINUTES_PER_TICK){
  const now=makePrisonClock(clock),extra=Math.max(0,Math.floor(Number(step)||0));
  const total=now.minutes+extra;
  return {minutes:total%1440,day:now.day+Math.floor(total/1440)};
}
export function getRoutine(clock){
  const {minutes}=makePrisonClock(clock);
  for(let i=SCHEDULE.length-1;i>=0;i--)if(minutes>=SCHEDULE[i].from)return SCHEDULE[i];
  return SCHEDULE[0];
}
export function formatPrisonClock(clock){
  const {minutes,day}=makePrisonClock(clock);
  return {time:String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0'),
    day, ...getRoutine(clock)};
}
export function lightLevel(clock){
  const minutes=makePrisonClock(clock).minutes;
  if(minutes<6*60||minutes>=21*60)return .67;
  if(minutes<7*60||minutes>=19*60)return .40;
  if(minutes<9*60||minutes>=17*60)return .20;
  return .05;
}
export function staffOnDuty(guard,clock){
  const shift=guard.shift||'all';
  return shift==='all'||shift===getRoutine(clock).duty;
}
