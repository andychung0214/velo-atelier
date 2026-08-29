# Velo Atelier／疾輪工房 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立可在純靜態網站託管環境執行、支援桌機與行動觸控的高細節 three.js 公路車訂製模擬遊戲。

**Architecture:** 以可測試的純 JavaScript 配置層作為唯一狀態來源，UI 與 three.js 場景透過穩定的 `partId` 同步。3D 車體由可替換的程式化零件群組組成，首版不依賴外部模型，並將瀏覽器專用場景模組與可由 Node.js 測試的資料／核心模組分離。

**Tech Stack:** HTML5、CSS、Vanilla JavaScript、原生 ES Modules、three.js 0.180.0、WebGL、Canvas 2D、Web Storage API、Node.js 18+ 內建 `node:test`。

**Spec:** `docs/superpowers/specs/2026-08-27-velo-atelier-design.md`

## Global Constraints

- 不使用 React、Angular、Vue、TypeScript、後端服務或大型遊戲引擎。
- three.js 使用固定版本 `0.180.0`，透過 jsDelivr ES Module 載入。
- 網站本身不得需要建構步驟，可部署至 GitHub Pages、Synology Web Station 或其他靜態檔案服務。
- 中文文件、註解與 UI 文案遵守專案 `AGENTS.md` 的臺灣用語規範。
- 不使用真實品牌商標、未授權模型、`.env`、憑證、token 或私人金鑰。
- 桌機優先，至少驗證 1440×900、834×1112、390×844 三種尺寸。
- 支援鍵盤焦點、狀態播報、減少動態效果及 WebGL／儲存失敗降級。
- 使用者已指定在 `F:\Codex\Projects\velo-atelier` 的 `main` 建立首版並推送 `origin`。

---

## 需求與範圍摘要

首版提供完整 3D 公路車、五組主要規格切換、至少八個獨立色彩區、跨語系車架文字、零件用途說明、三組預設配置及本機儲存。商品價格、購物車、真實尺寸配車、品牌模型、多人功能與後端服務不在本次範圍。

## 檔案結構

```text
velo-atelier/
├── assets/
│   └── favicon.svg                 # 原創識別圖示
├── docs/
│   ├── PLAN.md                     # 本實作計畫
│   ├── ART-DIRECTION.md            # 義式競速海報視覺規範
│   ├── TEST-PLAN.md                # 自動、手動、RWD 與無障礙測試清單
│   └── superpowers/specs/          # 已核准設計規格
├── src/
│   ├── core/
│   │   ├── config.js               # 配置預設、正規化與更新
│   │   ├── storage.js              # 版本化 localStorage 邊界
│   │   └── text.js                 # 車架文字正規化與字體目錄
│   ├── data/
│   │   ├── parts.js                # 零件、選項與用途說明
│   │   └── presets.js              # 三組完整配置
│   ├── scene/
│   │   ├── materials.js            # PBR 材質工廠
│   │   ├── primitives.js           # 車管、螺栓、輻條等幾何工具
│   │   ├── bike-model.js            # 公路車零件群組與更新介面
│   │   ├── text-decal.js            # Canvas 車架文字材質
│   │   └── scene-controller.js      # 場景、相機、燈光、控制與點選
│   ├── ui/
│   │   └── configurator.js          # 控制台渲染、事件與說明面板
│   └── app.js                       # 啟動、狀態協調與降級處理
├── styles/
│   ├── tokens.css                  # 色彩、字體、間距與動態 Token
│   ├── base.css                    # 重設、排版、焦點與共用規則
│   ├── layout.css                  # 三欄、平板與手機版面
│   └── components.css              # 控制、規格列、說明與舞台元件
├── tests/
│   ├── catalog.test.js             # 零件與預設資料
│   ├── config.test.js              # 配置正規化與更新
│   ├── storage.test.js             # 儲存、損壞資料與版本
│   ├── text.test.js                # 跨語系文字與長度限制
│   ├── structure.test.js           # HTML、CSS、SEO、無障礙契約
│   └── scene-contract.test.js      # 3D 模組與零件選取契約
├── .gitignore
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── index.html
├── package.json
├── robots.txt
└── sitemap.xml
```

## 里程碑

