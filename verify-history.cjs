const fs=require('node:fs');
const assert=require('node:assert/strict');
const {historyPose,timeline,stateAt}=require('./script.js');
const frames=require('./figma-source.json').frames;
const heights=frames.map(f=>f.height),segment=timeline(heights)[2];
assert.equal(segment.motion,2800);
assert.equal(historyPose(0).outline,0);
assert.equal(historyPose(0).text,0);
assert.ok(historyPose(1300).outline>0&&historyPose(300).outline<1);
assert.equal(historyPose(2000).outline,1);
assert.equal(historyPose(2000).text,0,'Text waits for completed outline');
assert.ok(historyPose(2200).text>0&&historyPose(800).text<1);
assert.equal(historyPose(2800).text,1);
for(const distance of [2800,3300,4299,4300]) {
 const state=stateAt(segment.start+segment.entryHold+distance,heights);
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
assert.equal(exitEnd.titleX,68);assert.equal(exitEnd.titleY,142);assert.equal(exitEnd.titleSize,36);
assert.equal(exitEnd.photoWidth,600);assert.equal(exitEnd.photoHeight,720);
for(const p of [.1,.25,.5,.75,.9]){const pose=historyExitPose(p);assert.ok(pose.outlineWidth>500&&pose.outlineWidth<610);assert.ok(pose.titleSize<180&&pose.titleSize>36);}
assert.match(fs.readFileSync(__dirname+'/styles.css','utf8'),/animation: history-title-glow 1\.5s/);
console.log('History exit geometry, backward flip, title destination and 1.5s glow: PASS');

assert.equal(historyPose(2400).text,0.5,"Title halfway after 400 of 800px");

for(const local of [0,400,799,800])assert.equal(historyPose(local).outline,0,"Outline waits for 800px scroll");
assert.ok(historyPose(801).outline>0);

assert.equal(historyPose(1400).outline,0.5,"Outline needs 1200px scroll to complete");
