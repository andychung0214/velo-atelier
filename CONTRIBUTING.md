# 貢獻指南

感謝協助改善 Velo Atelier／疾輪工房。請保持專案為純 HTML、CSS、Vanilla JavaScript 與 three.js 的靜態網站，不加入 React、Angular、Vue、TypeScript、後端服務或大型遊戲引擎。

## 開發流程

1. 由 `main` 建立 `feature/xxx`、`fix/xxx` 或 `chore/xxx` 分支。
2. 執行 `npm install` 與 `npm run verify`，確認基準狀態。
3. 功能或修正先加入會失敗的測試，再撰寫最小實作使測試通過。
4. 依 `docs/TEST-PLAN.md` 以桌機、平板與手機尺寸手動驗證。
5. 提交前執行 `git diff --check`、`npm run verify`，並檢查瀏覽器 console。

## 程式碼與內容規範

- 命名使用具語意的英文；中文文件、註解與 UI 採臺灣繁體中文。
- 使用原生 ES Modules，讓核心資料與配置邏輯可由 Node.js 測試。
- 3D 零件必須有穩定 `partId`、用途說明及可清理的幾何／材質資源。
- 互動控制必須提供鍵盤焦點、清楚標籤與減少動態效果支援。
- 不加入真實品牌 Logo、未授權模型、圖片、遠端字型或追蹤程式碼。
- 不讀取、提交或輸出 `.env`、token、憑證、私人金鑰與個人資料。

## Commit 訊息

採用 Conventional Commits，描述使用 zh-TW，例如：

```text
feat: 新增計時車把選項
fix: 修正手機初始視角裁切
test: 補強本機儲存降級測試
docs: 更新靜態部署說明
```

## Pull Request 檢查

- 說明需求、變更範圍與不在範圍內的項目。
- 附上自動測試輸出，以及適用尺寸的瀏覽器驗證證據。
- 視覺變更附桌機與手機截圖，並確認符合 `docs/ART-DIRECTION.md`。
- 列出已知限制、相容性影響與任何新增的外部來源。

