import {VIEW_COLS,VIEW_ROWS} from "../config.js";

function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

// Follows the player while keeping the entire viewport inside the world.
export function getCameraOffset(player,world,viewRows=VIEW_ROWS,viewCols=VIEW_COLS){
  const rows=world.length,cols=world[0]?.length??0;
  return {
    row:clamp(player.row-Math.floor(viewRows/2),0,Math.max(0,rows-viewRows)),
    col:clamp(player.col-Math.floor(viewCols/2),0,Math.max(0,cols-viewCols))
  };
}
