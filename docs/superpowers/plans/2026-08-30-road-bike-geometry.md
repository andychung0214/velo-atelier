# 真實公路車幾何與零件標示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 依核准參考照片重建 Velo Atelier 的程序化公路車比例，並以可測試的角色資料保證每個零件點選到正確說明。

**Architecture:** 新增不依賴 three.js 的純幾何模組，作為輪軸、車架接點、前叉與安裝點的唯一資料來源；`bike-model.js` 僅負責把幾何資料轉成網格。所有代表性網格加上 `componentRole`，測試同時檢查幾何比例、空間位置及最近 `partId`，瀏覽器再驗證實際畫面與指標點選。

**Tech Stack:** HTML、CSS、Vanilla JavaScript、three.js 0.180.0、原生 ES Modules、Node.js 內建 `node:test`。

**Spec:** `docs/superpowers/specs/2026-08-30-road-bike-geometry-design.md`

## Global Constraints

- 不使用 React、Angular、Vue、TypeScript、後端服務或大型遊戲引擎。
- 模型使用程式化 three.js 幾何，不新增未授權外部模型或品牌標誌。
- 所有新行為先寫失敗測試，確認預期失敗後才修改正式程式碼。
- 維持既有 `BikeModel = { root, selectable, update, selectPart, dispose }` 公開介面。
- 桌機與行動觸控版面均須可用，且 GitHub Pages 的相對路徑不可改壞。
- 中文文件、註解與 UI 文案使用臺灣用語。

---

## 檔案結構

- Create: `src/scene/bike-geometry.js` — 純資料幾何、角度與線段內插工具。
- Modify: `src/scene/bike-model.js` — 依幾何資料建立車架、輪組、煞車、傳動與接觸點。
- Modify: `tests/scene-contract.test.js` — 幾何範圍、角色／零件對應與附著位置回歸測試。
- Modify: `README.md` — 更新模型精度與已知限制。
- Modify: `docs/TEST-PLAN.md` — 加入側視輪廓與零件點選驗收清單。

---

### Task 1: 建立可測試的公路車幾何資料

**Files:**
- Create: `src/scene/bike-geometry.js`
- Modify: `tests/scene-contract.test.js`

**Interfaces:**
- Produces: `getBikeGeometry(frame: 'race'|'aero'|'endurance'): BikeGeometry`
- Produces: `pointOnSegment(start: Point2, end: Point2, t: number): Point2`
- `BikeGeometry = { wheelRadius, rearAxle, frontAxle, bottomBracket, seatTop, headTop, headBottom, forkCrown, rearBrakeMount, frontBrakeMount, tubeScale }`

- [ ] **Step 1: 寫入幾何比例失敗測試**

```js
import { getBikeGeometry } from '../src/scene/bike-geometry.js';

test('三種車架維持真實公路車比例', () => {
  for (const frame of ['race', 'aero', 'endurance']) {
    const geometry = getBikeGeometry(frame);
    const wheelDiameter = geometry.wheelRadius * 2;
    const wheelbase = geometry.frontAxle[0] - geometry.rearAxle[0];
    const bbDrop = geometry.rearAxle[1] - geometry.bottomBracket[1];
    const headLength = Math.hypot(
      geometry.headTop[0] - geometry.headBottom[0],
      geometry.headTop[1] - geometry.headBottom[1],
    );
    assert.ok(wheelbase / wheelDiameter >= 1.48 && wheelbase / wheelDiameter <= 1.62);
    assert.ok(bbDrop >= 0.16 && bbDrop <= 0.22);
    assert.ok(headLength / wheelDiameter >= 0.18 && headLength / wheelDiameter <= 0.28);
  }
});
```

- [ ] **Step 2: 執行測試並確認因 `bike-geometry.js` 不存在而失敗**

Run: `node --test tests/scene-contract.test.js`

Expected: FAIL，錯誤包含找不到 `src/scene/bike-geometry.js`。

- [ ] **Step 3: 實作固定拓樸與三種合理變體**