| 里程碑 | 產出 | 驗證證據 |
|---|---|---|
| M1 資料核心 | 零件目錄、預設配置、正規化、儲存 | `npm test` 的核心測試通過 |
| M2 視覺骨架 | 義式競速海報版面、RWD、語意化控制 | 結構測試與三種尺寸截圖 |
| M3 3D 車體 | 完整車架、輪組、煞車、傳動與座艙 | 瀏覽器顯示及視角操作證據 |
| M4 客製互動 | 零件選取、顏色、文字、預設與保存 | 互動測試及重新載入驗證 |
| M5 交付品質 | 文件、授權、全套測試、程式碼檢視 | `npm run verify`、瀏覽器檢查、Git 狀態 |

---

### Task 1: 建立資料目錄與測試基礎

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `src/data/parts.js`
- Create: `src/data/presets.js`
- Test: `tests/catalog.test.js`

**Interfaces:**
- Produces: `PART_CATALOG: Readonly<Record<string, PartDefinition>>`
- Produces: `OPTION_CATALOG: Readonly<Record<string, readonly OptionDefinition[]>>`
- Produces: `COLOR_TARGETS: readonly ColorTargetDefinition[]`
- Produces: `PRESETS: readonly PresetDefinition[]`
- `PartDefinition = { id, name, eyebrow, category, description, tip }`
- `OptionDefinition = { value, label, note }`
- `PresetDefinition = { id, name, subtitle, config }`

- [ ] **Step 1: 寫入會失敗的目錄測試**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { COLOR_TARGETS, OPTION_CATALOG, PART_CATALOG } from '../src/data/parts.js';
import { PRESETS } from '../src/data/presets.js';

test('零件目錄提供完整且唯一的說明', () => {
  const parts = Object.values(PART_CATALOG);
  assert.ok(parts.length >= 12);
  assert.equal(new Set(parts.map(({ id }) => id)).size, parts.length);
  for (const part of parts) {
    assert.ok(part.name && part.description && part.tip);
  }
});

test('首版選項及色彩目標符合規格', () => {
  assert.deepEqual(OPTION_CATALOG.brake.map(({ value }) => value), ['disc', 'caliper']);
  assert.deepEqual(OPTION_CATALOG.wheel.map(({ value }) => value), ['shallow', 'deep', 'disc']);
  assert.ok(COLOR_TARGETS.length >= 8);
  assert.equal(PRESETS.length, 3);
});
```

- [ ] **Step 2: 執行測試並確認因模組不存在而失敗**

Run: `node --test tests/catalog.test.js`  
Expected: FAIL，錯誤包含 `Cannot find module`。

- [ ] **Step 3: 建立套件腳本與資料目錄**

`package.json` 固定以下腳本與 ESM 設定：

```json
{
  "name": "velo-atelier",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node scripts/serve.mjs",
    "test": "node --test tests/*.test.js",
    "verify": "node --test tests/*.test.js"
  },
  "engines": { "node": ">=18" },
  "license": "MIT"
}
```

`.gitignore` 明確忽略依賴、測試產物、作業系統檔案與任何環境檔：

```gitignore
node_modules/
coverage/
test-results/
playwright-report/
.DS_Store
Thumbs.db
.env
.env.*
*.pem
*.key
```

在 `parts.js` 實作規格要求的 `frame`、`topTube`、`downTube`、`fork`、`wheelset`、`brake`、`drivetrain`、`cockpit`、`barTape`、`saddle`、`seatpost`、`bottleCage` 等零件，以及 frame／brake／wheel／drivetrain／cockpit 選項。`presets.js` 建立 `corsaRosso`、`verdePista`、`notteAzzurra` 三組完整配置。

- [ ] **Step 4: 執行目錄測試並確認通過**

Run: `node --test tests/catalog.test.js`  
Expected: PASS，2 tests，0 failures。

- [ ] **Step 5: 提交資料核心**

```powershell
git add package.json .gitignore src/data tests/catalog.test.js
git commit -m "feat: 建立公路車零件與預設配置目錄"
```

---

### Task 2: 配置正規化與版本化儲存

**Files:**
- Create: `src/core/config.js`
- Create: `src/core/storage.js`
- Test: `tests/config.test.js`
- Test: `tests/storage.test.js`

**Interfaces:**
- Consumes: `OPTION_CATALOG`, `COLOR_TARGETS`, `PRESETS`
- Produces: `DEFAULT_CONFIG: Readonly<BikeConfig>`
- Produces: `normalizeConfig(candidate: unknown): BikeConfig`
- Produces: `updateConfig(current: BikeConfig, patch: Partial<BikeConfig>): BikeConfig`
- Produces: `createConfigStorage(adapter: StorageLike, key?: string): { load, save, clear }`
- `StorageLike = { getItem(key): string|null, setItem(key, value): void, removeItem(key): void }`

- [ ] **Step 1: 寫入配置與儲存失敗測試**

```js
test('normalizeConfig 保留合法選項並拒絕未知值', () => {
  const config = normalizeConfig({ brake: 'caliper', wheel: 'unknown', frameColor: '#123abc' });
  assert.equal(config.brake, 'caliper');
  assert.equal(config.wheel, DEFAULT_CONFIG.wheel);
  assert.equal(config.frameColor, '#123abc');
});

