const assert=require('node:assert/strict'),fs=require('node:fs');
const {contactScrollPose:pose,transitionWeights,timeline,stateAt}=require('./script.js');
const heights=require('./figma-source.json').frames.map(f=>f.height),segments=timeline(heights),brand=segments[17];
assert.equal(brand.transition,1020);
for(let n=0;n<=100;n++){
 const p=n/100,{brandY,contactY}=pose(p);
 assert.equal(brandY+1020,contactY,'Adjacent scene edges remain joined');
 assert.ok(brandY<=0&&brandY>=-1020);assert.ok(contactY>=0&&contactY<=1020);
 assert.deepEqual(transitionWeights(17,p),{outgoing:1,incoming:1,black:0},'No opacity interpolation');
}
assert.equal(pose(0).contactY,1020);assert.equal(pose(1).contactY,0);
const contactStart=segments[18].start;
for(const d of [0,500,999,1000]){const s=stateAt(contactStart+d,heights);assert.equal(s.index,18);assert.equal(s.offset,0,'Contact first view still holds for 1000px');}
assert.equal(stateAt(contactStart+1001,heights).offset,1);
const css=fs.readFileSync(__dirname+'/styles.css','utf8'),js=fs.readFileSync(__dirname+'/script.js','utf8');
assert.match(css,/\.design-stage > \.f19-layer-003, \.design-stage > \.f19-layer-004 \{ top: 0; z-index: 80;/);
assert.ok(js.includes('contactGradients.forEach(layer=>stage.append(layer))'),'Use original gradient elements outside scrolling content');
console.log('Brand to Contact: adjacent opaque vertical scenes; original gradients fixed above scrolling content; Contact entry hold preserved: PASS');
