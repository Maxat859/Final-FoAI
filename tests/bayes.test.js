import test from 'node:test';import assert from 'node:assert/strict';
import {bayesianUpdate,formatProbability} from '../src/algorithms/bayes.js';
test('positive alarm Bayesian posterior 0.8',()=>{
  const got=bayesianUpdate({prior:.5,sensitivity:.8,falsePositive:.2,signal:'ALARM'});
  assert.ok(Math.abs(got.posterior-.8)<1e-12);
  assert.ok(Math.abs(got.evidenceProbability-.5)<1e-12);
});
test('normal observation uses complements',()=>{
  const p=bayesianUpdate({prior:.2,sensitivity:.9,falsePositive:.1,signal:'NORMAL'});
  assert.ok(Math.abs(p.posterior-(.02/(.02+.72)))<1e-12);
});
test('invalid probabilities are rejected',()=>{
  assert.throws(()=>bayesianUpdate({prior:-.1,sensitivity:.8,falsePositive:.2}),RangeError);
  assert.throws(()=>bayesianUpdate({prior:.5,sensitivity:2,falsePositive:.2}),RangeError);
  assert.throws(()=>bayesianUpdate({prior:.5,sensitivity:.8,falsePositive:.2,signal:'WRONG'}),RangeError);
});
test('impossible evidence returns undefined posterior instead of NaN',()=>{
  const x=bayesianUpdate({prior:0,sensitivity:1,falsePositive:0,signal:'ALARM'});
  assert.equal(x.posterior,null);assert.equal(x.defined,false);assert.equal(formatProbability(null),'Невозможно вычислить');
});
