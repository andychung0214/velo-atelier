import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
}

test('首頁具備 3D 舞台、控制台與狀態播報區', () => {
  const html = readProjectFile('index.html');

  for (const id of [
    'main-content',
    'bike-canvas',
    'scene-fallback',
    'configurator',
    'part-detail',
    'status-live',
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }

  assert.match(html, /<main\b/);
  assert.match(html, /<h1\b/);
  assert.match(html, /class="skip-link"/);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
});

test('首頁提供視角、旋轉及重設操作', () => {
  const html = readProjectFile('index.html');

  for (const action of ['reset-view', 'toggle-rotate', 'reset-config']) {
    assert.match(html, new RegExp(`data-action=["']${action}["']`));
  }

  for (const id of ['preset-list', 'spec-controls', 'color-controls', 'text-controls']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }

  assert.match(html, /id="bike-canvas"[^>]*tabindex="0"[^>]*aria-describedby="interaction-hint"/);
  assert.match(html, /id="interaction-hint"/);
});

test('首頁包含固定版本 three.js 與完整 SEO 中繼資料', () => {
  const html = readProjectFile('index.html');

  assert.match(html, /three@0\.180\.0/);
  assert.match(html, /type="importmap"/);
  assert.match(html, /application\/ld\+json/);
  assert.match(html, /<meta name="description"/);
  assert.match(html, /<meta property="og:title"/);
  assert.match(html, /<link rel="canonical"/);
  assert.match(html, /src="\.\/src\/app\.js"/);
});

test('樣式包含三種版面、焦點與減少動態效果', () => {
  const css = ['tokens.css', 'base.css', 'layout.css', 'components.css']
    .map((file) => readProjectFile(`styles/${file}`))
    .join('\n');

  assert.match(css, /@media[^}]*max-width:\s*1100px/s);
  assert.match(css, /@media[^}]*max-width:\s*720px/s);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /min-height:\s*44px/);
});

test('靜態網站索引與原創圖示完整存在', () => {
  for (const path of ['robots.txt', 'sitemap.xml', 'assets/favicon.svg', 'src/app.js']) {
    assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true, `${path} 必須存在`);
  }

  assert.match(readProjectFile('robots.txt'), /Sitemap:/);
  assert.match(readProjectFile('sitemap.xml'), /andychung0214\.github\.io\/velo-atelier/);
});
