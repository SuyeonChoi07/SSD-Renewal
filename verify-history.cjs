const fs=require('node:fs');
const assert=require('node:assert/strict');
const {historyPose,timeline,stateAt}=require('./script.js');
const frames=require('./figma-source.json').frames;
const heights=frames.map(f=>f.height),segment=timeline(heights)[2];
assert.equal(segment.motion,1000);
assert.equal(historyPose(0).outline,0);
assert.equal(historyPose(0).text,0);
assert.ok(historyPose(300).outline>0&&historyPose(300).outline<1);
assert.equal(historyPose(600).outline,1);
assert.equal(historyPose(600).text,0,'Text waits for completed outline');
assert.ok(historyPose(800).text>0&&historyPose(800).text<1);
assert.equal(historyPose(1000).text,1);
for(const distance of [1000,1500,2499,2500]) {
 const state=stateAt(segment.start+distance,heights);
 assert.equal(state.index,2);
 assert.equal(state.transition,0,'Hold the completed composition for 1500px');
 assert.equal(historyPose(state.local).text,1);
}
const start=historyPose(0,0),end=historyPose(0,1);
assert.equal(start.breadX,1035);assert.equal(start.breadY,350);assert.equal(start.breadWidth,438);
assert.equal(end.breadX,1031.5);assert.equal(end.breadY,324);assert.equal(end.breadWidth,405);assert.equal(end.wrappedHeight,373);
console.log(JSON.stringify({status:'PASS',breadTransition:'PASS',outlineBeforeText:true,completedCompositionHoldPx:1500},null,2));

const {historyExitPose}=require('./script.js');
const exitStart=historyExitPose(0),exitEnd=historyExitPose(1);
assert.equal(exitStart.outlineWidth,500);assert.equal(exitStart.outlineHeight,500);
assert.equal(exitEnd.outlineWidth,610);assert.equal(exitEnd.outlineHeight,732);
assert.equal(exitEnd.outlineX,1032);assert.equal(exitEnd.outlineY,144);
assert.equal(exitEnd.outgoingRotation,-180);assert.equal(exitStart.incomingRotation,0);assert.equal(exitEnd.incomingRotation,0);
assert.equal(exitEnd.titleX,68);assert.equal(exitEnd.titleY,252);assert.equal(exitEnd.titleSize,36);
assert.equal(exitEnd.photoWidth,600);assert.equal(exitEnd.photoHeight,720);
for(const p of [.1,.25,.5,.75,.9]){const pose=historyExitPose(p);assert.ok(pose.outlineWidth>500&&pose.outlineWidth<610);assert.ok(pose.titleSize<240&&pose.titleSize>36);}
assert.match(fs.readFileSync(__dirname+'/styles.css','utf8'),/animation: history-title-glow 1\.5s/);
console.log('History exit geometry, backward flip, title destination and 1.5s glow: PASS');
