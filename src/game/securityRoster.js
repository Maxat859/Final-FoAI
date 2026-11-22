/**
 * Fictional QAMAL staff roster. Some officers continuously patrol, others
 * stand at their posts; different shifts are active by day and at night.
 */
const staff=(id,floor,x,y,mode,route=[],role='guard',shift='all')=>({
  id,floor,x,y,mode,role,shift,detectionRadius:role==='police'?3:4,
  patrolRoute:route.map(([xx,yy])=>({x:xx,y:yy}))
});
const patrol=(id,floor,points,shift='all',role='guard')=>
  staff(id,floor,points[0][0],points[0][1],'patrol',points,role,shift);
const post=(id,floor,x,y,shift='all',role='guard')=>
  staff(id,floor,x,y,'post',[],role,shift);

export const SECURITY_ROSTER=Object.freeze([
  // Chapter-one officers: original AI demonstrations remain at their locations.
  patrol('guard1',1,[[21,10],[26,10],[26,12],[21,12]]),
  patrol('guard2',1,[[25,5],[26,5],[26,6],[22,6],[22,5]]),
  patrol('guard3',2,[[31,12],[35,12],[35,15],[31,15]]),
  patrol('guard4',2,[[42,19],[45,19],[45,23],[42,23]]),
  patrol('guard5',1,[[62,12],[68,12],[73,12]]),
  patrol('guard6',1,[[20,49],[26,49],[35,49]]),
  patrol('guard7',2,[[76,23],[83,23],[88,23]]),
  patrol('guard8',2,[[42,61],[49,61],[55,61]]),

  // North-east residential/service corridors.
  patrol('watch-a1',1,[[55,12],[65,12],[79,12],[70,12]],'day'),
  patrol('watch-a2',1,[[70,24],[84,24],[96,24]],'all'),
  patrol('watch-a3',1,[[55,36],[70,36],[91,36]],'night'),
  patrol('watch-a4',2,[[55,12],[65,12],[83,12]],'all'),
  patrol('watch-a5',2,[[70,24],[84,24],[96,24]],'day'),
  patrol('watch-a6',2,[[55,36],[70,36],[92,36]],'night'),

  // Southern living blocks, study/workshops and utility rooms.
  patrol('watch-s1',1,[[8,49],[22,49],[36,49]],'all'),
  patrol('watch-s2',1,[[22,62],[36,62],[49,62]],'day'),
  patrol('watch-s3',1,[[8,70],[22,70],[50,70]],'night'),
  patrol('watch-s4',2,[[8,49],[22,49],[36,49]],'day'),
  patrol('watch-s5',2,[[22,62],[36,62],[49,62]],'night'),
  patrol('watch-s6',2,[[8,70],[22,70],[50,70]],'all'),

  // Fixed checkpoints, reception and watchposts.
  post('post-entrance-1',1,49,12),
  post('post-entrance-2',1,49,23),
  post('post-warehouse',1,60,63),
  post('post-cellblock',1,71,36,'night'),
  post('post-office-2',2,49,12),
  post('post-reception-2',2,49,23),
  post('post-gallery-2',2,60,63),
  post('post-cellblock-2',2,71,36,'night'),

  // Outside courtyard officers with friendly-looking service dogs; daytime
  // guards make rounds while a night post remains at the gate.
  patrol('police-yard-a',1,[[64,41],[82,41],[89,43],[70,43]],'day','police'),
  patrol('police-yard-b',1,[[89,55],[75,55],[65,53],[85,53]],'all','police'),
  patrol('police-yard-c',1,[[70,51],[70,57],[82,57],[82,49]],'night','police'),
  post('police-yard-gate',1,59,48,'all','police'),
  post('police-yard-tower',1,96,42,'all','police')
]);
export const DOG_ROSTER=Object.freeze([
  {id:'k9-rex',floor:1,handlerId:'police-yard-a',x:65,y:41,name:'Рекс'},
  {id:'k9-bars',floor:1,handlerId:'police-yard-b',x:90,y:55,name:'Барс'},
  {id:'k9-juldyz',floor:1,handlerId:'police-yard-c',x:71,y:51,name:'Жұлдыз'}
]);
export const SECURITY_COUNT=SECURITY_ROSTER.length;