test('損壞儲存資料回復預設配置', () => {
  const memory = new Map([['velo-atelier:config', '{broken']]);
  const storage = createConfigStorage(mapAdapter(memory));
  assert.deepEqual(storage.load(), DEFAULT_CONFIG);
});
```

- [ ] **Step 2: 執行測試並確認函式尚未定義**

Run: `node --test tests/config.test.js tests/storage.test.js`  
Expected: FAIL，錯誤包含缺少 `config.js` 或 `storage.js`。

- [ ] **Step 3: 實作不可變配置與儲存邊界**

`BikeConfig` 使用以下穩定欄位：

```js
{
  frame: 'race', brake: 'disc', wheel: 'deep', drivetrain: 'electronic', cockpit: 'integrated',
  frameColor: '#8f1d2c', forkColor: '#8f1d2c', rimColor: '#171717',
  accentColor: '#f3ead7', tapeColor: '#26332d', saddleColor: '#171717',
  hardwareColor: '#a7aaad', textColor: '#f3ead7', frameText: 'VELO ATELIER',
  font: 'corsa', autoRotate: false
}
```

`normalizeConfig` 只複製已知欄位；選項對照 `OPTION_CATALOG`；色彩只接受 `/^#[0-9a-f]{6}$/i`；布林值只接受布林；文字交由 Task 3 的 `normalizeFrameText` 後續接管。儲存格式固定 `{ version: 1, config }`，解析或寫入錯誤一律捕捉並回傳安全結果。

- [ ] **Step 4: 執行核心測試並確認通過**

Run: `node --test tests/config.test.js tests/storage.test.js`  
Expected: PASS，所有配置與儲存案例通過。

- [ ] **Step 5: 提交配置層**

```powershell
git add src/core/config.js src/core/storage.js tests/config.test.js tests/storage.test.js
git commit -m "feat: 建立配置驗證與本機儲存"
```

---

### Task 3: 車架文字與跨語系字體

**Files:**
- Create: `src/core/text.js`
- Modify: `src/core/config.js`
- Test: `tests/text.test.js`
- Modify: `tests/config.test.js`

**Interfaces:**
- Produces: `FONT_OPTIONS: readonly FontDefinition[]`
- Produces: `normalizeFrameText(value: unknown, maxLength?: number): string`
- `FontDefinition = { value, label, canvasFamily, cssFamily }`
- `normalizeConfig` 必須使用 `normalizeFrameText(candidate.frameText, 24)`。

- [ ] **Step 1: 寫入中英日文字失敗測試**

```js
test('保留中文、英文與日文並壓縮空白', () => {
  assert.equal(normalizeFrameText('  疾輪  VELO  風の道  '), '疾輪 VELO 風の道');
});

test('移除控制字元並限制 24 個 Unicode 字元', () => {
  const source = `疾輪\u0000${'風'.repeat(30)}`;
  assert.equal(Array.from(normalizeFrameText(source)).length, 24);
  assert.equal(normalizeFrameText(source).includes('\u0000'), false);
});
```

- [ ] **Step 2: 執行測試並確認文字模組不存在**

Run: `node --test tests/text.test.js`  
Expected: FAIL，錯誤包含 `Cannot find module`。

- [ ] **Step 3: 實作四種字體策略與文字正規化**

四種字體值固定為 `corsa`、`editorial`、`mono`、`cjk`。Canvas 字體依序使用窄體無襯線、襯線、等寬及 CJK 系統無襯線回退；不把輸入當成 HTML。以 `Array.from()` 依 Unicode 字元截斷，移除 `U+0000–U+001F` 與 `U+007F–U+009F` 後壓縮空白。

- [ ] **Step 4: 執行文字與配置測試**

Run: `node --test tests/text.test.js tests/config.test.js`  
Expected: PASS，跨語系、控制字元、長度及字體回退均通過。

- [ ] **Step 5: 提交文字核心**

```powershell
git add src/core/text.js src/core/config.js tests/text.test.js tests/config.test.js
git commit -m "feat: 支援跨語系車架文字"
```

---

### Task 4: 建立義式競速海報介面骨架

