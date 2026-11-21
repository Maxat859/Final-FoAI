import test from 'node:test';
import assert from 'node:assert/strict';
import {createLevel} from '../src/config.js';
import {buildQuestionBank,questionsFor,DIFFICULTIES} from '../src/education/questionBank.js';
import {doorDifficulty,doorId,listChallengeDoors,adjacentDoor,getDoorQuestion,canPassDoor} from '../src/game/doorChallenges.js';
import {checkAnswer} from '../src/education/questionChecker.js';

test('Python and Go banks each contain 240 unique exercises across levels',()=>{
  for(const lang of ['python','go']){
    const bank=buildQuestionBank(lang);
    assert.equal(bank.length,240);
    assert.equal(new Set(bank.map(q=>q.id)).size,240);
    for(const difficulty of DIFFICULTIES)assert.equal(questionsFor(lang,difficulty).length,80);
    for(const question of bank){
      assert.ok(question.codeSnippet.length>10);
      assert.ok(question.explanation.length>8);
      assert.equal(checkAnswer(question,question.expectedAnswer).correct,true);
      assert.equal(question.language,lang);
    }
  }
});

test('door terminals exist in all three level tiers',()=>{
  const map=createLevel(),doors=listChallengeDoors(map);
  assert.ok(doors.length>=20);
  assert.equal(doors.length,new Set(doors.map(d=>d.id)).size);
  assert.ok(doors.some(d=>d.difficulty==='easy'));
  assert.ok(doors.some(d=>d.difficulty==='medium'));
  assert.ok(doors.some(d=>d.difficulty==='hard'));
  assert.equal(doorDifficulty(4,11),'easy');
  assert.equal(doorDifficulty(20,38),'hard');
});

test('nearby E interaction and unlocking refer to the correct door',()=>{
  const world=createLevel(),player={row:8,col:5};
  const door=adjacentDoor(world,player,[]);
  assert.ok(door);
  assert.equal(door.id,doorId(8,6));
  assert.equal(canPassDoor(door,[]),false);
  assert.equal(canPassDoor(door,new Set([door.id])),true);
  assert.equal(adjacentDoor(world,player,[door.id]),null);
});

test('question difficulty depends on the door zone and language',()=>{
  const doors=listChallengeDoors(createLevel());
  for(const door of doors){
    const py=getDoorQuestion(door,'python',0);
    const go=getDoorQuestion(door,'go',0);
    assert.equal(py.difficulty,door.difficulty);
    assert.equal(go.difficulty,door.difficulty);
    assert.equal(checkAnswer(py,py.expectedAnswer).correct,true);
  }
  const door=doors[0];
  assert.notEqual(getDoorQuestion(door,'go',0).id,getDoorQuestion(door,'go',1).id);
});
