import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
  const page=await browser.newPage({viewport:{width:1280,height:720}});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto('http://127.0.0.1:3000',{waitUntil:'networkidle'});
  await page.locator('#play-btn').click();
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.getStoryStage()),'wake');
  const start=await page.evaluate(()=>({pos:window.QAMAL_DEBUG.getPosition(),bed:window.QAMAL_DEBUG.getTile(10,3),bars:window.QAMAL_DEBUG.getTile(9,4)}));
  assert.equal(start.pos.row,10);assert.equal(start.pos.col,4);assert.equal(start.bed,'b');assert.equal(start.bars,'G');
  await page.locator('.wake-scene').waitFor({state:'visible'});
  const audioAvailable=await page.evaluate(()=>window.QAMAL_DEBUG.getAudioState().available);
  assert.equal(audioAvailable,true,'Chromium should support Web Audio');
  await page.waitForFunction(()=>window.QAMAL_DEBUG.getAudioState().ready,{timeout:4000});
  await page.screenshot({path:'/tmp/qamal-cell-wakeup.png',fullPage:true});
  await page.locator('#wake-start').click();

  // The guard walks into the actual cell instead of simply teleporting the player.
  await page.locator('.guard-story').waitFor({state:'visible',timeout:10000});
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.getStoryStage()),'guard');
  await page.screenshot({path:'/tmp/qamal-guard-arrival.png',fullPage:true});
  await page.locator('#escort-start').click();
  await page.locator('#learn-answer').waitFor({state:'visible',timeout:20000});
  const atSchool=await page.evaluate(()=>({pos:window.QAMAL_DEBUG.getPosition(),stage:window.QAMAL_DEBUG.getStoryStage(),doors:window.QAMAL_DEBUG.getUnlockedDoors()}));
  assert.equal(atSchool.stage,'classroom');
  assert.equal(atSchool.pos.row,4);assert.equal(atSchool.pos.col,15);
  assert.ok(atSchool.doors.includes('8:6'));assert.ok(atSchool.doors.includes('4:11'));
  assert.match(await page.locator('.learn-heading').innerText(),/Python/);
  await page.screenshot({path:'/tmp/qamal-classroom-lesson.png',fullPage:true});

  // A wrong answer is diagnosed and stored; a full breakdown can be requested.
  await page.locator('#learn-answer').fill('ОШИБКА');
  await page.locator('#learn-check').click();
  assert.match(await page.locator('#learn-feedback').innerText(),/ошиб|невер|проверь|разбор/i);
  assert.ok((await page.evaluate(()=>window.QAMAL_DEBUG.getMistakeCount()))>=1);
  await page.locator('#learn-explain').click();
  assert.match(await page.locator('.learning-answer').innerText(),/QAMAL/);
  await page.locator('#learn-answer').fill('QAMAL');
  await page.locator('#learn-check').click();
  await page.locator('[data-learn="next-task"]').click();
  await page.locator('#learn-answer').fill('print("Привет")');
  await page.locator('#learn-check').click();
  await page.locator('.learning-success').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.getStoryStage()),'free');
  assert.ok((await page.evaluate(()=>window.QAMAL_DEBUG.getLearningProgress())).python.includes(0));
  await page.locator('#game-dialog [data-close]').first().click();

  // Four directions, animation and footsteps are visible to the player.
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.warpTo(10,4,1)),true);
  const beforeSteps=await page.evaluate(()=>window.QAMAL_DEBUG.getAudioState().played);
  await page.keyboard.press('ArrowRight');
  assert.equal((await page.evaluate(()=>window.QAMAL_DEBUG.getPosition())).facing,'right');
  await page.keyboard.press('ArrowLeft');
  assert.equal((await page.evaluate(()=>window.QAMAL_DEBUG.getPosition())).facing,'left');
  await page.keyboard.press('ArrowUp'); // metal bars: turning still happens on a blocked cell
  const blocked=await page.evaluate(()=>window.QAMAL_DEBUG.getPosition());
  assert.equal(blocked.facing,'up');
  assert.equal(blocked.row,10);
  assert.equal(blocked.col,4);
  await page.keyboard.press('ArrowDown');
  assert.equal((await page.evaluate(()=>window.QAMAL_DEBUG.getPosition())).facing,'down');
  assert.ok((await page.evaluate(()=>window.QAMAL_DEBUG.getAudioState().played))>beforeSteps);
  await page.screenshot({path:'/tmp/qamal-facing-animation.png',fullPage:true});

  // The game still fills the browser and door quizzes still work.
  const screen=await page.locator('#game-canvas').boundingBox();
  assert.ok(screen.width>=1270&&screen.height>=710);
  assert.equal(await page.locator('.game-sidebar').count(),0);
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.warpTo(5,19,1)),true);
  await page.keyboard.press('e');
  await page.locator('#door-check').waitFor({state:'visible'});
  const checkButton=await page.locator('#door-check').boundingBox();
  assert.ok(checkButton&&checkButton.y+checkButton.height<=720);
  await page.screenshot({path:'/tmp/qamal-door-challenge.png',fullPage:true});
  const expected=await page.evaluate(async()=>{
    const {questionsFor}=await import('./src/education/questionBank.js');
    const other=await(await fetch('./data/quest-questions.json')).json();
    const pool=[...questionsFor('python','easy'),...other.questions.filter(q=>q.language==='python'&&q.difficulty==='easy')];
    return pool[(5*97+20*37)%pool.length].expectedAnswer;
  });
  if(await page.locator('[name=door-option]').count())await page.locator('[name=door-option][value="'+expected+'"]').check();
  else await page.locator('#door-answer').fill(expected);
  await page.locator('#door-check').click();
  await page.locator('.quest-unlocked').waitFor({state:'visible'});
  assert.ok((await page.evaluate(()=>window.QAMAL_DEBUG.getUnlockedDoors())).includes('5:20'));
  await page.locator('#game-dialog [data-close]').first().click();

  // Arman offers personalized lessons, with his portrait and written tasks.
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.warpTo(4,6,1)),true);
  await page.keyboard.press('e');
  await page.locator('.npc-dialog').waitFor({state:'visible'});
  assert.equal(await page.locator('.npc-speaker').textContent(),'Арман');
  await page.waitForFunction(()=>{const img=document.querySelector('.npc-portrait img');return img?.complete&&img.naturalWidth>0;});
  assert.equal(await page.locator('#mentor-open').count(),1);
  await page.screenshot({path:'/tmp/qamal-npc-dialogue.png',fullPage:true});
  await page.locator('#mentor-open').click();
  await page.locator('.learning-catalog').waitFor({state:'visible'});
  await page.locator('[data-learn-topic="1"]').click();
  assert.match(await page.locator('.learning-theory').innerText(),/перемен/i);
  await page.locator('#game-dialog [data-close]').first().click();

  // The second-floor library has bookshelves that open the same course freely.
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.warpTo(10,9,2)),true);
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.getTile(11,9)), 'r');
  await page.keyboard.press('e');
  await page.locator('.learning-catalog').waitFor({state:'visible'});
  await page.locator('#learn-language').selectOption('go');
  await page.locator('[data-learn-topic="0"]').click();
  assert.match(await page.locator('.learn-heading').innerText(),/Go/);
  await page.screenshot({path:'/tmp/qamal-library-go.png',fullPage:true});
  await page.locator('#game-dialog [data-close]').first().click();

  // Stairs still work and explored rooms remain per-floor.
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.warpTo(10,10,1)),true);
  await page.keyboard.press('e');
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.getFloor()),2);
  await page.screenshot({path:'/tmp/qamal-second-floor.png',fullPage:true});
  await page.keyboard.press('e');
  assert.equal(await page.evaluate(()=>window.QAMAL_DEBUG.getFloor()),1);
  await page.locator('#tools-toggle').click();
  assert.equal(await page.locator('#tools-popup').isVisible(),true);
  await page.locator('#tools-close').click();

  // Sound can be toggled at any time and its volume saved from Settings.
  await page.locator('#sound-toggle').click();
  assert.equal((await page.evaluate(()=>window.QAMAL_DEBUG.getAudioState())).enabled,false);
  assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'false');
  await page.locator('#sound-toggle').click();
  assert.equal((await page.evaluate(()=>window.QAMAL_DEBUG.getAudioState())).enabled,true);
  await page.keyboard.press('Escape');
  await page.locator('#settings-btn').click();
  await page.locator('#audio-volume').evaluate(el=>{el.value='58';el.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.locator('#audio-enabled').uncheck();
  assert.equal((await page.evaluate(()=>window.QAMAL_DEBUG.getAudioState())).enabled,false);
  assert.equal((await page.evaluate(()=>window.QAMAL_DEBUG.getAudioState())).volume,.58);
  await page.locator('#back-btn').click();
  await page.locator('#play-btn').click();
  assert.equal((await page.evaluate(()=>window.QAMAL_DEBUG.getAudioState())).enabled,false);
  assert.deepEqual(errors,[],'No uncaught browser errors');
  await page.screenshot({path:'/tmp/qamal-game-browser-smoke.png',fullPage:true});
  console.log('QAMAL browser walk: wake-up, escorted class, door, mentor, library, stairs, SFX toggle, volume and 4-direction sprites — PASS');
}finally{await browser.close();}
