import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';

import { DEFAULT_CONFIG } from '../src/core/config.js';
import { createBikeModel } from '../src/scene/bike-model.js';
import { tubeBetween } from '../src/scene/primitives.js';
import { getRenderProfile } from '../src/scene/scene-controller.js';

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
