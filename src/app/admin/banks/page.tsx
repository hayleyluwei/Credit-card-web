import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createBank, toggleBank } from "@/lib/admin-actions";
import { AdminField, adminInputClass } from "@/components/AdminField";

export default async function AdminBanksPage({
  searchParams
}: {
  searchParams?: { q?: string };
}) {
  const q = searchParams?.q?.trim() ?? "";
  const banks = await prisma.bank.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }]
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8">
      <header className="mb-6 border-b border-line pb-5">
        <p className="text-sm font-semibold text-brand-700">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">銀行管理</h1>
      </header>

      <section className="mb-6 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
        <h2 className="font-bold">穩定欄位提醒</h2>
        <p className="mt-2">Slug 是公開網址識別，建立後預設不要修改。SEO 欄位不會因優惠更新自動覆蓋；更新信用卡優惠時，預設不改銀行資料。</p>
      </section>

      <section className="mb-6 rounded-md border border-line bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold text-ink">新增銀行</h2>
        <form action={createBank} className="mt-4 grid gap-4 md:grid-cols-2">
          <AdminField label="銀行名稱"><input className={adminInputClass} name="name" required placeholder="例：國泰世華銀行" /></AdminField>
          <AdminField help="公開網址識別。建立後預設不要修改。" label="Slug"><input className={adminInputClass} name="slug" placeholder="例：cathay" /></AdminField>
          <AdminField label="Logo URL"><input className={adminInputClass} name="logoUrl" placeholder="/uploads/banks/example-logo.png" /></AdminField>
          <AdminField label="Logo Alt"><input className={adminInputClass} name="logoAlt" placeholder="例：國泰世華銀行 Logo" /></AdminField>
          <AdminField label="官網 URL"><input className={adminInputClass} name="websiteUrl" placeholder="https://www.example.com" /></AdminField>
          <AdminField label="SEO 標題" help="SEO 欄位不會因優惠更新自動覆蓋。"><input className={adminInputClass} name="seoTitle" /></AdminField>
          <AdminField label="SEO 描述" help="可留空使用銀行描述 fallback。"><textarea className={adminInputClass} name="seoDescription" rows={2} /></AdminField>
          <AdminField label="說明"><textarea className={adminInputClass} name="description" rows={2} placeholder="例：銀行信用卡與優惠頁會使用的簡短介紹。" /></AdminField>
          <label className="flex items-center gap-3 text-sm font-semibold"><input defaultChecked name="isActive" type="checkbox" />啟用</label>
          <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white" type="submit">新增銀行</button>
        </form>
      </section>

      <form className="mb-4"><input className={adminInputClass} name="q" placeholder="搜尋銀行" defaultValue={q} /></form>
      <section className="grid gap-3">
        {banks.map((bank) => (
          <article className="rounded-md border border-line bg-white p-4 shadow-soft" key={bank.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold">{bank.name}</h2>
                <p className="text-sm text-slate-600">/{bank.slug} - {bank.isActive ? "啟用" : "停用"}</p>
              </div>
              <div className="flex gap-2">
                <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold" href={`/admin/banks/${bank.id}`}>編輯</Link>
                <form action={toggleBank}>
                  <input name="id" type="hidden" value={bank.id} />
                  <input name="nextIsActive" type="hidden" value={bank.isActive ? "" : "on"} />
                  <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" type="submit">{bank.isActive ? "停用" : "啟用"}</button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
