const assert=require('node:assert/strict');
const {historyContentPose,historyExitPose,timeline,stateAt}=require('./script.js');
const frames=require('./figma-source.json').frames,heights=frames.map(f=>f.height);
assert.equal(historyExitPose(0).incomingRotation,0);
const first=historyContentPose(0);
assert.equal(first.imageOpacity,0);assert.equal(first.imageBlur,24);assert.equal(first.photoOpacity,0);
const imageDone=historyContentPose(400);
assert.equal(imageDone.imageOpacity,1);assert.equal(imageDone.imageBlur,0);assert.equal(imageDone.photoOpacity,0,'Side photos wait for center image');
assert.ok(historyContentPose(550).photoX>0);assert.ok(historyContentPose(550).photoOpacity>0);
for(let i=0;i<8;i++){const done=historyContentPose(900,0,i);assert.equal(done.photoOpacity,1);assert.equal(done.photoX,0);}
assert.equal(historyContentPose(900,0).captionY,0);assert.equal(historyContentPose(900,0).captionOpacity,1);
assert.equal(historyContentPose(900,1).captionY,32);assert.equal(historyContentPose(900,1).captionOpacity,0);
const segments=timeline(heights);
for(const [index,motion] of [[3,900],[4,4600],[5,8200]]){assert.equal(segments[index].motion,motion);assert.equal(stateAt(segments[index].start+motion+800,heights).transition,0);}
console.log('History_content: no incoming rotation, center blur/fade, caption slide/fade, delayed side photos, 800px photo hold: PASS');
