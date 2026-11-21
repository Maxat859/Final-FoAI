import {ASSET_IDS,COLS,ROOM_LABELS,ROWS,TILE_SIZE} from '../config.js';
const TILE=TILE_SIZE;
const ICONS={'#':ASSET_IDS.wall,D:ASSET_IDS.door,B:ASSET_IDS.bars,b:ASSET_IDS.bed,d:ASSET_IDS.desk,t:ASSET_IDS.terminal,c:ASSET_IDS.camera,E:ASSET_IDS.exit};
function fallback(ctx,id,x,y,size){
  const wall=id.includes('wall'),floor=id.includes('floor'),guard=id.includes('guard'),character=id.includes('character');
  ctx.fillStyle=wall?'#425564':floor?'#2b3f4e':character?'#172b36':'#7e7466';ctx.fillRect(x,y,size,size);
  if(wall||floor){ctx.fillStyle=wall?'#607586':'#394d5a';ctx.fillRect(x+2,y+3,size-4,2);ctx.fillStyle='#152632';ctx.fillRect(x,y+size-3,size,3);}
  if(character){ctx.fillStyle='#101d28';ctx.fillRect(x+10,y+24,4,6);ctx.fillRect(x+18,y+24,4,6);ctx.fillStyle=guard?'#38547e':'#c88752';ctx.fillRect(x+7,y+11,18,14);ctx.fillStyle='#dbb593';ctx.fillRect(x+12,y+5,9,9);}
}
export function createRenderer(canvas,mini,assets={images:new Map()}){
  const ctx=canvas.getContext('2d'),miniCtx=mini.getContext('2d');
  if(!ctx||!miniCtx)throw new Error('Canvas 2D is unavailable');
  canvas.width=COLS*TILE;canvas.height=ROWS*TILE;ctx.imageSmoothingEnabled=false;miniCtx.imageSmoothingEnabled=false;
  function sprite(id,x,y,size=TILE,context=ctx){
    const img=assets.images?.get(id);
    if(img&&img.naturalWidth){context.drawImage(img,x,y,size,size);}else{fallback(context,id,x,y,size);}
  }
  function drawTile(r,c,world,context=ctx){
    const symbol=world[r][c],x=c*TILE,y=r*TILE;
    const floor=(r<8&&c>20)||(r>14&&c>14)?ASSET_IDS.floorDark:ASSET_IDS.floor;
    sprite(floor,x,y,TILE,context);
    if(ICONS[symbol])sprite(ICONS[symbol],x,y,TILE,context);
    context.strokeStyle='rgba(6,18,29,.19)';context.strokeRect(x+.5,y+.5,TILE,TILE);
  }
  function drawEntity(entity,highlight){
    const x=entity.col*TILE,y=entity.row*TILE;
    ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(x+8,y+27,17,3);
    sprite(entity.spriteId||ASSET_IDS.player,x,y);
    if(highlight){ctx.lineWidth=2;ctx.strokeStyle='#f3c66a';ctx.strokeRect(x+1,y+1,TILE-2,TILE-2);}
  }
  function frame({world,player,entities=[],seen=new Set(),route=[],alarm=0,mission={}}){
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#070c13';ctx.fillRect(0,0,canvas.width,canvas.height);
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(!seen.has(`${r},${c}`)){
        // Unexplored rooms are silhouettes, not a large empty black rectangle.
        const x=c*TILE,y=r*TILE,sym=world[r][c];
        ctx.fillStyle=sym==='#'?'#1a2b3a':'#0e1b28';ctx.fillRect(x,y,TILE,TILE);
        if(sym==='#'){ctx.fillStyle='#283c4c';ctx.fillRect(x+2,y+2,TILE-4,3);}
        ctx.strokeStyle='rgba(89,111,128,.08)';ctx.strokeRect(x+.5,y+.5,TILE,TILE);
      }else drawTile(r,c,world);
    }
    // Visible interactions are marked inside the game world, not hidden in side menus.
    const objectives=[{row:4,col:16,key:'learned',label:'CODE'},{row:11,col:26,key:'lockOpen',label:'CSP'},{row:3,col:25,key:'visitedCCTV',label:'CCTV'},{row:16,col:18,key:'dossiers',label:'FILE'}];
    for(const o of objectives){if(!seen.has(`${o.row},${o.col}`))continue;
      const x=o.col*TILE,y=o.row*TILE;
      const complete=Boolean(mission[o.key]);
      ctx.fillStyle=complete?'#4aaf87':'#efbd5d';ctx.fillRect(x+24,y+1,7,7);
      ctx.fillStyle='#09111b';ctx.font='bold 8px monospace';ctx.fillText(complete?'✓':'!',x+25,y+7);
    }
    for(const [label,col,row] of ROOM_LABELS){if(!seen.has(`${row},${col}`))continue;
      ctx.font='bold 9px monospace';ctx.fillStyle='rgba(7,15,23,.8)';ctx.fillRect(col*TILE+3,row*TILE+5,Math.ceil(ctx.measureText(label).width)+9,14);
      ctx.fillStyle='#d5e3e9';ctx.fillText(label,col*TILE+7,row*TILE+16);
    }
    if(Array.isArray(route))for(const point of route){if(!seen.has(`${point.row},${point.col}`))continue;
      ctx.fillStyle='rgba(240,191,90,.42)';ctx.fillRect(point.col*TILE+9,point.row*TILE+9,14,14);
    }
    for(const entity of entities)if(seen.has(`${entity.row},${entity.col}`))drawEntity(entity,false);
    // Player has a subtle visible halo; red flashing corners signal elevated alarm.
    const px=player.col*TILE+TILE/2,py=player.row*TILE+TILE/2;
    const aura=ctx.createRadialGradient(px,py,5,px,py,TILE*2);
    aura.addColorStop(0,'rgba(241,192,92,.17)');aura.addColorStop(1,'rgba(241,192,92,0)');
    ctx.fillStyle=aura;ctx.fillRect(px-TILE*2,py-TILE*2,TILE*4,TILE*4);
    drawEntity({...player,spriteId:ASSET_IDS.player},true);
    if(alarm>=60){ctx.strokeStyle='rgba(235,80,75,.65)';ctx.lineWidth=6;ctx.strokeRect(4,4,canvas.width-8,canvas.height-8);}
    drawMini({world,player,entities,seen});
  }
  function drawMini({world,player,entities=[],seen=new Set()}){
    const w=mini.width,h=mini.height,dx=w/COLS,dy=h/ROWS;
    miniCtx.fillStyle='#08111c';miniCtx.fillRect(0,0,w,h);
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(!seen.has(`${r},${c}`))continue;
      const sym=world[r][c];miniCtx.fillStyle=sym==='#'||sym==='B'?'#607b8c':sym==='E'?'#65c5a2':sym==='D'?'#ab9d77':'#304657';
      miniCtx.fillRect(Math.floor(c*dx),Math.floor(r*dy),Math.ceil(dx)+1,Math.ceil(dy)+1);
    }
    for(const e of entities)if(e.role==='guard'&&seen.has(`${e.row},${e.col}`)){miniCtx.fillStyle='#69a2d1';miniCtx.fillRect(e.col*dx,e.row*dy,4,4);}
    miniCtx.fillStyle='#eabd60';miniCtx.fillRect(player.col*dx-1,player.row*dy-1,6,6);
  }
  function cameraPreview(target,world,entities,camera={row:3,col:25}){
    const view=target.getContext('2d');if(!view)return;
    const maxCols=9,maxRows=6,startR=Math.max(0,Math.min(ROWS-maxRows,camera.row-3)),startC=Math.max(0,Math.min(COLS-maxCols,camera.col-4));
    target.width=maxCols*TILE;target.height=maxRows*TILE;view.imageSmoothingEnabled=false;
    for(let r=0;r<maxRows;r++)for(let c=0;c<maxCols;c++){
      const rr=startR+r,cc=startC+c,sym=world[rr][cc];
      view.fillStyle=sym==='#'?'#485965':sym==='B'?'#7a8792':'#263c4b';view.fillRect(c*TILE,r*TILE,TILE,TILE);
      if(sym==='D')view.fillStyle='#bb9863'; else if(sym==='E')view.fillStyle='#5bad8a';else continue;
      view.fillRect(c*TILE+8,r*TILE+5,16,24);
    }
    for(const e of entities)if(e.row>=startR&&e.row<startR+maxRows&&e.col>=startC&&e.col<startC+maxCols){
      const px=(e.col-startC)*TILE,py=(e.row-startR)*TILE;
      view.fillStyle=e.role==='guard'?'#6598ce':'#d19e63';view.fillRect(px+9,py+6,15,22);
    }
    view.fillStyle='rgba(113,217,178,.65)';view.font='10px monospace';view.fillText('● REC  CAM / SIMULATION',8,16);
  }
  return {frame,cameraPreview};
}
