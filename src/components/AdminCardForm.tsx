"use client";

import type { Bank, Card } from "@prisma/client";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AdminField, adminInputClass } from "@/components/AdminField";
import { StableSlugInput } from "@/components/StableSlugInput";
import type { AdminActionState } from "@/lib/admin-actions";
import { jsonArrayToLines } from "@/lib/domain-parsing";

type AdminCardFormProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  banks: Bank[];
  card: Card;
};

const initialState: AdminActionState = {
  errors: [],
  ok: true
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="rounded-md bg-brand-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60" disabled={pending} type="submit">
      {pending ? "儲存中..." : "儲存草稿 / 更新"}
    </button>
  );
}

export function AdminCardForm({ action, banks, card }: AdminCardFormProps) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="mt-6 grid gap-4 rounded-md border border-line bg-white p-6 shadow-soft">
      <input name="id" type="hidden" value={card.id} />

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
              公開頁網址已更新：
              <Link className="ml-1 underline" href={state.publicPath} target="_blank" rel="noreferrer">
                查看公開頁（另開新分頁）
              </Link>
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-3">
            <Link className="rounded-md border border-line bg-white px-3 py-2 font-semibold text-ink" href="/admin/cards">
              回信用卡管理列表
            </Link>
            <Link className="rounded-md border border-line bg-white px-3 py-2 font-semibold text-ink" href="/admin">
              回後台首頁
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <h2 className="font-bold">穩定欄位提醒</h2>
        <p className="mt-2">Slug 是公開網址識別，建立後預設不要修改。真正修改 Slug 時，系統會跳出提醒，避免不小心改壞公開網址。</p>
      </section>

      <AdminField label="信用卡名稱">
        <input className={adminInputClass} name="name" required defaultValue={card.name} />
      </AdminField>
      <AdminField label="Slug" help="Slug 會影響公開網址。修改時會跳出確認提醒。">
        <StableSlugInput defaultValue={card.slug} required />
      </AdminField>
      <AdminField label="銀行">
        <select className={adminInputClass} name="bankId" defaultValue={card.bankId}>
          {banks.map((bank) => (
            <option key={bank.id} value={bank.id}>{bank.name}</option>
          ))}
        </select>
      </AdminField>
      <AdminField label="卡面圖片 URL" help="顯示於前台信用卡詳情頁與未來信用卡入口；請填可公開瀏覽的圖片網址。">
        <input className={adminInputClass} name="imageUrl" defaultValue={card.imageUrl ?? ""} />
      </AdminField>
      <AdminField label="圖片 Alt">
        <input className={adminInputClass} name="imageAlt" defaultValue={card.imageAlt ?? ""} />
      </AdminField>
      <AdminField label="摘要">
        <textarea className={adminInputClass} name="summary" rows={3} defaultValue={card.summary ?? ""} />
      </AdminField>
      <AdminField label="描述">
        <textarea className={adminInputClass} name="description" rows={3} defaultValue={card.description ?? ""} />
      </AdminField>
      <AdminField label="目標客群">
        <input className={adminInputClass} name="targetAudience" defaultValue={card.targetAudience ?? ""} />
      </AdminField>
      <AdminField label="年費" help="寫給人看的短句，例：NT$36,000／終身免年費。">
        <input className={adminInputClass} name="annualFee" defaultValue={card.annualFee ?? ""} />
      </AdminField>
      <AdminField label="免年費條件" help="例：首年免年費，次年起年刷 36 萬免年費。">
        <input className={adminInputClass} name="annualFeeWaiver" defaultValue={card.annualFeeWaiver ?? ""} />
      </AdminField>
      <AdminField label="卡片等級" help="例：無限卡、御璽卡、鈦金卡。">
        <input className={adminInputClass} name="cardLevel" defaultValue={card.cardLevel ?? ""} />
      </AdminField>
      <AdminField label="發卡組織" help="例：Visa、Mastercard、JCB。">
        <input className={adminInputClass} name="cardNetwork" defaultValue={card.cardNetwork ?? ""} />
      </AdminField>
      <AdminField label="優點" help="一行一項，前台會以條列顯示。">
        <textarea className={adminInputClass} name="prosLines" rows={4} defaultValue={jsonArrayToLines(card.prosJson)} />
      </AdminField>
      <AdminField label="注意事項" help="一行一項，前台會以條列顯示。">
        <textarea className={adminInputClass} name="consLines" rows={4} defaultValue={jsonArrayToLines(card.consJson)} />
      </AdminField>
      <AdminField label="SEO 標題" help="SEO 欄位不會因優惠更新自動覆蓋。">
        <input className={adminInputClass} name="seoTitle" defaultValue={card.seoTitle ?? ""} />
      </AdminField>
      <AdminField label="SEO 描述" help="SEO 欄位不會因優惠更新自動覆蓋。">
        <textarea className={adminInputClass} name="seoDescription" rows={3} defaultValue={card.seoDescription ?? ""} />
      </AdminField>
      <label className="flex items-center gap-3 text-sm font-semibold">
        <input name="isActive" type="checkbox" defaultChecked={card.isActive} />
        啟用
      </label>

      <div className="flex flex-wrap gap-3">
        <SubmitButton />
        <button className="rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink" type="reset">
          還原本次修改
        </button>
        <Link className="rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink" href="/admin/cards">
          回信用卡管理列表
        </Link>
        <Link className="rounded-md border border-line px-4 py-3 text-sm font-semibold text-ink" href="/admin">
          回後台首頁
        </Link>
      </div>
    </form>
  );
}
