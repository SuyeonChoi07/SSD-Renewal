import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const vertexShader = `
  uniform float uProgress;
  uniform float uTime;
  uniform float uDirection;
  uniform float uWorldXSign;
  uniform float uMinZ;
  uniform float uMaxZ;

  varying vec2 vUv;
  varying float vCurl;
  varying float vShade;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  void main() {
    vUv = uv;
    vec3 p = position;

    float localX01 = clamp(p.x * 0.5 + 0.5, 0.0, 1.0);
    float x01 = uWorldXSign < 0.0 ? 1.0 - localX01 : localX01;
    float zRange = max(uMaxZ - uMinZ, 0.0001);
    float innerDistance = (uMaxZ - p.z) / zRange;
    float edge = 1.0 - smoothstep(0.02, 0.78, innerDistance);
    float diagonal = smoothstep(-0.12, 1.0, x01);
    float bendPhase = smoothstep(0.0, 0.72, uProgress);
    float vertexExitPhase = smoothstep(0.52, 1.0, uProgress);
    float open = bendPhase * diagonal;
    float n = noise(vec2(x01 * 7.0, innerDistance * 4.0 + uTime * 0.08));

    float edgeSpread = open * edge * (2.15 + n * 0.32);
    float vertexExitSpread = vertexExitPhase * 5.2;
    p.z += uDirection * (edgeSpread + vertexExitSpread);

    float curlPhase = clamp(open * 1.45 - innerDistance * 0.95, 0.0, 1.0);
    float curl = sin(curlPhase * 3.14159265) * edge;
    p.y += curl * (0.42 + diagonal * 0.25);
    p.z += sin(x01 * 12.0 + uTime * 0.55) * edge * open * 0.025;
    p.y += (n - 0.5) * edge * open * 0.08;

    vCurl = curl;
    vShade = n;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = `
  uniform sampler2D uMap;
  uniform float uHasMap;
  varying vec2 vUv;
  varying float vCurl;
  varying float vShade;

  void main() {
    vec4 texel = uHasMap > 0.5
      ? texture2D(uMap, vUv)
      : vec4(0.28, 0.15, 0.07, 1.0);

    float ridgeLight = vCurl * (0.52 + vShade * 0.18);
    float cavity = smoothstep(0.5, 1.0, vCurl) * 0.20;
    texel.rgb *= 0.88 + vShade * 0.16;
    texel.rgb += vec3(0.42, 0.19, 0.055) * ridgeLight;
    texel.rgb *= 1.0 - cavity;

    if (texel.a < 0.01) discard;
    gl_FragColor = texel;
  }
