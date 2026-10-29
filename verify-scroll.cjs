const assert = require('node:assert/strict');
const fs = require('node:fs');
const { SCENE_SCROLL_PX, HOLD_SCROLL_PX, stateAt, transitionWeights } = require('./script.js');
const source = JSON.parse(fs.readFileSync(__dirname + '/figma-source.json', 'utf8'));
const heights = source.frames.map(frame => frame.height);
assert.equal(SCENE_SCROLL_PX, 1500);
assert.equal(HOLD_SCROLL_PX, 1250);
let boundaries = 0;
for (let i = 0; i < heights.length; i++) {
  assert.equal(stateAt(i * 1500, heights).index, i);
  assert.equal(stateAt(i * 1500 + 1499, heights).index, i);
  assert.equal(stateAt(i * 1500, heights).offset, 0);
  assert.equal(stateAt(i * 1500 + 1250, heights).offset, Math.max(0, heights[i] - 1020));
  assert.equal(stateAt(i * 1500 + 1200, heights).transition, 0);
  boundaries++;
}
assert.equal(stateAt(-100, heights).index, 0);
assert.equal(stateAt(999999, heights).index, 18);
assert.deepEqual(transitionWeights(13, 0), {outgoing:1, incoming:0, black:0});
assert.deepEqual(transitionWeights(13, .5), {outgoing:0, incoming:0, black:1});
assert.deepEqual(transitionWeights(13, 1), {outgoing:0, incoming:1, black:0});
// Forward and reverse samples must both pass through a completely black interval.
for (const points of [[0,.25,.45,.5,.55,.75,1],[1,.75,.55,.5,.45,.25,0]]) {
  for (const t of points) {
    const w = transitionWeights(13, t);
    assert.ok(w.outgoing === 0 || w.incoming === 0, 'Table and Our Way must never overlap');
    if (t >= .45 && t <= .55) assert.equal(w.black, 1);
  }
}
console.log(JSON.stringify({status:'PASS',sceneScrollPx:1500,frameBoundaries:boundaries,longFrameTravel:'PASS',blackFadeBothDirections:'PASS'},null,2));
