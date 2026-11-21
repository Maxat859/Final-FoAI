import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});
  await page.locator('#play-btn').click();
  await page.locator('#game-dialog [data-close]').first().click();
  await page.locator('#game-canvas').waitFor({state:'visible'});

  const screen=await page.locator('#game-canvas').boundingBox();
  assert.ok(screen.width>=1270&&screen.height>=710,'Canvas must fill viewport');
  assert.equal(await page.locator('.game-sidebar').count(),0,'Permanent sidebar must be removed');

  for(const direction of ['ArrowRight','ArrowRight','ArrowUp'])await page.keyboard.press(direction);
  const atDoor=await page.evaluate(()=>window.QAMAL_DEBUG.getPosition());
  assert.equal(atDoor.row,9);assert.equal(atDoor.col,6);

  await page.keyboard.press('e');
  await page.locator('#door-check').waitFor({state:'visible'});
  await page.screenshot({path:'/tmp/qamal-door-challenge.png',fullPage:true});
  assert.match(await page.locator('#dialog-inner').innerText(),/ДВЕРЬ/);

  const expected=await page.evaluate(async ()=>{
    const {questionsFor}=await import('./src/education/questionBank.js');
    const other=await (await fetch('./data/quest-questions.json')).json();
    const pool=[...questionsFor('python','easy'),...other.questions.filter(q=>q.language==='python'&&q.difficulty==='easy')];
    const seed=8*97+6*37;
    return pool[seed%pool.length].expectedAnswer;
  });
  if(await page.locator('[name=door-option]').count()){
    await page.locator('[name=door-option][value="'+expected+'"]').check();
  } else await page.locator('#door-answer').fill(expected);
  await page.locator('#door-check').click();
  await page.locator('.quest-unlocked').waitFor({state:'visible'});
  assert.ok((await page.evaluate(()=>window.QAMAL_DEBUG.getUnlockedDoors())).includes('8:6'));
  await page.locator('#game-dialog [data-close]').first().click();

  // Re-enter the world; the solved door remains traversable.
  for(let i=0;i<5;i++)await page.keyboard.press('ArrowUp');
  const nearNpc=await page.evaluate(()=>window.QAMAL_DEBUG.getPosition());
  assert.equal(nearNpc.row,4);assert.equal(nearNpc.col,6);
  await page.keyboard.press('e');
  await page.locator('.npc-dialog').waitFor({state:'visible'});
  assert.equal(await page.locator('.npc-speaker').textContent(),'Арман');
  await page.waitForFunction(()=>{const img=document.querySelector('.npc-portrait img');return img?.complete&&img.naturalWidth>0;});
  assert.ok(await page.locator('.npc-portrait img').evaluate(img=>img.complete&&img.naturalWidth>0));
  await page.locator('#npc-next').click();
  await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('.npc-words')?.textContent?.length>5);
  assert.ok((await page.locator('.npc-words').innerText()).length>5);
  await page.screenshot({path:'/tmp/qamal-npc-dialogue.png',fullPage:true});
  await page.keyboard.press('Escape');

  await page.locator('#tools-toggle').click();
  assert.equal(await page.locator('#tools-popup').isVisible(),true);
  await page.locator('#tools-close').click();
  assert.equal(await page.locator('#tools-popup').isVisible(),false);

  assert.deepEqual(errors,[],'Browser console must contain no uncaught errors');
  await page.screenshot({path:'/tmp/qamal-game-browser-smoke.png',fullPage:true});
  console.log('Browser smoke passed: fullscreen, movement, interactive door, Python/Go question, persistent unlock, NPC portrait dialogue, menu.');
} finally {
  await browser.close();
}