**Files:**
- Create: `index.html`
- Create: `styles/tokens.css`
- Create: `styles/base.css`
- Create: `styles/layout.css`
- Create: `styles/components.css`
- Create: `assets/favicon.svg`
- Create: `robots.txt`
- Create: `sitemap.xml`
- Test: `tests/structure.test.js`

**Interfaces:**
- Produces DOM: `#bike-canvas`, `#scene-fallback`, `#configurator`, `#part-detail`, `#status-live`
- Produces controls: `[data-action="reset-view"]`, `[data-action="toggle-rotate"]`, `[data-action="reset-config"]`
- Produces form containers: `#preset-list`, `#spec-controls`, `#color-controls`, `#text-controls`

- [ ] **Step 1: 寫入 HTML／CSS 結構失敗測試**

```js
test('首頁具備 3D 舞台、控制台與無障礙區域', () => {
  const html = readFileSync('index.html', 'utf8');
  for (const id of ['bike-canvas', 'scene-fallback', 'configurator', 'part-detail', 'status-live']) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }
  assert.match(html, /<main/);
  assert.match(html, /application\/ld\+json/);
  assert.ok(existsSync('robots.txt'));
  assert.ok(existsSync('sitemap.xml'));
});

test('樣式包含三種版面與減少動態效果', () => {
  const css = ['tokens.css', 'base.css', 'layout.css', 'components.css']
    .map((file) => readFileSync(`styles/${file}`, 'utf8')).join('\n');
  assert.match(css, /@media[^}]*max-width:\s*1100px/s);
  assert.match(css, /@media[^}]*max-width:\s*720px/s);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
});
```

- [ ] **Step 2: 執行結構測試並確認失敗**

Run: `node --test tests/structure.test.js`  
Expected: FAIL，錯誤包含找不到 `index.html`。

- [ ] **Step 3: 建立語意化頁面與設計 Token**

色彩 Token 固定為象牙白 `#f1ecdf`、紙影 `#d8d0c0`、酒紅 `#8f1d2c`、賽車綠 `#1f4d3a`、碳纖黑 `#171717`、鋁銀 `#a7aaad`。桌機使用 `minmax(190px, 0.7fr) minmax(520px, 2.2fr) minmax(300px, 1fr)` 三欄；1100px 以下縮成雙區，720px 以下改為舞台加底部控制台。所有按鈕、輸入與可點選規格列都有 44px 最小觸控區與可見焦點。

`index.html` 必須包含標題、描述、canonical、Open Graph、Product／SoftwareApplication 結構化資料、跳至主要內容連結、可讀的操作提示及 CDN import map。`robots.txt` 允許索引並指向 GitHub Pages Sitemap；`sitemap.xml` 使用 `https://andychung0214.github.io/velo-atelier/`：

```html
<script type="importmap">
{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/"}}
</script>
<script type="module" src="./src/app.js"></script>
```

- [ ] **Step 4: 執行結構測試並確認通過**

Run: `node --test tests/structure.test.js`  
Expected: PASS，HTML、SEO、RWD、焦點與減少動態效果契約通過。

- [ ] **Step 5: 提交介面骨架**

```powershell
git add index.html styles assets/favicon.svg robots.txt sitemap.xml tests/structure.test.js
git commit -m "feat: 建立義式競速海報介面"
```

---

### Task 5: 建立高細節 three.js 公路車

**Files:**
- Create: `src/scene/materials.js`
- Create: `src/scene/primitives.js`
- Create: `src/scene/bike-model.js`
- Create: `src/scene/scene-controller.js`
- Test: `tests/scene-contract.test.js`

**Interfaces:**
- Produces: `createMaterials(THREE, config): MaterialLibrary`
- Produces: `tubeBetween(THREE, start, end, radiusStart, radiusEnd, material): THREE.Mesh`
- Produces: `createBikeModel(THREE, config): BikeModel`
- `BikeModel = { root, selectable, update(config), selectPart(partId), dispose() }`
- Produces: `createSceneController({ canvas, config, onPartSelect, onError }): Promise<SceneController>`
- `SceneController = { update(config), selectPart(partId), resetView(), setAutoRotate(enabled), resize(), dispose() }`

- [ ] **Step 1: 寫入場景原始碼契約失敗測試**

```js
test('場景模組提供模型、控制與點選契約', () => {
  const model = readFileSync('src/scene/bike-model.js', 'utf8');
  const controller = readFileSync('src/scene/scene-controller.js', 'utf8');
  assert.match(model, /export function createBikeModel/);
  assert.match(model, /partId/);
  assert.match(controller, /OrbitControls/);
  assert.match(controller, /Raycaster/);
  assert.match(controller, /setAnimationLoop/);
});
```

