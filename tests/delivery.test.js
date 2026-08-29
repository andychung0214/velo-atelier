import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createStaticServer, resolveStaticPath } from '../scripts/serve.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('必要交付文件完整且 README 涵蓋指定章節', async () => {
  const requiredFiles = [
    'README.md',
    'CONTRIBUTING.md',
    'LICENSE',
    'docs/PLAN.md',
    'docs/ART-DIRECTION.md',
    'docs/TEST-PLAN.md',
  ];

  await Promise.all(requiredFiles.map((file) => access(path.join(projectRoot, file))));
  const readme = await readFile(path.join(projectRoot, 'README.md'), 'utf8');

  for (const heading of [
    '遊戲介紹', '特色', '操作方式', '安裝與執行', '專案結構',
    '測試方式', '靜態網站', '已知限制', '授權',
  ]) {
    assert.match(readme, new RegExp(`^## ${heading}`, 'm'));
  }
});

test('靜態路徑解析會拒絕上層目錄與隱藏檔案', () => {
  assert.equal(resolveStaticPath(projectRoot, '/%2e%2e%2Foutside.txt'), null);
  assert.equal(resolveStaticPath(projectRoot, '/.env'), null);
  assert.equal(resolveStaticPath(projectRoot, '/.git/config'), null);
  assert.equal(resolveStaticPath(projectRoot, '/'), path.join(projectRoot, 'index.html'));
});

test('GitHub Pages workflow 使用官方 Actions 與最小部署權限', async () => {
  const workflow = await readFile(
    path.join(projectRoot, '.github/workflows/deploy-pages.yml'),
    'utf8',
  );

  assert.match(workflow, /branches:\s*\["main"\]/);
  assert.match(workflow, /contents:\s*read/);
  assert.match(workflow, /pages:\s*write/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /uses:\s*actions\/checkout@v6/);
  assert.match(workflow, /uses:\s*actions\/configure-pages@v5/);
  assert.match(workflow, /uses:\s*actions\/upload-pages-artifact@v4/);
  assert.match(workflow, /uses:\s*actions\/deploy-pages@v4/);
});

test('零相依靜態伺服器提供首頁、正確 MIME 與 404', async (context) => {
  const server = createStaticServer({ root: projectRoot });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => new Promise((resolve) => server.close(resolve)));

  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  const [home, css, missing] = await Promise.all([
    fetch(`${baseUrl}/`),
    fetch(`${baseUrl}/styles/tokens.css`),
    fetch(`${baseUrl}/missing-page`),
  ]);

  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /^text\/html/);
  assert.match(await home.text(), /Velo Atelier/);
  assert.equal(css.status, 200);
  assert.match(css.headers.get('content-type'), /^text\/css/);
  assert.equal(missing.status, 404);
});
