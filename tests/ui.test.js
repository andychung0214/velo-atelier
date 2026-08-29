import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_CONFIG } from '../src/core/config.js';
import { getConfiguratorModel } from '../src/ui/configurator.js';

test('控制台模型包含完整規格、色彩、預設與字體', () => {
  const model = getConfiguratorModel(DEFAULT_CONFIG);

  assert.equal(model.specs.length, 5);
  assert.equal(model.colors.length, 8);
  assert.equal(model.presets.length, 3);
  assert.equal(model.fonts.length, 4);
});

test('控制台模型正確標記目前規格與色彩', () => {
  const config = {
    ...DEFAULT_CONFIG,
    brake: 'caliper',
    wheel: 'disc',
    frameColor: '#123abc',
    font: 'cjk',
  };
  const model = getConfiguratorModel(config);
  const brake = model.specs.find(({ key }) => key === 'brake');
  const frameColor = model.colors.find(({ key }) => key === 'frameColor');

  assert.equal(brake.options.find(({ selected }) => selected).value, 'caliper');
  assert.equal(frameColor.value, '#123abc');
  assert.equal(model.fonts.find(({ selected }) => selected).value, 'cjk');
});

test('控制台模型不回傳可改動的原始配置參照', () => {
  const config = { ...DEFAULT_CONFIG };
  const model = getConfiguratorModel(config);
  model.colors[0].value = '#000000';

  assert.equal(config.frameColor, DEFAULT_CONFIG.frameColor);
});
