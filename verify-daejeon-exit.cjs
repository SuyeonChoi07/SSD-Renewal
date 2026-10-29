const assert=require('node:assert/strict');
const {daejeonExitPose:pose,timeline,stateAt}=require('./script.js');
assert.ok(pose(150,8).textOpacity<pose(150,0).textOpacity,'Last line exits first');
assert.equal(pose(750).textOpacity,0);assert.equal(pose(750).panelOpacity,1);
assert.equal(pose(1250).panelOpacity,0);assert.equal(pose(1250).align,0);
assert.equal(pose(2050).align,1);assert.equal(pose(2050).fade,0,'Align before dissolve');
assert.equal(pose(2400).fade,1);
for(const n of [1400,1700,2000])assert.equal(pose(n).fade,0);
const heights=require('./figma-source.json').frames.map(f=>f.height),segments=timeline(heights);
assert.equal(segments[8].exitMotion,2400);
assert.equal(stateAt(segments[8].start+segments[8].entryHold+segments[8].motion+segments[8].hold+2400,heights).transition,0);
console.log('Daejeon reverse text/panel exit, sign alignment first, then photo-to-logo dissolve: PASS');

const {daejeonAlignedCrop}=require('./script.js');
for(const p of [0,.1,.25,.5,.75,1]){const crop=daejeonAlignedCrop(p);assert.equal(crop.width,159.93,'No horizontal resizing');assert.equal(crop.height,270,'No vertical resizing');}
const startCrop=daejeonAlignedCrop(0),endCrop=daejeonAlignedCrop(1);
assert.ok(endCrop.left<startCrop.left,'Move background left');
console.log('Background alignment changes position only; image dimensions and aspect ratio stay fixed: PASS');

const {daejeonAlignedLogoRect}=require('./script.js');
const rect=daejeonAlignedLogoRect();
assert.ok(Math.abs(rect.width/415-rect.height*1.2134/167)<1e-10,'Uniform logo scale preserves letter proportions');
assert.ok(rect.x<574&&rect.y<383,'Correct the former right/down ghost offset');
console.log('Foreground logo registered to white sign strokes with uniform scale; background stays undeformed: PASS');
