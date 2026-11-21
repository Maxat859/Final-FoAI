import {ASSET_IDS,COLS,ROOM_LABELS,ROWS,TILE_SIZE,VIEW_COLS,VIEW_ROWS} from '../config.js';
import {getCameraOffset} from '../game/camera.js';
import {doorDifficulty,doorId} from '../game/doorChallenges.js';

const TILE=TILE_SIZE;
const ICONS={'#':ASSET_IDS.wall,D:ASSET_IDS.door,B:ASSET_IDS.bars,b:ASSET_IDS.bed,d:ASSET_IDS.desk,t:ASSET_IDS.terminal,c:ASSET_IDS.camera,E:ASSET_IDS.exit};
const TARGETS=[
  {row:4,col:16,key:'learned'},
  {row:11,col:26,key:'lockOpen'},
  {row:3,col:25,key:'visitedCCTV'},
  {row:16,col:18,key:'dossiers'}
];

function fallback(ctx,id,x,y,size){
  const wall=id.includes('wall'),floor=id.includes('floor');
  const guard=id.includes('guard'),character=id.includes('character');
  ctx.fillStyle=wall?'#425564':floor?'#2b3f4e':character?'#172b36':'#7e7466';
  ctx.fillRect(x,y,size,size);
  if(wall||floor){
    ctx.fillStyle=wall?'#607586':'#394d5a';ctx.fillRect(x+2,y+3,size-4,2);
    ctx.fillStyle='#152632';ctx.fillRect(x,y+size-3,size,3);
  }
  if(character){
    ctx.fillStyle='#101d28';ctx.fillRect(x+10,y+24,4,6);ctx.fillRect(x+18,y+24,4,6);
    ctx.fillStyle=guard?'#38547e':'#c88752';ctx.fillRect(x+7,y+11,18,14);
    ctx.fillStyle='#dbb593';ctx.fillRect(x+12,y+5,9,9);
  }
}

