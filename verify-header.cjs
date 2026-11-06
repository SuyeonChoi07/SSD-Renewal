const assert=require('node:assert/strict'),fs=require('node:fs');
const {headerPose,scrollHintPose}=require('./script.js');
assert.equal(headerPose(0,0).width,365.299);
assert.equal(headerPose(0,1).width,124);
assert.equal(headerPose(0,1).height,50);
assert.ok(headerPose(0,.5).width>124&&headerPose(0,.5).width<365.299);
for(let index=0;index<18;index++){
  if(index>=6&&index<=9||index===11)continue;
  assert.deepEqual(headerPose(index,1),headerPose(index===5?10:index===10?12:index+1,0),'Continuous header at scene boundary');
}
assert.equal(headerPose(15,0).light,0);
assert.equal(headerPose(15,1).light,1);
assert.equal(headerPose(16,1).light,0);
assert.equal(headerPose(17,0).active[3],1);
assert.equal(headerPose(18,0).active[4],1);
assert.deepEqual(scrollHintPose(15,0),{dark:0,opacity:1});
assert.deepEqual(scrollHintPose(15,1),scrollHintPose(16,0));
assert.deepEqual(scrollHintPose(16,1),scrollHintPose(17,0));
assert.deepEqual(scrollHintPose(17,1),scrollHintPose(18,0));
assert.deepEqual(scrollHintPose(18,0),{dark:0,opacity:0});
const html=fs.readFileSync(__dirname+'/index.html','utf8');
assert.equal((html.match(/class="persistent-header"/g)||[]).length,1);
assert.match(html,/<a class="f10-layer-024"/,'Central wordmark stays visible');
console.log(JSON.stringify({status:'PASS',persistentHeader:true,continuousLogoSize:true,continuousThemeColor:true,activeNavigation:'PASS',centralWordmarkPreserved:true},null,2));
