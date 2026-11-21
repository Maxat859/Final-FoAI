import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createLevel,EXIT_POSITION} from "../src/config.js";
import {createDoorQuests,DOOR_DIFFICULTIES,difficultyForDoor} from "../src/game/doorQuests.js";
import {checkAnswer} from "../src/education/questionChecker.js";

const bank=JSON.parse(readFileSync(new URL("../data/quest-questions.json",import.meta.url),"utf8")).questions;

test("768 unique Python and Go tasks, three difficulty levels, complete answer choices",()=>{
  assert.equal(bank.length,768);
  assert.equal(new Set(bank.map(q=>q.id)).size,768);
  for(const language of ["python","go"]){
    assert.equal(bank.filter(q=>q.language===language).length,384);
    for(const level of ["easy","medium","hard"]){
      const entries=bank.filter(q=>q.language===language&&q.difficulty===level);
      assert.equal(entries.length,128);
      for(const q of entries){
        assert.ok(q.prompt&&q.codeSnippet&&q.explanation);
        assert.deepEqual(Object.keys(q.choices),["A","B","C","D"]);
        assert.equal(new Set(Object.values(q.choices)).size,4,"ambiguous choices: "+q.id);
        assert.equal(checkAnswer(q,q.answer).correct,true);
        const wrong=["A","B","C","D"].find(x=>x!==q.answer);
        assert.equal(checkAnswer(q,wrong).correct,false);
      }
    }
  }
});

test("map contains at least 25 distinct educational doors; depths increase in later wings",()=>{
  const world=createLevel(),quests=createDoorQuests(world);
  assert.ok(quests.doors.length>=25);
  assert.equal(new Set(quests.doors.map(d=>d.id)).size,quests.doors.length);
  assert.equal(difficultyForDoor(4,11),"easy");
  assert.equal(difficultyForDoor(17,29),"medium");
  assert.equal(difficultyForDoor(28,38),"hard");
  assert.equal(world[EXIT_POSITION.row][EXIT_POSITION.col],"E");
  for(const door of quests.doors){
    assert.equal(world[door.row][door.col],"D");
    assert.equal(door.required,DOOR_DIFFICULTIES[door.difficulty].steps);
    assert.equal(quests.isLocked(door.row,door.col),true);
  }
});

test("one, two and three questions unlock easy/medium/hard gates",()=>{
  const quests=createDoorQuests(createLevel());
  for(const level of ["easy","medium","hard"]){
    const door=quests.doors.find(d=>d.difficulty===level);
    assert.ok(door,"Missing "+level+" gate");
    for(let i=0;i<door.required;i++){
      assert.equal(quests.isLocked(door.row,door.col),true);
      for(const language of ["python","go"]){
        const q=quests.question(door,language,bank);
        assert.equal(q.language,language);
        assert.equal(q.difficulty,level);
        assert.equal(checkAnswer(q,q.answer).correct,true);
      }
      const result=quests.award(door);
      assert.equal(result.solved,i+1);
    }
    assert.equal(quests.isUnlocked(door),true);
    assert.equal(quests.isLocked(door.row,door.col),false);
    assert.equal(quests.award(door).solved,door.required);
  }
});

test("door progression persists and nearest door uses cardinal distance",()=>{
  const world=createLevel(),quests=createDoorQuests(world);
  const door=quests.doors.find(d=>d.row===4&&d.col===11);
  assert.ok(door);
  assert.equal(quests.nearest({row:4,col:10,facing:"right"})?.id,door.id);
  assert.equal(quests.nearest({row:4,col:8,facing:"right"}),null);
  quests.award(door);
  const restored=createDoorQuests(world,quests.snapshot());
  assert.equal(restored.steps(door),1);
  assert.equal(restored.isUnlocked(door),true);
  assert.equal(restored.nearest({row:4,col:10,facing:"right"}),null);
});
