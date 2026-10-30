const assert=require('node:assert/strict');
const {brandPose:pose,BRAND_HALL_PIN:pin,BRAND_HALL_SCROLL:width,timeline,stateAt}=require('./script.js');
const heights=require('./figma-source.json').frames.map(f=>f.height),segment=timeline(heights)[17];
assert.equal(segment.motion,width);assert.equal(segment.entryHold,1000);
for(const local of [0,1000,pin-1,pin]){const p=pose(local);assert.equal(p.offset,local);assert.equal(p.galleryX,0);assert.equal(235-p.offset+p.offset,235,'Bread remains at its original screen height');}
let previousX=0,previousRotation=-1;
for(let d=0;d<=width;d+=1){
 const local=pin+d,p=pose(local),state=stateAt(segment.start+segment.entryHold+local,heights);
 assert.equal(p.offset,pin,'Vertical motion stops during horizontal gallery');
 assert.equal(5248-p.offset,180,'Heading reaches attached image position');
 assert.ok(p.galleryX<=previousX);assert.ok(p.breadRotation>previousRotation);
 assert.equal(state.offset,pin);assert.equal(state.transition,0);
 previousX=p.galleryX;previousRotation=p.breadRotation;
}
assert.equal(pose(pin+width).galleryX,-width);
for(const d of [1,200,1061]){const p=pose(pin+width+d);assert.equal(p.offset,pin+d);assert.equal(p.galleryX,-width,'Gallery stops moving after last photo');}
assert.equal(129+3635+pose(pin+width).galleryX,1935,'Last photo ends at right inset');
assert.equal(pose(segment.travel+width).offset,segment.travel);
assert.equal(pose(segment.travel+width).breadRotation,360);
assert.deepEqual(pose(segment.travel+width+1500),pose(segment.travel+width),'Final hold preserves complete pose');
console.log('Brand: pinned rotating bread, heading at 180px, vertical pause during gallery, full last photo then vertical resume: PASS');

const {brandCharacterOpacity:alpha}=require('./script.js');
for(const count of [23,240]){
 for(let i=0;i<count;i++){
  assert.equal(alpha(0,0,i,count),0,'Loading without scroll cannot reveal letters');
  assert.equal(alpha(680,0,i,count),1,'All characters revealed during entry hold');
  assert.equal(alpha(1000,180,i,count),0,'All characters fade out with downward scroll');
 }
 assert.ok(alpha(300,0,0,count)>alpha(300,0,count-1,count),'Letters enter in reading order');
 assert.ok(alpha(1000,90,0,count)<alpha(1000,90,count-1,count),'Letters exit in reading order');
 const before=alpha(350,0,Math.floor(count/2),count);
 alpha(1000,180,Math.floor(count/2),count);
 assert.equal(alpha(350,0,Math.floor(count/2),count),before,'Reverse scroll restores exact character opacity');
}
const css=require('node:fs').readFileSync(__dirname+'/styles.css','utf8');
assert.ok(!css.includes('brand-character-in'),'No time-based autoplay animation');
console.log('Brand heading and introduction: scroll-driven per-character in/out; no loading autoplay; reversible: PASS');
