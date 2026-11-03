import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { sectionProgress, scrollRotation } from './rotation-math.mjs';

/** 고정 전체 화면 모델. 섹션의 문서 상단 위치를 스크롤 경계로 사용합니다. */
export function createModelExperience({ container, sections, getScrollPositions = null, framing = null, isActive = () => true, modelUrl = new URL('./tws.glb', import.meta.url).href, onUpdate = () => {} }) {
  const resolve = value => typeof value === 'string' ? document.querySelector(value) : value;
  container = resolve(container);
  if (!container || !Array.isArray(sections) || sections.length !== 2) {
    throw new Error('모델 컨테이너와 두 섹션을 지정해 주세요.');
  }
  sections = sections.map(resolve);
  if (sections.some(section => !section)) throw new Error('지정한 섹션을 찾을 수 없습니다.');

  let disposed = false;
  let loaded = false;
  let model;
  let progress = 0;
  let hovering = false;
  let firstTop = 0;
  let secondTop = 0;
  const removeListeners = [];
  const listen = (target, name, handler, options) => {
    target.addEventListener(name, handler, options);
    removeListeners.push(() => target.removeEventListener(name, handler, options));
  };

  const scene = new THREE.Scene();
  const viewport = () => ({ width: container.clientWidth || innerWidth, height: container.clientHeight || innerHeight });
  const initialViewport = viewport();
  const camera = new THREE.PerspectiveCamera(35, initialViewport.width / initialViewport.height, .1, 100);
  camera.position.set(0, 1.833333, 13);
  camera.lookAt(0, 0, 0);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(initialViewport.width, initialViewport.height);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .6;
  container.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  scene.environmentIntensity = .4;
  room.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xfff9ec, 0xa69a83, .8));
  const key = new THREE.PointLight(0xffe3bd, 70, 0, 2);
  const azimuth = THREE.MathUtils.degToRad(31);
  const elevation = THREE.MathUtils.degToRad(40);
  key.position.set(15 * Math.cos(elevation) * Math.sin(azimuth),
    15 * Math.sin(elevation), 15 * Math.cos(elevation) * Math.cos(azimuth));
  const fill = new THREE.DirectionalLight(0xddeaff, .8);
  fill.position.set(-4, 2, -1);
  scene.add(key, fill);

  const hoverRig = new THREE.Group();
  const scrollRig = new THREE.Group();
  const initialRig = new THREE.Group();
  scene.add(hoverRig);
  hoverRig.add(scrollRig);
  scrollRig.add(initialRig);
  initialRig.rotation.x = THREE.MathUtils.degToRad(80);
  function fitCamera() {
    const { width, height } = viewport();
    camera.aspect = width / height;
    camera.position.set(0, 1.833333, 13);
    camera.lookAt(0, 0, 0);
    if (model && framing) {
      const savedScroll = scrollRig.rotation.clone();
      const savedHover = hoverRig.rotation.clone();
      scrollRig.rotation.set(0, 0, 0);
      hoverRig.rotation.set(0, 0, 0);
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(model);
      for (let pass = 0; pass < 6; pass++) {
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld(true);
        const points = [];
        for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
          points.push(new THREE.Vector3(x, y, z).project(camera));
        }
        const pixels = Math.max(
          (Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x))) * width / 2,
          (Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))) * height / 2
        );
        camera.position.multiplyScalar(pixels / framing.size);
        camera.lookAt(0, 0, 0);
      }
      scrollRig.rotation.copy(savedScroll);
      hoverRig.rotation.copy(savedHover);
    }
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }

  const pointer = new THREE.Vector2();
  const target = new THREE.Vector2();
  const bounds = new THREE.Box3();
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  listen(renderer.domElement, 'pointermove', event => {
    if (event.pointerType !== 'mouse') return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
      -(event.clientY - rect.top) / rect.height * 2 + 1);
    hovering = true;
  });
  const clearHover = () => { hovering = false; };
  listen(renderer.domElement, 'pointerleave', clearHover);
  listen(window, 'blur', clearHover);

  const refresh = () => {
    const positions = getScrollPositions ? getScrollPositions() : sections.map(section => section.getBoundingClientRect().top + scrollY);
    [firstTop, secondTop] = positions;
    progress = sectionProgress(scrollY, firstTop, secondTop);
  };
  listen(window, 'scroll', () => {
    progress = sectionProgress(scrollY, firstTop, secondTop);
  }, { passive: true });
  listen(window, 'resize', () => {
    fitCamera();
    refresh();
  });
  refresh();

  function disposeModel(object) {
    const resources = new Set();
    object.traverse(node => {
      if (node.geometry) resources.add(node.geometry);
      for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
        if (!material) continue;
        resources.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) resources.add(value);
      }
    });
    resources.forEach(resource => resource.dispose());
  }

  const ready = new GLTFLoader().loadAsync(modelUrl).then(gltf => {
    if (disposed) { disposeModel(gltf.scene); return; }
    model = gltf.scene;
    bounds.setFromObject(model).getSize(size);
    bounds.getCenter(center);
    const longest = Math.max(size.x, size.y, size.z);
    if (!(longest > 0)) throw new Error('표시할 모델의 크기가 유효하지 않습니다.');
    const scale = 2.5 / longest;
    model.scale.multiplyScalar(scale);
    model.position.addScaledVector(center, -scale);
    initialRig.add(model);
    fitCamera();
    loaded = true;
    refresh();
  });

  const getState = () => ({
    ready: loaded,
    progress,
    rotation: { x: scrollRig.rotation.x, y: 0, z: scrollRig.rotation.z },
    hover: { x: hoverRig.rotation.x, y: hoverRig.rotation.y, z: 0 }
  });
  let previous = performance.now();
  renderer.setAnimationLoop(time => {
    const delta = Math.max(0, Math.min((time - previous) / 1000, .05));
    previous = time;
    if (!isActive()) return;
    if (loaded) {
      const rotation = scrollRotation(progress);
      scrollRig.rotation.set(rotation.x, 0, rotation.z, 'XYZ');
      target.set(0, 0);
      if (hovering && !reducedMotion.matches) {
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld();
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObject(model, true)[0];
        if (hit) {
          bounds.setFromObject(model);
          bounds.getCenter(center);
          bounds.getSize(size);
          const x = THREE.MathUtils.clamp((hit.point.x - center.x) / Math.max(size.x / 2, .001), -1, 1);
          const y = THREE.MathUtils.clamp((hit.point.y - center.y) / Math.max(size.y / 2, .001), -1, 1);
          const strength = THREE.MathUtils.degToRad(6);
          target.set(-y * strength, x * strength);
        }
      }
      const blend = 1 - Math.exp(-8 * delta);
      hoverRig.rotation.x = THREE.MathUtils.lerp(hoverRig.rotation.x, target.x, blend);
      hoverRig.rotation.y = THREE.MathUtils.lerp(hoverRig.rotation.y, target.y, blend);
      onUpdate(getState());
    }
    renderer.render(scene, camera);
  });

  function destroy() {
    if (disposed) return;
    disposed = true;
    loaded = false;
    renderer.setAnimationLoop(null);
    removeListeners.forEach(remove => remove());
    if (model) disposeModel(model);
    environment.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }
  return { ready, refresh, getState, destroy };
}
