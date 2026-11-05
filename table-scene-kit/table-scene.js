import * as THREE from './vendor/three.module.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
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
 renderer.shadowMap.type=THREE.VSMShadowMap;
 view.prepend(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e9e6e0');
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
 // A simple diffuse preview avoids reflection-map preparation and dark metals.
 gltf.scene.traverse(object=>{if(!object.isMesh)return;
 const convert=material=>new THREE.MeshLambertMaterial({
  color:material.color?.clone()??new THREE.Color('white'),map:material.map,
  side:THREE.DoubleSide,transparent:material.transparent,opacity:material.opacity,
  alphaTest:material.alphaTest,vertexColors:material.vertexColors
 });
 object.material=Array.isArray(object.material)?object.material.map(convert):convert(object.material);
 object.castShadow=true;object.receiveShadow=true;
 });
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
 key.shadow.mapSize.set(1024,1024);
 key.shadow.camera.left=-span;key.shadow.camera.right=span;
 key.shadow.camera.top=span;key.shadow.camera.bottom=-span;
 key.shadow.camera.near=span*.01;key.shadow.camera.far=span*6;
 key.shadow.normalBias=span*.0015;
 key.shadow.bias=-0.0002;
 key.shadow.radius=settings.light.shadowRadius;
 key.shadow.blurSamples=8;
 // Invisible window mullions only block sunlight: no visible geometry above the table.
 const windowFrame=new THREE.Group();
 windowFrame.position.set(center.x,box.max.y+span*.3,center.z);
 windowFrame.rotation.y=Math.PI/5;
 const blockerMaterial=new THREE.MeshBasicMaterial({side:THREE.DoubleSide,colorWrite:false,depthWrite:false});
 function addMullion(width,depth,x,z){
 const slat=new THREE.Mesh(new THREE.PlaneGeometry(width,depth),blockerMaterial);
 slat.rotation.x=-Math.PI/2;slat.position.set(x,0,z);
 slat.castShadow=true;windowFrame.add(slat);
 }
 for(let i=-5;i<=5;i++)addMullion(span*.055,span*3,i*span*.22,0);
 addMullion(span*3,span*.035,0,span*.18);
 scene.add(windowFrame);
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
 if(document.hidden||root.dataset.active!=='true'||now-lastFoliageFrame<33)return;
 lastFoliageFrame=now;
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