```js
const BASE = Object.freeze({
  wheelRadius: 0.82,
  rearAxle: [-1.23, 0.84],
  frontAxle: [1.27, 0.84],
  bottomBracket: [-0.27, 0.66],
});

export function getBikeGeometry(frame = 'race') {
  const variant = FRAME_VARIANTS[frame] ?? FRAME_VARIANTS.race;
  return structuredClone({ ...BASE, ...variant });
}
```

`race` 使用 `seatTop [-0.64, 1.94]`、`headTop [0.81, 2.02]`、`headBottom [0.92, 1.66]`；其餘變體只在約 0.12 範圍內調整 stack／reach，前後輪軸不變。

- [ ] **Step 4: 執行幾何測試並確認通過**

Run: `node --test tests/scene-contract.test.js`

Expected: PASS，三種車架的輪距、五通下沉、座管角、頭管角及頭管長度均在指定範圍。

- [ ] **Step 5: 提交純幾何里程碑**

```powershell
git add src/scene/bike-geometry.js tests/scene-contract.test.js docs/superpowers
git commit -m "fix: 建立真實公路車幾何基準"
```

---

### Task 2: 重建雙三角車架、前叉與輪組比例

**Files:**
- Modify: `src/scene/bike-model.js`
- Modify: `tests/scene-contract.test.js`

**Interfaces:**
- Consumes: `getBikeGeometry(frame)`。
- Produces: `userData.componentRole: string`，由代表性群組或網格提供。
- 保留 `createBikeModel(THREE, config)` 公開介面。

- [ ] **Step 1: 寫入角色與空間位置失敗測試**

```js
const EXPECTED_PART_BY_ROLE = {
  'frame-head-tube': 'frame',
  'frame-seat-tube': 'frame',
  'frame-chainstay-left': 'frame',
  'frame-seatstay-left': 'frame',
  'top-tube': 'topTube',
  'down-tube': 'downTube',
  'fork-blade-left': 'fork',
  'wheel-front-tire': 'wheelset',
};

test('車架代表網格映射到正確零件說明', () => {
  const bike = createBikeModel(THREE, DEFAULT_CONFIG);
  for (const [role, partId] of Object.entries(EXPECTED_PART_BY_ROLE)) {
    const object = findRole(bike.root, role);
    assert.ok(object, `${role} 必須存在`);
    assert.equal(nearestPartId(object), partId);
  }
  bike.dispose();
});
```

- [ ] **Step 2: 執行測試並確認頭管／叉腳角色不存在而失敗**

Run: `node --test tests/scene-contract.test.js`

Expected: FAIL，第一個缺少角色為 `frame-head-tube`。

- [ ] **Step 3: 依唯一幾何來源重建車架**

`buildFrame` 以 `geometry.rearAxle`、`bottomBracket`、`seatTop`、`headTop`、`headBottom` 建立座管、頭管、左右後上叉、左右後下叉、五通殼、上管與下管。頭管只加入 `frame`；`fork` 只加入前叉冠與左右叉腳。所有車管半徑降至輪徑的合理視覺比例，空力型只能增加管徑，不能改變雙三角拓樸。

- [ ] **Step 4: 重建輪組並以角色標記前後輪胎、輪框、輻條與花鼓**

`createWheel` 改接收輪軸座標，不再讀取 `REAR_X`、`FRONT_X`、`AXLE_Y` 全域常數；保留低框、刀輪、後板輪互斥行為。

- [ ] **Step 5: 執行場景測試並確認車架角色與既有選項通過**

Run: `node --test tests/scene-contract.test.js`

Expected: PASS，頭管歸 `frame`、叉腳歸 `fork`，輪組與煞車互斥測試仍通過。

- [ ] **Step 6: 提交車架里程碑**

```powershell
git add src/scene/bike-model.js tests/scene-contract.test.js
git commit -m "fix: 重建公路車架與前叉比例"
```

---

### Task 3: 對齊煞車、傳動、座艙與水壺架安裝點

**Files:**
- Modify: `src/scene/bike-model.js`
- Modify: `tests/scene-contract.test.js`

