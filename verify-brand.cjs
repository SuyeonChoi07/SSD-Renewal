const assert=require('node:assert/strict');
const {brandPose:pose,brandModelScrollAnchors,brandModelDrop,BRAND_HALL_PIN:pin,BRAND_HALL_SCROLL:width,timeline,stateAt}=require('./script.js');
const heights=require('./figma-source.json').frames.map(f=>f.height);
heights[17]=Number(require('node:fs').readFileSync(__dirname+'/index.html','utf8').match(/id="brand"[^>]*data-frame-height="(\d+)"/)[1]);
const segment=timeline(heights)[17];
assert.equal(segment.motion,width);assert.equal(segment.entryHold,1680);
const anchors=brandModelScrollAnchors(timeline(heights));
assert.deepEqual(anchors,[segment.start+1180,segment.start+segment.entryHold+4620]);
assert.ok(anchors[0]<anchors[1]);
assert.equal(stateAt(anchors[1],heights).offset,4620,'Model rotation ends at content offset -4620px');
assert.equal(brandModelDrop(anchors[0]-1,anchors),0);
assert.ok(brandModelDrop((anchors[0]+anchors[1])/2,anchors)>0);
assert.equal(brandModelDrop(anchors[1],anchors),50);
const fs=require('node:fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const moduleSource=fs.readFileSync(__dirname+'/brand-model.js','utf8');
const glb=fs.readFileSync(__dirname+'/assets/tws-scroll-reuse/tws.glb');
assert.equal(glb.toString('ascii',0,4),'glTF');
assert.equal(glb.readUInt32LE(8),glb.length);
assert.match(html,/class="brand-model-stage" data-node-id="779:926"/);
assert.doesNotMatch(html,/class="f18-layer-139/);
assert.match(moduleSource,/framing:\{size:550\}/);
const {ROTATION_DEGREES,axisEase,scrollRotation}=require('./assets/tws-scroll-reuse/rotation-math.mjs');
assert.deepEqual(ROTATION_DEGREES,{x:-700,y:0,z:353});
const radians=Math.PI/180;
assert.ok(Math.abs(scrollRotation(1).x+700*radians)<1e-10);
assert.ok(Math.abs(scrollRotation(1).z-353*radians)<1e-10);
for(const axis of ['x','z']){
  const peak=fn=>{
    let maximum=0;
    for(let i=1;i<10000;i++){
      const t=i/10000,h=.00001;
      maximum=Math.max(maximum,Math.abs((fn(t+h)-fn(t-h))/(2*h)));
    }
    return maximum;
  };
  const originalPeak=peak(t=>axisEase(t,axis));
  const newPeak=peak(t=>scrollRotation(t)[axis]/(ROTATION_DEGREES[axis]*radians));
  assert.ok(Math.abs(newPeak/originalPeak-.7)<.001,axis+' peak angular speed is 70%');
}
for(const distance of [1180,1300,1500,1679,1680]){
 const state=stateAt(segment.start+distance,heights);
 assert.equal(state.local,0,'Hold for 500px after the final character appears');
 assert.equal(state.offset,0);
}
assert.equal(stateAt(segment.start+1681,heights).offset,1,'Scroll resumes after the text hold');
for(const local of [0,1000,pin-400]){const p=pose(local);assert.equal(p.offset,local);assert.equal(p.galleryX,0);assert.equal(p.modelY,0);}
let previousX=0;
for(let d=0;d<=width;d+=1){
 const local=pin+d,p=pose(local),state=stateAt(segment.start+segment.entryHold+local,heights);
 assert.equal(p.offset,pin,'Vertical motion stops during horizontal gallery');
 assert.equal(6130-p.offset,180,'Heading reaches attached image position');
 assert.ok(p.galleryX<=previousX);
 assert.equal(state.offset,pin);assert.equal(state.transition,0);
 assert.equal(p.modelY,0,'3D bread stays fixed during horizontal gallery scroll');
 previousX=p.galleryX;
}
assert.equal(pose(pin+width).galleryX,-width);
for(const d of [1,200,1061]){
 const p=pose(pin+width+d);
 assert.equal(p.offset,pin+d);assert.equal(p.galleryX,-width,'Gallery stops moving after last photo');
 assert.equal(p.modelY,-d,'3D bread and gallery move upward by the same scroll distance');
}
assert.equal(129+3635+pose(pin+width).galleryX,1935,'Last photo ends at right inset');
assert.equal(pose(segment.travel+width).offset,segment.travel);
assert.deepEqual(pose(segment.travel+width+1500),pose(segment.travel+width),'Final hold preserves complete pose');
console.log('Brand: 3D model anchors and asset, heading at 180px, vertical pause during gallery, full last photo then vertical resume: PASS');

const {brandCharacterOpacity:alpha}=require('./script.js');
for(const count of [23,240]){
 for(let i=0;i<count;i++){
  assert.equal(alpha(0,0,i,count),0,'Loading without scroll cannot reveal letters');
  assert.equal(alpha(500,0,i,count),0,'No character appears before the 500px delay ends');
  assert.equal(alpha(1180,0,i,count),1,'All characters revealed after delay and original animation');
  assert.equal(alpha(1500,180,i,count),0,'All characters fade out with downward scroll');
 }
 assert.ok(alpha(800,0,0,count)>alpha(800,0,count-1,count),'Letters enter in reading order');
 assert.ok(alpha(1500,90,0,count)<alpha(1500,90,count-1,count),'Letters exit in reading order');
 const before=alpha(850,0,Math.floor(count/2),count);
 alpha(1500,180,Math.floor(count/2),count);
 assert.equal(alpha(850,0,Math.floor(count/2),count),before,'Reverse scroll restores exact character opacity');
}
const css=fs.readFileSync(__dirname+'/styles.css','utf8');
assert.doesNotMatch(css,/#brand > \.frame-art::before/,'No black overlay behind the hall');
assert.ok(!css.includes('brand-character-in'),'No time-based autoplay animation');
console.log('Brand heading and introduction: scroll-driven per-character in/out; no loading autoplay; reversible: PASS');

const {brandCellOpacity:cellOpacity}=require('./script.js');
for(const y of [-1,0,.2,.3,.7,.8,1,2])assert.equal(cellOpacity(y),.5);
for(const y of [.4,.45,.5,.55,.6])assert.equal(cellOpacity(y),1);
assert.ok(Math.abs(cellOpacity(.35)-.75)<1e-6);assert.ok(Math.abs(cellOpacity(.65)-.75)<1e-6);
for(let i=31;i<40;i++)assert.ok(cellOpacity(i/100)>cellOpacity((i-1)/100));
for(let i=61;i<=70;i++)assert.ok(cellOpacity(i/100)<cellOpacity((i-1)/100));
console.log('Brand cells: 50% outside 30–70vh; eased ramps at 30–40/60–70vh; 100% across 40–60vh: PASS');

const {brandGalleryReveal:reveal}=require('./script.js');
for(const top of [2,1,.85])assert.equal(reveal(top),0);
for(const top of [.45,.4,0,-1])assert.equal(reveal(top),1);
assert.ok(Math.abs(reveal(.65)-.5)<1e-6);
for(let i=1;i<=40;i++)assert.ok(reveal(.85-i*.01)>reveal(.85-(i-1)*.01));
assert.ok(css.includes('overflow: hidden;')&&css.includes('--brand-gallery-reveal-x'));
console.log('Brand gallery images: scroll-controlled left reveal from 85vh to 45vh; clipped to original photo parents: PASS');
