const assert=require('node:assert/strict');
const {historyCarouselFocus:focus,historyCarouselGeometry:geometry}=require('./script.js');
assert.equal(focus(3,99999),0);assert.equal(focus(4,0),0);assert.equal(focus(4,4600),3);assert.equal(focus(5,0),3);assert.equal(focus(5,8200),8);
for(let active=0;active<=8;active++){
 const center=geometry(active,active);assert.equal(center.x,732);assert.equal(center.width,600);assert.equal(center.height,720);assert.equal(center.opacity,1);
 if(active<8){const next=geometry(active,active+1),arrived=geometry(active+1,active+1),old=geometry(active+1,active);assert.equal(next.x,1362);assert.equal(next.width,250);assert.equal(next.opacity,.6);assert.equal(arrived.x,732);assert.equal(old.x,452);assert.equal(old.width,250);assert.equal(old.opacity,.6);}
}
for(const progress of [.1,.25,.5,.75,.9]){const incoming=geometry(progress,1);assert.ok(incoming.x<1362&&incoming.x>732);assert.ok(incoming.width>250&&incoming.width<600);assert.ok(incoming.opacity>.6&&incoming.opacity<1);}
console.log('History gallery: adjacent photos, continuous positions/sizes/opacity, no reset across content frames: PASS');

for(const [frame,count] of [[4,3],[5,5]])for(let step=0;step<count-1;step++){const at=step*1800+1000;const expected=(frame===4?0:3)+step+1;for(const delta of [0,400,799,800])assert.equal(focus(frame,at+delta),expected,'Every center photo holds 800px');}

const early=geometry(.1,1),late=geometry(.9,1);assert.ok((1362-early.x)/630<.02,"Slow departure");assert.ok((late.x-732)/630<.02,"Slow arrival");
