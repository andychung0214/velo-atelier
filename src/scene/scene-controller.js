import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { createBikeModel } from './bike-model.js';

const CAMERA_POSITION = new THREE.Vector3(4.65, 2.85, 6.2);
const CAMERA_TARGET = new THREE.Vector3(0, 1.25, 0);

export function getRenderProfile({ width, devicePixelRatio, reducedMotion }) {
  const isMobile = width <= 720;
  return {
    pixelRatio: Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2),
    shadowMapSize: isMobile ? 1024 : 2048,
    autoRotateAllowed: !reducedMotion,
  };
}

function getPartId(object) {
  let current = object;
  while (current) {
    if (current.userData.partId) return current.userData.partId;
    current = current.parent;
  }
  return null;
}

export async function createSceneController({
  canvas,
  config,
  onPartSelect = () => {},
  onError = () => {},
}) {
  if (!canvas) {
    throw new Error('找不到 3D 舞台畫布。');
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (error) {
    onError(error);
    throw error;
  }

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.08, 80);
  camera.position.copy(CAMERA_POSITION);

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(CAMERA_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.rotateSpeed = 0.62;
  controls.zoomSpeed = 0.75;
  controls.minDistance = 3.8;
  controls.maxDistance = 11;
  controls.minPolarAngle = Math.PI * 0.24;
  controls.maxPolarAngle = Math.PI * 0.72;
  controls.enablePan = false;
  controls.update();

  const hemisphere = new THREE.HemisphereLight('#fff8e9', '#344039', 2.6);
  scene.add(hemisphere);

  const keyLight = new THREE.DirectionalLight('#fff4dc', 5.2);
  keyLight.position.set(4.5, 7.5, 5.5);
  keyLight.castShadow = true;
  keyLight.shadow.bias = -0.00025;
  keyLight.shadow.normalBias = 0.025;
  keyLight.shadow.camera.left = -5;
  keyLight.shadow.camera.right = 5;
  keyLight.shadow.camera.top = 5;
  keyLight.shadow.camera.bottom = -2;
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight('#9cb9c7', 2.8);
  rimLight.position.set(-5, 3.5, -4.5);
  scene.add(rimLight);

  const warmFill = new THREE.PointLight('#d9a28c', 1.8, 12, 1.5);
  warmFill.position.set(-3, 2.1, 3.4);
  scene.add(warmFill);

  const groundMaterial = new THREE.ShadowMaterial({
    color: '#342f29',
    opacity: 0.18,
    transparent: true,
  });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.005;
  ground.receiveShadow = true;
  scene.add(ground);

  const bike = createBikeModel(THREE, config);
  bike.root.rotation.y = -0.08;
  scene.add(bike.root);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerStart = null;
  let isVisible = !document.hidden;
  let currentConfig = { ...config };
  let autoRotateRequested = Boolean(config.autoRotate);
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  function currentProfile() {
    return getRenderProfile({
      width: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio,
      reducedMotion: reducedMotionQuery.matches,
    });
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const profile = currentProfile();
    renderer.setPixelRatio(profile.pixelRatio);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    keyLight.shadow.mapSize.set(profile.shadowMapSize, profile.shadowMapSize);
    controls.autoRotate = autoRotateRequested && profile.autoRotateAllowed;
  }

  function resetView() {
    camera.position.copy(CAMERA_POSITION);
    controls.target.copy(CAMERA_TARGET);
    controls.update();
  }

  function setAutoRotate(enabled) {
    autoRotateRequested = Boolean(enabled);
    controls.autoRotate = autoRotateRequested && currentProfile().autoRotateAllowed;
    controls.autoRotateSpeed = 0.72;
    return controls.autoRotate;
  }

  function onPointerDown(event) {
    pointerStart = { x: event.clientX, y: event.clientY };
  }

  function onPointerUp(event) {
    if (!pointerStart) return;
    const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
    pointerStart = null;
    if (distance > 6) return;

    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(bike.selectable, false);
    const [hit] = hits;
    const partId = hit ? getPartId(hit.object) : null;
    if (partId) onPartSelect(partId);
  }

  function onVisibilityChange() {
    isVisible = !document.hidden;
  }

  function onReducedMotionChange() {
    setAutoRotate(autoRotateRequested);
  }

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);
  document.addEventListener('visibilitychange', onVisibilityChange);
  reducedMotionQuery.addEventListener?.('change', onReducedMotionChange);

  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(resize)
    : null;
  resizeObserver?.observe(canvas);
  window.addEventListener('resize', resize);
  resize();
  setAutoRotate(config.autoRotate);

  renderer.setAnimationLoop(() => {
    if (!isVisible) return;
    controls.update();
    renderer.render(scene, camera);
  });

  return {
    update(nextConfig) {
      currentConfig = { ...nextConfig };
      bike.update(currentConfig);
      setAutoRotate(currentConfig.autoRotate);
    },
    selectPart(partId) {
      bike.selectPart(partId);
    },
    resetView,
    setAutoRotate,
    resize,
    dispose() {
      renderer.setAnimationLoop(null);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotionQuery.removeEventListener?.('change', onReducedMotionChange);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      bike.dispose();
      ground.geometry.dispose();
      groundMaterial.dispose();
      renderer.dispose();
    },
  };
}
