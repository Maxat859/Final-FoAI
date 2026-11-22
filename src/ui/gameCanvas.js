import {ASSET_IDS,COLS,roomLabelsFor,ROWS,TILE_SIZE,VIEW_COLS,VIEW_ROWS} from '../config.js';
import {paintPrisonTile} from './prisonTextures.js';
import {getCameraOffset} from '../game/camera.js';
import {doorDifficulty,doorId} from '../game/doorChallenges.js';
import {drawDirectionalCharacter} from './characterSprite.js';
import {drawDog} from './dogSprite.js';
import {lightLevel} from '../game/prisonSchedule.js';
import {expansionInteractions} from '../game/complexExpansion.js';

const TILE=TILE_SIZE;
const ICONS={'#':ASSET_IDS.wall,D:ASSET_IDS.door,B:ASSET_IDS.bars,b:ASSET_IDS.bed,d:ASSET_IDS.desk,t:ASSET_IDS.terminal,c:ASSET_IDS.camera,E:ASSET_IDS.exit};
const EXPANSION_HOTSPOTS={1:expansionInteractions(1),2:expansionInteractions(2)};
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
  function drawTile(world,row,col,x,y,floor,opened){
    paintPrisonTile(ctx,world[row][col],x,y,row,col,floor,opened);
  }
  function drawEntity(entity,camera,highlight=false){
    const x=(entity.col-camera.col)*TILE,y=(entity.row-camera.row)*TILE;
    if(x < -TILE||y < -TILE||x >= canvas.width||y >= canvas.height)return;
    ctx.fillStyle='rgba(0,0,0,.4)';ctx.fillRect(x+8,y+27,17,3);
    const playerSprite=highlight||entity.spriteId===ASSET_IDS.player;
    const guardSprite=entity.role==='guard'||entity.role==='escort'||entity.role==='police'||entity.spriteId===ASSET_IDS.guard||entity.spriteId===ASSET_IDS.senior;
    if(entity.role==='dog'){
      drawDog(ctx,x,y,{facing:entity.facing,walkFrame:entity.walkFrame,moving:entity.moving});
    }else if(playerSprite||guardSprite){
      drawDirectionalCharacter(ctx,x,y,{
        facing:entity.facing||'down',
        walkFrame:entity.walkFrame??((entity.row+entity.col)%2),
        moving:Boolean(entity.moving||entity.animation==='walk'),
        kind:entity.role==='police'?'police':guardSprite&&!playerSprite?'guard':'player'
      });
    }else sprite(entity.spriteId||ASSET_IDS.player,x,y);
    if(entity.sleeping){
      // Inactive residents rest in their cell beds while night patrols continue.
      ctx.fillStyle='#b6d9e8';
      ctx.font='bold 11px monospace';
      ctx.fillText('z',x+18,y+6);
      ctx.fillStyle='#8aafc7';ctx.font='bold 8px monospace';
      ctx.fillText('z',x+25,y+1);
    }
    if(highlight){
      ctx.lineWidth=2;ctx.strokeStyle='#f3c66a';
      ctx.strokeRect(x+1,y+1,TILE-2,TILE-2);
    }
  }
  function frame({world,player,entities=[],seen=new Set(),visible=new Set(),route=[],alarm=0,mission={},unlockedDoors=[],floor=1,clock}){
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
      drawTile(world,r,c,x,y,floor,unlocked.has(doorId(r,c)));
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

    // New rooms expose actual interactive facilities, not empty scenery.
    for(const point of EXPANSION_HOTSPOTS[floor]){
      if(!visible.has(point.row+','+point.col))continue;
      const x=(point.col-camera.col)*TILE,y=(point.row-camera.row)*TILE;
      if(x<0||y<0||x>=canvas.width||y>=canvas.height)continue;
      ctx.fillStyle=point.kind==='room'?'#9bb7af':'#f4cb83';
      ctx.fillRect(x+22,y+3,8,9);
      ctx.fillStyle='#182b37';ctx.font='bold 8px monospace';
      ctx.fillText(point.kind==='room'?'i':'!',x+24,y+10);
    }
    for(const [label,col,row] of roomLabelsFor(floor)){
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
    // Day / dusk / night cycle: sunlit areas fade and lamps become important.
    const darkness=lightLevel(clock);
    if(darkness>.08){
      const glow=ctx.createRadialGradient(px,py,TILE*.4,px,py,
        Math.max(canvas.width,canvas.height)*.72);
      glow.addColorStop(0,'rgba(3,9,22,'+(darkness*.38).toFixed(3)+')');
      glow.addColorStop(.55,'rgba(2,10,26,'+(darkness*.85).toFixed(3)+')');
      glow.addColorStop(1,'rgba(2,7,20,'+Math.min(.82,darkness*1.12).toFixed(3)+')');
      ctx.fillStyle=glow;ctx.fillRect(0,0,canvas.width,canvas.height);
      // Warm patches from visible prison lamps and outdoor perimeter lights.
      for(let vr=0;vr<viewportRows;vr++)for(let vc=0;vc<viewportCols;vc++){
        const rr=camera.row+vr,cc=camera.col+vc;
        const tile=world[rr]?.[cc];
        if(tile!=='L'||!visible.has(rr+','+cc))continue;
        const cx=(vc+.5)*TILE,cy=(vr+.5)*TILE;
        const lamp=ctx.createRadialGradient(cx,cy,4,cx,cy,TILE*2.7);
        lamp.addColorStop(0,'rgba(255,210,130,.20)');
        lamp.addColorStop(1,'rgba(255,210,130,0)');
        ctx.fillStyle=lamp;ctx.fillRect(cx-TILE*3,cy-TILE*3,TILE*6,TILE*6);
      }
    }
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
      miniCtx.fillStyle=symbol==='#'||symbol==='K'||symbol==='F'||symbol==='B'?'#536c7b':
        symbol==='E'?'#65c5a2':symbol==='D'?'#ab9d77':'#304657';
      const x=Math.floor(c*dx),y=Math.floor(r*dy);
      miniCtx.fillRect(x,y,Math.ceil(dx)+1,Math.ceil(dy)+1);
      if(!visible.has(key)){
        miniCtx.fillStyle='rgba(2,6,12,.55)';
        miniCtx.fillRect(x,y,Math.ceil(dx)+1,Math.ceil(dy)+1);
      }
    }
    for(const entity of entities){
      if(!['guard','police','dog'].includes(entity.role)||!visible.has(entity.row+','+entity.col))continue;
      miniCtx.fillStyle=entity.role==='dog'?'#d9ad70':entity.role==='police'?'#5279bd':'#69a2d1';
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
