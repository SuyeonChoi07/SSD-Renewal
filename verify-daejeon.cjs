const assert=require('node:assert/strict');
const {daejeonPose:pose,timeline}=require('./script.js');
assert.equal(pose(0).panelX,-702);assert.equal(pose(0).panelOpacity,0);
assert.equal(pose(500).panelX,0);assert.equal(pose(500).panelOpacity,1);
for(const local of [500,650,799,800])assert.equal(pose(local).textOpacity,0,'300px gap after panel');
assert.ok(pose(925).textOpacity>0&&pose(925).textOpacity<1);assert.ok(pose(925).textY<0);
assert.ok(pose(925,1).textOpacity<pose(925,0).textOpacity,'Line stagger');
for(let line=0;line<9;line++){assert.equal(pose(1700,line).textOpacity,1);assert.equal(pose(1700,line).textY,0);}
assert.equal(timeline(require('./figma-source.json').frames.map(f=>f.height))[8].motion,1700);
console.log('Daejeon panel slide/fade, 300px gap, top-down staggered text: PASS');
