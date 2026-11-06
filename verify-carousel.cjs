const assert=require('node:assert/strict');
const {historyCarouselFocus:focus,historyCarouselGeometry:geometry}=require('./script.js');
assert.equal(focus(3,99999),0);assert.equal(focus(4,0),0);assert.equal(focus(4,2400),3);assert.equal(focus(5,0),3);assert.equal(focus(5,3000),8);
for(let active=0;active<=8;active++){
 const center=geometry(active,active);assert.equal(center.x,732);assert.equal(center.width,600);assert.equal(center.height,720);assert.equal(center.opacity,1);
 if(active<8){const next=geometry(active,active+1),arrived=geometry(active+1,active+1),old=geometry(active+1,active);assert.equal(next.x,1362);assert.equal(next.width,250);assert.equal(next.opacity,.6);assert.equal(arrived.x,732);assert.equal(old.x,452);assert.equal(old.width,250);assert.equal(old.opacity,.6);}
}
for(const progress of [.1,.25,.5,.75,.9]){const incoming=geometry(progress,1);assert.ok(incoming.x<1362&&incoming.x>732);assert.ok(incoming.width>250&&incoming.width<600);assert.ok(incoming.opacity>.6&&incoming.opacity<1);}
console.log('History gallery: adjacent photos, continuous positions/sizes/opacity, no reset across content frames: PASS');

for(const [frame,count] of [[4,3],[5,5]])for(let step=0;step<count;step++){
 const start=step*600+(frame===4&&step>0?600:0),base=(frame===4?0:3)+step;
 const duration=frame===4&&step===0?1200:600;
 assert.equal(focus(frame,start),base);
 assert.equal(focus(frame,start+duration/2),base+.5);
 assert.equal(focus(frame,start+duration),base+1,'Next photo begins immediately after the previous transition');
}

const early=geometry(.1,1),late=geometry(.9,1);assert.ok((1362-early.x)/630<.02,"Slow departure");assert.ok((late.x-732)/630<.02,"Slow arrival");
