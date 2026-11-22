/**
 * Original 32×32 directional sprite painter for QAMAL actors.
 * Front / back / left / right are visibly distinct; two walk frames
 * alternate legs and arms, and the same style works for the guard.
 */
export const FACING_DIRECTIONS=Object.freeze(['up','down','left','right']);
export function normalizeFacing(value){return FACING_DIRECTIONS.includes(value)?value:'down';}
export function facingFromStep(from,to,fallback='down'){
  const dx=(to?.col??to?.x??0)-(from?.col??from?.x??0);
  const dy=(to?.row??to?.y??0)-(from?.row??from?.y??0);
  if(Math.abs(dx)>Math.abs(dy))return dx>0?'right':'left';
  if(dy!==0)return dy>0?'down':'up';
  return normalizeFacing(fallback);
}
export function drawDirectionalCharacter(ctx,x,y,{
  facing='down',walkFrame=0,moving=false,kind='player'
}={}){
  const direction=normalizeFacing(facing);
  const guard=kind==='guard',prisoner=kind==='prisoner';
  const cloth=guard?'#386891':prisoner?'#5e7c70':'#b88453';
  const clothLight=guard?'#6d9fbc':prisoner?'#83a495':'#d1a674';
  const clothDark=guard?'#284667':prisoner?'#3d6357':'#795636';
  const skin=guard?'#d6ae87':'#cb9672';
  const hair=guard?'#1c2d40':'#29252b';
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
  // Subtle highlights to keep the 32px artwork readable over dark concrete.
  R(8,18,1,6,clothLight);R(25,18,1,6,clothDark);
  ctx.restore();
}
