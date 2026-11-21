export const DEFAULT_MISSION={learned:false,lockOpen:false,visitedCCTV:false,bayesDone:false,finished:false};
export const OBJECTIVES=[
 ['learned','Пройти задание Python или Go'],
 ['lockOpen','Решить логический CSP-замок'],
 ['visitedCCTV','Изучить виртуальную систему CCTV'],
 ['bayesDone','Проверить сигнал алгоритмом Байеса'],
 ['finished','Найти выход (зелёная клетка)']
];
export function objective(mission){return OBJECTIVES.find(([k])=>!mission[k])?.[1]||'Глава завершена';}
export function canFinish(mission){return !!(mission.learned&&mission.lockOpen&&mission.visitedCCTV&&mission.bayesDone);}
export function markMission(mission,key){if(!(key in DEFAULT_MISSION))throw new Error('Unknown mission flag');return {...mission,[key]:true};}
