import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {getCourse,lessonAt,validateProgress,diagnoseLessonError,isCorrectLessonAnswer} from '../src/education/curriculum.js';
import {createLevel,BLOCKED_TILES} from '../src/config.js';
import {makeEscortPath,GUARD_APPROACH,CLASSROOM_DESK,nextEscortPair} from '../src/game/escort.js';
import {nearestInteraction} from '../src/game/player.js';

test('Python and Go include eight ordered lessons and two practical exercises each',()=>{
  for(const language of ['python','go']){
    const lessons=getCourse(language);
    assert.equal(lessons.length,8);
    assert.equal(new Set(lessons.map(x=>x.id)).size,8);
    for(let i=0;i<lessons.length;i++){
      const lesson=lessonAt(language,i);
      assert.ok(lesson.lesson.length>40);
      assert.ok(lesson.example.length>6);
      assert.equal(lesson.tasks.length,2);
      for(const q of lesson.tasks){
        assert.ok(q.codeSnippet.length>5);
        assert.ok(q.steps.length>=3);
        assert.ok(q.explanation.length>10);
        assert.equal(isCorrectLessonAnswer(q,q.expectedAnswer),true);
      }
    }
  }
});

test('Code exercises accept harmless spacing variants without executing code',()=>{
  const p=getCourse('python')[1].tasks[1];
  assert.equal(isCorrectLessonAnswer(p,'score=10'),true);
  const g=getCourse('go')[1].tasks[1];
  assert.equal(isCorrectLessonAnswer(g,'score:=10'),true);
  assert.equal(isCorrectLessonAnswer(g,'score = 10'),false);
  const pp=getCourse('python')[0].tasks[1];
  assert.equal(isCorrectLessonAnswer(pp,"print('Привет')"),true);
});

test('Every wrong answer can be analyzed step by step, with solution on second attempt',()=>{
  for(const language of ['python','go']){
    for(const lesson of getCourse(language)){
      for(const q of lesson.tasks){
        const first=diagnoseLessonError(q,'не знаю',1);
        assert.equal(first.correct,false);
        assert.equal(first.reveal,false);
        assert.equal(first.steps.length>=3,true);
        const next=diagnoseLessonError(q,'не знаю',2);
        assert.equal(next.correct,false);
        assert.equal(next.reveal,true);
        assert.equal(next.answer,q.expectedAnswer);
        const correct=diagnoseLessonError(q,q.expectedAnswer,1);
        assert.equal(correct.correct,true);
      }
    }
  }
});

test('Learning progress survives saves but rejects bad entries',()=>{
  const value=validateProgress({python:[0,2,2,7,8,-2,'1'],go:[1,4,4]});
  assert.deepEqual(value,{python:[0,2,7],go:[1,4]});
  assert.deepEqual(validateProgress(null),{python:[],go:[]});
});

test('Guard can approach the cell and escort across real doors into class',()=>{
  const world=createLevel(1);
  const route=makeEscortPath(world);
  assert.deepEqual(route.path[0],{row:10,col:4});
  assert.deepEqual(route.path.at(-1),CLASSROOM_DESK);
  assert.ok(route.steps>=12);
  assert.deepEqual(route.gates,['8:6','4:11']);
  assert.ok(GUARD_APPROACH.length>=4);
  const p=nextEscortPair(route.path,1);
  assert.deepEqual(p.player,route.path[1]);
  assert.deepEqual(p.guard,route.path[2]);
  assert.ok(route.path.every(point=>!BLOCKED_TILES.has(world[point.row][point.col])));
});

test('Library has physically placed bookcases and context interaction on floor 2',()=>{
  const second=createLevel(2);
  assert.equal(second[11][9],'r');
  assert.equal(second[10][6],'r');
  assert.ok(BLOCKED_TILES.has('r'));
  const item=nearestInteraction({row:10,col:9},second,[],2);
  assert.equal(item?.kind,'library');
  const downstairs=nearestInteraction({row:10,col:9},createLevel(1),[],1);
  assert.notEqual(downstairs?.kind,'library');
});

test('Panels expose classroom, library, mentor and persistent mistake review',()=>{
  const file=readFileSync(new URL('../src/ui/panels.js',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../src/ui/learningUI.js',import.meta.url),'utf8');
  assert.match(file,/createLearningUI/);
  assert.match(file,/id="mentor-open"/);
  assert.match(file,/id="escort-start"/);
  assert.match(file,/onWake/);
  assert.match(main,/function guardArrives/);
  assert.match(main,/function beginEscort/);
  assert.match(main,/storyStage/);
  assert.match(main,/learningProgress/);
  assert.match(ui,/learning-journal/);
  assert.match(ui,/learn-explain/);
});

test('New game button confirms save reset while retaining learning language',()=>{
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
  assert.match(html,/id="new-game-btn"/);
  assert.match(main,/window\.confirm\(/);
  assert.match(main,/storage\.set\('progress',null\)/);
  assert.doesNotMatch(main,/storage\.set\('language',null\)/);
});
