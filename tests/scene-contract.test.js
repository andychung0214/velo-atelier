import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { DEFAULT_CONFIG } from '../src/core/config.js';
import { getBikeGeometry, pointOnSegment } from '../src/scene/bike-geometry.js';
import { createBikeModel } from '../src/scene/bike-model.js';
import { tubeBetween } from '../src/scene/primitives.js';
import {
  getCameraDistanceScale,
  getKeyboardCameraAction,
  getRenderProfile,
  getResponsiveCameraTargetX,
  getResponsiveFov,
} from '../src/scene/scene-controller.js';
import { createTextDecal } from '../src/scene/text-decal.js';

function nearestPartId(object) {
  let current = object;
  while (current) {
    if (current.userData.partId) return current.userData.partId;
    current = current.parent;
  }
  return null;
}

function acuteAngleDegrees(start, end) {
  const deltaX = Math.abs(end[0] - start[0]);
  const deltaY = Math.abs(end[1] - start[1]);
  return Math.atan2(deltaY, deltaX) * (180 / Math.PI);
}

test('三種車架維持真實公路車比例', () => {
  for (const frame of ['race', 'aero', 'endurance']) {
    const geometry = getBikeGeometry(frame);
    const wheelDiameter = geometry.wheelRadius * 2;
    const wheelbase = geometry.frontAxle[0] - geometry.rearAxle[0];
    const bottomBracketDrop = geometry.rearAxle[1] - geometry.bottomBracket[1];
    const headTubeLength = Math.hypot(
      geometry.headTop[0] - geometry.headBottom[0],
      geometry.headTop[1] - geometry.headBottom[1],
    );
    const seatTubeAngle = acuteAngleDegrees(geometry.bottomBracket, geometry.seatTop);
    const headTubeAngle = acuteAngleDegrees(geometry.headBottom, geometry.headTop);

    assert.ok(wheelbase / wheelDiameter >= 1.48 && wheelbase / wheelDiameter <= 1.62);
    assert.ok(bottomBracketDrop >= 0.16 && bottomBracketDrop <= 0.22);
    assert.ok(headTubeLength / wheelDiameter >= 0.18 && headTubeLength / wheelDiameter <= 0.28);
    assert.ok(seatTubeAngle >= 72 && seatTubeAngle <= 75);
    assert.ok(headTubeAngle >= 70 && headTubeAngle <= 74.5);
  }
});

test('車架衍生安裝點可沿實際車管內插且不共用可變座標', () => {
  const race = getBikeGeometry('race');
  const secondRace = getBikeGeometry('race');
  const midpoint = pointOnSegment(race.headBottom, race.bottomBracket, 0.5);

  assert.ok(Math.abs(midpoint[0] - 0.325) < 1e-9);
  assert.ok(Math.abs(midpoint[1] - 1.16) < 1e-9);
  race.headTop[0] = 99;
  assert.equal(secondRace.headTop[0], 0.81);
});

test('tubeBetween 依兩點建立正確長度與中心的車管', () => {
  const material = new THREE.MeshBasicMaterial();
  const tube = tubeBetween(
    THREE,
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(1, 2, 0),
    0.08,
    0.1,
    material,
  );

  assert.ok(Math.abs(tube.geometry.parameters.height - Math.sqrt(8)) < 1e-9);
  assert.deepEqual(tube.position.toArray(), [0, 1, 0]);
  assert.equal(tube.castShadow, true);

  tube.geometry.dispose();
  material.dispose();
});

test('公路車模型包含所有可說明的主要零件', () => {
  const bike = createBikeModel(THREE, DEFAULT_CONFIG);
  const partIds = new Set();

  bike.root.traverse((object) => {
    if (object.userData.partId) {
      partIds.add(object.userData.partId);
    }
  });

  for (const partId of [
    'frame', 'topTube', 'downTube', 'fork', 'wheelset', 'brake',
    'drivetrain', 'crankset', 'cassette', 'cockpit', 'barTape',
    'saddle', 'seatpost', 'bottleCage',
  ]) {
    assert.equal(partIds.has(partId), true, `${partId} 必須可選取`);
  }

  assert.ok(bike.selectable.length >= 40);
  assert.ok(bike.selectable.every((object) => object.isMesh));
  bike.dispose();
});

test('更新規格時輪組與煞車維持互斥', () => {
  const bike = createBikeModel(THREE, {
    ...DEFAULT_CONFIG,
    brake: 'disc',
    wheel: 'disc',
  });

  assert.ok(bike.root.getObjectByName('brakes-disc'));
  assert.equal(bike.root.getObjectByName('brakes-caliper'), undefined);
  assert.ok(bike.root.getObjectByName('rear-disc-wheel'));

  bike.update({
    ...DEFAULT_CONFIG,
    brake: 'caliper',
    wheel: 'shallow',
  });

  assert.equal(bike.root.getObjectByName('brakes-disc'), undefined);
  assert.ok(bike.root.getObjectByName('brakes-caliper'));
  assert.equal(bike.root.getObjectByName('rear-disc-wheel'), undefined);
  assert.ok(bike.root.getObjectByName('rear-shallow-wheel'));
  bike.dispose();
});

