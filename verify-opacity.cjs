const assert=require('node:assert/strict');
const {transitionWeights}=require('./script.js');
for(let scene=0;scene<18;scene++)for(let n=0;n<=100;n++){
 const w=transitionWeights(scene,n/100);
 if(scene===13){assert.ok(w.outgoing===0||w.incoming===0);continue;}
 if(scene===15){assert.equal(w.outgoing+w.incoming,1,'Requested complementary crossfade');continue;}
 const compositeAlpha=w.incoming+w.outgoing*(1-w.incoming);
 assert.equal(compositeAlpha,1,'No transparency dip during scene transition');
}
console.log('All regular transitions keep composite opacity 1; intentional black fade preserved: PASS');
