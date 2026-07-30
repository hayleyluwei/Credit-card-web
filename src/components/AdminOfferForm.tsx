"use client";

import type { Bank, Card, Category, Offer, OfferCard, RewardTier } from "@prisma/client";
import Link from "next/link";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AdminField, adminInputClass } from "@/components/AdminField";
import { StableSlugInput } from "@/components/StableSlugInput";
import type { AdminActionState } from "@/lib/admin-actions";

type CardWithBank = Card & { bank: Bank };
type OfferWithCards = Offer & { cards: OfferCard[]; tiers: RewardTier[] };

type TierDraft = {
  key: string;
  label: string;
  rewardType: string;
  rate: string;
  cap: string;
  capPeriod: string;
  minSpend: string;
  conditionsText: string;
};

let tierKeySeq = 0;
function nextTierKey() {
  tierKeySeq += 1;
  return `tier-${tierKeySeq}`;
}

function emptyTier(): TierDraft {
  return { key: nextTierKey(), label: "", rewardType: "", rate: "", cap: "", capPeriod: "", minSpend: "", conditionsText: "" };
}

function tiersFromOffer(offer?: OfferWithCards | null): TierDraft[] {
  const rows = offer?.tiers ?? [];
  if (rows.length === 0) return [emptyTier()];
  return rows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((tier) => ({
      key: nextTierKey(),
      label: tier.label ?? "",
      rewardType: tier.rewardType ?? "",
      rate: tier.rate ?? "",
      cap: tier.cap ?? "",
      capPeriod: tier.capPeriod ?? "",
      minSpend: tier.minSpend ?? "",
      conditionsText: tier.conditionsText ?? ""
    }));
}

type AdminOfferFormProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  cards: CardWithBank[];
  categories: Category[];
  offer?: OfferWithCards | null;
};

const initialOfferActionState: AdminActionState = {
  errors: [],
  ok: true
};

