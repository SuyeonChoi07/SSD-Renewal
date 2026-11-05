const assert=require('node:assert/strict');
const {timeline,stateAt,historyCarouselFocus,historyCarouselGeometry,shouldExpandHistoryPhoto}=require('./script.js');
const heights=require('./figma-source.json').frames.map(frame=>frame.height);
const segments=timeline(heights);
assert.equal(segments[3].entryHold,200);
const last=segments[5];
assert.equal(last.motion,4600);
assert.equal(last.hold,200);
for(let index=6;index<=9;index++)assert.equal(segments[index].length,0);
const holdStart=last.start+last.entryHold+last.motion;
for(const delta of [0,100,199,200]){
  const state=stateAt(holdStart+delta,heights);
  assert.equal(state.index,5);
  assert.equal(state.transition,0);
  assert.equal(historyCarouselFocus(state.index,state.local),8);
}
assert.equal(stateAt(last.start+last.length,heights).index,10);
for(const index of [5,6,10])assert.equal(shouldExpandHistoryPhoto(index,1),false);
assert.equal(historyCarouselGeometry(8,8).width,600);
assert.equal(historyCarouselGeometry(8,8).height,720);
console.log('History last photo holds at 600x720 for 200px; image expansion is removed: PASS');
