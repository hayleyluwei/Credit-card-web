import { prisma } from "@/lib/prisma";
import { updateSiteSetting } from "@/lib/admin-actions";
import { AdminField, adminInputClass } from "@/components/AdminField";

export default async function AdminSettingsPage() {
  const setting = await prisma.siteSetting.findFirst();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8">
      <header className="mb-6 border-b border-line pb-5">
        <p className="text-sm font-semibold text-brand-700">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">網站設定</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">設定公開站預設 SEO、首頁精選數量與過期優惠顯示規則。</p>
      </header>

      <form action={updateSiteSetting} className="grid gap-5 rounded-md border border-line bg-white p-6 shadow-soft">
        <input name="id" type="hidden" value={setting?.id ?? 1} />
        <AdminField help="公開站名稱與部分 metadata fallback 會使用此欄位。" label="站台名稱">
          <input className={adminInputClass} name="siteName" required defaultValue={setting?.siteName ?? "信用卡優惠查詢"} />
        </AdminField>
        <AdminField help="首頁或未填 SEO 頁面的 fallback title。" label="預設 SEO 標題">
          <input className={adminInputClass} name="defaultSeoTitle" defaultValue={setting?.defaultSeoTitle ?? ""} />
        </AdminField>
        <AdminField help="首頁或未填 SEO 頁面的 fallback description。" label="預設 SEO 描述">
          <textarea className={adminInputClass} name="defaultSeoDescription" rows={3} defaultValue={setting?.defaultSeoDescription ?? ""} />
        </AdminField>
        <div className="grid gap-5 sm:grid-cols-2">
          <AdminField label="首頁精選數量">
            <input className={adminInputClass} min={1} name="homepageFeaturedCount" type="number" defaultValue={setting?.homepageFeaturedCount ?? 6} />
          </AdminField>
          <AdminField label="分類頁每頁數量">
            <input className={adminInputClass} min={1} name="categoryPageSize" type="number" defaultValue={setting?.categoryPageSize ?? 12} />
          </AdminField>
        </div>
        <label className="flex items-center gap-3 text-sm font-semibold text-ink">
          <input name="showExpiredOffers" type="checkbox" defaultChecked={setting?.showExpiredOffers ?? false} />
          顯示過期優惠
        </label>
        <button className="rounded-md bg-brand-700 px-4 py-3 text-sm font-semibold text-white" type="submit">
          儲存設定
        </button>
      </form>
    </main>
  );
}