- [ ] **Step 2: 執行場景契約並確認失敗**

Run: `node --test tests/scene-contract.test.js`  
Expected: FAIL，錯誤包含找不到場景檔案。

- [ ] **Step 3: 實作材質與幾何工具**

建立烤漆、碳纖維、陽極金屬、橡膠及半透明塑料五類 `MeshPhysicalMaterial`。`tubeBetween` 使用 `CylinderGeometry` 對齊兩點；提供 `markPart(object, partId)` 將 `partId` 設在可選群組；所有建立的幾何與材質都可由 `dispose()` 釋放。

- [ ] **Step 4: 實作公路車零件群組**

依固定公尺比例建立前後 700c 車輪、競賽／空力／耐力車架、前叉、曲柄、鏈條、飛輪、前後變速器、座管、座墊、水壺架及座艙。輪組切換必須區分 28mm 低框、65mm 刀輪及封閉板輪；煞車切換必須互斥；電子變速顯示控制盒，機械變速顯示線管。所有 UI 可選零件向上群組並標記 `partId`。

- [ ] **Step 5: 實作場景、燈光與相機控制**

場景使用透明 WebGL 畫布、ACES Filmic tone mapping、sRGB 色彩空間、限制為 2 的像素比例、PCFSoftShadowMap、2048×2048 主光陰影與接觸地面。`OrbitControls` 限制極角及距離；`Raycaster` 由指標座標選取 `selectable`；點選空白不改變目前零件。動畫迴圈只更新控制器與渲染，頁面隱藏時暫停。

- [ ] **Step 6: 執行場景契約及完整測試**

Run: `npm test`  
Expected: PASS，所有既有測試及場景契約通過。

- [ ] **Step 7: 啟動靜態伺服器並驗證模型里程碑**

Run: `node scripts/serve.mjs`（若 Task 9 尚未建立腳本，暫用 `python -m http.server 4173`）  
Expected: `http://127.0.0.1:4173/` 顯示完整車體，可旋轉、縮放、重設視角，瀏覽器控制台沒有未處理錯誤。

- [ ] **Step 8: 提交 3D 車體**

```powershell
git add src/scene tests/scene-contract.test.js
git commit -m "feat: 建立高細節三維公路車"
```

---

### Task 6: 車架文字材質與零件選取回饋

**Files:**
- Create: `src/scene/text-decal.js`
- Modify: `src/scene/bike-model.js`
- Modify: `src/scene/scene-controller.js`
- Modify: `tests/scene-contract.test.js`

**Interfaces:**
- Consumes: `FONT_OPTIONS`, `normalizeFrameText`
- Produces: `createTextDecal(THREE, { text, color, font }): TextDecal`
- `TextDecal = { meshes, update({ text, color, font }), dispose() }`
- `BikeModel.selectPart(partId)` 以 emissive 或輪廓材質高亮，空字串時隱藏文字平面。

- [ ] **Step 1: 增加文字材質與選取狀態失敗測試**

```js
test('模型整合 Canvas 文字與選取高亮', () => {
  const decal = readFileSync('src/scene/text-decal.js', 'utf8');
  const model = readFileSync('src/scene/bike-model.js', 'utf8');
  assert.match(decal, /CanvasTexture/);
  assert.match(decal, /devicePixelRatio/);
  assert.match(model, /selectPart/);
  assert.match(model, /emissive/);
});
```

- [ ] **Step 2: 執行場景契約並確認新斷言失敗**

Run: `node --test tests/scene-contract.test.js`  
Expected: FAIL，錯誤指出缺少 `CanvasTexture` 或 `selectPart`。

- [ ] **Step 3: 實作高 DPI Canvas 文字材質**

以 1024×256 邏輯畫布乘上最多 2 倍像素比例，先等待 `document.fonts.ready` 再繪製；Canvas 僅使用 `fillText`，不解析 HTML。文字平面貼在下管左右兩側，依空力與非空力管徑調整位置；更新時先釋放舊 `CanvasTexture`。

- [ ] **Step 4: 實作選取高亮與導引線狀態**

保存每個材質的原始 emissive 值，選取時只提高目前 `partId` 的 emissive 強度，其餘復原。`scene-controller` 點選後呼叫 `onPartSelect(partId)`；UI 後續以 `data-selected-part` 驅動酒紅導引線。