**Interfaces:**
- Consumes: `BikeGeometry.rearBrakeMount`, `frontBrakeMount`, `forkCrown` 與下管線段。
- Produces roles: `brake-front-caliper`、`brake-rear-caliper`、`crankset-chainring`、`cassette-cog`、`drivetrain-rear-derailleur`、`cockpit-stem`、`bar-tape-left`、`seatpost`、`saddle-shell`、`bottle-cage-rail`。

- [ ] **Step 1: 寫入其餘零件角色與附著位置失敗測試**

```js
test('煞車與水壺架位於對應安裝區域', () => {
  const bike = createBikeModel(THREE, { ...DEFAULT_CONFIG, brake: 'caliper' });
  const geometry = getBikeGeometry('race');
  assertNearRole(findRole(bike.root, 'brake-front-caliper'), geometry.frontBrakeMount, 0.18);
  assertNearRole(findRole(bike.root, 'brake-rear-caliper'), geometry.rearBrakeMount, 0.18);
  assertRoleNearSegment(findRole(bike.root, 'bottle-cage-rail'), geometry.headBottom, geometry.bottomBracket, 0.24);
  bike.dispose();
});
```

- [ ] **Step 2: 執行測試並確認固定座標模型未提供角色而失敗**

Run: `node --test tests/scene-contract.test.js`

Expected: FAIL，煞車或水壺架角色不存在。

- [ ] **Step 3: 將煞車與傳動改由幾何安裝點衍生**

碟盤維持在輪轂中心；碟煞卡鉗貼近前叉腳與左後上叉。C 夾煞分別置於前叉冠與後上叉橋。飛輪、後變速器、鏈條使用後輪軸與五通；機械線管從座艙、下管至後變速器，不再使用舊車架固定座標。

- [ ] **Step 4: 將座艙、座管、座墊與水壺架改由車架點位衍生**

座艙從頭管頂端延伸，座管沿座管軸線延伸；水壺架中心使用 `pointOnSegment(headBottom, bottomBracket, 0.55)`，兩側軌道保持貼近下管，不得漂浮至主三角中央。

- [ ] **Step 5: 執行場景與完整測試**

Run: `npm test`

Expected: PASS，全部測試通過且無警告／未處理錯誤。

- [ ] **Step 6: 提交安裝點里程碑**

```powershell
git add src/scene/bike-model.js tests/scene-contract.test.js
git commit -m "fix: 對齊公路車零件安裝位置"
```

---

### Task 4: 瀏覽器驗收、文件與部署

**Files:**
- Modify: `README.md`
- Modify: `docs/TEST-PLAN.md`

**Interfaces:**
- Consumes: 靜態網站 `http://127.0.0.1:4173/` 與正式網站 `https://andychung0214.github.io/velo-atelier/`。

- [ ] **Step 1: 更新文件中的模型精度與手動驗收清單**

README 說明模型依真實公路車比例重建但不代表特定品牌工程圖；測試計畫加入側視輪廓、三分之四視角、三種車架、兩種煞車與主要零件點選標題清單。

- [ ] **Step 2: 執行完整驗證**

Run: `npm run verify`

Expected: 全部測試通過、0 failures。

- [ ] **Step 3: 啟動靜態伺服器並驗證桌機與行動版**

Run: `npm start`

Expected: 1440×900 側視與三分之四視角輪廓正常；390×844 可旋轉、縮放與點選，控制台無錯誤。

- [ ] **Step 4: 驗證代表性零件的實際點選**

依序點選頭管、上管、下管、前叉腳、前輪、前煞車、曲柄、飛輪、後變速器、座墊、座管、把手帶與水壺架；說明標題必須與實體一致。

- [ ] **Step 5: 執行程式碼審查並修正重要問題**

使用 `superpowers:requesting-code-review` 檢查規格覆蓋、幾何回歸、資源釋放與既有互動；修正 Critical／Important 問題後重跑 `npm run verify`。

- [ ] **Step 6: 完成分支並準備推送**

```powershell
git add README.md docs/TEST-PLAN.md
git commit -m "docs: 補充公路車模型驗收方式"
git status --short --branch
git log --oneline origin/main..HEAD
```

推送前向使用者顯示 remote、branch 與 commit；合回 `main` 後推送 `origin/main`，最後實際開啟 GitHub Pages 核對新模型。
