# NTUST 智慧製造 AI Agent Lab — 官網 Redesign v2

國立臺灣科技大學智慧製造 AI Agent Lab 實驗室官網的第二版重新設計。相較於初版（Astro 架構的傳統多頁網站），這版改走「單頁互動式技術簡報」的方向：用可捲動的敘事線，把實驗室的閉環智慧製造研究，做成一個會動的 3D 產線展示。

## 設計方向

整體視覺套用的是一套自訂的 **Industry 設計系統**——工程藍圖 / wireframe 美學：

- **色彩**：淺灰技術感底色（`#f2f2f3`）配單一鋼藍色主色（`#5980a6`），每個色彩角色都用 OKLCH 產生 100–900 的色階，確保同一階數在不同色彩上視覺重量一致。刻意只用一個強調色，不做多彩裝飾。
- **字體**：標題用 Barlow Condensed（壓縮體，工程感），內文用 Barlow，中文字則搭 Noto Sans TC，三者透過 `--font-heading` / `--font-body` token 統一管理。
- **卡片與圖框**：不用圓角、不用實色底——卡片、圖片、主要按鈕都畫成「藍圖物件」：直角、細線邊框，四角加上 `+` 十字校準記號（`.blueprint` class）。這是整套設計語言裡最明顯的識別特徵。
- **圖像處理**：人像與活動照片保留原色（照片牆刻意不做染色，以真實紀錄為主），其餘裝飾性圖框沿用藍圖線稿語彙。
- **圖示**：Lucide icon set，統一 1.5px 線寬，維持工程製圖的細線調性。
- **互動狀態**：不用瀏覽器預設樣式——hover / pressed 都吃色階漸層，鍵盤 focus 用 2px 主色外框（`:focus-visible`），而不是預設藍框。

這套系統被封裝成獨立的 design token + component 套件放在 [`_ds/`](_ds/)，理論上可以套用到其他頁面或未來的子站，不用每次重新定義色彩／字體／間距。

## 頁面敘事與互動設計

主頁（[`Lab Site v3.dc.html`](Lab%20Site%20v3.dc.html)）是一鏡到底的捲動敘事：

1. **Hero** — 頁首換成實驗室標頭圖（`photos/head-banner.png`），捲動時 3D 產線由遠景逐步推近。
2. **閉環智慧製造 3D 產線**（`#lineCanvas` / `#worldBox`）— 用 Three.js 現場建出一條 U 形產線：感測、故障診斷、決策優化、製程控制、品質回饋、持續改善六座工站，加上環形輸送帶、機械手臂、控制室與地板。幾何在 [`line-model.js`](line-model.js)，站點文案在 [`line-stations.json`](line-stations.json)，改文字不用動 3D 模型。捲動到各站時鏡頭固定為同一個低角度取景，工站置於畫面右側，左側留給文字。
3. **研究圖譜**（`#graphsvg`）— 論文以節點圖呈現，依研究主題分類，可切換卡片 / 清單 / 關聯圖三種檢視。
4. **團隊、技術重點、聯絡方式**（`#teamWrap` / `#g-tech` / `#g-contact`）— 沿用同一套藍圖卡片語彙；碩士生可依入學學年（113 / 114 / 115）篩選，聯絡區塊嵌入地圖（已鎖定互動，避免誤點其他地點）。
5. **雙語切換** — 用 `data-lang="zh|en"` 搭配 `.l-zh` / `.l-en` class 做顯示切換，不重新載頁；論文標籤、作者分隔符號一併跟著語言變化。

整體是把「實驗室做什麼」從條列式介紹，改成用一條可以捲動探索的產線動線去講故事，3D 場景是整版設計的核心錨點。

## 檔案結構

```
index.html               入口（轉址到主頁）
Lab Site v3.dc.html      主頁（目前版本，內容最完整）
Lab Site v2.dc.html      上一版（保留供比對，功能較陽春）
Production Line 3D.html  3D 產線模型的獨立開發／檢測頁（含 OBJ / GLTF 匯出）
line-model.js            3D 產線的幾何建模（各設備一個具名函式）
line-stations.json       六座工站的中英文文案與對應論文
support.js               頁面執行期（dc-runtime 編譯輸出，不要手動改）
three-d-stage.js         <three-d-stage> 3D 檢視器元件（含 orbit controls、匯出）
photos/                  照片：教授、成員、實驗室現場與活動、導覽列標頭
_ds/                     Industry 設計系統（token、component 樣式、使用說明）
```

## 內容維護

- 論文、成員、學歷經歷、交通方式、照片輪播：`Lab Site v3.dc.html` 下半段的資料常數
  （`PAPERS`、`MEMBERS`、`EDU`、`EXP`、`TRANSIT`、`LAB_PHOTOS`）。
- 成員照片：`MEMBERS` 每筆的 `photo` 欄位指向 `photos/`；碩士生學年為 `yr`（113 / 114 / 115）。
- 工站文字：`line-stations.json`。
- 3D 幾何：`line-model.js`，每座設備一個具名函式，尺寸集中在函式頂端的 `D` 常數。

## 技術棧

- 無建置工具、無框架安裝——純靜態檔案，直接開瀏覽器（或部署到任何靜態主機／GitHub Pages）
- **GSAP 3.12.5 + ScrollTrigger**（CDN）：捲動動畫
- **Three.js 0.184**（CDN，透過 import map）：3D 產線模型與檢視器
- **Google Fonts**：Barlow / Barlow Condensed / Noto Sans TC
- 頁面本體用一種宣告式模板語法（`{{ 變數 }}` 綁定、`x-dc` 自訂元素），由 `support.js`（dc-runtime）在瀏覽器端解讀渲染

## ⚠️ 已知限制

`Lab Site v3.dc.html` 的模板語法需要 `window.React` / `window.ReactDOM` 已存在才能由 `support.js` 渲染，而匯出的檔案本身沒有附上 React／ReactDOM 的載入。直接雙擊開啟、或部署到純靜態環境時畫面可能無法完整渲染；獨立部署需額外補上 React/ReactDOM 的 CDN script。另外 3D 模型與設計系統以模組載入，需以 HTTP 伺服器開啟（例如 `python -m http.server 8000`），`file://` 直接開啟會失敗。`Production Line 3D.html` 是純 Three.js + 原生 JS 的獨立頁面，不受此限制。

## 版本說明

- **v3**：目前主要版本，內容與互動最完整
- **v2**：較早的迭代，保留作為設計演進的紀錄
- **Production Line 3D.html**：3D 產線模型的開發／除錯用獨立頁面，用來單獨檢視、調整、匯出模型，不是給訪客看的正式頁面
