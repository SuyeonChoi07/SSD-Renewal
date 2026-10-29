const assert=require('node:assert/strict'),fs=require('node:fs');
const {wrapperTearPose:pose,timeline}=require('./script.js');
assert.equal(pose(14,0).opacities[0],1);assert.equal(pose(14,1).opacities[2],1);
assert.deepEqual(pose(14,1),pose(15,0),'Continuous midway tear');
assert.ok(pose(15,.85).retreat>0);
assert.ok(pose(15,1).opacities.every(v=>v===0),'Paper fully gone for scene 16');
for(const scene of [14,15])for(const t of [0,.2,.4,.6,.8,1]){const p=pose(scene,t);assert.ok(p.opacities.filter(o=>o>0).length<=2);assert.ok(p.opacities.every(o=>o>=0&&o<=1));}
const segments=timeline(require('./figma-source.json').frames.map(f=>f.height));
assert.equal(segments[14].transition,1000);assert.equal(segments[15].transition,1000);
const manifest=require('./assets/wrapper-generation.json');assert.equal(manifest.assets.length,3);
for(const asset of manifest.assets)assert.ok(fs.statSync(__dirname+'/'+asset.path).size>0);
console.log('Generated wrapper frames, ordered tear progression, reversible easing, and final paper removal: PASS');
