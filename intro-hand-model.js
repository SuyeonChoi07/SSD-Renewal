import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container=document.querySelector('.intro-hand-model-stage');
const anchors=window.storyModel?.handAnchors;

if(container&&anchors){
  const clamp=value=>Math.max(0,Math.min(1,value));
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(45,2064/1020,.01,100);
  scene.add(new THREE.HemisphereLight(0xfff6e8,0x756b60,2));
  const key=new THREE.DirectionalLight(0xffe4bd,3);
  key.position.set(-3,5,8);
  scene.add(key);
  const fill=new THREE.DirectionalLight(0xffffff,1.4);
  fill.position.set(5,1,4);
  scene.add(fill);
  const renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.setSize(2064,1020);
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.15;
  container.append(renderer.domElement);

  let mixer,clip,ready=false;
  function update(){
    if(!ready)return;
    const y=window.scrollY;
    const forward=clamp((y-anchors.first)/(anchors.second-anchors.first));
    const reverse=clamp((y-anchors.reverseStart)/(anchors.third-anchors.reverseStart));
    const coming=clamp(forward/.4);
    const slideY=y>=anchors.reverseStart?reverse**3*1071:(1-(1-coming)**3)*1071;
    const opacity=y>=anchors.reverseStart?clamp(1-Math.max((reverse-.5)/.5,0)):clamp(coming*2);
    const visible=y>=anchors.first&&y<anchors.third&&opacity>0;
    container.style.visibility=visible?'visible':'hidden';
    container.style.opacity=visible?opacity:0;
    container.style.transform=`translateY(${slideY}px)`;
    // 02에서 마지막 프레임 직전 자세를 유지하고, History 진입 뒤 03까지 역재생한다.
    const end=Math.max(clip.duration-1/24,0);
    mixer.setTime(end*(y>=anchors.reverseStart?1-reverse:forward));
    renderer.render(scene,camera);
  }

  new GLTFLoader().load(new URL('./assets/hand-scroll-component/hand_f_only.glb',import.meta.url).href,gltf=>{
    const model=gltf.scene;
    clip=gltf.animations.find(animation=>animation.name==='Armature.003Action')||gltf.animations[0];
    if(!clip)throw new Error('손 모델 애니메이션을 찾을 수 없습니다.');
    model.rotation.z=THREE.MathUtils.degToRad(-35);
    // 스킨 애니메이션의 뼈가 움직여도 초기 메시 경계로 화면에서 제거되지 않게 한다.
    model.traverse(object=>{if(object.isMesh)object.frustumCulled=false;});
    scene.add(model);
    mixer=new THREE.AnimationMixer(model);
    mixer.clipAction(clip).play();
    mixer.setTime(Math.max(clip.duration-1/24,0));
    scene.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(model);
    const center=bounds.getCenter(new THREE.Vector3());
    const radius=bounds.getBoundingSphere(new THREE.Sphere()).radius;
    // 원본 GLB 배율을 그대로 두고, 모델의 경계구로 카메라 거리를 자동 산정한다.
    const distance=radius/Math.sin(THREE.MathUtils.degToRad(camera.fov/2));
    camera.position.set(center.x,center.y,center.z+distance);
    camera.lookAt(center);
    camera.far=distance+radius*4+10;
    camera.setViewOffset(2064,1020,1032-1035,510-692,2064,1020);
    camera.updateProjectionMatrix();
    ready=true;
    container.dataset.status='ready';
    update();
  },undefined,error=>{
    container.dataset.status='error';
    console.error('손 3D 모델 로딩 실패:',error);
  });
  window.addEventListener('scroll',update,{passive:true});
}
