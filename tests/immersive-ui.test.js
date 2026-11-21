import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {checkAnswer} from '../src/education/questionChecker.js';
import {buildQuestionBank} from '../src/education/questionBank.js';

function file(path){return readFileSync(new URL('../'+path,import.meta.url),'utf8');}

test('full-screen game has interactive overlay buttons and no permanent sidebar',()=>{
  const html=file('index.html'),css=file('main.css');
  const ids=[...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(ids.length,new Set(ids).size);
  for(const id of ['game-canvas','game-dialog','tools-toggle','action-btn','map-btn',
                    'help-btn','game-message','action-prompt','fullscreen-btn','panel-actions']){
    assert.ok(ids.includes(id),id+' missing');
  }
  assert.ok(!html.includes('class="game-sidebar"'));
  assert.match(css,/\.world-screen\s*\{/);
  assert.match(css,/\.npc-portrait/);
});

test('all DOM ids used by src/main.js actually exist',()=>{
  const js=file('src/main.js'),html=file('index.html');
  const needed=[...new Set([...js.matchAll(/\$\('([^']+)'\)/g)].map(x=>x[1]))];
  for(const id of needed)assert.ok(html.includes('id="'+id+'"'),id+' used but not found');
  assert.match(js,/panels\.open\('door'/);
  assert.match(js,/panels\.open\('npc'/);
  assert.match(js,/getUnlockedDoors/);
});

test('additional 768 questions are valid and cover all six language / difficulty groups',()=>{
  const dataset=JSON.parse(file('data/quest-questions.json'));
  const items=dataset.questions;
  assert.equal(items.length,768);
  assert.equal(new Set(items.map(q=>q.id)).size,768);
  for(const language of ['python','go']){
    assert.equal(buildQuestionBank(language).length,240);
    for(const difficulty of ['easy','medium','hard']){
      const subset=items.filter(q=>q.language===language&&q.difficulty===difficulty);
      assert.equal(subset.length,128);
      for(const q of subset){
        assert.equal(checkAnswer(q,q.expectedAnswer).correct,true);
        assert.ok(q.codeSnippet.length>5);
        assert.equal(Object.keys(q.choices).length,4);
      }
    }
  }
});

test('distinct character portraits are available for the dialogue scenes',()=>{
  for(const name of ['erasyl','arman','ruslan','guard','daniyar','madina','timur']){
    const path='assets/portraits/'+name+'.svg';
    assert.ok(existsSync(new URL('../'+path,import.meta.url)),path);
    const svg=file(path);
    assert.match(svg,/viewBox="0 0 64 64"/);
    assert.match(svg,/<rect /);
  }
  const panel=file('src/ui/panels.js');
  assert.match(panel,/npc-portrait/);
  assert.match(panel,/door-check/);
  assert.match(panel,/npc-next/);
});
