const assert=require('node:assert/strict');
const {historyZoomPose:pose,timeline}=require('./script.js');
const plain=p=>[p.x,p.y,p.width,p.height];
assert.deepEqual(plain(pose(5,8200,0)),[732,150,600,720]);
assert.deepEqual(plain(pose(5,9000,1)),plain(pose(6,0,0)));
assert.deepEqual(plain(pose(6,1000,1)),plain(pose(7,0,0)));
assert.deepEqual(plain(pose(7,1000,1)),plain(pose(8,0,0)));
assert.deepEqual(plain(pose(8,0,0)),[0,0,2064,1020]);
for(const index of [6,7])for(let d=100;d<=1000;d+=100)assert.ok(pose(index,d).width>=pose(index,d-100).width);
assert.deepEqual(plain(pose(6,1000)),plain(pose(6,2500)),'Zoom endpoint holds without jump');
console.log('History last photo: continuous zoom geometry through bridges to full Daejeon background: PASS');

const {stateAt}=require('./script.js');
const heights=require('./figma-source.json').frames.map(f=>f.height),segments=timeline(heights);
assert.equal(segments[6].hold,0);assert.equal(segments[6].transition,0);assert.equal(segments[6].length,1000);
assert.equal(stateAt(segments[6].start+1000,heights).index,7,'Bridge changes immediately after zoom');
const html=require('node:fs').readFileSync(__dirname+'/index.html','utf8');
const stack=html.slice(html.indexOf('<div class="bridge-photo-stack"'));
assert.ok(stack.indexOf('class="f08-layer-005"')<stack.indexOf('class="f07-layer-005"'),'f08 is prepositioned behind f07');
assert.match(html,/rel="preload" href="assets\/bridge-store-detail.png" as="image"/);
console.log('Bridge: no hold or transition gap; next original photo prepositioned and preloaded: PASS');

const {shouldExpandHistoryPhoto,historyCarouselFocus,historyCarouselGeometry}=require('./script.js');
for(const local of [0,1000,1800,3600,5400,7200,8200,8999]) {
 const state=stateAt(segments[5].start+local,heights);
 assert.equal(shouldExpandHistoryPhoto(state.index,state.transition),false,'Zoom must not override ordered gallery before outgoing transition');
 const focus=historyCarouselFocus(5,local);
 if(focus<8)assert.ok(historyCarouselGeometry(focus,8).x>732,'Last photo stays to the right until its turn');
}
assert.equal(historyCarouselGeometry(3,3).opacity,1,'Current center photo must not be dimmed');
assert.equal(shouldExpandHistoryPhoto(5,.01),true);
assert.equal(shouldExpandHistoryPhoto(6,0),true);
console.log('Regression: last photo cannot jump into center early or dim current center photo: PASS');
