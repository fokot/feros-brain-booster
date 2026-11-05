import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptSpeed, scoreSelection, advanceBall } from '../src/training.js';
test('adaptive speed stays bounded and moves in the right direction', () => {
  assert.equal(adaptSpeed(1, true), 1.12);
  assert.equal(adaptSpeed(1, false), .88);
  assert.equal(adaptSpeed(3, true), 3);
  assert.equal(adaptSpeed(.2, false), .2);
});
test('scores target identities, independent of selection order', () => {
  assert.equal(scoreSelection([1, 3, 6], [6, 1, 3]), 3);
  assert.equal(scoreSelection([1, 3, 6], [0, 1, 7]), 1);
});
test('balls bounce back into the volume', () => {
  const ball = { position: {x:2.7,y:0,z:-2.7}, velocity:{x:1,y:1,z:-1} };
  advanceBall(ball, .1);
  assert.equal(ball.position.x, 2.75);
  assert.equal(ball.velocity.x, -1);
  assert.equal(ball.position.z, -2.75);
  assert.equal(ball.velocity.z, 1);
});
