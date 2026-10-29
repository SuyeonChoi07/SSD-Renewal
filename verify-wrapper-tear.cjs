const assert=require('node:assert/strict'),fs=require('node:fs');
const {wrapperTearPose:pose,timeline,stateAt}=require('./script.js');
const segments=timeline(require('./figma-source.json').frames.map(f=>f.height));
assert.equal(segments[14].transition,700);assert.equal(segments[15].transition,800);assert.equal(segments[15].hold,0);
assert.deepEqual(pose(14,1),pose(15,0),'No midpoint reset');
const start=segments[14].start+segments[14].hold+segments[14].motion;
for(let distance=0;distance<=1500;distance+=25){const state=stateAt(start+distance,require('./figma-source.json').frames.map(f=>f.height));const p=pose(state.index,state.transition);assert.equal(p.step,Math.floor(distance/100));assert.ok(p.opacities.every(v=>v===0||v===1),'No translucent paper');if(distance<1500)assert.equal(p.opacities.reduce((a,b)=>a+b,0),1);}
const stages=new Set();for(let step=0;step<15;step++){const p=step<7?pose(14,step/7):pose(15,(step-7)/8);stages.add(p.frame+':'+p.retreat);}assert.equal(stages.size,15,'15 distinct paper poses');
assert.ok(pose(16,0).opacities.every(v=>v===0));
const manifest=require('./assets/wrapper-generation.json');for(const asset of manifest.assets)assert.ok(fs.statSync(__dirname+'/'+asset.path).size>0);
console.log('15 distinct opaque tear stages; 100px each, 1500px total, no midpoint delay: PASS');