function dateInput(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function SubmitButton({ children, intent, tone = "default" }: { children: string; intent: string; tone?: "default" | "primary" | "danger" }) {
  const { pending } = useFormStatus();
  const toneClass =
    tone === "primary"
      ? "bg-brand-700 text-white"
      : tone === "danger"
        ? "border border-red-200 text-red-700"
        : "border border-line text-ink";

  return (
    <button className={`rounded-md px-4 py-3 text-sm font-semibold disabled:opacity-60 ${toneClass}`} disabled={pending} name="intent" type="submit" value={intent}>
      {pending ? "儲存中..." : children}
    </button>
  );
}

export function AdminOfferForm({ action, cards, categories, offer }: AdminOfferFormProps) {
  const selectedCards = new Set(offer?.cards.map((item) => item.cardId) ?? []);
  const isEdit = Boolean(offer);
  const [state, formAction] = useFormState(action, initialOfferActionState);
  const [tiers, setTiers] = useState<TierDraft[]>(() => tiersFromOffer(offer));

  function updateTier(key: string, field: keyof Omit<TierDraft, "key">, value: string) {
    setTiers((prev) => prev.map((tier) => (tier.key === key ? { ...tier, [field]: value } : tier)));
  }
  function addTier() {
    setTiers((prev) => [...prev, emptyTier()]);
  }
  function removeTier(key: string) {
    setTiers((prev) => (prev.length <= 1 ? prev : prev.filter((tier) => tier.key !== key)));
  }

  return (
    <form action={formAction} className="grid gap-6 rounded-md border border-line bg-white p-6 shadow-soft">
      {offer ? <input name="id" type="hidden" value={offer.id} /> : null}

      {state.errors.length > 0 ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">
          <h2 className="font-bold">儲存失敗</h2>
          <ul className="mt-2 list-disc pl-5">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : state.message ? (
        <section className="rounded-md border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800" role="status">
          <h2 className="font-bold">{state.message}</h2>
          {state.publicPath ? (
            <p className="mt-2">
              公開頁網址：
              <Link className="ml-1 underline" href={state.publicPath} target="_blank" rel="noreferrer">
                查看公開頁（另開新分頁）
              </Link>
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="rounded-md border border-line bg-white px-3 py-2 font-semibold text-ink" href="/admin/offers">
              回優惠管理列表
            </Link>
            <Link className="rounded-md border border-line bg-white px-3 py-2 font-semibold text-ink" href="/admin">
              回後台首頁
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <h2 className="font-bold">發布前檢查與穩定欄位提醒</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>發布前請填寫官方來源連結。</li>
          <li>發布前請填寫回饋方式或回饋內容。</li>
          <li>發布前請至少勾選一張適用信用卡。</li>
          <li>Slug 會影響公開網址，建立後預設不要修改；真正修改 Slug 時，系統會跳出提醒。</li>
          <li>查看公開頁會另開新分頁，避免你離開後台編輯流程。</li>
        </ul>
      </section>

      <section className="rounded-md border border-line bg-slate-50 p-4">
        <h2 className="text-lg font-bold text-ink">前台欄位對應圖</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-sm font-bold text-brand-700">優惠卡片 / 搜尋結果</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>優惠標題：卡片主標題。</li>
              <li>列表摘要：首頁、搜尋頁、分類頁、信用卡詳情頁的優惠卡片摘要。</li>
              <li>分類、適用信用卡、回饋內容、截止日：卡片輔助資訊。</li>
            </ul>
          </div>
          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-sm font-bold text-brand-700">優惠詳情頁</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>手動摘要與詳細說明：顯示於優惠詳情頁主要內容。</li>
              <li>優惠亮點：顯示於詳情頁「優惠亮點」區塊。</li>
              <li>回饋方式、回饋內容、門檻、上限、注意事項：顯示於「回饋與限制」。</li>
            </ul>
          </div>
          <div className="rounded-md border border-line bg-white p-4">
            <p className="text-sm font-bold text-brand-700">SEO / 維護</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
              <li>Slug：公開網址識別，修改時會跳提醒。</li>
              <li>SEO 標題 / 描述：搜尋引擎使用，不直接顯示在一般前台資訊卡。</li>
              <li>最後驗證：協助後台維護資料新鮮度。</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-ink">基本內容</h2>
        </div>
        <AdminField label="優惠標題" help="公開頁、搜尋結果與 SEO fallback 會優先使用此標題。">
          <input className={adminInputClass} name="title" placeholder="例：CUBE 餐飲系列活動" required defaultValue={offer?.title ?? ""} />
        </AdminField>
        <AdminField label="Slug" help="Slug 會影響公開網址，修改時會跳出確認提醒。">
          <StableSlugInput defaultValue={offer?.slug ?? ""} placeholder="例：cube-dining-2026" />
        </AdminField>
        <AdminField label="分類">
          <select className={adminInputClass} name="categoryId" required defaultValue={offer?.categoryId ?? categories[0]?.id}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </AdminField>
        <AdminField label="摘要模式" help="系統摘要會用手動摘要、亮點或列表摘要自動組出摘要；手動摘要適合你想完全控制文案時使用。">
          <select className={adminInputClass} name="summaryMode" defaultValue={offer?.summaryMode ?? "system"}>
            <option value="system">系統摘要</option>
            <option value="manual">手動摘要</option>
          </select>
        </AdminField>
        <AdminField label="卡片摘要" help="短摘要素材，可供系統 fallback 使用；如果只想控制列表卡片，請優先填「列表摘要」。">
          <textarea className={adminInputClass} name="summary" placeholder="例：每週四於國內餐廳消費滿額，可取得加碼優惠券。" rows={2} defaultValue={offer?.summary ?? ""} />
        </AdminField>
        <AdminField label="列表摘要" help="顯示在首頁、搜尋頁、分類頁、信用卡詳情頁的優惠卡片摘要。">
          <textarea className={adminInputClass} name="summaryPreview" placeholder="例：每週四持 CUBE 卡於國內餐廳消費滿額，可取得加碼優惠券。" rows={2} defaultValue={offer?.summaryPreview ?? ""} />
        </AdminField>
        <AdminField label="適用對象" help="給前台或後台辨識適合的使用者族群。">
          <input className={adminInputClass} name="targetAudience" placeholder="例：常用 CUBE 卡外食、聚餐的使用者" defaultValue={offer?.targetAudience ?? ""} />
        </AdminField>
        <AdminField label="標籤" help="以逗號分隔，供搜尋與後台篩選使用。">
          <input className={adminInputClass} name="tags" placeholder="例：餐飲,CUBE,小樹點" defaultValue={offer?.tags ?? ""} />
        </AdminField>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-ink">優惠內容</h2>
        </div>
        <AdminField label="亮點 1" help="顯示於優惠詳情頁「優惠亮點」區塊，也可作為系統摘要素材。">
          <input className={adminInputClass} name="highlight1" placeholder="例：加碼 5% 優惠券" defaultValue={offer?.highlight1 ?? ""} />
        </AdminField>
        <AdminField label="亮點 2" help="顯示於優惠詳情頁「優惠亮點」區塊；建議填限制或上限。">
          <input className={adminInputClass} name="highlight2" placeholder="例：每張優惠券上限 100 點小樹點" defaultValue={offer?.highlight2 ?? ""} />
        </AdminField>
        <AdminField label="手動摘要" help="顯示於優惠詳情頁前段；適合放使用者最應該看懂的一句話。">
          <textarea className={adminInputClass} name="manualSummary" placeholder="例：每週四持 CUBE 卡於國內餐廳單筆滿 NT$2,000，可獲 5% 優惠券。" rows={2} defaultValue={offer?.manualSummary ?? ""} />
        </AdminField>
        <AdminField label="詳細說明" help="顯示在優惠詳情頁「怎麼拿到優惠」，請使用消費者看得懂的步驟，不要只寫內部備註。">
          <textarea className={adminInputClass} name="description" placeholder="例：活動期間至指定餐廳消費，結帳時出示指定信用卡並符合單筆門檻即可享優惠。" rows={4} defaultValue={offer?.description ?? ""} />
        </AdminField>
        <AdminField label="來源連結" help="發布前必填；請填官方活動或銀行頁面。">
          <input className={adminInputClass} name="sourceUrl" placeholder="例：https://www.example.com/official-offer" type="url" defaultValue={offer?.sourceUrl ?? ""} />
        </AdminField>
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-ink">回饋層（Reward Tier）</h2>
            <p className="mt-1 text-sm text-slate-600">
              一檔優惠可有多層回饋（例：基本回饋、精選通路加碼、新卡友加碼），每層各自填回饋方式、內容、上限、門檻與條件。單層優惠填一層即可。發布前至少要有一層填了回饋方式或回饋內容。
            </p>
          </div>
          <button type="button" onClick={addTier} className="rounded-md border border-brand-300 px-3 py-2 text-sm font-semibold text-brand-700">
            ＋ 新增回饋層
          </button>
        </div>

        {/* [T21] 動態回饋層；admin-actions 依 tierCount 與 tier-<i>-<field> 讀取。 */}
        <input type="hidden" name="tierCount" value={tiers.length} />

        <div className="grid gap-5">
          {tiers.map((tier, index) => (
            <div key={tier.key} className="rounded-md border border-line bg-slate-50 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-bold text-ink">回饋層 {index + 1}</p>
                {tiers.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeTier(tier.key)}
                    className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700"
                  >
                    刪除這層
                  </button>
                ) : null}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <AdminField label="這層名稱（選填）" help="多層時建議填，例：精選通路加碼、新卡友加碼。單層可留空。">
                  <input
                    className={adminInputClass}
                    name={`tier-${index}-label`}
                    placeholder="例：精選通路加碼"
                    value={tier.label}
                    onChange={(event) => updateTier(tier.key, "label", event.target.value)}
                  />
                </AdminField>
                <AdminField label="回饋方式" help="例：cashback、points、discount、installment、miles、travel-benefit。">
                  <input
                    className={adminInputClass}
                    name={`tier-${index}-rewardType`}
                    placeholder="例：cashback"
                    value={tier.rewardType}
                    onChange={(event) => updateTier(tier.key, "rewardType", event.target.value)}
                  />
                </AdminField>
                <AdminField label="回饋內容" help="回饋率或算式，例：4%、每滿 NT$50,000 回饋 NT$50。">
                  <input
                    className={adminInputClass}
                    name={`tier-${index}-rate`}
                    placeholder="例：加碼 4%"
                    value={tier.rate}
                    onChange={(event) => updateTier(tier.key, "rate", event.target.value)}
                  />
                </AdminField>
                <AdminField label="回饋上限" help="這層的回饋金額上限文字。">
                  <input
                    className={adminInputClass}
                    name={`tier-${index}-cap`}
                    placeholder="例：每帳單週期上限 NT$800"
                    value={tier.cap}
                    onChange={(event) => updateTier(tier.key, "cap", event.target.value)}
                  />
                </AdminField>
                <AdminField label="上限週期（選填）" help="例：月帳單週期、日曆月、一次性。">
                  <input
                    className={adminInputClass}
                    name={`tier-${index}-capPeriod`}
                    placeholder="例：月帳單週期"
                    value={tier.capPeriod}
                    onChange={(event) => updateTier(tier.key, "capPeriod", event.target.value)}
                  />
                </AdminField>
                <AdminField label="使用門檻（選填）" help="這層的最低消費／門檻文字。">
                  <input
                    className={adminInputClass}
                    name={`tier-${index}-minSpend`}
                    placeholder="例：單筆滿 NT$3,000"
                    value={tier.minSpend}
                    onChange={(event) => updateTier(tier.key, "minSpend", event.target.value)}
                  />
                </AdminField>
                <div className="md:col-span-2">
                  <AdminField label="注意事項 / 條件（選填）" help="這層的條件與限制，顯示於詳情頁「回饋與限制」。">
                    <textarea
                      className={adminInputClass}
                      name={`tier-${index}-conditionsText`}
                      rows={3}
                      placeholder="例：需完成指定任務、限一般消費、排除項目依官方公告。"
                      value={tier.conditionsText}
                      onChange={(event) => updateTier(tier.key, "conditionsText", event.target.value)}
                    />
                  </AdminField>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-ink">日期與排序</h2>
        </div>
        <AdminField label="開始日期">
          <input className={adminInputClass} name="startDate" type="date" defaultValue={dateInput(offer?.startDate)} />
        </AdminField>
        <AdminField label="結束日期">
          <input className={adminInputClass} name="endDate" type="date" defaultValue={dateInput(offer?.endDate)} />
        </AdminField>
        <AdminField label="最後驗證日期" help="記錄最後確認官方來源的日期。">
          <input className={adminInputClass} name="lastVerifiedAt" type="date" defaultValue={dateInput(offer?.lastVerifiedAt)} />
        </AdminField>
        <AdminField label="推薦分數">
          <input className={adminInputClass} name="recommendScore" type="number" defaultValue={offer?.recommendScore ?? 0} />
        </AdminField>
        <AdminField label="排序">
          <input className={adminInputClass} name="sortOrder" type="number" defaultValue={offer?.sortOrder ?? 0} />
        </AdminField>
        <AdminField label="行銷徽章" help="顯示於優惠卡片右上角的短文字，例：最新優惠、加碼中。留空則不顯示徽章。">
          <input className={adminInputClass} name="badgeLabel" defaultValue={offer?.badgeLabel ?? ""} />
        </AdminField>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input name="isFeatured" type="checkbox" defaultChecked={offer?.isFeatured ?? false} />
          精選優惠
        </label>
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-bold text-ink">適用信用卡</h2>
        <p className="text-sm text-slate-600">發布前至少要勾選一張信用卡；前台會在優惠卡片與詳情頁顯示適用卡片。</p>
        <div className="grid gap-2 md:grid-cols-2">
          {cards.map((card) => (
            <label key={card.id} className="flex items-start gap-3 rounded-md border border-line p-3 text-sm">
              <input name="cardIds" type="checkbox" value={card.id} defaultChecked={selectedCards.has(card.id)} />
              <span>
                <span className="font-semibold text-ink">{card.name}</span>
                <span className="block text-slate-500">{card.bank.name}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold text-ink">SEO 與 FAQ</h2>
        </div>
        <AdminField label="SEO 標題" help="給搜尋引擎使用，可留空使用優惠標題 fallback。">
          <input className={adminInputClass} name="seoTitle" placeholder="例：CUBE 餐飲系列活動｜信用卡優惠" defaultValue={offer?.seoTitle ?? ""} />
        </AdminField>
        <AdminField label="SEO 描述" help="給搜尋引擎使用，可留空使用摘要 fallback。">
          <textarea className={adminInputClass} name="seoDescription" placeholder="例：整理 CUBE 卡餐飲優惠、消費門檻、回饋上限與適用信用卡。" rows={2} defaultValue={offer?.seoDescription ?? ""} />
        </AdminField>
        <div className="md:col-span-2">
          <AdminField label="FAQ JSON" help='選填；格式為 [{"question":"問題","answer":"回答"}]，用於 FAQ JSON-LD。'>
            <textarea className={adminInputClass} name="faqJson" placeholder='例：[{"question":"活動期間到什麼時候？","answer":"請依官方公告為準。"}]' rows={4} defaultValue={offer?.faqJson ?? ""} />
          </AdminField>
        </div>
      </section>

      <section className="rounded-md border border-sky-200 bg-sky-50 p-4">
        <h2 className="font-bold text-sky-950">維護提醒</h2>
        <p className="mt-2 text-sm leading-6 text-sky-950">
          更新信用卡優惠時，預設只調整優惠內容與適用信用卡關聯；不要順手改銀行或信用卡的 slug、SEO。若優惠 Slug 真的需要修改，請確認公開網址變更風險。
        </p>
      </section>

      <div className="flex flex-wrap gap-3">
        <SubmitButton intent="draft">儲存草稿</SubmitButton>
        <SubmitButton intent="publish" tone="primary">儲存並發布</SubmitButton>
        {isEdit ? <SubmitButton intent="unpublish" tone="danger">取消發布</SubmitButton> : null}
        <button className="rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink" type="reset">
          還原本次修改
        </button>
        <Link className="rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink" href="/admin/offers">
          回優惠管理列表
        </Link>
        <Link className="rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink" href="/admin">
          回後台首頁
        </Link>
      </div>
    </form>
  );
}
