/** Fictional prison timetable; time advances when gameplay runs, not by wall clock. */
export const START_TIME=6*60;
export const MINUTES_PER_TICK=0; // NPC actions and player steps must not speed up the clock.
export const REAL_DAY_MS=40*60*1000;
export const GAME_MINUTES_PER_DAY=24*60;
export const WEEKDAY_NAMES=Object.freeze(['ПОНЕДЕЛЬНИК','ВТОРНИК','СРЕДА','ЧЕТВЕРГ','ПЯТНИЦА','СУББОТА','ВОСКРЕСЕНЬЕ']);
export function weekdayForDay(day){
  const positive=Number.isInteger(day)&&day>0?day:1;
  return WEEKDAY_NAMES[(positive-1)%WEEKDAY_NAMES.length];
}
export const REAL_MS_PER_GAME_MINUTE=REAL_DAY_MS/GAME_MINUTES_PER_DAY;
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
  const remainder=Number(raw?.minuteFraction);
  return Number.isFinite(remainder)&&remainder>=0&&remainder<1
    ?{minutes,day,minuteFraction:remainder}:{minutes,day};
}
export function advancePrisonClock(clock,step=MINUTES_PER_TICK){
  const now=makePrisonClock(clock),extra=Math.max(0,Math.floor(Number(step)||0));
  const total=now.minutes+extra;
  const next={minutes:total%1440,day:now.day+Math.floor(total/1440)};
  if('minuteFraction' in now)next.minuteFraction=now.minuteFraction;
  return next;
}
/** Exactly 40 minutes of active game time = one 24-hour prison day.
 * Fractions are included in saved clocks so reloads don't lose progress.
 */
export function advancePrisonClockByRealTime(clock,elapsedMs){
  const current=makePrisonClock(clock);
  const millis=Number(elapsedMs);
  if(!Number.isFinite(millis)||millis<=0)return current;
  const elapsedMinutes=millis/REAL_MS_PER_GAME_MINUTE+(current.minuteFraction||0);
  const wholeMinutes=Math.floor(elapsedMinutes+1e-10);
  const fraction=Math.max(0,Math.min(0.9999999999,elapsedMinutes-wholeMinutes));
  const stepped=advancePrisonClock(current,wholeMinutes);
  return {...stepped,minuteFraction:fraction};
}
export function getRoutine(clock){
  const {minutes}=makePrisonClock(clock);
  for(let i=SCHEDULE.length-1;i>=0;i--)if(minutes>=SCHEDULE[i].from)return SCHEDULE[i];
  return SCHEDULE[0];
}
export function formatPrisonClock(clock){
  const {minutes,day}=makePrisonClock(clock);
  return {time:String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(minutes%60).padStart(2,'0'),
    day, weekday:weekdayForDay(day), ...getRoutine(clock)};
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
