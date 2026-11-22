/**
 * Original 32×32 directional sprite painter for QAMAL actors.
 * Front / back / left / right are visibly distinct; two walk frames
 * alternate legs and arms, and the same style works for the guard.
 */
export const FACING_DIRECTIONS=Object.freeze(['up','down','left','right']);

/**
 * Shared visual language: every human in QAMAL uses the same 32px proportions
 * and four-direction animation. Colour, hair and badge distinguish characters.
 */
const HUMAN_VARIANTS=Object.freeze([
  {cloth:'#607f75',light:'#92b3a5',dark:'#405b56',hair:'#272e35'},
  {cloth:'#657d8b',light:'#9aafb4',dark:'#405564',hair:'#44352e'},
  {cloth:'#827a65',light:'#b4a58b',dark:'#595343',hair:'#2a262d'},
  {cloth:'#776b81',light:'#a597ad',dark:'#51475a',hair:'#47372d'},
  {cloth:'#85745d',light:'#b6a083',dark:'#584d3d',hair:'#34313e'},
  {cloth:'#548075',light:'#8fb8a9',dark:'#365b53',hair:'#5c4535'}
]);
const UNIQUE_CHARACTERS=Object.freeze({
  erasyl:{cloth:'#a67f50',light:'#d8aa70',dark:'#705737',hair:'#29252b'},
  arman:{cloth:'#527766',light:'#87aa87',dark:'#34544b',hair:'#383036'},
  ruslan:{cloth:'#727b91',light:'#a1acc0',dark:'#4e586e',hair:'#24252a'},
  daniyar:{cloth:'#7d755f',light:'#b0a78f',dark:'#585346',hair:'#513c2e'},
  madina:{cloth:'#7f6e88',light:'#b19cc1',dark:'#56495e',hair:'#302832'},
  timur:{cloth:'#638187',light:'#9cb7b6',dark:'#40575e',hair:'#302d32'},
  svetlana:{cloth:'#887365',light:'#b8a28f',dark:'#5c4b43',hair:'#352b2b'},
  bakyt:{cloth:'#617d73',light:'#94b2a2',dark:'#42594e',hair:'#49372f'}
});
function nameHash(name){
  let n=2166136261;
  for(const ch of String(name||'')){n=Math.imul(n^ch.charCodeAt(0),16777619);}
  return n>>>0;
}
export function characterPalette(kind='player',characterId=''){
  const id=String(characterId||'').toLowerCase();
  const hash=nameHash(id);
  const variant=UNIQUE_CHARACTERS[id]||HUMAN_VARIANTS[hash%HUMAN_VARIANTS.length];
  if(kind==='police')return {cloth:'#213f5f',light:'#5485a5',dark:'#152b47',
    hair:'#1a2939',skin:'#cda17e',accent:'#d9c18c',badge:true,hairStyle:0};
  if(kind==='guard')return {cloth:'#386891',light:'#6d9fbc',dark:'#284667',
    hair:'#1c2d40',skin:'#cda17e',accent:'#d8ceae',badge:true,hairStyle:hash%3};
  return {...variant,skin:['#cfa07d','#bd8a6d','#dfaf8d'][hash%3],
    accent:kind==='player'?'#eacb91':'#d8cfa9',
    badge:false,hairStyle:hash%3};
}

