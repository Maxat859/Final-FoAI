// 40 minutes of active play per complete in-game 24-hour cycle.
// Day 1 is Monday. Menus and learning dialogs pause the clock.
export const DAY_MS=40*60*1000;
export const HOUR_MS=DAY_MS/24;
export const WEEKDAYS=['ПОНЕДЕЛЬНИК','ВТОРНИК','СРЕДА','ЧЕТВЕРГ','ПЯТНИЦА','СУББОТА','ВОСКРЕСЕНЬЕ'];
export function createClock(savedMs=0){
  let elapsed=Math.max(0,Number.isFinite(savedMs)?savedMs:0);
  const withinDay=()=>elapsed%DAY_MS;
  return {
    setElapsed(ms){elapsed=Math.max(0,Number.isFinite(ms)?ms:0);},
    advance(realMs){elapsed+=Math.max(0,Math.min(1000,realMs));},
    get elapsedMs(){return elapsed;},
    get dayNumber(){return Math.floor(elapsed/DAY_MS)+1;},
    get weekday(){return WEEKDAYS[(this.dayNumber-1)%7];},
    get hour(){return Math.floor(withinDay()/HOUR_MS);},
    get minutes(){return Math.floor(withinDay()/HOUR_MS*60)%60;},
    get time(){return String(this.hour).padStart(2,'0')+':'+String(this.minutes).padStart(2,'0');},
    get night(){return this.hour>=20||this.hour<6;},
    get phase(){
      const h=this.hour;
      if(h<6)return 'ТИХИЙ ЧАС';
      if(h<8)return 'ПОДЪЁМ И ПРОВЕРКА';
      if(h<12)return 'ЗАНЯТИЯ';
      if(h<14)return 'ОБЕД';
      if(h<18)return 'ПРОГУЛКА И РАБОТА';
      if(h<20)return 'ВЕЧЕРНЯЯ ПРОВЕРКА';
      return 'НОЧНОЙ РЕЖИМ';
    },
    get light(){const h=this.hour+this.minutes/60;return h>=6&&h<20?0:h>=5&&h<6?(6-h)*0.32:h>=20&&h<21?(h-20)*0.32:0.32;}
  };
}
