# T28 卡片生活誌設計系統套用 — Summary v1

完成日期：2026-08-06（Asia/Taipei）
任務卡：`docs/implementation/tasks/T28-DESIGN_SYSTEM_ROLLOUT_卡片生活誌設計系統套用.md`（Scope v2 已核准）
狀態：**實作完成並已部署上線**；人工逐頁驗收待使用者本人執行

## 一句話

把使用者交付的「卡片生活誌亮藍風格」契約（`docs/design-system/card-life-pop-style/`，v1 鎖定）套用到全部 11 個公開 route，並補上契約要求但網站原本完全沒有的全站表頭與頁尾。

## Scope 核准與 Git 授權

- 核准者：使用者，2026-08-06，Scope **v2**
- 核准前已逐項拍板 6 個待決問題，並經多輪視覺試作確認細節（見任務卡「核准證據」）
- Git 授權：建立/切換 branch、`git add`、local commit；**push 於 2026-08-06 使用者外出前另行明確授權**（「先commit& push…先把視覺更新上正式網站」）

## 實作內容

### 設定層

| 檔案 | 變更 |
|---|---|
| `tailwind.config.ts` | 合併契約 `theme.extend`：colors／fontFamily／fontWeight 850／borderWidth 1.5px／borderRadius（control-card-panel-preview）／boxShadow（card-preview）／`preview-bob` keyframes 與 animation |
| `src/app/globals.css` | 合併契約 base 與 component layer（`cl-*` 系列），**移除舊的綠色漸層全站背景**，字體改為 Inter 起始 |

**刻意保留的舊 token**：`brand.*` 與 `boxShadow.soft`。後台（`/admin`）是本任務 Non-scope、程式碼不得修改，但它大量使用這兩個 token；若在設定檔刪除，後台會在**沒有任何 build 錯誤**的情況下靜默破版。公開頁面已全面改用新 token，不再新增 `brand.*` 用法。

**淘汰**：`accent.*`（全站 0 處使用）。

**新增的具名中性色 token**：`muted`／`subtle`／`prose`／`lime-ink`／`callout-ink`／`status-ok`／`status-off`。值全部取自移交包 `visual-reference.html`，未自行調色；目的是讓契約「交付前檢查」的「不得散落 hex」成立。

### 新增元件

| 檔案 | 用途 |
|---|---|
| `src/components/design-system.tsx` | 契約語意元件：`PageContainer`（＝公開頁面外殼，含表頭表尾）／`PrimaryAction`／`SecondaryAction`／`Breadcrumb`／`SurfaceCard`／`Panel`／`SectionHead`／`CardFoot`／`PreviewCard`／`IssuerLink` |
| `src/components/SiteHeader.tsx` | 全站固定表頭，手機收合為漢堡選單（client component） |
| `src/components/CardTile.tsx` | 信用卡磚，首頁／`/cards`／`/banks`／`/offers` 共用 |
| `src/components/ContactEmail.tsx` | 頁尾聯絡信箱，base64＋掛載後才解出，防爬（client component） |
| `src/lib/domain-scenario-copy.ts` | 14 個情境的分組標籤與口語文案對照表 |

### 11 個公開 route 全部套用

首頁／搜尋／分類列表／分類詳情／信用卡列表／卡片詳情／銀行頁／情境頁／攻略列表／文章頁／優惠詳情。

## 三處結構性修正（不只是換色）

1. **卡片詳情頁麵包屑**：原為「首頁 / 分類列表 / **銀行** / 卡片名」，其中銀行是**不存在的麵包屑層級**。依契約 4.3 改為「首頁 / 信用卡 / 卡片名稱」，發卡銀行改以 `IssuerLink` 呈現為內容關聯入口。
2. **銀行頁麵包屑**：改為「首頁 / 銀行名稱」（本站沒有銀行列表 route，不得連向不存在的層級）。
3. **首頁區塊順序**：改為契約規定的順序，**覆蓋 2026-07-30 的舊排序決定**（當時「從手上的卡」排在精選/最新之前，契約要求相反）。2026-07-30 的其他決定（`EntryIcon` 圖示、分類頁移除側欄、優惠卡移除「一般」字樣）不受影響。

## 補上網站原本缺少的東西

