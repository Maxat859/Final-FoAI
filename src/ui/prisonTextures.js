/**
 * Original QAMAL 32x32 pixel-art tiles, rendered as crisp Canvas rectangles.
 * Every tile has concrete grain, bevelled metal and object-specific detail.
 * Deterministic textures: camera scrolling does not cause flickering.
 */
const R=(ctx,x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
const D=(ctx,x,y,s,color)=>R(ctx,x,y,s,s,color);
function hash(row,col,n){let v=(row+53)*1103515245^(col+107)*1234567^(n*2654435761);v^=v>>>16;return v>>>0;}
function metal(ctx,x,y,w,h,light='#9daab1',dark='#243643'){
  R(ctx,x,y,w,h,dark);R(ctx,x+1,y+1,w-2,h-3,'#60717c');
  R(ctx,x+2,y+1,w-4,2,light);R(ctx,x+2,y+h-3,w-4,2,'#1b2934');
}
function rivets(ctx,x,y,w,h){
  for(const [dx,dy] of [[2,2],[w-4,2],[2,h-4],[w-4,h-4]])
    D(ctx,x+dx,y+dy,2,'#b6b1a1');
}
function concrete(ctx,x,y,row,col,dark=false){
  const a=dark?'#283b47':'#485963',b=dark?'#304655':'#526570',line=dark?'#20333e':'#344651';
  R(ctx,x,y,32,32,a);R(ctx,x,y,32,2,b);
  R(ctx,x,y+30,32,2,'#1c2f3b');
  R(ctx,x+15,y,1,32,line);R(ctx,x,y+15,32,1,line);
  for(let i=0;i<14;i++){
    const px=(hash(row,col,i*3)%28)+2,py=(hash(row,col,i*3+1)%28)+2;
    D(ctx,x+px,y+py,i%3===0?2:1,i%2?'#60727c':'#344b55');
  }
  R(ctx,x+3,y+3,8,1,dark?'#526777':'#79818a');
}
function drawStructure(ctx,t,x,y,row,col){
  const steel=t==='K',bars=t==='G'||t==='B';
  if(steel){
    R(ctx,x,y,32,32,'#263641');R(ctx,x,y,32,5,'#778892');
    R(ctx,x+3,y+7,26,20,'#3c525e');R(ctx,x+6,y+9,20,16,'#263c49');
    R(ctx,x+15,y+7,2,19,'#192c38');R(ctx,x+6,y+16,20,2,'#192c38');
    rivets(ctx,x+3,y+6,26,23);R(ctx,x,y+29,32,3,'#172732');
    return;
  }
  if(bars){
    R(ctx,x,y,32,32,'#203540');R(ctx,x,y,32,4,'#8e9696');
    R(ctx,x+1,y+5,30,23,'#1a303e');
    for(let i=0;i<5;i++){
      R(ctx,x+2+i*7,y+4,3,25,i%2?'#a2aeb0':'#c3c6be');
      R(ctx,x+2+i*7,y+4,1,25,'#d7d0b8');
    }
    R(ctx,x,y+15,32,4,'#556b77');
    R(ctx,x,y+16,32,1,'#c2b99e');
    if(t==='B'){R(ctx,x+14,y+12,8,10,'#b79a59');D(ctx,x+17,y+16,3,'#273942');}
    return;
  }
  // Concrete block wall, brick bonds and chipped corners.
  R(ctx,x,y,32,32,'#283f4b');R(ctx,x,y,32,6,'#627987');
  R(ctx,x+1,y+6,30,22,'#425866');R(ctx,x,y+29,32,3,'#162936');
  R(ctx,x,y+13,32,2,'#233b48');R(ctx,x+15,y+7,2,6,'#1c3541');
  R(ctx,x+8,y+15,2,14,'#1c3541');R(ctx,x+26,y+16,2,13,'#253a47');
  R(ctx,x+3,y+10,10,1,'#70818a');R(ctx,x+18,y+19,10,1,'#70818a');
  if(hash(row,col,2)%4===0){R(ctx,x+23,y+22,5,2,'#1b3440');R(ctx,x+25,y+24,2,3,'#172c38');}
}
function stairs(ctx,x,y,up){
  R(ctx,x,y,32,32,'#152a34');
  for(let i=0;i<6;i++){
    const xx=x+3+i*2,yy=up?y+4+i*4:y+27-i*4;
    R(ctx,xx,yy,27-i*3,3,i%2?'#80919a':'#627984');
    R(ctx,xx,yy+2,27-i*3,1,'#263843');
  }
  R(ctx,x+14,y+9,5,14,'#e6c17b');
  R(ctx,x+10,y+(up?9:18),13,4,'#e6c17b');
  R(ctx,x+2,y+2,28,2,'#b2b3a4');
}
function prop(ctx,t,x,y){
  switch(t){
  case 'b': // iron bunk with blanket, pillow and legs
    metal(ctx,x+3,y+2,26,29,'#b3b6b4','#253946');
    R(ctx,x+6,y+5,20,23,'#6c8591');R(ctx,x+8,y+7,16,7,'#e1d9bb');
    R(ctx,x+7,y+15,18,11,'#558190');R(ctx,x+7,y+16,18,3,'#8eb0b7');
    R(ctx,x+4,y+28,3,4,'#1e303a');R(ctx,x+26,y+28,3,4,'#1e303a');break;
  case 'q': // toilet
    metal(ctx,x+7,y+3,18,10,'#d1d6c9','#516570');
    R(ctx,x+8,y+14,16,13,'#93a9ae');R(ctx,x+10,y+15,12,10,'#e4e0d1');
    R(ctx,x+13,y+17,6,6,'#4d7986');R(ctx,x+10,y+27,12,4,'#8fa1a0');break;
  case 's': // washbasin with pipe
    metal(ctx,x+5,y+5,22,22,'#d4d4c8','#52727c');
    R(ctx,x+7,y+7,18,16,'#c6d4d1');R(ctx,x+10,y+10,12,10,'#5d9aab');
    R(ctx,x+14,y+2,4,9,'#ccd3c5');R(ctx,x+11,y+4,10,3,'#a3b0ac');
    D(ctx,x+15,y+17,3,'#1e4657');break;
  case 'l': // locker
    metal(ctx,x+3,y+2,26,29,'#9ca5a4','#2a3e4a');
    R(ctx,x+7,y+7,18,20,'#536875');
    for(let i=0;i<4;i++)R(ctx,x+11,y+10+i*3,10,1,'#a8ada8');
    R(ctx,x+22,y+20,2,5,'#d5be81');break;
  case 'h': // shower stall
    metal(ctx,x+4,y+4,24,24,'#b5c1c0','#385864');
    R(ctx,x+7,y+7,18,17,'#406f7b');R(ctx,x+13,y+3,4,8,'#d7cab9');
    R(ctx,x+10,y+11,12,2,'#bdc8bc');D(ctx,x+11,y+16,2,'#7dc2cd');
    D(ctx,x+19,y+19,2,'#7dc2cd');break;
  case 'm': // mess hall / workshop table
    R(ctx,x+3,y+3,26,26,'#3a3b37');
    R(ctx,x+4,y+5,24,20,'#927b5a');R(ctx,x+4,y+5,24,3,'#c7a777');
    R(ctx,x+7,y+12,8,6,'#cfbb8f');R(ctx,x+19,y+12,7,5,'#4e7472');
    R(ctx,x+6,y+26,5,5,'#382e27');R(ctx,x+22,y+26,5,5,'#382e27');break;
  case 'd': // desk
    metal(ctx,x+3,y+4,26,25,'#ab9471','#403932');
    R(ctx,x+5,y+7,22,18,'#877056');
    R(ctx,x+8,y+11,10,7,'#cfbd9d');R(ctx,x+20,y+10,5,3,'#314957');
    R(ctx,x+4,y+27,5,4,'#302f2c');R(ctx,x+24,y+27,5,4,'#302f2c');break;
  case 't': // terminal with green CRT
    metal(ctx,x+4,y+5,24,23,'#9aa5a4','#213946');
    R(ctx,x+7,y+7,18,13,'#0b2534');
    R(ctx,x+9,y+9,13,3,'#62d2ad');R(ctx,x+9,y+15,9,2,'#81bca8');
    R(ctx,x+10,y+23,12,3,'#bdb599');D(ctx,x+25,y+24,2,'#e1b45e');break;
  case 'c': // camera dome
    metal(ctx,x+6,y+4,20,8,'#d4d0bc','#697985');
    R(ctx,x+9,y+10,14,8,'#6e8691');R(ctx,x+5,y+17,22,10,'#2b414f');
    D(ctx,x+11,y+19,11,'#1a2c3b');D(ctx,x+14,y+20,6,'#548f9b');
    D(ctx,x+16,y+21,2,'#c8706f');break;
  case 'v': // ventilation grille
    metal(ctx,x+4,y+4,24,24,'#a3aaab','#20333f');
    for(let i=0;i<5;i++)R(ctx,x+8,y+9+i*3,16,1,'#94a5ad');
    break;
  case 'k': // supply crate
    R(ctx,x+3,y+3,26,27,'#926d4a');R(ctx,x+5,y+5,22,23,'#6b523b');
    R(ctx,x+8,y+5,4,22,'#ccac76');R(ctx,x+21,y+5,3,22,'#ad895c');
    R(ctx,x+5,y+15,22,3,'#b48e62');break;
  case 'p': // pipes along floor
    R(ctx,x+4,y,6,32,'#aa9c85');R(ctx,x+6,y,2,32,'#dbc79d');
    R(ctx,x+19,y,5,32,'#73868a');R(ctx,x+2,y+10,26,5,'#8d9b9a');
    R(ctx,x+2,y+12,26,1,'#d2bba5');break;
  case 'w': // frosted cell window
    metal(ctx,x+3,y+3,26,26,'#bac4bb','#283744');
    R(ctx,x+7,y+7,18,18,'#345567');R(ctx,x+9,y+9,14,14,'#547f91');
    R(ctx,x+15,y+7,3,18,'#c9c3ad');R(ctx,x+7,y+15,18,3,'#c9c3ad');break;
  case 'L': // fluorescent ceiling light
    metal(ctx,x+5,y+5,22,22,'#9ea4a1','#273d4a');
    R(ctx,x+11,y+7,10,18,'#f0dca5');R(ctx,x+14,y+9,4,15,'#fff5cb');break;
  case 'D': // heavy metal locked door
    metal(ctx,x+2,y+1,28,30,'#abb7b7','#1c3341');
    R(ctx,x+6,y+5,20,21,'#415b6b');R(ctx,x+7,y+6,18,3,'#738c99');
    R(ctx,x+10,y+12,12,9,'#1b3444');R(ctx,x+11,y+13,10,2,'#c4b477');
    R(ctx,x+13,y+16,6,3,'#67c8ab');D(ctx,x+25,y+22,2,'#e9be76');break;
  case 'E':
    metal(ctx,x+2,y+2,28,29,'#b5d3ae','#1d4d46');
    R(ctx,x+6,y+5,20,22,'#397867');
    R(ctx,x+10,y+10,11,10,'#a2e8ba');R(ctx,x+15,y+12,9,3,'#133f35');
    R(ctx,x+21,y+22,4,3,'#e5cc8b');break;
  }
}

export function paintPrisonTile(ctx,t,x,y,row,col,floor=1,opened=false){
  // Concrete underlays vary by level, but every tile is 32x32 pixel aligned.
  concrete(ctx,x,y,row,col,floor===2);
  if(t==='#'||t==='K'||t==='G'||t==='B'){
    drawStructure(ctx,t,x,y,row,col);return;
  }
  if(t==='U'||t==='N'){stairs(ctx,x,y,t==='U');return;}
  if(t==='D'&&opened){
    R(ctx,x+2,y+3,28,27,'#182d3a');
    R(ctx,x+2,y+3,3,26,'#95a9aa');R(ctx,x+27,y+3,3,26,'#95a9aa');
    R(ctx,x+6,y+28,20,3,'#438c72');return;
  }
  if(t!=='.')prop(ctx,t,x,y);
}