`;

export async function createOpenerEffect({
  container,
  modelUrl = "./assets/opener.glb",
  wheel = true,
  wheelSpeed = 0.00075,
  pixelRatio = 2
} = {}) {
  if (!(container instanceof HTMLElement)) {
    throw new Error("createOpenerEffect: container HTML 요소가 필요합니다.");
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
  camera.position.z = 5;

  const shared = {
    progress: { value: 0 },
    time: { value: 0 }
  };

  let targetProgress = 0;
  let frameId = 0;
  let destroyed = false;
  let modelSize = null;
  const modelRoot = new THREE.Group();
  scene.add(modelRoot);

  function makeMaterial(source, direction, worldXSign, minZ, maxZ) {
    const map = source?.map ?? null;
    if (map) {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }

    return new THREE.ShaderMaterial({
      uniforms: {
        uProgress: shared.progress,
        uTime: shared.time,
        uDirection: { value: direction },
        uWorldXSign: { value: worldXSign },
        uMinZ: { value: minZ },
        uMaxZ: { value: maxZ },
        uMap: { value: map },
        uHasMap: { value: map ? 1 : 0 }
      },
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
      transparent: true,
      depthWrite: false,
      alphaTest: 0.01
    });
  }

  const gltf = await new GLTFLoader().loadAsync(modelUrl);
  const wrapper = gltf.scene;
  const upper = wrapper.getObjectByName("upper");
  const downer = wrapper.getObjectByName("downer");

  if (!upper?.isMesh || !downer?.isMesh) {
    renderer.dispose();
    renderer.domElement.remove();
    throw new Error("opener.glb에서 upper 또는 downer 메시를 찾지 못했습니다.");
  }

  wrapper.updateMatrixWorld(true);
  const upperBox = new THREE.Box3().setFromObject(upper);
  const downerBox = new THREE.Box3().setFromObject(downer);
  const upperHeight = upperBox.max.y - upperBox.min.y;
  const downerHeight = downerBox.max.y - downerBox.min.y;
  const desiredOverlap = (upperHeight + downerHeight) * 0.03;
  const currentOverlap = Math.max(
    0,
    Math.min(upperBox.max.y, downerBox.max.y) -
      Math.max(upperBox.min.y, downerBox.min.y)
  );
  const correction = (currentOverlap - desiredOverlap) * 0.5;
  upper.position.y += correction;
  downer.position.y -= correction;
  downer.position.y += downerHeight * 0.13;

  upper.geometry.computeBoundingBox();
  downer.geometry.computeBoundingBox();

  const upperLocalZ = new THREE.Vector3(0, 0, 1).applyQuaternion(upper.quaternion).y;
  const downerLocalZ = new THREE.Vector3(0, 0, 1).applyQuaternion(downer.quaternion).y;
  const upperWorldX = new THREE.Vector3(1, 0, 0).applyQuaternion(upper.quaternion).x;
  const downerWorldX = new THREE.Vector3(1, 0, 0).applyQuaternion(downer.quaternion).x;

  upper.material = makeMaterial(
    upper.material,
    Math.sign(upperLocalZ) || -1,
    Math.sign(upperWorldX) || 1,
    upper.geometry.boundingBox.min.z,
    upper.geometry.boundingBox.max.z
  );
  downer.material = makeMaterial(
    downer.material,
    -Math.sign(downerLocalZ) || -1,
    Math.sign(downerWorldX) || 1,
    downer.geometry.boundingBox.min.z,
    downer.geometry.boundingBox.max.z
  );

  wrapper.updateMatrixWorld(true);
  const modelBox = new THREE.Box3().setFromObject(wrapper);
  const center = modelBox.getCenter(new THREE.Vector3());
  modelSize = modelBox.getSize(new THREE.Vector3());
  wrapper.position.sub(center);
  modelRoot.add(wrapper);

  function resize() {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    const aspect = width / height;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));
    renderer.setSize(width, height, false);
    camera.left = -aspect;
    camera.right = aspect;
    camera.top = 1;
    camera.bottom = -1;
    camera.updateProjectionMatrix();

    const widthScale = (aspect * 2) / modelSize.x;
    const heightScale = 2 / modelSize.y;
    modelRoot.scale.set(widthScale, heightScale, heightScale);
  }

  function onWheel(event) {
    targetProgress = THREE.MathUtils.clamp(
      targetProgress + event.deltaY * wheelSpeed,
      0,
      1
    );
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  if (wheel) window.addEventListener("wheel", onWheel, { passive: true });
  resize();

  const clock = new THREE.Clock();
  function animate() {
    if (destroyed) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    shared.time.value += delta;
    shared.progress.value = THREE.MathUtils.damp(
      shared.progress.value,
      targetProgress,
      5.5,
      delta
    );
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  }
  animate();

  return {
    setProgress(value) {
      targetProgress = THREE.MathUtils.clamp(Number(value) || 0, 0, 1);
      // 외부 페이지 스크롤에 연결할 때는 시간 지연 없이 정확한 스크롤 위치를 반영합니다.
      if (!wheel) shared.progress.value = targetProgress;
    },
    getProgress() {
      return shared.progress.value;
    },
    resize,
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      if (wheel) window.removeEventListener("wheel", onWheel);
      wrapper.traverse((node) => {
        if (!node.isMesh) return;
        node.geometry?.dispose();
        node.material?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}