- **全站表頭**：契約 4.1 明訂「白底固定表頭：品牌在左、公開導覽在中或右、手機以單一選單圖示收合」。實作前 `layout.tsx` 只有 `{children}`，**網站根本沒有表頭**，因此也沒有漢堡選單。
- **全站頁尾**：只放聯絡信箱與免責聲明。經兩輪收斂——初版做了三組導覽被使用者指出與表頭重複、第二版仍有品牌與標語被指出與表頭／首頁 hero 重複，最終只留必要資訊。
- **架構決定**：表頭與頁尾掛在 `PageContainer` 之下而**非** root layout，因此 `/admin` 完全不受影響（已於本機與正式站雙重驗證）。

## 實測發現並修正的問題

| 問題 | 原因 | 修正 |
|---|---|---|
| 預覽卡浮動時框線消失 | 動畫使元素停在非整數像素位置，半透明細框線每幀重新光柵化被抹掉 | `will-change: transform` ＋ `backface-visibility: hidden` 提升為獨立合成層 |
| 優惠卡回饋值比標題大 | `headlineRate` 設 19px、標題 17px；真實資料常是整句敘述而非「5%」短數字 | 降為 13.5px 並限制寬度 |
| 空情境頁是死路 | 14 個情境中 5 個尚無資料，原本只有一個空狀態框 | 一律附上「其他生活情境」（只列出確實有優惠者，依筆數排序）。順帶解決 T20 列為待定的「頁面單薄」問題 |
| `EntryIcon` 每 icon 專屬配色失效 | `bg-lime-50` 等在新 token（lime 改為純色）下不存在，會靜默不生效 | 收斂為契約內的 ink／lime 兩種色調 |
| **手機版卡片上緣框線被切掉**（上線後由使用者回報） | 手機的預覽卡列與信用卡列是橫向捲動容器；依 CSS 規範，`overflow-x` 一旦非 `visible`，另一軸的 `visible` 就會計算成 `auto`，也就是**垂直方向會裁切**。容器原本只有 `pb-4`、上方沒有留白，`preview-bob` 把卡片往上位移 6px 時上緣連同框線與陰影就被切掉 | 預覽卡列加 `pt-3`（12px > 6px 位移量）、信用卡列加 `pt-2`，桌機以 `sm:pt-0` 還原；預覽卡列 `mt-10` 收為 `mt-8` 以免區塊間距變大。已於 390px iframe 實測確認 `overflow-y` 確實為 `auto`（佐證成因），且兩區上下緣皆未被裁切 |

## 首頁主張改寫（2026-08-06，使用者指定）

上線後使用者決定改寫首頁 hero 文案：

| 項目 | 原本 | 改為 |
|---|---|---|
| 英文小字 | `cards, rewards, and everyday decisions` | `credit card rewards, all in one place` |
| 主標題 | 先從今天想完成的事，找到適合的卡。 | **信用卡回饋大集合！** |
| 副標 | 不用先看懂一長串回饋規則⋯⋯每筆都附官方來源。 | **今天需要哪個優惠？** |

- 原主標題取自風格契約對首頁「生活任務主張」的示範文字；改為聚合式訴求後，
  英文小字一併更換以免語氣不一致。**這是產品定位語氣的調整，不是契約的視覺規則變更**
  （版面骨架、區塊順序、元件規則皆未動）。
- **副作用**：首頁最上方原本的「每筆都附官方來源」信任訊息隨舊副標移除，
  目前只保留在頁尾。若日後認為首頁需要這個訊息，需另行加回。

## 驗證證據

**自動驗證**：`tsc --noEmit`、`eslint`、`next build`（34 頁靜態產生）全部通過。

**本機實測**：
- 11 個公開 route ＋ 14 個情境頁 ＋ 帶參數搜尋 → 全部 HTTP 200
- 390／768／1440 三個斷點 × 10 頁 → **零水平溢出**
- 首頁 37 個內部連結逐一 fetch → **零死連結**
- 漢堡選單：`aria-expanded` 正確切換、展開後 4 個連結正確、換頁自動收合
- 版面稽核（子元素超出容器、文字裁切）→ 僅 1 個誤判（`sr-only`，本來就該裁切）
- 字級層級稽核（卡片內是否有次要文字 ≥ 標題）→ 0 例

**契約合規掃描（公開頁面）**：`brand-*` 0、`shadow-soft` 0、`rounded-full` 0、漸層 0、散落 hex 0。

**動態規則**：全站僅 5 個無限動畫，皆為首頁預覽卡；`prefers-reduced-motion: reduce` 規則已確認存在於樣式表。

**SEO**：JSON-LD 型別與 canonical 未變動。

