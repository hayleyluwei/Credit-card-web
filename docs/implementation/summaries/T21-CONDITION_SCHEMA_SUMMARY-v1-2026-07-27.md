# T21 優惠條件結構化（重構 Offer＋RewardTier／Channel）Summary

日期：2026-07-27（Asia/Taipei）
任務卡：`docs/implementation/tasks/T21-CONDITION_SCHEMA_優惠條件結構化規劃.md`（v1 已核准 2026-07-27）
任務狀態：**完成**（2026-07-27）

## 核准與方針

- 使用者 2026-07-27 正式核准 T21 Scope v1 並指示「直接動 schema」。
- 方案 B（重構 Offer，不新增 Promotion）、capPeriod/PaymentMethod 用 String、TierConditions 用 JSON 字串、巢狀限一層——皆為先前拍板決策。
- 扁平回饋欄位**最終移除**（使用者 2026-07-27 拍板）；為避免資料遺失，採「先擴張、遷移、再收縮」分階段執行。

## 完成內容（分階段）

### Phase 1 — schema 擴張＋spec v3
- `prisma/schema.prisma` 新增 `RewardTier`（含 `label/rewardType/rate/cap/capPeriod/minSpend/conditionsText/conditions(JSON)/sortOrder`）、`Channel`、`RewardTierChannel`（多對多 join）；`Offer` 加 `tiers` 關聯與 `headlineRate`／`headlineSummary`。
- 對齊了漂移的 `engineering-data-model-spec/schema.prisma`（補回 T19 遺漏的 6 個 Card 欄位）。
- 產出 `schema-v3-2026-07-27.prisma`、`prisma-schema-spec-v3-2026-07-27.md`、`schema-checklist-2026-07-27.md`。`prisma validate` 通過。

### Phase 2 — db push＋資料遷移
- 備份 dev.db → `prisma db push`（純新增）→ `scripts/migrate-offers-to-tiers.mjs` 把 16 筆 offer 各遷出 1 筆 RewardTier（16/16，內容抽查一致），並回填 `headlineRate`。

### Phase 3 — 前台改讀 tiers
- `src/app/offers/[slug]/page.tsx`：「回饋與限制」改為逐層渲染 RewardTier（多層感知：多層時顯示層名與框線、單層維持原樣），並顯示適用通路；期間／驗證／來源移到分隔線下的 offer 層級區塊。
- `src/components/OfferCard.tsx`：列表「回饋」改用 `headlineRate`。

### Phase 4 — 後台 tier 表單＋actions＋驗證
- `src/components/AdminOfferForm.tsx`：扁平回饋輸入改為**動態回饋層編輯器**（＋新增／刪除層，每層 label/rewardType/rate/cap/capPeriod/minSpend/conditionsText），編輯時載入既有 tiers。
- `src/lib/admin-actions.ts`：`parseTiers` 讀取 `tierCount` 與 `tier-<i>-<field>`；建立採 `tiers.create`、更新採 `deleteMany + create` 重建；設定 `headlineRate`；`offerData` 不再寫扁平欄位。
- `src/lib/domain-validation.ts`：`validateOfferPublish` 改為「至少一層有 rewardType 或 rate」。
- `src/app/admin/offers/[id]/page.tsx`：查詢補 include tiers。

### Phase 5a — 匯入／seed 改寫 tiers
- `scripts/import-offer-data.mjs`：每筆 offer 依（仍為扁平的）試算表建立 1 筆 RewardTier、設定 headlineRate、不再寫扁平欄位；upsert 模式先清後建避免重複。**實跑驗證**：16 offer→16 tier 重建，HSBC 年費文字與永豐 H2 日期都從 xlsx 正確帶入。
- `prisma/seed.mjs`：改寫入 tiers，並支援每筆 `seed.tiers` 陣列以建立多層範例。

### Phase 5b — 移除扁平欄位（收縮）
- `prisma/schema.prisma`：`Offer` 移除 `rewardType/rewardValue/rewardCap/minSpend/conditions`；升版 v4。
- 移除前台殘留 fallback（`offers/[slug]`、`OfferCard`）——tiers 現保證非空。
- 備份 dev.db → `prisma db push --accept-data-loss`（資料已在 tiers，移除屬冗餘）→ 重新生成 Client。
- 產出 `schema-v4-2026-07-27.prisma`、`prisma-schema-spec-v4-2026-07-27.md`、`schema-checklist-2026-07-27-phase5b.md`。
- `scripts/migrate-offers-to-tiers.mjs` 加註為歷史腳本（來源欄位已不存在）。

## 驗證結果

- `npx prisma validate`：通過（v3、v4 各一次）。
- `npx tsc --noEmit`：0 錯誤（Phase 3、4、5b 各驗一次）。
- `npx next build`：全部路由編譯通過。
- 資料：16 offers / 16 tiers / 0 offersWithoutTier（Phase 2 遷移後、Phase 5a 重匯後、Phase 5b 移除欄位後三次確認）。
- 瀏覽器實測（本機 dev server）：優惠詳情頁（幣倍卡、HSBC 御璽、永豐公用事業）逐層渲染正確、年費文字與日期正確；分類頁 OfferCard 的「回饋」由 headlineRate 正確顯示；移除欄位後無 server／console 錯誤。

## 驗收補充（2026-07-27）

- **後台 tier 表單已由使用者親自登入實測**：在真實優惠 `ctbc-linepay-rewards-2026h2`（Codex 匯入的中國信託 LINE Pay 卡優惠，本身即為 3 層真實資料）新增第 4 層測試層（test0728），儲存後前台正確反映為獨立第 4 層；使用者隨後自行從後台刪除該測試層，一併驗證刪除功能。至此 T21 的自動驗證、資料層測試、真實多層資料渲染、後台表單人工實測四項證據齊備，正式標記完成。
- 補充驗證：`scripts/verify-t21-tier-data-layer.mjs`（2026-07-27 新增）直接以 Prisma 模擬 admin-actions.ts 的 tiers create／deleteMany+create／單層情境三種操作，11 項斷言全過，測試優惠建立後已清除。

## 未完成／待決（非阻塞）

- **幣倍卡多層 seed 範例（Scope 項）：使用者 2026-07-27 決定先跳過**——seed 已具備 `seed.tiers` 多層能力，真正的多層資料改由後台 tier 表單建在正式資料上（持久、真實），且中國信託 LINE Pay 卡的真實 3 層資料已是等同案例。此 Scope 子項記為待補，不影響 T21 完成認定。
- 試算表 offers 工作表仍為扁平（規格維持 v2），故批次匯入只產單層 tier；多層優惠目前靠後台表單建立。試算表多層寫法（規格 v3+）為未來獨立議題。
- 正式 PostgreSQL 遷移屬 T18；本任務 schema 已是 v4，屆時一併帶上。

## 觸及範圍

- schema／資料：是（本機 SQLite，已備份；正式環境未動）。
- Git 遠端／部署：未 push、未部署（本 Summary 撰寫時）。
