import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { tableSettings } from './settings.js';

export async function mountTableScene(root, settings = tableSettings) {
 const view = root.querySelector('.table-scene__view');
 const status = root.querySelector('[data-table-status]');
try {
 const renderer=new THREE.WebGLRenderer({antialias:true});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
 renderer.toneMapping=THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure=settings.exposure;
 renderer.shadowMap.enabled=true;
 renderer.shadowMap.type=THREE.PCFShadowMap;
 view.prepend(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#FFE385');
 const pmrem=new THREE.PMREMGenerator(renderer);
 const room=new RoomEnvironment();
 const environment=pmrem.fromScene(room);
 scene.environment=environment.texture;
 scene.environmentIntensity=settings.environmentIntensity;
 pmrem.dispose();room.dispose();
 // Warm window sunlight against a softer, cooler ambient sky.
 scene.add(new THREE.HemisphereLight(0xfff4e7,0xa18d76,settings.light.ambient));
 const key=new THREE.DirectionalLight(0xffefd5,settings.light.key);scene.add(key);
 const fill=new THREE.DirectionalLight(0xfff3e5,settings.light.fill);scene.add(fill);
 const gltf=await new GLTFLoader().loadAsync(settings.modelUrl);
 scene.add(gltf.scene);
 const box=new THREE.Box3().setFromObject(gltf.scene);
 if(box.isEmpty())throw Error('모델에 표시할 형상이 없습니다.');
 const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());
 const span=Math.max(size.x,size.y,size.z,.01);
 // Keep the original framing while reducing only the requested objects.
 for(const name of ['아이코스피어','봉투']){
 const object=gltf.scene.getObjectByName(name);
 if(!object)throw Error('모델에서 '+name+' 오브젝트를 찾을 수 없습니다.');
 object.scale.multiplyScalar(settings.objectScale);
 }
 const bounceGroup=new THREE.Group();bounceGroup.name='빵과 봉투 애니메이션 그룹';
 gltf.scene.add(bounceGroup);
 scene.updateMatrixWorld(true);
 const groupCenter=new THREE.Box3();
 for(const name of ['아이코스피어','봉투'])groupCenter.expandByObject(gltf.scene.getObjectByName(name));
 bounceGroup.position.copy(gltf.scene.worldToLocal(groupCenter.getCenter(new THREE.Vector3())));
 scene.updateMatrixWorld(true);
 for(const name of ['아이코스피어','봉투'])bounceGroup.attach(gltf.scene.getObjectByName(name));
 const bounceHome=bounceGroup.position.clone();
 const bounceBounds=new THREE.Box3().setFromObject(bounceGroup);
 const bounceHeight=Math.max(bounceBounds.getSize(new THREE.Vector3()).y*.9,span*.015)*settings.liftMultiplier;
 // Keep the GLB's original PBR materials and textures.
 gltf.scene.traverse(object=>{if(!object.isMesh)return;
 object.castShadow=true;object.receiveShadow=true;
 });
 const shadowCanvas=document.createElement('canvas');
 shadowCanvas.width=shadowCanvas.height=64;
 const shadowContext=shadowCanvas.getContext('2d');
 const gradient=shadowContext.createRadialGradient(32,32,0,32,32,32);
 gradient.addColorStop(0,'rgba(0,0,0,0.65)');
 gradient.addColorStop(.48,'rgba(0,0,0,0.35)');
 gradient.addColorStop(1,'rgba(0,0,0,0)');
 shadowContext.fillStyle=gradient;
 shadowContext.fillRect(0,0,64,64);
 const shadowTexture=new THREE.CanvasTexture(shadowCanvas);
 const contactMaterial=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity:.72,depthWrite:false,side:THREE.DoubleSide});
 const bounceSize=bounceBounds.getSize(new THREE.Vector3());
 const contactShadow=new THREE.Mesh(new THREE.PlaneGeometry(bounceSize.x*1.45,bounceSize.z*1.45),contactMaterial);
 contactShadow.rotation.x=-Math.PI/2;
 const contactCenter=bounceBounds.getCenter(new THREE.Vector3());
 const floorRay=new THREE.Raycaster(new THREE.Vector3(contactCenter.x,bounceBounds.max.y+span,contactCenter.z),new THREE.Vector3(0,-1,0),0,span*4);
 const floorObjects=['Tray','Table'].map(name=>gltf.scene.getObjectByName(name)).filter(Boolean);
 const floorHit=floorRay.intersectObjects(floorObjects,true).find(hit=>hit.point.y<=bounceBounds.min.y+span*.02);
 contactShadow.position.set(contactCenter.x,(floorHit?.point.y??bounceBounds.min.y-span*.003)+span*.001,contactCenter.z);
 contactShadow.renderOrder=2;
 scene.add(contactShadow);
 const camera=new THREE.PerspectiveCamera(45,Math.max(view.clientWidth,1)/Math.max(view.clientHeight,1),1,span*10);
 camera.position.set(center.x,box.max.y+span*2,center.z);
 camera.up.set(0,0,-1);camera.lookAt(center);
 camera.position.fromArray(settings.cameraPosition);
 const framingDistance=Math.max(camera.position.y-box.max.y,span*.01);
 camera.near=Math.max(.01,framingDistance*.2);
 camera.zoom=settings.startZoom/100;
 const pivot=center.clone(),orbitBase=camera.position.clone(),orbitUp=camera.up.clone();
 const baseRotation=camera.quaternion.clone();
 camera.far=Math.max(camera.far,camera.position.length()*3);
 // Top-view screen upper-right is world +X/-Z; elevation is 60° above the table.
 const horizontal=span;
 key.position.copy(center).add(new THREE.Vector3(horizontal/Math.sqrt(2),horizontal*Math.tan(Math.PI/3),-horizontal/Math.sqrt(2)));
 fill.position.copy(center).add(new THREE.Vector3(span,span,-span));
 key.target.position.copy(center);fill.target.position.copy(center);scene.add(key.target,fill.target);
 key.castShadow=true;
 key.shadow.mapSize.set(2048,2048);
 key.shadow.camera.left=-span;key.shadow.camera.right=span;
 key.shadow.camera.top=span;key.shadow.camera.bottom=-span;
 key.shadow.camera.near=span*.01;key.shadow.camera.far=span*6;
 key.shadow.normalBias=span*.00035;
 key.shadow.bias=-0.00005;
 key.shadow.radius=settings.light.shadowRadius;
 // An arched window projects its light and mullion shadows onto the model.
 const windowCanvas=document.createElement('canvas');
 windowCanvas.width=windowCanvas.height=512;
 const windowContext=windowCanvas.getContext('2d');
 windowContext.fillStyle='#080808';windowContext.fillRect(0,0,512,512);
 function traceWindow(){
   windowContext.beginPath();
   windowContext.moveTo(96,472);windowContext.lineTo(416,472);
   windowContext.lineTo(416,192);
   windowContext.bezierCurveTo(416,95,345,40,256,40);
   windowContext.bezierCurveTo(167,40,96,95,96,192);
   windowContext.closePath();
 }
 windowContext.save();
 windowContext.shadowColor='#ffffff';windowContext.shadowBlur=15;
 windowContext.fillStyle='#fffaf0';traceWindow();windowContext.fill();
 windowContext.restore();
 windowContext.save();traceWindow();windowContext.clip();
 windowContext.strokeStyle='rgba(18,18,18,.85)';windowContext.lineWidth=8;
 for(const x of [176,256,336]){
   windowContext.beginPath();windowContext.moveTo(x,472);windowContext.lineTo(x,70);windowContext.stroke();
 }
 for(const y of [240,320,400]){
   windowContext.beginPath();windowContext.moveTo(96,y);windowContext.lineTo(416,y);windowContext.stroke();
 }
 windowContext.beginPath();windowContext.arc(256,194,90,Math.PI,0);windowContext.stroke();
 windowContext.restore();
 windowContext.strokeStyle='rgba(18,18,18,.8)';windowContext.lineWidth=11;
 traceWindow();windowContext.stroke();
 const windowTexture=new THREE.CanvasTexture(windowCanvas);
 windowTexture.colorSpace=THREE.SRGBColorSpace;
 const blockerMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,colorWrite:false,depthWrite:false});
 const daylight=new THREE.SpotLight(0xfff4df,settings.light.window,span*5,Math.PI/6,.7,1);
 daylight.map=windowTexture;
 daylight.position.copy(center).add(new THREE.Vector3(span*.65,span*1.6,-span*.7));
 daylight.target.position.set(center.x,box.max.y,center.z);
 daylight.castShadow=true;
 daylight.shadow.mapSize.set(1024,1024);
 daylight.shadow.bias=-0.00005;
 daylight.shadow.normalBias=span*.00035;
 daylight.shadow.radius=3;
 scene.add(daylight,daylight.target);
 // Soft sunlight falls through the spaces between the mullions onto the table.
 const tableObject=gltf.scene.getObjectByName('Table');
 if(tableObject){
 const tableBounds=new THREE.Box3().setFromObject(tableObject);
 const tableSize=tableBounds.getSize(new THREE.Vector3());
 const tableCenter=tableBounds.getCenter(new THREE.Vector3());
 const tablePullDirection=Math.sign(camera.position.z-tableCenter.z)||1;
 tableObject.position.z+=tableSize.x*.27*tablePullDirection;
 tableBounds.setFromObject(tableObject).getCenter(tableCenter);
 }
 // Shadow-only foliage between the window and tabletop, swaying in a light breeze.
 const foliage=new THREE.Group();
 const foliageY=box.max.y+span*.22;
 const lightShift=(foliageY-center.y)/Math.sqrt(6);
 foliage.position.set(center.x+lightShift,foliageY,center.z-lightShift);
 const leaves=[];
 const leafGeometry=new THREE.CircleGeometry(1,24);
 for(let i=0;i<14;i++){
 const angle=i*2.3999632297;
 const distance=span*(.025+.016*Math.sqrt(i));
 const leaf=new THREE.Mesh(leafGeometry,blockerMaterial);
 leaf.rotation.set(-Math.PI/2,0,angle+.4);
 leaf.position.set(Math.cos(angle)*distance,Math.sin(i)*span*.006,Math.sin(angle)*distance);
 leaf.scale.set(span*(.021+(i%3)*.004),span*.009,1);
 leaf.castShadow=true;foliage.add(leaf);
 leaves.push({leaf,angle:angle+.4,phase:i*1.7});
 }
 scene.add(foliage);
 const readout=root.querySelector('[data-table-readout]');
 const render=()=>renderer.render(scene,camera);
 let zoomPercent=settings.startZoom;
 let sectionXOffset=0;
 function resize(){
 const width=Math.max(view.clientWidth,1),height=Math.max(view.clientHeight,1);
 camera.aspect=width/height;
 const framingHeight=Math.max(size.z,size.x/camera.aspect,.01)*1.25;
 camera.fov=THREE.MathUtils.radToDeg(2*Math.atan(framingHeight/(2*framingDistance)));
 camera.updateProjectionMatrix();
 renderer.setSize(width,height);
 render();
 }
 resize();
 scene.updateMatrixWorld(true);
 camera.updateMatrixWorld(true);
 const ray=new THREE.Raycaster();
 ray.setFromCamera(new THREE.Vector2(0,0),camera);
 const hit=ray.intersectObject(gltf.scene,true)[0];
 if(hit)pivot.copy(hit.point);
 const utensils=new Map(['Spoon','Knife','Fork'].map(name=>{
 const object=gltf.scene.getObjectByName(name);
 if(!object)throw Error('모델에서 '+name+' 오브젝트를 찾을 수 없습니다.');
 const center=new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());
 return [name,{object,center,home:object.position.clone(),targetX:object.position.x,targetZ:object.position.z}];
 }));
 const hoverPlane=new THREE.Plane(new THREE.Vector3(0,1,0));
 const hoverPoint=new THREE.Vector3();
 const pointer=new THREE.Vector2();
 const breadHoverTarget=new THREE.Vector2();
 const breadHoverOffset=new THREE.Vector2();
 const breadHoverCenter=new THREE.Vector3();
 const breadHoverBounds=new THREE.Box3();
 const resetBreadHover=()=>breadHoverTarget.set(0,0);
 function resetUtensils(){
 for(const utensil of utensils.values()){
 utensil.targetX=utensil.home.x;
 utensil.targetZ=utensil.home.z;
 }
 }
 renderer.domElement.addEventListener('pointermove',event=>{
 if(root.dataset.active!=='true')return;
 const bounds=renderer.domElement.getBoundingClientRect();
 pointer.set((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1);
 camera.updateMatrixWorld();
 ray.setFromCamera(pointer,camera);
 const firstHit=ray.intersectObject(gltf.scene,true)[0];
 let selected=firstHit?.object;
 while(selected&&!utensils.has(selected.name)&&selected.name!=='아이코스피어'&&selected.name!=='봉투')selected=selected.parent;
 resetUtensils();
 resetBreadHover();
 if(!selected)return;
 if(selected.name==='아이코스피어'||selected.name==='봉투'){
 breadHoverBounds.setFromObject(bounceGroup).getCenter(breadHoverCenter);
 hoverPlane.constant=-breadHoverCenter.y;
 if(!ray.ray.intersectPlane(hoverPlane,hoverPoint))return;
 const distance=span*(settings.breadHoverDistance??.008);
 breadHoverTarget.set(
   THREE.MathUtils.clamp((hoverPoint.x-breadHoverCenter.x)/(span*.12),-1,1)*distance,
   THREE.MathUtils.clamp((hoverPoint.z-breadHoverCenter.z)/(span*.12),-1,1)*distance);
 return;
 }
 const utensil=utensils.get(selected.name);
 hoverPlane.constant=-utensil.center.y;
 if(!ray.ray.intersectPlane(hoverPlane,hoverPoint))return;
 const distance=span*(settings.utensilHoverDistance??.008);
 utensil.targetX=utensil.home.x+THREE.MathUtils.clamp((hoverPoint.x-utensil.center.x)/(span*.12),-1,1)*distance;
 utensil.targetZ=utensil.home.z+THREE.MathUtils.clamp((hoverPoint.z-utensil.center.z)/(span*.12),-1,1)*distance;
 });
 renderer.domElement.addEventListener('pointerleave',()=>{resetUtensils();resetBreadHover();});
 window.addEventListener('blur',()=>{resetUtensils();resetBreadHover();});
 const observer=new ResizeObserver(resize);
 observer.observe(view);
 function easeInOut(t){return t*t*t*(t*(t*6-15)+10);}
 function applyMotion(progress){
 const eased=easeInOut(progress);
 sectionXOffset=settings.endOffsetX*eased;
 // Rise, then descend and complete a full turn simultaneously.
 const bounceKeys=[[0,0],[.12,0],[.34,1],[.94,0],[1,0]];
 let lift=0;
 for(let i=1;i<bounceKeys.length;i++){
 const [start,value0]=bounceKeys[i-1], [end,value1]=bounceKeys[i];
 if(progress<=end){
 const t=THREE.MathUtils.clamp((progress-start)/(end-start),0,1);
 // Rise quickly and decelerate; descend slowly and accelerate toward landing.
 const smooth=value1>value0?1-Math.pow(1-t,3):value1<value0?t*t*t:t;
 lift=value0+(value1-value0)*smooth;break;
 }
 }
 bounceGroup.position.copy(bounceHome);bounceGroup.position.y+=bounceHeight*lift;
 bounceGroup.position.x+=breadHoverOffset.x;
 bounceGroup.position.z+=breadHoverOffset.y;
 contactMaterial.opacity=.72*(1-.88*lift);
 const spinProgress=THREE.MathUtils.clamp((progress-.34)/(.94-.34),0,1);
 const spinEase=spinProgress*spinProgress*(3-2*spinProgress);
 bounceGroup.rotation.z=Math.PI*2*spinEase;
 const zoomProgress=THREE.MathUtils.clamp(progress/settings.zoomEndAt,0,1);
 const zoomEase=easeInOut(zoomProgress);
 zoomPercent=Math.round(settings.startZoom+(settings.endZoom-settings.startZoom)*zoomEase);
 camera.zoom=zoomPercent/100;camera.updateProjectionMatrix();
 const pitch=settings.endPitch*eased;
 const rotation=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),THREE.MathUtils.degToRad(pitch));
 camera.position.copy(orbitBase).sub(pivot).applyQuaternion(rotation).add(pivot);
 camera.position.x+=sectionXOffset;
 camera.up.copy(orbitUp).applyQuaternion(rotation);
 camera.quaternion.copy(rotation).multiply(baseRotation);
 if(readout)readout.textContent=(progress===0?'SECTION 01':progress===1?'SECTION 02':'01 → 02')+' · '+zoomPercent+'% · '+pitch.toFixed(1)+'° · X 이동 '+sectionXOffset.toFixed(3);
 render();
 settings.onProgress?.(progress);
 }
 let motionProgress=0;
 let playbackFrame=0,playbackTarget=0,playing=false;
 const playTo=target=>{
 const next=THREE.MathUtils.clamp(target,0,1);
 if(playing&&playbackTarget===next||!playing&&motionProgress===next)return;
 cancelAnimationFrame(playbackFrame);
 const from=motionProgress,duration=settings.durationMs*Math.abs(next-from);
 playbackTarget=next;
 if(duration===0){motionProgress=next;playing=false;applyMotion(next);return;}
 playing=true;
 const started=performance.now();
 const tick=now=>{
 const elapsed=THREE.MathUtils.clamp((now-started)/duration,0,1);
 motionProgress=from+(next-from)*elapsed;
 applyMotion(motionProgress);
 if(elapsed<1)playbackFrame=requestAnimationFrame(tick);
 else{playing=false;playbackFrame=0;}
 };
 playbackFrame=requestAnimationFrame(tick);
 };
 applyMotion(0);
 if(status)status.textContent='';
 let lastFoliageFrame=0;
 function animateFoliage(now){
 requestAnimationFrame(animateFoliage);
 if(document.hidden||root.dataset.active!=='true'){
 for(const utensil of utensils.values()){
 utensil.object.position.x=utensil.home.x;
 utensil.object.position.z=utensil.home.z;
 }
 resetUtensils();
 resetBreadHover();breadHoverOffset.set(0,0);
 bounceGroup.position.x=bounceHome.x;
 bounceGroup.position.z=bounceHome.z;
 return;
 }
 if(now-lastFoliageFrame<33)return;
 lastFoliageFrame=now;
 for(const utensil of utensils.values()){
 utensil.object.position.x+=(utensil.targetX-utensil.object.position.x)*.22;
 utensil.object.position.z+=(utensil.targetZ-utensil.object.position.z)*.22;
 }
 breadHoverOffset.lerp(breadHoverTarget,.22);
 bounceGroup.position.x=bounceHome.x+breadHoverOffset.x;
 bounceGroup.position.z=bounceHome.z+breadHoverOffset.y;
 const t=now*.001;
 foliage.rotation.y=Math.sin(t*.55)*.055;
 foliage.position.x=center.x+lightShift+Math.sin(t*.7)*span*.003;
 for(const state of leaves){
 state.leaf.rotation.z=state.angle+Math.sin(t*.9+state.phase)*.09;
 state.leaf.rotation.x=-Math.PI/2+Math.sin(t*.75+state.phase)*.06;
 }
 // Camera motion continues on its independent 1.2-second timeline.
 renderer.render(scene,camera);
 }
 requestAnimationFrame(animateFoliage);
 return {playTo};
}catch(error){if(status){status.style.color='#b3261e';status.textContent='표시 오류: '+error.message;}console.error(error);}

}
