const assert=require('node:assert/strict');
const {ease,timeline,stateAt}=require('./script.js');
assert.equal(ease(0),0);assert.equal(ease(.5),.5);assert.equal(ease(1),1);
assert.ok(Math.abs(ease(.25)-.1291619)<.000001);
for(let i=1;i<100;i++){assert.ok(ease(i/100)>ease((i-1)/100));assert.ok(Math.abs(ease(i/100)+ease(1-i/100)-1)<.000001);}
const heights=require('./figma-source.json').frames.map(f=>f.height),segments=timeline(heights),segment=segments[5];
for(let i=6;i<=9;i++)assert.equal(segments[i].length,0);
assert.equal(segment.hold,0);assert.equal(segment.transition,600);
const begin=segment.start+segment.entryHold+segment.motion+segment.hold+segment.exitMotion;
assert.equal(stateAt(begin+300,heights).transition,.5);
assert.equal(stateAt(segment.start+segment.length,heights).index,10);
console.log('Scene 5 transitions directly to scene 10 without a photo hold: PASS');