- [ ] **Step 5: 執行完整測試並在瀏覽器檢查文字**

Run: `npm test`  
Expected: PASS。瀏覽器依序輸入 `VELO ATELIER`、`疾輪工房`、`風の道`，三組文字皆清楚顯示且切換字體後更新。

- [ ] **Step 6: 提交文字與選取效果**

```powershell
git add src/scene/text-decal.js src/scene/bike-model.js src/scene/scene-controller.js tests/scene-contract.test.js
git commit -m "feat: 加入車架文字與零件選取回饋"
```

---

### Task 7: 整合客製化控制台與應用程式狀態

**Files:**
- Create: `src/ui/configurator.js`
- Create: `src/app.js`
- Modify: `index.html`
- Modify: `styles/components.css`
- Modify: `tests/structure.test.js`

**Interfaces:**
- Consumes: `PART_CATALOG`, `OPTION_CATALOG`, `COLOR_TARGETS`, `PRESETS`, `FONT_OPTIONS`
- Consumes: `normalizeConfig`, `updateConfig`, `createConfigStorage`, `createSceneController`
- Produces: `createConfigurator({ root, detailRoot, initialConfig, onChange, onSelectPart, onAction }): Configurator`
- `Configurator = { update(config), selectPart(partId), announce(message), destroy() }`
- `onAction` 值限定為 `reset-view`、`toggle-rotate`、`reset-config`、`apply-preset`。

- [ ] **Step 1: 擴充控制台契約測試並確認失敗**

```js
test('應用程式協調配置、場景與儲存', () => {
  const app = readFileSync('src/app.js', 'utf8');
  const ui = readFileSync('src/ui/configurator.js', 'utf8');
  assert.match(app, /createConfigStorage/);
  assert.match(app, /createSceneController/);
  assert.match(ui, /createConfigurator/);
  assert.match(ui, /PART_CATALOG/);
  assert.match(ui, /aria-pressed/);
});
```

- [ ] **Step 2: 執行結構測試並確認新斷言失敗**

Run: `node --test tests/structure.test.js`  
Expected: FAIL，錯誤指出找不到 `src/app.js` 或 UI 模組。

- [ ] **Step 3: 實作資料驅動控制台**

規格選項、色彩目標、預設配置與字體均由資料目錄產生。`input` 事件即時更新顏色與文字，`change` 處理選項；目前選項使用 `aria-pressed="true"`。零件詳情固定呈現 eyebrow、名稱、用途與選購提示，選取後將焦點保留在原控制項，並透過 `#status-live` 播報。

- [ ] **Step 4: 實作單向狀態協調**

`app.js` 啟動順序固定為：建立儲存邊界、載入並正規化配置、建立 UI、建立場景、同步初始狀態。每次變更只走 `applyPatch(patch)`：建立新配置、更新 UI、更新場景、嘗試儲存。套用預設使用完整正規化；重設先清除儲存再使用 `DEFAULT_CONFIG`；場景載入失敗顯示 `#scene-fallback` 且控制台仍可操作。

- [ ] **Step 5: 完整互動瀏覽器驗證**

Expected:

1. 碟煞／C 夾煞切換互斥。
2. 低框輪／刀輪／板輪外觀明顯不同。
3. 電子／機械變速及傳統／一體式座艙正確切換。
4. 八個色彩輸入即時更新對應零件。
5. 點選 3D 零件與控制台皆顯示相同用途說明。
6. 三組預設可套用，重新整理後保持最後配置，重設後回到預設。

- [ ] **Step 6: 執行完整測試**

Run: `npm test`  
Expected: PASS，0 failures。

- [ ] **Step 7: 提交完整客製化流程**

```powershell
git add src/ui src/app.js index.html styles/components.css tests/structure.test.js
git commit -m "feat: 整合公路車客製化控制台"
```

---

### Task 8: 完成 RWD、效能、無障礙與降級

**Files:**
- Modify: `styles/base.css`
- Modify: `styles/layout.css`
- Modify: `styles/components.css`
- Modify: `src/scene/scene-controller.js`
- Modify: `src/app.js`
- Modify: `tests/structure.test.js`
- Modify: `tests/scene-contract.test.js`

**Interfaces:**
- `scene-controller` 監聽 `ResizeObserver`、`visibilitychange` 與媒體查詢。
- `app.js` 以 `showSceneError(message)` 呈現 WebGL／CDN 錯誤。
- UI 可完全以 Tab、Enter、Space、方向鍵與 Escape 操作適用控制項。

