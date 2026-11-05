const assert=require('node:assert/strict');
const {daejeonPose:pose,timeline,stateAt}=require('./script.js');
assert.equal(pose(0).panelX,-702);assert.equal(pose(0).panelOpacity,0);
assert.equal(pose(500).panelX,0);assert.equal(pose(500).panelOpacity,1);
for(const local of [500,650,799,800])assert.equal(pose(local).textOpacity,0,'300px gap after panel');
assert.ok(pose(925).textOpacity>0&&pose(925).textOpacity<1);assert.ok(pose(925).textY<0);
assert.ok(pose(925,1).textOpacity<pose(925,0).textOpacity,'Line stagger');
for(let line=0;line<9;line++){assert.equal(pose(1700,line).textOpacity,1);assert.equal(pose(1700,line).textY,0);}
const heights=require('./figma-source.json').frames.map(f=>f.height);
const segment=timeline(heights)[8];
assert.equal(segment.length,0);
assert.equal(stateAt(segment.start,heights).index,10);
console.log('Daejeon scene is skipped; retained pose helpers remain deterministic: PASS');
