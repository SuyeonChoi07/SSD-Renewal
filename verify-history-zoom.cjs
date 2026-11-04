const assert=require('node:assert/strict');
const {historyZoomPose:pose,timeline}=require('./script.js');
const plain=p=>[p.x,p.y,p.width,p.height];
assert.deepEqual(plain(pose(5,4600,0)),[732,150,600,720]);
assert.deepEqual(plain(pose(5,5000,1)),plain(pose(6,0,0)));
assert.deepEqual(plain(pose(6,600,1)),plain(pose(7,0,0)));
assert.deepEqual(plain(pose(7,600,1)),plain(pose(8,0,0)));
assert.deepEqual(plain(pose(8,0,0)),[0,0,2064,1020]);
for(const index of [6,7])for(let d=60;d<=600;d+=60)assert.ok(pose(index,d).width>=pose(index,d-60).width);
assert.deepEqual(plain(pose(6,600)),plain(pose(6,2500)),'Zoom endpoint holds without jump');
console.log('History last photo: continuous zoom geometry through bridges to full Daejeon background: PASS');

const {stateAt}=require('./script.js');
const heights=require('./figma-source.json').frames.map(f=>f.height),segments=timeline(heights);
assert.equal(segments[5].hold,0);assert.equal(segments[5].transition,150);
assert.equal(segments[6].entryHold,0);assert.equal(segments[6].hold,0);assert.equal(segments[6].transition,0);assert.equal(segments[6].length,600);
assert.equal(segments[7].entryHold,0);assert.equal(segments[7].motion,600);assert.equal(segments[7].hold,750);
assert.equal(stateAt(segments[6].start+600,heights).index,7,'Bridge changes immediately after its 600px zoom');
assert.equal(stateAt(segments[7].start+600+750,heights).transition,0,'Scene 7 retains its final hold');
const html=require('node:fs').readFileSync(__dirname+'/index.html','utf8');
const stack=html.slice(html.indexOf('<div class="bridge-photo-stack"'));
assert.ok(stack.indexOf('class="f08-layer-005"')<stack.indexOf('class="f07-layer-005"'),'f08 is prepositioned behind f07');
assert.match(html,/rel="preload" href="assets\/bridge-store-detail.png" as="image"/);
console.log('Bridge: no hold or transition gap; next original photo prepositioned and preloaded: PASS');

const {shouldExpandHistoryPhoto,historyCarouselFocus,historyCarouselGeometry}=require('./script.js');
for(const local of [0,600,1000,2000,3000,4000,4599,4600]) {
 const state=stateAt(segments[5].start+segments[5].entryHold+local,heights);
 assert.equal(shouldExpandHistoryPhoto(state.index,state.transition),false,'Zoom must not override ordered gallery before outgoing transition');
 const focus=historyCarouselFocus(5,local);
 if(focus<8)assert.ok(historyCarouselGeometry(focus,8).x>732,'Last photo stays to the right until its turn');
}
assert.equal(historyCarouselGeometry(3,3).opacity,1,'Current center photo must not be dimmed');
assert.equal(shouldExpandHistoryPhoto(5,.01),true);
assert.equal(shouldExpandHistoryPhoto(6,0),true);
console.log('Regression: last photo cannot jump into center early or dim current center photo: PASS');