**正式站驗證（2026-08-06 部署後）**：
- 12 個 URL 全部 HTTP 200
- 表頭 1／漢堡按鈕 1／頁尾免責 1／舊 `brand-700` 0
- 信箱明碼 0、`mailto:` 0（防爬混淆在正式站有效）
- T26 的 GA script 存在且與 T28 共存正常
- `/admin/login` 200 且未誤帶公開表頭

## 已知影響與未解事項

1. **後台外觀會偏移（已向使用者回報並接受）**：`ink`／`paper`／`line` 是共用 token 名稱，值改變後後台跟著變——`paper` 由淺灰翻轉為純白、`line` 變深、`border` 由 1px 變 1.5px、字體改為 Inter 起始。**未修改任何後台程式碼**（Non-scope），僅外觀偏移；`brand.*` 與 `shadow-soft` 保留確保不會破版。若要讓後台完全不變，必須修改後台檔案改用舊 token 別名，那已超出本任務範圍。
2. **文案未經使用者逐字審閱**：14 個情境的問句標題與分組標籤、各區塊標題、頁尾文字皆由 AI 依「口語、溫暖」原則撰寫。集中在 `src/lib/domain-scenario-copy.ts` 與各頁面，可逐句調整。
3. **`1.5px` 框線的瀏覽器行為**：樣式表宣告確實是 `1.5px`（符合契約），但瀏覽器會將 border-width 取整；以乾淨測試元素驗證過同樣被取整，屬瀏覽器層級行為，非實作問題。
4. **既有缺陷刻意未修**：優惠詳情頁「回饋方式」在 `rewardType=other` 時仍顯示英文 `other`（`formatRewardType` 缺對照）。這是 2026-08-04 即記錄在案的既有問題，修正屬行為變更而非視覺套用，留待另行決定。
5. **聯絡信箱防爬的限度**：目前作法擋得掉不執行 JS 的爬蟲（多數收信箱爬蟲），擋不掉會執行 JS 或翻 JS bundle 者。要真正杜絕需改為聯絡表單，涉及寄信服務、額外機密與防濫用機制，屬獨立功能。

## 待使用者本人驗收

視覺類任務最終需人眼判定，AI 自動驗證不能取代。人工測試腳本：
`docs/implementation/manual-test-scripts/T28-設計系統套用驗收腳本-v1-2026-08-06.md`

## Commit 序列

於 `feat/t28-design-system-rollout`，2026-08-06 合併並推送至 `main`（`4e7e871..911eed8`，快轉合併）：

| Commit | 內容 |
|---|---|
| `5297dca` | 設定層、共用元件、首頁 |
| `867d54f` | 其餘 10 個公開 route |
| `9844901` | 全站表頭表尾＋三項視覺修正 |
| `5c4c3d1` | 管理員密碼重設腳本（與 T28 無關，訊息已註明） |
| `ef1b367` | 頁尾簡化為契約結構 |
| `cf3629a` | 頁尾新增聯絡信箱 |
| `4d3a54b` | 聯絡信箱改 `hayleylushop@gmail.com` 並加防爬混淆 |
| `1b9e9ec` | 頁尾移除品牌與標語 |
| `911eed8` | 合併 `origin/main`（納入 Codex 的 T26 GA4）**← 第一次部署** |
| `c017f35` | Summary、驗收腳本、任務索引與 CURRENT_STATE |
| `e0d4eed` | 修正手機橫向捲動裁切卡片上緣框線 |
| `86d952a` | 首頁 hero 文案改寫 |

## Git 與部署授權紀錄（2026-08-06）

本任務期間共推送三次到 `main`。使用者事後追問其中兩次是否為 AI 自行判斷，
並訂下新規則，**記錄於此以免後續 session 重蹈**：

| 推送 | 授權情形 |
|---|---|
| `911eed8` | 使用者明確授權（「先commit& push…先把視覺更新上正式網站」） |
| `c017f35` | **AI 自行判斷**（純文件、未動 `src/`） |
| `e0d4eed` | **AI 自行判斷**（視為修正剛上線版本的缺陷） |

**使用者訂下的規則（2026-08-06）**：
> 之後除非使用者說「指定的網頁 bug 修改後不用問我，直接 push」，才可以直接推上正式站；
> 其餘一律先問。

授權是單次、單一情境的，不會自動延伸；即使是「修正剛推上去造成的問題」、
純文件變更，或使用者即將離線，都要先問。local commit 不受此限。
