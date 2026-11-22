/** Original four-way, two-frame 32px dog sprite for fictional K9 companions. */
import {normalizeFacing} from './characterSprite.js';
export function drawDog(ctx,x,y,{facing='down',moving=false,walkFrame=0}={}){
  const face=normalizeFacing(facing),step=moving?(walkFrame%2?1:-1):0;
  const R=(xx,yy,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(xx,yy,w,h);};
  ctx.save();ctx.translate(Math.round(x),Math.round(y));
  if(face==='right'){ctx.translate(32,0);ctx.scale(-1,1);}
  R(6,29,22,2,'rgba(0,0,0,.35)');
  const fur='#8e6d4b',light='#c19a6b',dark='#4c4236',ear='#382f2b';
  if(face==='up'){
    R(9,13,18,13,fur);R(7,7,20,11,fur);
    R(7,5,5,8,ear);R(23,5,5,8,ear);
    R(10,9,14,4,light);R(10,25,5,5,dark);R(20,25,5,5,dark);
    R(1,17-step,8,3,fur);R(7,21+step,5,6,fur);
  }else if(face==='down'){
    R(9,13,18,12,fur);R(7,8,20,12,light);
    R(7,5,6,10,ear);R(22,5,6,10,ear);
    R(11,16,12,6,light);R(14,19,6,3,ear);
    R(11,13,3,2,ear);R(22,13,3,2,ear);
    R(8,24+step,7,6,dark);R(20,24-step,7,6,dark);
    R(2,15-step,7,4,fur);
  }else{
    R(8,13,19,13,fur);R(6,9,13,11,light);
    R(7,6,5,9,ear);R(18,7,6,7,ear);
    R(3,15,5,6,light);R(2,17,5,3,dark);
    R(9,13,3,2,ear);
    R(11,24+step,6,6,dark);R(22,24-step,5,6,dark);
    R(24,13,6,4,fur);R(27,10+step,4,3,light);
  }
  // Bright service collar marks dogs as companions, not hostile creatures.
  R(10,18,17,3,'#547e95');R(19,18,3,3,'#e7bd75');
  ctx.restore();
}
