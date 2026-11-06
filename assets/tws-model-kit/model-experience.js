import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';


export function createModelExperience({ container, sections, getScrollPositions = null, framing = null, isActive = () => true, modelUrls = [new URL('./tws.glb', import.meta.url).href, new URL('./tws_w_o.glb', import.meta.url).href], onUpdate = () => {} }) {
  const resolve = value => typeof value === 'string' ? document.querySelector(value) : value;
  container = resolve(container);
  sections = sections.map(resolve);
  if (!container || sections.length !== 3 || sections.some(item => !item)) throw new Error('container와 3개의 section 요소를 지정해 주세요.');
  let disposed = false;
  const listeners = [];
  function listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    listeners.push(() => target.removeEventListener(event, handler, options));
  }
  function disposeModel(model) {
    const resources = new Set();
    model.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      for (const material of (Array.isArray(object.material) ? object.material : [object.material])) {
        if (!material) continue;
        resources.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
      }
    });
    resources.forEach(resource => resource.dispose());
  }
  const scene = new THREE.Scene();
  const viewport=()=>({width:container.clientWidth||innerWidth,height:container.clientHeight||innerHeight});
  const initialViewport=viewport();
  const camera = new THREE.PerspectiveCamera(35, initialViewport.width / initialViewport.height, .1, 100);
  camera.position.set(0, 1.1, 7.8);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(initialViewport.width, initialViewport.height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .6;
  container.appendChild(renderer.domElement);

  // 반사 환경 + 따뜻한 주광 + 차가운 보조광. GLB의 재질은 교체하지 않습니다.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .4;
  room.dispose();
  pmrem.dispose();
  const ambient = new THREE.HemisphereLight(0xfff9ec, 0xa69a83, .8);
  scene.add(ambient);
  // 점광원은 실제로 거리에 따라 빛이 감쇠합니다.
  const key = new THREE.PointLight(0xffe3bd, 70, 0, 2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xddeaff, .8);
  fill.position.set(-4, 2, -1); scene.add(fill);

  camera.lookAt(0, 0, 0);
  // 초기 자세, 스크롤 회전, 호버 기울기를 분리합니다.
  const hoverRig = new THREE.Group(); scene.add(hoverRig);
  const scrollRig = new THREE.Group(); hoverRig.add(scrollRig);
  const rig = new THREE.Group(); scrollRig.add(rig);
  rig.rotation.x = THREE.MathUtils.degToRad(80);
  const scrollRotation = Object.freeze({ x:350, y:0, z:360 });
  // Beta(12,10) / Beta(10,12)의 누적 곡선입니다.
  // 기울기(스크롤 대비 회전 속도)는 각각 55% / 45%에서 최대가 됩니다.
  function axisScrollEase(progress, axis) {
    const t = THREE.MathUtils.clamp(progress, 0, 1);
    const coefficients = [1];
    for (let k = 1; k <= 21; k++) coefficients[k] = coefficients[k - 1] * (22 - k) / k;
    const start = axis === 'x' ? 12 : 10;
    let result = 0;
    for (let k = start; k <= 21; k++) {
      result += coefficients[k] * t ** k * (1 - t) ** (21 - k);
    }
    return result;
  }
  // 확정된 조명 설정: 조절 패널 없이 고정합니다.
  const lighting = Object.freeze({ power:70, distance:15, azimuth:31, elevation:40, fill:.8, ambient:.8, environment:.4, exposure:.6 });
  key.intensity = lighting.power;
  fill.intensity = lighting.fill;
  ambient.intensity = lighting.ambient;
  scene.environmentIntensity = lighting.environment;
  renderer.toneMappingExposure = lighting.exposure;
  let ready = false;
  let originalModel, alternateModel;
  let framedSize=0;
  function fitCamera() {
    const {width,height}=viewport();
    camera.aspect=width/height;
    camera.clearViewOffset();
    camera.position.set(0,1.1,7.8);camera.lookAt(0,0,0);
    if(framing&&originalModel){
      const saved=scrollRig.rotation.clone();scrollRig.rotation.set(0,0,0);
      const hover=hoverRig.rotation.clone();hoverRig.rotation.set(0,0,0);
      scene.updateMatrixWorld(true);
      const box=new THREE.Box3().setFromObject(originalModel);
      for(let pass=0;pass<5;pass++){
        camera.updateProjectionMatrix();camera.updateMatrixWorld(true);
        const points=[];
        for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new THREE.Vector3(x,y,z).project(camera));
        framedSize=Math.max((Math.max(...points.map(p=>p.x))-Math.min(...points.map(p=>p.x)))*width/2,(Math.max(...points.map(p=>p.y))-Math.min(...points.map(p=>p.y)))*height/2);
        camera.position.multiplyScalar(framedSize/framing.size);camera.lookAt(0,0,0);
      }
      camera.setViewOffset(width,height,width/2-framing.centerX,height/2-framing.centerY,width,height);
      scrollRig.rotation.copy(saved);hoverRig.rotation.copy(hover);
    }
    camera.updateProjectionMatrix();
    renderer.setSize(width,height);
  }
  const pointer = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  const hoverTarget = new THREE.Vector2();
  const hoverBounds = new THREE.Box3();
  const hoverCenter = new THREE.Vector3();
  const hoverSize = new THREE.Vector3();
  let pointerOverCanvas = false;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  listen(renderer.domElement, 'pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1);
    pointerOverCanvas = true;
  });
  const clearHover = () => { pointerOverCanvas = false; hoverTarget.set(0, 0); };
  listen(renderer.domElement, 'pointerleave', clearHover);
  listen(window, 'blur', clearHover);
  const loader = new GLTFLoader();
  // 두 모델을 미리 불러와 전환 순간에 추가 다운로드가 발생하지 않도록 합니다.
  const readyPromise = Promise.allSettled(modelUrls.map(url => loader.loadAsync(url))).then(results => {
    const models = results.filter(r => r.status === 'fulfilled').map(r => r.value);
    if (disposed || models.length !== 2) {
      models.forEach(gltf => disposeModel(gltf.scene));
      if (disposed) return;
      throw results.find(r => r.status === 'rejected')?.reason || new Error('모델 URL 두 개가 필요합니다.');
    }
    const [original, alternate] = models;
    originalModel = original.scene;
    alternateModel = alternate.scene;
    const box = new THREE.Box3().setFromObject(originalModel);
    const size = box.getSize(new THREE.Vector3());
    const scale = 2.5 / Math.max(size.x, size.y, size.z);
    for (const model of [originalModel, alternateModel]) {
      const center = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
      model.scale.multiplyScalar(scale);
      model.position.addScaledVector(center, -scale);
      rig.add(model);
    }
    alternateModel.visible = false;
    fitCamera();
    ready = true;

  });

  let progress = 0;
  let sectionProgress = 0;
  let swapProgress = 0;
  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress = max > 0 ? THREE.MathUtils.clamp(scrollY / max, 0, 1) : 0;
    // 01섹션 시작부터 02섹션 시작까지의 진행률만 사용합니다.
    const positions=getScrollPositions?getScrollPositions():sections.map(section=>section.getBoundingClientRect().top+scrollY);
    const [firstTop,secondTop,thirdTop]=positions;
    const sectionDistance = secondTop - firstTop;
    sectionProgress = sectionDistance > 0 ? THREE.MathUtils.clamp((scrollY - firstTop) / sectionDistance, 0, 1) : 0;
    const swapDistance = thirdTop - secondTop;
    swapProgress = swapDistance > 0 ? THREE.MathUtils.clamp((scrollY - secondTop) / swapDistance, 0, 1) : 0;

  }
  listen(window, 'scroll', onScroll, { passive: true });
  listen(window, 'resize', () => {
    fitCamera();onScroll();
  });

  onScroll();
  let previousFrame = performance.now();
  renderer.setAnimationLoop((time) => {
    const delta = Math.min((time - previousFrame) / 1000, .05);
    previousFrame = time;
    if(!isActive())return;
    if (ready) {
      // X·Z축에 서로 다른 속도 곡선을 적용합니다.
      {
        // 코사인 ease-in-out: 시작과 끝은 느리게, 중간은 빠르게 회전합니다.
        const easedProgress = (1 - Math.cos(Math.PI * sectionProgress)) / 2;
        const xProgress = axisScrollEase(sectionProgress, 'x');
        const zProgress = axisScrollEase(sectionProgress, 'z');
        const easedSwap = (1 - Math.cos(Math.PI * swapProgress)) / 2;
        const swapAngle = -easedSwap * Math.PI * 2;
        scrollRig.rotation.set(
          THREE.MathUtils.degToRad(scrollRotation.x) * xProgress,
          THREE.MathUtils.degToRad(scrollRotation.y) * easedProgress + swapAngle,
          THREE.MathUtils.degToRad(scrollRotation.z) * zProgress, 'XYZ');
        // 02→03 구간의 추가 회전이 -270°에 도달하면 모델을 교체합니다.
        const showAlternate = easedSwap >= .75;
        originalModel.visible = !showAlternate;
        alternateModel.visible = showAlternate;
        onUpdate(getState());
      }
      hoverTarget.set(0, 0);
      if (pointerOverCanvas && !reducedMotion.matches) {
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld();
        raycaster.setFromCamera(pointer, camera);
        const activeModel = alternateModel.visible ? alternateModel : originalModel;
        const hit = raycaster.intersectObject(activeModel, true)[0];
        if (hit) {
          // 축 고리가 아닌 실제 모델 표면에 호버할 때만 X·Z축으로 최대 10° 기울입니다.
          hoverBounds.setFromObject(activeModel);
          hoverBounds.getCenter(hoverCenter);
          hoverBounds.getSize(hoverSize);
          const x = THREE.MathUtils.clamp((hit.point.x - hoverCenter.x) / Math.max(hoverSize.x / 2, .001), -1, 1);
          const y = THREE.MathUtils.clamp((hit.point.y - hoverCenter.y) / Math.max(hoverSize.y / 2, .001), -1, 1);
          const strength = THREE.MathUtils.degToRad(10);
          hoverTarget.set(-y * strength, x * strength);
        }
      }
      const blend = 1 - Math.exp(-8 * delta);
      hoverRig.rotation.x = THREE.MathUtils.lerp(hoverRig.rotation.x, hoverTarget.x, blend);
      hoverRig.rotation.y = 0;
      hoverRig.rotation.z = THREE.MathUtils.lerp(hoverRig.rotation.z, hoverTarget.y, blend);
    }
    // 고정된 모델 중심을 기준으로 조명을 배치합니다.
    const azimuth = THREE.MathUtils.degToRad(lighting.azimuth);
    const elevation = THREE.MathUtils.degToRad(lighting.elevation);
    key.position.set(
      lighting.distance * Math.cos(elevation) * Math.sin(azimuth),
      lighting.distance * Math.sin(elevation),
      lighting.distance * Math.cos(elevation) * Math.cos(azimuth)
    ).add(rig.position);
    renderer.render(scene, camera);
  });
  function getState() {
    const easedSwap = (1 - Math.cos(Math.PI * swapProgress)) / 2;
    return { ready, progress, sectionProgress, swapProgress, swapDegrees: -360 * easedSwap, framedSize,
      model: easedSwap >= .75 ? 'alternate' : 'original',
      rotation: { x:scrollRig.rotation.x, y:scrollRig.rotation.y, z:scrollRig.rotation.z },
      hover: { x:hoverRig.rotation.x, y:hoverRig.rotation.y, z:hoverRig.rotation.z } };
  }
  function destroy() {
    if (disposed) return;
    disposed = true;
    renderer.setAnimationLoop(null);
    listeners.forEach(remove => remove());
    [originalModel, alternateModel].filter(Boolean).forEach(disposeModel);
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }
  return { ready: readyPromise, getState, destroy };
}
