const assert=require('node:assert/strict');
const {historyContentPose,historyExitPose,timeline,stateAt}=require('./script.js');
const frames=require('./figma-source.json').frames,heights=frames.map(f=>f.height);
assert.equal(historyExitPose(0).incomingRotation,0);
const first=historyContentPose(0);
assert.equal(first.imageOpacity,0);assert.equal(first.imageBlur,24);assert.equal(first.photoOpacity,0);
const imageDone=historyContentPose(240);
assert.equal(imageDone.imageOpacity,1);assert.equal(imageDone.imageBlur,0);assert.equal(imageDone.photoOpacity,0,'Side photos wait for center image');
assert.ok(historyContentPose(330).photoX>0);assert.ok(historyContentPose(330).photoOpacity>0);
for(let i=0;i<8;i++){const done=historyContentPose(540,0,i);assert.equal(done.photoOpacity,1);assert.equal(done.photoX,0);}
assert.equal(historyContentPose(540,0).captionY,0);assert.equal(historyContentPose(540,0).captionOpacity,1);
assert.equal(historyContentPose(540,1).captionY,32);assert.equal(historyContentPose(540,1).captionOpacity,0);
const segments=timeline(heights);
for(const [index,motion] of [[3,540],[4,2400],[5,3000]]){assert.equal(segments[index].motion,motion);assert.equal(segments[index].hold,0);assert.equal(stateAt(segments[index].start+segments[index].entryHold+motion,heights).transition,0);}
assert.equal(segments[3].transition,0);
assert.equal(segments[4].transition,0);
assert.equal(segments[4].entryHold,0);
assert.equal(segments[5].entryHold,0);
assert.equal(segments[4].start+segments[4].length,segments[5].start,'Gallery frames meet without a photo hold');
console.log('History_content: center and side photos enter; photo hold intervals are removed: PASS');