export function normalizeFacing(value){return FACING_DIRECTIONS.includes(value)?value:'down';}
export function facingFromStep(from,to,fallback='down'){
  const dx=(to?.col??to?.x??0)-(from?.col??from?.x??0);
  const dy=(to?.row??to?.y??0)-(from?.row??from?.y??0);
  if(Math.abs(dx)>Math.abs(dy))return dx>0?'right':'left';
  if(dy!==0)return dy>0?'down':'up';
  return normalizeFacing(fallback);
}
export function drawDirectionalCharacter(ctx,x,y,{
  facing='down',walkFrame=0,moving=false,kind='player',characterId=''
}={}){
  const direction=normalizeFacing(facing);
  const guard=kind==='guard'||kind==='police',police=kind==='police';
  const look=characterPalette(kind,characterId);
  const cloth=look.cloth,clothLight=look.light,clothDark=look.dark;
  const skin=look.skin,hair=look.hair;
  const boot='#182935',eye='#23232a';
  const alt=moving?(walkFrame%2?1:-1):0;
  const R=(xx,yy,w,h,c)=>{ctx.fillStyle=c;ctx.fillRect(xx,yy,w,h);};
  ctx.save();
  ctx.translate(Math.round(x),Math.round(y));
  if(direction==='right'){ctx.translate(32,0);ctx.scale(-1,1);}
  // Keep the shadow aligned to the actor, never rotated away from the tile.
  R(7,29,19,2,'rgba(0,0,0,.4)');
  if(direction==='down'){
    R(9+alt,25,6,5,clothDark);R(18-alt,25,6,5,clothDark);
    R(9+alt,29,7,3,boot);R(18-alt,29,7,3,boot);
    R(6,15+alt,5,12,clothDark);R(25,15-alt,5,12,clothDark);
    R(8,14,18,14,cloth);R(9,15,16,3,clothLight);
    R(9,24,16,3,clothDark);R(15,24,4,2,'#bfc6b6');
    R(9,4,16,13,skin);R(8,4,18,5,hair);R(10,3,14,3,hair);
    R(8,7,3,5,hair);R(23,7,3,5,hair);
    R(11,11,4,2,eye);R(19,11,4,2,eye);
    R(16,13,2,2,'#a8785f');R(14,16,6,1,'#87564e');
    if(guard){R(10,4,14,5,clothDark);R(8,7,18,3,cloth);R(11,17,5,3,'#ddd2a3');}
  }else if(direction==='up'){
    R(9-alt,25,6,5,clothDark);R(18+alt,25,6,5,clothDark);
    R(9-alt,29,7,3,boot);R(18+alt,29,7,3,boot);
    R(6,16-alt,5,11,clothDark);R(25,16+alt,5,11,clothDark);
    R(8,14,18,14,cloth);R(10,15,14,3,clothLight);
    R(11,21,12,4,clothDark);R(15,17,4,3,'#8b7662');
    R(9,4,16,13,hair);R(8,6,18,10,hair);R(10,3,13,4,hair);
    R(9,12,16,3,'#574e4a');
    if(guard){R(9,4,16,8,clothDark);R(10,10,14,3,cloth);R(11,17,12,4,clothLight);}
  }else{
    // Left-facing profile. Right-facing version mirrors the entire drawing.
    R(11-alt,25,5,5,clothDark);R(19+alt,25,5,5,clothDark);
    R(9-alt,29,8,3,boot);R(19+alt,29,6,3,boot);
    R(17,16+alt,8,11,clothDark);R(7,17-alt,7,10,clothLight);
    R(9,14,17,14,cloth);R(11,15,14,3,clothLight);
    R(10,24,15,3,clothDark);R(15,24,4,2,'#bfc6b6');
    R(10,4,16,13,skin);R(11,3,16,5,hair);R(19,6,8,11,hair);
    R(7,10,4,5,skin);R(11,11,4,2,eye);R(8,14,4,2,'#a6745e');
    R(12,16,7,1,'#855a51');
    if(guard){R(10,4,15,4,clothDark);R(9,7,18,3,cloth);}
  }
  // All humans share the same shoulder seams, uniform crease and pixel grid.
  R(10,18,2,4,clothDark);R(22,18,2,4,clothLight);
  R(12,22,8,1,clothLight);
  // Slightly different hairlines and accessories make named NPCs recognizable.
  if(!guard){
    if(look.hairStyle===0)R(13,5,7,2,hair);
    else if(look.hairStyle===1)R(9,5,5,4,hair);
    else R(20,6,4,5,hair);
    R(21,23,3,2,look.accent); // small cell-block patch
  }else{
    R(12,18,4,3,look.accent); // security identification badge
  }
  if(police){
    // Police star emblem, visible on all four directional uniforms.
    R(17,19,5,5,'#d6bd7e');
    R(19,20,2,2,'#223b50');
  }
  // Subtle highlights to keep the 32px artwork readable over dark concrete.
  R(8,18,1,6,clothLight);R(25,18,1,6,clothDark);
  ctx.restore();
}
