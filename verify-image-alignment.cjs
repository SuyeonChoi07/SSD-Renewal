const assert=require('node:assert/strict');
const {historyImageCrops:crops}=require('./script.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8, a+' vs '+b);
for(const progress of [0,.1,.25,.5,.75,1]){
 const {history,front}=crops(progress);
 near(history.left+history.width*181.5/350,front.left+front.width*181.5/350);
 near(history.top+history.height*19.5/241,front.top+front.height*71.5/292);
}
for(const progress of [1,1.2,1.5,1.8,2]){
 const {front,back}=crops(progress);
 near(front.left+front.width*181.5/350,back.left+back.width*2140/4096);
 near(front.top+front.height*71.5/292,back.top+back.height*847/3417);
 near(front.width*99/350,back.width*1202/4096);
 near(front.height*23/292,back.height*304/3417);
}
assert.deepEqual(crops(3).back,{width:159.93,height:270,left:-17.2,top:-13.63});
console.log('Sign lettering center and scale remain aligned across both image dissolves: PASS');