- [ ] **Step 1: 加入效能與降級契約失敗測試**

```js
test('場景限制像素比例並支援生命週期', () => {
  const source = readFileSync('src/scene/scene-controller.js', 'utf8');
  assert.match(source, /Math\.min\([^,]+,\s*2\)/);
  assert.match(source, /ResizeObserver/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /prefers-reduced-motion/);
});
```

- [ ] **Step 2: 執行測試並確認新增契約失敗**

Run: `node --test tests/scene-contract.test.js tests/structure.test.js`  
Expected: FAIL，至少一項生命週期或降級契約未完成。

- [ ] **Step 3: 實作 RWD 與可用性細節**

1440px 顯示完整三欄；834px 將品牌摘要移到舞台上方並保持控制台可見；390px 將舞台固定為至少 48svh、控制台改為文件流底部區塊，避免遮住瀏覽器工具列。所有文字對比至少 4.5:1，純裝飾元素 `aria-hidden="true"`，色彩輸入同時顯示文字標籤。

- [ ] **Step 4: 實作效能與錯誤降級**

限制像素比例，手機將陰影貼圖降至 1024；ResizeObserver 更新相機比例；頁面隱藏停止動畫；減少動態效果停用自動旋轉及 CSS 轉場。捕捉 WebGL、模組啟動與儲存錯誤，顯示具體下一步且不使用阻斷式 alert。

- [ ] **Step 5: 執行自動測試並完成三種尺寸手動檢查**

Run: `npm test`  
Expected: PASS。以 1440×900、834×1112、390×844 檢查無水平捲動、控制可點擊、舞台可操作、文字不截斷；開啟減少動態效果後模型不自動旋轉。

- [ ] **Step 6: 提交品質改善**

```powershell
git add styles src/app.js src/scene/scene-controller.js tests
git commit -m "feat: 完成響應式與無障礙體驗"
```

---

### Task 9: 完成交付文件、靜態伺服器與總驗證

**Files:**
- Create: `scripts/serve.mjs`
- Create: `README.md`
- Create: `docs/ART-DIRECTION.md`
- Create: `docs/TEST-PLAN.md`
- Create: `CONTRIBUTING.md`
- Create: `LICENSE`
- Modify: `package.json`
- Create: `tests/delivery.test.js`
- Modify: `robots.txt`
- Modify: `sitemap.xml`

**Interfaces:**
- `scripts/serve.mjs`：只使用 Node.js 內建 `http`、`fs`、`path`，預設 `127.0.0.1:4173`，正確回傳 HTML、CSS、JS、SVG MIME。
- `npm start`：啟動靜態伺服器。
- `npm run verify`：執行所有 Node.js 測試。

- [ ] **Step 1: 寫入交付完整性失敗測試**

```js
test('必要文件、授權與靜態網站索引完整存在', () => {
  for (const file of ['README.md', 'docs/PLAN.md', 'docs/ART-DIRECTION.md', 'docs/TEST-PLAN.md', 'CONTRIBUTING.md', 'LICENSE', 'robots.txt', 'sitemap.xml']) {
    assert.ok(existsSync(file), `${file} 必須存在`);
  }
});

test('README 涵蓋必要交付章節', () => {
  const readme = readFileSync('README.md', 'utf8');
  for (const heading of ['遊戲介紹', '特色', '操作方式', '安裝與執行', '專案結構', '測試方式', '靜態網站託管', '已知限制', '授權']) {
    assert.match(readme, new RegExp(`## ${heading}`));
  }
});
```

- [ ] **Step 2: 執行交付測試並確認文件缺少而失敗**

Run: `node --test tests/delivery.test.js`  
Expected: FAIL，列出尚未建立的必要文件。

- [ ] **Step 3: 實作零依賴靜態伺服器**

伺服器只允許專案根目錄內的正規化路徑，`/` 對應 `index.html`，不存在回傳 404，拒絕 `..` 路徑穿越；收到 SIGINT 時關閉。啟動訊息固定顯示 `Velo Atelier: http://127.0.0.1:4173/`。

- [ ] **Step 4: 撰寫必要文件**

`README.md` 包含遊戲介紹、特色、操作方式、安裝與執行、專案結構、測試方式、靜態網站託管、已知限制、隱私與授權。`ART-DIRECTION.md` 包含色票、字體策略、元件規格、動畫原則、可選風格與禁止事項。`TEST-PLAN.md` 包含功能、自動、手動、行動裝置、瀏覽器、效能與無障礙清單。`CONTRIBUTING.md` 寫明分支、Conventional Commits zh-TW、測試及安全規範。`LICENSE` 使用完整 MIT License，著作權標示 `2026 Velo Atelier contributors`。

