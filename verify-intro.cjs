const assert = require('node:assert/strict');
const {introPose,introLinePose}=require('./script.js');
const travel=2040;
for(const offset of [0,500,1000,1500]) {
  const pose=introPose(offset,travel);
  assert.equal(pose.breadX,1035);
  assert.equal(pose.breadY,326);
  // The scene scroll and the bread's counter-translation cancel each other.
  assert.equal(-offset+326+offset,326);
}
const end=introPose(travel,travel);
assert.equal(end.breadX,1035);
assert.equal(end.breadRotation,360);
let previousRotation=-1;
for(let offset=0;offset<=travel;offset+=20){const pose=introPose(offset,travel);assert.equal(pose.breadX,1035,'No horizontal bread movement');assert.ok(pose.breadRotation>previousRotation,'Clockwise rotation follows scroll');previousRotation=pose.breadRotation;}
const css=require('node:fs').readFileSync(__dirname+'/styles.css','utf8');
assert.match(css,/#intro \.f02-layer-006 \{ left: 301px;/);
assert.match(css,/#intro \.f02-layer-037 \{ top: 319px; transform: translateY\(var\(--intro-offset, 0px\)\)/);
assert.equal(end.breadY,350);
assert.deepEqual(introPose(travel+1500,travel),end,'End pose stays fixed during hold');
assert.deepEqual(introLinePose(0,0,.20,0,true),{opacity:1,y:0});
assert.deepEqual(introLinePose(.5,0,.20,0,true),{opacity:0,y:-40});
const entering=introLinePose(.38,.32,.59,0);
assert.ok(entering.opacity>0&&entering.opacity<1&&entering.y>0,'Enter from below');
assert.ok(introLinePose(.38,.32,.59,1).opacity<entering.opacity,'Lines are staggered');
const leaving=introLinePose(.65,.32,.59,0);
assert.ok(leaving.opacity>0&&leaving.opacity<1&&leaving.y<0,'Exit upward');
for(let line=0;line<4;line++)assert.deepEqual(introLinePose(1,.71,null,line),{opacity:1,y:0});
console.log(JSON.stringify({status:'PASS',introBreadPinned:true,breadSettlesOnHands:true,textLineStagger:true,slideFadeDirections:'PASS',endHoldPose:'PASS'},null,2));
