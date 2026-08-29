import test from 'node:test';
import assert from 'node:assert/strict';

import { FONT_OPTIONS, normalizeFrameText } from '../src/core/text.js';

test('保留中文、英文與日文並壓縮空白', () => {
  assert.equal(
    normalizeFrameText('  疾輪  VELO\n\t風の道  '),
    '疾輪 VELO 風の道',
  );
});

test('移除控制字元並限制 24 個 Unicode 字元', () => {
  const source = `疾輪\u0000${'風'.repeat(30)}`;
  const normalized = normalizeFrameText(source);

  assert.equal(Array.from(normalized).length, 24);
  assert.equal(normalized.includes('\u0000'), false);
  assert.ok(normalized.startsWith('疾輪'));
});

test('非文字輸入回傳空字串且可自訂上限', () => {
  assert.equal(normalizeFrameText(null), '');
  assert.equal(normalizeFrameText({ text: 'VELO' }), '');
  assert.equal(normalizeFrameText('ABCDEFGHIJ', 5), 'ABCDE');
});

test('提供四種具有 Canvas 與 CSS 回退的跨語系字體', () => {
  assert.deepEqual(
    FONT_OPTIONS.map(({ value }) => value),
    ['corsa', 'editorial', 'mono', 'cjk'],
  );

  for (const font of FONT_OPTIONS) {
    assert.ok(font.label);
    assert.ok(font.canvasFamily);
    assert.ok(font.cssFamily);
  }
});
