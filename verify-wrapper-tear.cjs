const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const {wrapperTearPose:pose,timeline}=require('./script.js');
const segments=timeline(require('./figma-source.json').frames.map(f=>f.height));
assert.equal(segments[14].transition+segments[15].transition,2000);assert.equal(segments[15].hold,0);
assert.deepEqual(pose(14,1),pose(15,0));assert.equal(pose(14,0).frame,0);
const seen=new Set();
for(let i=0;i<20;i++){
 const distance=i*100+1,index=distance<700?14:15,t=index===14?distance/700:(distance-700)/1300,p=pose(index,t);
 assert.equal(p.frame,i+1);assert.ok(p.opacities.every(v=>v===0||v===1));seen.add(p.frame);
}
assert.equal(seen.size,20);assert.ok(pose(16,0).opacities.every(v=>v===0));
const manifest=require('./assets/wrapper-generation-v4.json');assert.equal(manifest.assets.length,20);
const hashes=new Set();let previous=-1;
for(const asset of manifest.assets){const bytes=fs.readFileSync(__dirname+'/'+asset.path);hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));assert.ok(asset.transparentFraction>previous);previous=asset.transparentFraction;}
assert.equal(hashes.size,20,'Twenty distinct generated images');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),css=fs.readFileSync(__dirname+'/styles.css','utf8'),script=fs.readFileSync(__dirname+'/script.js','utf8');
assert.equal((html.match(/data-tear-frame=/g)||[]).length,21,'Baseline plus 20 full images');
assert.ok(!html.includes('tear-half')&&!css.includes('tear-half')&&!script.includes('tear-retreat'),'No half clipping or artificial paper movement');
for(const asset of manifest.assets)assert.ok(html.includes(asset.path));
console.log('20 individually generated full frames; 100px each; unique files, increasing opening area; no cropping/movement/fade workaround: PASS');

assert.ok(!script.includes('--tear-left')&&!css.includes('--tear-left'),'No whole-image slide');

const {wrapperCopyVisible}=require("./script.js");
for(let p=0;p<1;p+=.01)assert.equal(wrapperCopyVisible(13,p),false,"Copy stays hidden throughout partial scene 14 opacity");
assert.equal(wrapperCopyVisible(13,1),false);assert.equal(wrapperCopyVisible(14,0),true);