test('建模後會釋放不再被網格參照的共享材質', () => {
  const originalDispose = THREE.Material.prototype.dispose;
  let disposeCount = 0;
  THREE.Material.prototype.dispose = function trackedDispose() {
    disposeCount += 1;
    return originalDispose.call(this);
  };

  let bike;
  try {
    bike = createBikeModel(THREE, DEFAULT_CONFIG);
    assert.ok(disposeCount >= 12, `預期釋放至少 12 個來源材質，實際為 ${disposeCount}`);
  } finally {
    bike?.dispose();
    THREE.Material.prototype.dispose = originalDispose;
  }
});

test('顏色更新不需重建車體並會更新對應材質', () => {
  const bike = createBikeModel(THREE, DEFAULT_CONFIG);
  const rootId = bike.root.id;
  const nextColor = '#123abc';

  bike.update({ ...DEFAULT_CONFIG, frameColor: nextColor });
  let frameMesh;
  bike.root.traverse((object) => {
    if (!frameMesh && object.userData.materialKey === 'frameColor') {
      frameMesh = object;
    }
  });

  assert.equal(bike.root.id, rootId);
  assert.ok(frameMesh);
  assert.equal(frameMesh.material.color.getHexString(), '123abc');
  bike.dispose();
});

test('行動裝置效能設定限制像素比例、陰影與動態效果', () => {
  assert.deepEqual(
    getRenderProfile({ width: 390, devicePixelRatio: 3, reducedMotion: true }),
    { pixelRatio: 1.5, shadowMapSize: 1024, autoRotateAllowed: false },
  );
  assert.deepEqual(
    getRenderProfile({ width: 1440, devicePixelRatio: 2, reducedMotion: false }),
    { pixelRatio: 2, shadowMapSize: 2048, autoRotateAllowed: true },
  );
});

test('Canvas 車架文字會繪製跨語系內容並可隱藏', () => {
  const draws = [];
  const context = {
    clearRect() {},
    fillText(text, x, y) { draws.push({ text, x, y, fillStyle: this.fillStyle }); },
    setTransform() {},
    textAlign: '',
    textBaseline: '',
    font: '',
    fillStyle: '',
  };
  const canvas = {
    width: 0,
    height: 0,
    getContext() { return context; },
  };
  const decal = createTextDecal(
    THREE,
    { text: '疾輪 VELO 風の道', color: '#f1ecdf', font: 'cjk' },
    { createCanvas: () => canvas, pixelRatio: 2 },
  );

  assert.equal(canvas.width, 2048);
  assert.equal(canvas.height, 512);
  assert.equal(draws.at(-1).text, '疾輪 VELO 風の道');
  assert.equal(draws.at(-1).fillStyle, '#f1ecdf');
  assert.equal(decal.meshes.length, 2);
  assert.ok(decal.meshes.every(({ visible }) => visible));

  decal.update({ text: '', color: '#8f1d2c', font: 'corsa' });
  assert.ok(decal.meshes.every(({ visible }) => !visible));
  decal.dispose();
});

test('零件選取只高亮目前 partId', () => {
  const bike = createBikeModel(THREE, DEFAULT_CONFIG);
  bike.selectPart('wheelset');

  const selectedMeshes = bike.selectable.filter((mesh) => nearestPartId(mesh) === 'wheelset');
  const frameMeshes = bike.selectable.filter((mesh) => nearestPartId(mesh) === 'frame');

  assert.ok(selectedMeshes.some((mesh) => mesh.material.emissive?.getHex() !== 0));
  assert.ok(frameMeshes.every((mesh) => !mesh.material.emissive || mesh.material.emissive.getHex() === 0));
  bike.dispose();
});

test('Canvas 鍵盤操作映射旋轉、縮放與重設視角', () => {
  assert.deepEqual(getKeyboardCameraAction('ArrowLeft'), { type: 'orbit', amount: -0.1 });
  assert.deepEqual(getKeyboardCameraAction('ArrowRight'), { type: 'orbit', amount: 0.1 });
  assert.deepEqual(getKeyboardCameraAction('ArrowUp'), { type: 'zoom', factor: 0.9 });
  assert.deepEqual(getKeyboardCameraAction('ArrowDown'), { type: 'zoom', factor: 1.1 });
  assert.deepEqual(getKeyboardCameraAction('Home'), { type: 'reset' });
  assert.equal(getKeyboardCameraAction('A'), null);
});

test('狹長舞台會增加初始相機距離以容納完整車體', () => {
  assert.equal(getCameraDistanceScale(1, 714), 1);
  assert.equal(getCameraDistanceScale(0.85, 375), 1.45);
  assert.equal(getCameraDistanceScale(0.52, 519), 1.55);
});

test('窄舞台使用較寬視野保留完整車體', () => {
  assert.equal(getResponsiveFov(375), 50);
  assert.equal(getResponsiveFov(519), 42);
  assert.equal(getResponsiveFov(714), 34);
});

test('行動舞台會把取景中心移向前輪以平衡三分之四視角', () => {
  assert.equal(getResponsiveCameraTargetX(375), 0.32);
  assert.equal(getResponsiveCameraTargetX(420), 0.32);
  assert.equal(getResponsiveCameraTargetX(519), 0);
  assert.equal(getResponsiveCameraTargetX(714), 0);
});
