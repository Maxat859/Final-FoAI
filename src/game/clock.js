// One game day is exactly 40 minutes of active play. Paused on menus/dialogs.
export const DAY_MS=40*60*1000;
export const HOUR_MS=DAY_MS/24;
export function createClock(savedMs=0){
  let elapsed=((Number(savedMs)||0)%DAY_MS+DAY_MS)%DAY_MS;
  return {
    advance(realMs){elapsed=(elapsed+Math.max(0,Math.min(1000,realMs)))%DAY_MS;},
    get elapsedMs(){return elapsed;},
    get hour(){return Math.floor(elapsed/HOUR_MS);},
    get minutes(){return Math.floor(elapsed/HOUR_MS*60)%60;},
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