export function createRenderer(canvas,mini,assets={images:new Map()}){
  const ctx=canvas.getContext('2d'),miniCtx=mini.getContext('2d');
  if(!ctx||!miniCtx)throw new Error('Canvas 2D is unavailable');
  // Render only a camera window, never the entire 48 x 32 map.
  let viewportCols=VIEW_COLS,viewportRows=VIEW_ROWS;
  function resize(){
    const screenWidth=typeof window==='undefined'?736:Math.max(300,window.innerWidth);
    const screenHeight=typeof window==='undefined'?480:Math.max(320,window.innerHeight);
    const tileOnScreen=Math.max(43,Math.min(84,Math.round(Math.min(screenWidth/14,screenHeight/9))));
    viewportCols=Math.min(COLS,Math.max(7,Math.ceil(screenWidth/tileOnScreen)));
    viewportRows=Math.min(ROWS,Math.max(6,Math.ceil(screenHeight/tileOnScreen)));
    canvas.width=viewportCols*TILE;
    canvas.height=viewportRows*TILE;
    ctx.imageSmoothingEnabled=false;miniCtx.imageSmoothingEnabled=false;
  }
  resize();

  function sprite(id,x,y,size=TILE,context=ctx){
    const img=assets.images?.get(id);
    if(img&&img.naturalWidth)context.drawImage(img,x,y,size,size);
    else fallback(context,id,x,y,size);
  }
  function drawTile(world,row,col,x,y){
    const symbol=world[row][col];
    const floor=(row<8&&col>20)||(row>14&&col>14)?ASSET_IDS.floorDark:ASSET_IDS.floor;
    sprite(floor,x,y);
    if(ICONS[symbol])sprite(ICONS[symbol],x,y);
    ctx.strokeStyle='rgba(6,18,29,.19)';
    ctx.strokeRect(x+.5,y+.5,TILE,TILE);
  }
  function drawEntity(entity,camera,highlight=false){
    const x=(entity.col-camera.col)*TILE,y=(entity.row-camera.row)*TILE;
    if(x < -TILE||y < -TILE||x >= canvas.width||y >= canvas.height)return;
    ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(x+8,y+27,17,3);
    sprite(entity.spriteId||ASSET_IDS.player,x,y);
    if(highlight){
      ctx.lineWidth=2;ctx.strokeStyle='#f3c66a';
      ctx.strokeRect(x+1,y+1,TILE-2,TILE-2);
    }
  }
  function frame({world,player,entities=[],seen=new Set(),visible=new Set(),route=[],alarm=0,mission={},unlockedDoors=[]}){
    const camera=getCameraOffset(player,world,viewportRows,viewportCols);
    const unlocked=new Set(unlockedDoors);
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#050a12';ctx.fillRect(0,0,canvas.width,canvas.height);

    // Three fog-of-war states: unknown = black, explored = dark, visible = lit.
    for(let vr=0;vr<viewportRows;vr++)for(let vc=0;vc<viewportCols;vc++){
      const r=camera.row+vr,c=camera.col+vc;
      if(r>=world.length||c>=world[r].length)continue;
      const key=r+','+c,x=vc*TILE,y=vr*TILE;
      if(!seen.has(key))continue; // Do not reveal wall outlines or rooms.
      drawTile(world,r,c,x,y);
      if(!visible.has(key)){
        ctx.fillStyle='rgba(2,8,16,.79)';
        ctx.fillRect(x,y,TILE,TILE);
      }
    }

    // Programming challenges are visible on door tiles as large, colored markers.
    for(let vr=0;vr<viewportRows;vr++)for(let vc=0;vc<viewportCols;vc++){
      const r=camera.row+vr,c=camera.col+vc;
      if(world[r]?.[c]!=='D'||!visible.has(r+','+c))continue;
      const id=doorId(r,c),done=unlocked.has(id),level=doorDifficulty(r,c);
      const x=vc*TILE,y=vr*TILE;
      ctx.fillStyle=done?'#386d60':level==='easy'?'#5e875a':level==='medium'?'#b98d40':'#a44a57';
      ctx.fillRect(x+3,y+2,TILE-6,14);
      ctx.strokeStyle=done?'#a5e3c3':'#ffe7b3';ctx.lineWidth=1;ctx.strokeRect(x+3.5,y+2.5,TILE-7,13);
      ctx.fillStyle='#fffbe5';ctx.font='bold 9px monospace';
      ctx.fillText(done?'OK':level==='easy'?'1*':level==='medium'?'2*':'3*',x+9,y+13);
    }
    // Objective indicators only appear once the object is actually in sight.
    for(const target of TARGETS){
      const key=target.row+','+target.col;
      if(!visible.has(key))continue;
      const x=(target.col-camera.col)*TILE,y=(target.row-camera.row)*TILE;
      if(x<0||y<0||x>=canvas.width||y>=canvas.height)continue;
      const completed=Boolean(mission[target.key]);
      ctx.fillStyle=completed?'#4aaf87':'#efbd5d';ctx.fillRect(x+23,y+1,8,8);
      ctx.fillStyle='#09111b';ctx.font='bold 8px monospace';ctx.fillText(completed?'✓':'!',x+25,y+8);
    }

    for(const [label,col,row] of ROOM_LABELS){
      if(!visible.has(row+','+col))continue;
      const x=(col-camera.col)*TILE,y=(row-camera.row)*TILE;
      if(x<0||y<0||x>canvas.width-30||y>canvas.height-20)continue;
      ctx.font='bold 9px monospace';
      ctx.fillStyle='rgba(7,15,23,.85)';
      ctx.fillRect(x+3,y+5,Math.ceil(ctx.measureText(label).width)+9,14);
      ctx.fillStyle='#d5e3e9';ctx.fillText(label,x+7,y+16);
    }

    if(Array.isArray(route))for(const point of route){
      if(!visible.has(point.row+','+point.col))continue;
      const x=(point.col-camera.col)*TILE,y=(point.row-camera.row)*TILE;
      if(x<0||y<0||x>=canvas.width||y>=canvas.height)continue;
      ctx.fillStyle='rgba(240,191,90,.42)';ctx.fillRect(x+9,y+9,14,14);
    }

    // An enemy behind a wall is not drawn, even if its cell was explored.
    for(const entity of entities){
      if(visible.has(entity.row+','+entity.col))drawEntity(entity,camera);
    }
    const px=(player.col-camera.col+.5)*TILE,py=(player.row-camera.row+.5)*TILE;
    const aura=ctx.createRadialGradient(px,py,5,px,py,TILE*2);
    aura.addColorStop(0,'rgba(241,192,92,.15)');aura.addColorStop(1,'rgba(241,192,92,0)');
    ctx.fillStyle=aura;ctx.fillRect(px-TILE*2,py-TILE*2,TILE*4,TILE*4);
    drawEntity({...player,spriteId:ASSET_IDS.player},camera,true);
    if(alarm>=60){
      ctx.strokeStyle='rgba(235,80,75,.65)';ctx.lineWidth=6;
      ctx.strokeRect(4,4,canvas.width-8,canvas.height-8);
    }
    drawMini({world,player,entities,seen,visible,camera});
  }

  function drawMini({world,player,entities,seen,visible,camera}){
    const w=mini.width,h=mini.height,dx=w/COLS,dy=h/ROWS;
    miniCtx.fillStyle='#050a12';miniCtx.fillRect(0,0,w,h);
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      const key=r+','+c;
      if(!seen.has(key))continue;
      const symbol=world[r][c];
      miniCtx.fillStyle=symbol==='#'||symbol==='B'?'#536c7b':
        symbol==='E'?'#65c5a2':symbol==='D'?'#ab9d77':'#304657';
      const x=Math.floor(c*dx),y=Math.floor(r*dy);
      miniCtx.fillRect(x,y,Math.ceil(dx)+1,Math.ceil(dy)+1);
      if(!visible.has(key)){
        miniCtx.fillStyle='rgba(2,6,12,.55)';
        miniCtx.fillRect(x,y,Math.ceil(dx)+1,Math.ceil(dy)+1);
      }
    }
    for(const entity of entities){
      if(entity.role!=='guard'||!visible.has(entity.row+','+entity.col))continue;
      miniCtx.fillStyle='#69a2d1';
      miniCtx.fillRect(entity.col*dx,entity.row*dy,3,3);
    }
    miniCtx.strokeStyle='rgba(222,181,96,.9)';
    miniCtx.lineWidth=1;
    miniCtx.strokeRect(camera.col*dx+.5,camera.row*dy+.5,viewportCols*dx,viewportRows*dy);
    miniCtx.fillStyle='#f4c66e';
    miniCtx.fillRect(player.col*dx-2,player.row*dy-2,5,5);
  }

  // CCTV panels are separate fictional cameras, not the player's field of view.
  function cameraPreview(target,world,entities,camera={row:3,col:25}){
    const view=target.getContext('2d');if(!view)return;
    const maxCols=9,maxRows=6;
    const startR=Math.max(0,Math.min(ROWS-maxRows,camera.row-3));
    const startC=Math.max(0,Math.min(COLS-maxCols,camera.col-4));
    target.width=maxCols*TILE;target.height=maxRows*TILE;view.imageSmoothingEnabled=false;
    for(let r=0;r<maxRows;r++)for(let c=0;c<maxCols;c++){
      const rr=startR+r,cc=startC+c,symbol=world[rr][cc];
      view.fillStyle=symbol==='#'?'#485965':symbol==='B'?'#7a8792':'#263c4b';
      view.fillRect(c*TILE,r*TILE,TILE,TILE);
      if(symbol==='D')view.fillStyle='#bb9863';
      else if(symbol==='E')view.fillStyle='#5bad8a';
      else continue;
      view.fillRect(c*TILE+8,r*TILE+5,16,24);
    }
    for(const e of entities){
      if(e.row<startR||e.row>=startR+maxRows||e.col<startC||e.col>=startC+maxCols)continue;
      const x=(e.col-startC)*TILE,y=(e.row-startR)*TILE;
      view.fillStyle=e.role==='guard'?'#6598ce':'#d19e63';
      view.fillRect(x+9,y+6,15,22);
    }
    view.fillStyle='rgba(113,217,178,.65)';
    view.font='10px monospace';view.fillText('● REC  CAM / SIMULATION',8,16);
  }
  return {frame,cameraPreview,resize,getViewport:()=>({rows:viewportRows,cols:viewportCols})};
}
