import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COLOR_TARGETS,
  OPTION_CATALOG,
  PART_CATALOG,
} from '../src/data/parts.js';
import { PRESETS } from '../src/data/presets.js';

test('零件目錄提供完整且唯一的說明', () => {
  const parts = Object.values(PART_CATALOG);

  assert.ok(parts.length >= 12);
  assert.equal(new Set(parts.map(({ id }) => id)).size, parts.length);

  for (const part of parts) {
    assert.ok(part.name);
    assert.ok(part.eyebrow);
    assert.ok(part.category);
    assert.ok(part.description);
    assert.ok(part.tip);
  }
});

test('首版規格選項符合核准範圍', () => {
  assert.deepEqual(
    OPTION_CATALOG.frame.map(({ value }) => value),
    ['race', 'aero', 'endurance'],
  );
  assert.deepEqual(
    OPTION_CATALOG.brake.map(({ value }) => value),
    ['disc', 'caliper'],
  );
  assert.deepEqual(
    OPTION_CATALOG.wheel.map(({ value }) => value),
    ['shallow', 'deep', 'disc'],
  );
  assert.deepEqual(
    OPTION_CATALOG.drivetrain.map(({ value }) => value),
    ['electronic', 'mechanical'],
  );
  assert.deepEqual(
    OPTION_CATALOG.cockpit.map(({ value }) => value),
    ['integrated', 'classic'],
  );
});

test('色彩目標可對應至少八個可辨識零件群組', () => {
  assert.ok(COLOR_TARGETS.length >= 8);
  assert.equal(
    new Set(COLOR_TARGETS.map(({ key }) => key)).size,
    COLOR_TARGETS.length,
  );

  for (const target of COLOR_TARGETS) {
    assert.match(target.key, /Color$/);
    assert.ok(target.label);
    assert.ok(PART_CATALOG[target.partId]);
  }
});

test('提供三組完整且不同的預設配置', () => {
  assert.equal(PRESETS.length, 3);
  assert.equal(new Set(PRESETS.map(({ id }) => id)).size, 3);
  assert.equal(new Set(PRESETS.map(({ config }) => config.frameColor)).size, 3);

  for (const preset of PRESETS) {
    assert.ok(preset.name && preset.subtitle);
    assert.ok(preset.config.frame);
    assert.ok(preset.config.brake);
    assert.ok(preset.config.wheel);
    assert.match(preset.config.frameColor, /^#[0-9a-f]{6}$/i);
  }
});
