# NTUST 智慧製造 AI Agent Lab — 官網 Redesign v2

國立臺灣科技大學智慧製造 AI Agent Lab 實驗室官網的第二版重新設計。相較於初版（Astro 架構的傳統多頁網站），這版改走「單頁互動式技術簡報」的方向：用可捲動的敘事線，把實驗室的閉環智慧製造研究，做成一個會動的 3D 產線展示。

## 設計方向

整體視覺套用的是一套自訂的 **Industry 設計系統**——工程藍圖 / wireframe 美學：

- **色彩**：淺灰技術感底色（`#f2f2f3`）配單一鋼藍色主色（`#5980a6`），每個色彩角色都用 OKLCH 產生 100–900 的色階，確保同一階數在不同色彩上視覺重量一致。刻意只用一個強調色，不做多彩裝飾。
- **字體**：標題用 Barlow Condensed（壓縮體，工程感），內文用 Barlow，中文字則搭 Noto Sans TC，三者透過 `--font-heading` / `--font-body` token 統一管理。
- **卡片與圖框**：不用圓角、不用實色底——卡片、圖片、主要按鈕都畫成「藍圖物件」：直角、細線邊框，四角加上 `+` 十字校準記號（`.blueprint` class）。這是整套設計語言裡最明顯的識別特徵。
- **圖像處理**：所有照片統一套用 `.duotone`，去飽和後染上主色，呈現絹印藍圖感，而不是一般網站常見的全彩照片牆。
- **圖示**：Lucide icon set，統一 1.5px 線寬，維持工程製圖的細線調性。
- **互動狀態**：不用瀏覽器預設樣式——hover / pressed 都吃色階漸層，鍵盤 focus 用 2px 主色外框（`:focus-visible`），而不是預設藍框。

這套系統被封裝成獨立的 design token + component 套件放在 [`_ds/`](_ds/)，理論上可以套用到其他頁面或未來的子站，不用每次重新定義色彩／字體／間距。

## 頁面敘事與互動設計

主頁（[`Lab Site v3.dc.html`](Lab%20Site%20v3.dc.html)）是一鏡到底的捲動敘事，用 GSAP + ScrollTrigger 驅動：

1. **Hero** — 一個會走路的火柴人角色，隨捲動觸發跳躍／翻滾／揮手等動作（`#stick` 系列 CSS keyframes + JS 狀態機），把「有人在做研究」這件事具象化，取代制式的標題+副標排版。
2. **閉環智慧製造 3D 產線**（`#lineCanvas` / `#worldBox`）— 用 Three.js 現場建出一條產線模型：振動感測、視覺站、排程牆、PLC 機櫃、機械手臂、SPC 看板、環形輸送帶、控制室、地板九個工站，每個工站對應實驗室的一篇論文／技術（資料與模型分離：幾何在 [`line-model.js`](line-model.js)，站點文案在 [`line-stations.json`](line-stations.json)，方便之後只改文字不動 3D 模型）。捲動到對應區塊時鏡頭與標籤會連動。
3. **研究圖譜**（`#graphsvg`）— 論文以節點圖（force-graph 風格）呈現，用色彩分類研究主題，可切換圖表 / 列表兩種檢視模式。
4. **團隊、技術重點、聯絡方式**（`#teamWrap` / `#g-tech` / `#g-contact`）— 沿用同一套藍圖卡片語彙，聯絡區塊嵌入地圖。
5. **雙語切換** — 用 `data-lang="zh|en"` 搭配 `.l-zh` / `.l-en` class 做顯示切換，不重新載頁。

整體是把「實驗室做什麼」從條列式介紹，改成用一條可以捲動探索的產線動線去講故事，3D 場景是整版設計的核心錨點。

## 檔案結構

```
Lab Site v3.dc.html      主頁（目前版本，內容最完整）
Lab Site v2.dc.html      上一版（保留供比對，功能較陽春）
Production Line 3D.html  3D 產線模型的獨立開發／檢測頁（含 OBJ / GLTF 匯出）
line-model.js            3D 產線的幾何建模（各設備一個具名函式）
line-stations.json       9 個工站的中英文文案與對應論文
support.js               頁面執行期（dc-runtime 編譯輸出，不要手動改）
three-d-stage.js         <three-d-stage> 3D 檢視器元件（含 orbit controls、匯出）
_ds/                      Industry 設計系統（token、component 樣式、使用說明）
screens/                  設計過程的截圖／版本快照
uploads/                  設計素材與參考圖片
```

## 技術棧

- 無建置工具、無框架安裝——純靜態檔案，直接開瀏覽器（或部署到任何靜態主機／GitHub Pages）
- **GSAP 3.12.5 + ScrollTrigger**（CDN）：捲動動畫
- **Three.js 0.184**（CDN，透過 import map）：3D 產線模型與檢視器
- **Google Fonts**：Barlow / Barlow Condensed / Noto Sans TC
- 頁面本體用一種自訂的宣告式模板語法（`{{ 變數 }}` 綁定、`x-dc` 自訂元素），由 `support.js`（dc-runtime）在瀏覽器端解讀渲染——這是從一個 AI 網站產生平台匯出的快照

## ⚠️ 已知限制

`Lab Site v3.dc.html` 用到的模板語法（`{{ campusLink }}`、`{{ stations }}` 等）需要 `window.React` / `window.ReactDOM` 已存在於頁面環境中才能被 `support.js` 解讀渲染，但匯出的檔案本身**沒有**附上 React／ReactDOM 的載入。也就是說直接雙擊開啟、或部署到 GitHub Pages 之類的純靜態環境，畫面可能無法完整渲染（部分互動或資料綁定會是空的）。若要獨立部署，需要額外補上 React/ReactDOM 的 CDN script，或是回到原始建置平台重新匯出一份「完全靜態」版本。`Production Line 3D.html` 因為是純 Three.js + 原生 JS 寫的獨立頁面，不受此限制，可以直接開啟使用。

## 版本說明

- **v3**：目前主要版本，內容與互動最完整
- **v2**：較早的迭代，保留作為設計演進的紀錄
- **Production Line 3D.html**：3D 產線模型的開發／除錯用獨立頁面，用來單獨檢視、調整、匯出模型，不是給訪客看的正式頁面
