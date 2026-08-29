import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_CONFIG,
  normalizeConfig,
  updateConfig,
} from '../src/core/config.js';

test('合法規格與色彩覆寫預設配置', () => {
  const config = normalizeConfig({
    brake: 'caliper',
    wheel: 'shallow',
    cockpit: 'classic',
    frameColor: '#123AbC',
    autoRotate: true,
  });

  assert.equal(config.brake, 'caliper');
  assert.equal(config.wheel, 'shallow');
  assert.equal(config.cockpit, 'classic');
  assert.equal(config.frameColor, '#123abc');
  assert.equal(config.autoRotate, true);
});

test('未知選項、色彩與欄位回復安全值', () => {
  const config = normalizeConfig({
    frame: 'flying',
    wheel: 'unknown',
    rimColor: 'red',
    autoRotate: 'yes',
    injected: '<script>bad()</script>',
  });

  assert.equal(config.frame, DEFAULT_CONFIG.frame);
  assert.equal(config.wheel, DEFAULT_CONFIG.wheel);
  assert.equal(config.rimColor, DEFAULT_CONFIG.rimColor);
  assert.equal(config.autoRotate, DEFAULT_CONFIG.autoRotate);
  assert.equal('injected' in config, false);
});

test('updateConfig 回傳新物件且不改動原配置', () => {
  const current = normalizeConfig({ brake: 'disc', frameColor: '#8f1d2c' });
  const next = updateConfig(current, { brake: 'caliper' });

  assert.notEqual(next, current);
  assert.equal(next.brake, 'caliper');
  assert.equal(current.brake, 'disc');
  assert.equal(next.frameColor, '#8f1d2c');
});

test('normalizeConfig 接受空值並回傳獨立預設物件', () => {
  const first = normalizeConfig(null);
  const second = normalizeConfig(undefined);

  assert.deepEqual(first, DEFAULT_CONFIG);
  assert.deepEqual(second, DEFAULT_CONFIG);
  assert.notEqual(first, DEFAULT_CONFIG);
  assert.notEqual(first, second);
});

test('配置正規化會清理車架文字並拒絕未知字體', () => {
  const config = normalizeConfig({
    frameText: '  疾輪\u0000  風の道  ',
    font: 'comic-sans',
  });

  assert.equal(config.frameText, '疾輪 風の道');
  assert.equal(config.font, DEFAULT_CONFIG.font);
});
