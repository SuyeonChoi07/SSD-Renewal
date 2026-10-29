const assert = require('node:assert/strict');
const fs = require('node:fs');
const { HOLD_SCROLL_PX, TRANSITION_SCROLL_PX, timeline, stateAt, transitionWeights } = require('./script.js');
const source = JSON.parse(fs.readFileSync(__dirname + '/figma-source.json', 'utf8'));
const heights = source.frames.map(frame => frame.height);
const segments = timeline(heights);
assert.equal(HOLD_SCROLL_PX, 1000);
assert.equal(TRANSITION_SCROLL_PX, 250);
assert.equal(segments[0].hold, 0);
assert.equal(segments[1].start, 250);
assert.ok(stateAt(1, heights).transition > 0, 'Landing transitions immediately');
for(let i=1;i<heights.length;i++) {
  const segment=segments[i];
  for(const delta of [0,1,500,999,1000]) {
    const state=stateAt(segment.start+delta,heights);
    assert.equal(state.index,i);
    assert.equal(state.offset,0,'No content movement during hold: '+source.frames[i].name);
    assert.equal(state.transition,0,'No fade during hold: '+source.frames[i].name);
    assert.equal(transitionWeights(i,state.transition).outgoing,1);
  }
  if(segment.travel) {
    assert.equal(stateAt(segment.start+1000+segment.travel/2,heights).offset,segment.travel/2);
    assert.equal(stateAt(segment.start+1000+segment.travel,heights).offset,segment.travel);
  }
  if(segment.transition) {
    assert.equal(stateAt(segment.start+1000+segment.travel+125,heights).transition,.5);
    assert.equal(stateAt(segments[i+1].start,heights).index,i+1);
  }
}
assert.equal(stateAt(-100,heights).index,0);
assert.equal(stateAt(999999,heights).index,18);
for(const points of [[0,.25,.45,.5,.55,.75,1],[1,.75,.55,.5,.45,.25,0]])for(const t of points){const w=transitionWeights(13,t);assert.ok(w.outgoing===0||w.incoming===0);if(t>=.45&&t<=.55)assert.equal(w.black,1);}
console.log(JSON.stringify({status:'PASS',landingHoldPx:0,completedFrameHoldPx:1000,heldFrames:18,longContentStartsAfterHold:true,blackFadeBothDirections:'PASS'},null,2));
