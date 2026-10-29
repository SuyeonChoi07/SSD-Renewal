const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {fittedCamera}=require('./intro-model.js');
const original={position:[10,20,30],target:[2,4,6]};
assert.deepEqual(fittedCamera(original,1.05),{position:[10.4,20.8,31.200000000000003],target:[2,4,6]});
assert.deepEqual(original,{position:[10,20,30],target:[2,4,6]},'Camera target and source stay unchanged');
const code=fs.readFileSync(__dirname+'/intro-model.js','utf8');
function simulate(mode){
 const bread={dataset:{}},iframe={dataset:{modelId:'8ca58505f79f439383097d522f25b60a',cameraDistance:'1.05'},closest:()=>bread};
 let options,camera,interaction,callback,background;
 const api={addEventListener:(name,fn)=>{assert.equal(name,'viewerready');callback=fn;},start:()=>callback(),setUserInteraction:value=>interaction=value,setCameraEasing:()=>{},setEnableCameraConstraints:(enabled,opts,cb)=>cb(),focusOnVisibleGeometries:cb=>cb(),getCameraLookAt:cb=>cb(null,original),setCameraLookAt:(pos,target,duration,cb)=>{camera={pos,target,duration};cb();},setBackground:(opts,cb)=>{background=opts;cb(mode==='background-error'?new Error('unsupported'):null);}};
 function Sketchfab(){this.init=(id,opts)=>{options=opts;if(mode==='error')opts.error();else opts.success(api);};}
 const context={document:{querySelector:()=>iframe},setTimeout:()=>1,clearTimeout:()=>{}};
 if(mode!=='missing')context.Sketchfab=Sketchfab;
 vm.runInNewContext(code,context);
 return {bread,options,camera,interaction,background};
}
const success=simulate('ready');assert.equal(success.bread.dataset.modelState,'ready');assert.equal(success.options.transparent,1);assert.equal(success.options.autospin,0);assert.equal(success.interaction,false);assert.equal(success.camera.duration,0);assert.equal(success.background.transparent,true);
for(const mode of ['error','missing','background-error'])assert.equal(simulate(mode).bread.dataset.modelState,'fallback');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),css=fs.readFileSync(__dirname+'/styles.css','utf8');
assert.match(html,/data-model-id="8ca58505f79f439383097d522f25b60a"/);
assert.match(css,/\.intro-bread-viewer[^}]*pointer-events: none/);
assert.match(css,/--bread-rotation/);assert.match(css,/--bread-shift-y/);
console.log('Intro 3D: camera framing, transparent background request, scroll passthrough, preserved motion container and load/error fallback: PASS');
