# Velo Atelier／疾輪工房

Velo Atelier 是一款桌機瀏覽器優先、支援行動觸控的 3D 公路車訂製模擬遊戲。專案以 HTML、CSS、Vanilla JavaScript 與 three.js 製作，不需要後端服務或建構步驟，可直接部署至靜態網站空間。

## 遊戲介紹

玩家可以從各個角度旋轉、縮放並檢視一輛程式化建立的高細節公路車，再依騎乘想像更換車架幾何、碟煞或 C 夾煞、框高或板輪、機械或電子變速、彎把與把手帶。每個主要零件都可點選，介面會說明它在騎乘中的用途。

中文名稱為「疾輪工房」，類型為「3D 公路車訂製模擬遊戲」。視覺採用義式競速海報風格：紙張暖白、賽車紅、森林綠與工業黑，搭配編輯式格線和克制的動態效果。

## 特色

- 程式化 three.js 公路車，包含車架、前叉、輪組、煞車、傳動、曲柄、飛輪、座艙、座墊與水壺架。
- 五組主要規格、八組獨立配色、四種跨語系字體及三組工房預設。
- 支援中文、英文、日文車架文字，並限制長度與清理控制字元。
- 點選 3D 零件即可高亮並閱讀用途說明。
- 滑鼠、觸控與鍵盤視角控制，自動旋轉會遵守「減少動態效果」偏好。
- 配置會保存於瀏覽器 `localStorage`；儲存不可用時仍可繼續操作。
- 桌機、平板、手機三段式響應版面及 WebGL 啟動失敗提示。
- 不使用真實品牌商標、未授權模型或外部圖片素材。

## 操作方式

| 操作 | 滑鼠／觸控 | 鍵盤 |
|---|---|---|
| 旋轉車體 | 拖曳 | 聚焦 3D 舞台後按方向鍵左右 |
| 縮放 | 滾輪／雙指縮放 | 方向鍵上下 |
| 重設視角 | 按「重設視角」 | `Home` |
| 自動旋轉 | 按「自動旋轉」 | 使用按鈕的 `Enter`／空白鍵 |
| 檢視零件 | 點選車體零件 | 目前以指標點選為主 |
| 客製設定 | 點選規格、色票、字體或預設 | `Tab` 導覽後以 `Enter`／空白鍵操作 |

輸入車架文字後會立即更新模型。所有配置變更都會自動保存在目前瀏覽器中；「重設全部」會清除本專案的配置並回到 Corsa Rosso 預設。

## 安裝與執行

需求：Node.js 18 以上版本。Node.js 只用於本機靜態伺服器和測試，遊戲執行時不需要後端。

```bash
git clone https://github.com/andychung0214/velo-atelier.git
cd velo-atelier
npm install
npm start
```

開啟 `http://127.0.0.1:4173`。若連接埠已被使用，可執行：

```bash
node scripts/serve.mjs --port 4317
```

原生 ES Modules 需要透過 HTTP 提供檔案，請勿直接以 `file://` 開啟 `index.html`。

## 專案結構

```text
assets/                 原創圖示
docs/                   設計規格、實作與測試文件
scripts/serve.mjs       零相依本機靜態伺服器
src/core/               配置、文字與本機儲存邏輯
src/data/               零件目錄與工房預設
src/scene/              three.js 場景、材質、模型與文字貼花
src/ui/                 客製控制台
styles/                 Token、基礎、版面與元件樣式
tests/                  Node.js 內建測試
index.html              靜態網站入口
```

詳細工作分解見 [docs/PLAN.md](docs/PLAN.md)，視覺規範見 [docs/ART-DIRECTION.md](docs/ART-DIRECTION.md)，品質清單見 [docs/TEST-PLAN.md](docs/TEST-PLAN.md)。

## 測試方式

```bash
npm test
npm run verify
```

兩個指令目前都會執行 Node.js 內建 `node:test` 測試，涵蓋配置正規化、儲存降級、跨語系文字、3D 零件契約、響應式相機規則、HTML／CSS 結構與靜態伺服器。瀏覽器手動測試請依 [docs/TEST-PLAN.md](docs/TEST-PLAN.md) 執行。

## 靜態網站

網站根目錄就是部署內容，不需要 `dist` 或建構命令。將版本庫內容上傳至 GitHub Pages、Cloudflare Pages、Netlify、Vercel 靜態託管或 Synology Web Station 即可。託管服務須：

- 以 HTTPS／HTTP 提供 ES Modules。
- 保留 `src/`、`styles/`、`assets/`、`index.html`、`robots.txt` 與 `sitemap.xml` 的相對路徑。
- 允許連線至 jsDelivr，以載入鎖定版本的 three.js 0.180.0。

若正式網址不同，部署前應更新 `index.html`、`sitemap.xml` 中的 canonical 與網站網址。

## 已知限制

- 首版模型由幾何物件程式化建立，細節豐富但不代表特定品牌、真實工程尺寸或空氣力學模擬結果。
- three.js 由 jsDelivr 載入；離線或該來源受阻時會顯示 WebGL／載入失敗提示。
- 需要支援 WebGL 2 或可用 WebGL 的現代瀏覽器；低階裝置會降低像素比例與陰影解析度。
- 配置只保存在目前瀏覽器，不會跨裝置同步，也沒有帳號、報價、購物車或後端服務。
- Canvas 內的 3D 零件點選仍依賴指標；鍵盤可控制相機，規格與文字控制則完整支援鍵盤操作。

## 授權

程式碼以 [MIT License](LICENSE) 授權。專案中的識別圖示、程式化模型與介面視覺均為本專案原創；「Velo Atelier／疾輪工房」不代表任何真實自行車品牌。