- [ ] **Step 5: 執行完整自動驗證**

Run: `npm run verify`  
Expected: PASS，所有測試 0 failures。

- [ ] **Step 6: 執行瀏覽器最終驗證**

Run: `npm start`  
Expected: 本機伺服器啟動於 `http://127.0.0.1:4173/`。逐項完成 `docs/TEST-PLAN.md` 的 P0 清單，檢查瀏覽器控制台、三種尺寸、觸控模擬、鍵盤、跨語系文字、保存與重設，並保存桌機及手機截圖作為檢視證據但不提交測試暫存圖。

- [ ] **Step 7: 安全與版本庫稽核**

Run: `git status --short && git ls-files`  
Expected: 只包含專案原始碼、文件與授權；不包含 `.env`、`*.pem`、`*.key`、token 或私人金鑰。以 `rg -n --hidden -g '!\.git/**' -g '!docs/PLAN.md' "(BEGIN .*PRIVATE KEY|api[_-]?key|access[_-]?token|secret)" .` 確認沒有敏感內容。

- [ ] **Step 8: 提交完整交付內容**

```powershell
git add README.md docs/ART-DIRECTION.md docs/TEST-PLAN.md CONTRIBUTING.md LICENSE scripts/serve.mjs package.json robots.txt sitemap.xml tests/delivery.test.js
git commit -m "docs: 完成疾輪工房交付文件"
```

- [ ] **Step 9: 請求程式碼檢視並修正重要問題**

依 `superpowers:requesting-code-review` 比較規格提交 `5e96f15` 與目前 HEAD。Critical 及 Important 問題必須修正並重新執行 `npm run verify`；Minor 問題記錄於交付說明。

- [ ] **Step 10: 推送前顯示並核對目標**

Run: `git remote -v`、`git branch --show-current`、`git log -1 --oneline`  
Expected: remote 為 `https://github.com/andychung0214/velo-atelier.git`、branch 為 `main`，並向使用者顯示即將推送的 remote、branch 與 commit 後才執行 `git push -u origin main`。

---

## 風險與緩解

| 風險 | 影響 | 緩解方式 |
|---|---|---|
| 程式化模型不及攝影掃描真實 | 視覺期待落差 | 使用正確公路車比例、細分零件、PBR 材質、碳纖維細紋、棚拍燈光；文件明示不等同 CAD |
| three.js CDN 無法連線 | 3D 舞台無法啟動 | 固定版本、靜態內容保留、顯示明確重新整理提示；未來可改為 vendored 模組 |
| 板輪、碟煞等幾何增加 GPU 負擔 | 行動裝置掉幀 | 共用幾何與材質、限制像素比例與陰影、頁面隱藏暫停動畫 |
| 中日文字體尚未下載完成 | 首次貼圖缺字或跳動 | 等待 `document.fonts.ready`、使用系統 CJK 回退、可再次更新貼圖 |
| `localStorage` 損壞或受限制 | 配置不能保存 | 版本化格式、欄位白名單、錯誤捕捉與非阻斷提示 |
| 3D 點選命中子網格 | 顯示錯誤零件說明 | 子網格向上尋找穩定 `partId`，以契約測試與瀏覽器點選驗證 |
| 推送遠端已有不相容歷史 | `git push` 被拒絕 | 推送前先 fetch／檢查遠端；絕不自行 force-push，遇衝突停止並回報 |

## 最終驗收條件

- `npm run verify` 全部通過且沒有略過測試。
- three.js 舞台在桌機及行動尺寸顯示完整公路車並可旋轉、縮放、重設與自動旋轉。
- 車架、煞車、輪組、傳動、座艙、八組色彩、三組預設及四種字體均可操作。
- 中文、英文、日文車架文字顯示正確，重新整理後配置仍存在。
- 點選 3D 零件會高亮並顯示正確用途與選購提示。
- 1440×900、834×1112、390×844 沒有水平捲動或不可操作控制項。
- 鍵盤焦點、狀態播報、減少動態效果及錯誤降級均完成驗證。
- README、計畫、藝術方向、測試計畫、貢獻指南、MIT 授權與 `.gitignore` 完整。
- Git 版本庫沒有憑證、token、`.env` 或私人金鑰。
- 已完成程式碼檢視並修正 Critical／Important 問題。
- 推送前已向使用者顯示 remote、branch 與 commit；推送結果可由遠端確認。
