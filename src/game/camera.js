import {VIEW_COLS,VIEW_ROWS} from "../config.js";

function clamp(value,min,max){return Math.max(min,Math.min(max,value));}

// Follows the player while keeping the entire viewport inside the world.
export function getCameraOffset(player,world){
  const rows=world.length,cols=world[0]?.length??0;
  return {
    row:clamp(player.row-Math.floor(VIEW_ROWS/2),0,Math.max(0,rows-VIEW_ROWS)),
    col:clamp(player.col-Math.floor(VIEW_COLS/2),0,Math.max(0,cols-VIEW_COLS))
  };
}
