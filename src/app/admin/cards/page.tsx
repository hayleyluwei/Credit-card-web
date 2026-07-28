import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createCard, toggleCard } from "@/lib/admin-actions";
import { AdminField, adminInputClass } from "@/components/AdminField";

export default async function AdminCardsPage({ searchParams }: { searchParams?: { q?: string } }) {
  const q = searchParams?.q?.trim() ?? "";
  const [cards, banks] = await Promise.all([
    prisma.card.findMany({
      where: q ? { name: { contains: q } } : undefined,
      include: { bank: true },
      orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.bank.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8">
      <header className="mb-6 border-b border-line pb-5">
        <p className="text-sm font-semibold text-brand-700">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">信用卡管理</h1>
      </header>

      <section className="mb-6 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
        <h2 className="font-bold">穩定欄位提醒</h2>
        <p className="mt-2">Slug 是公開網址識別，建立後預設不要修改。SEO 欄位不會因優惠更新自動覆蓋；更新信用卡優惠時，預設只改優惠內容與適用信用卡關聯。</p>
      </section>

      <section className="mb-6 rounded-md border border-line bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold text-ink">新增信用卡</h2>
        <form action={createCard} className="mt-4 grid gap-4 md:grid-cols-2">
          <AdminField label="卡片名稱"><input className={adminInputClass} name="name" required placeholder="例：CUBE 卡" /></AdminField>
          <AdminField label="Slug" help="公開網址識別。建立後預設不要修改。"><input className={adminInputClass} name="slug" placeholder="例：cube-card" /></AdminField>
          <AdminField label="發卡銀行">
            <select className={adminInputClass} name="bankId" required>
              {banks.map((bank) => <option key={bank.id} value={bank.id}>{bank.name}</option>)}
            </select>
          </AdminField>
          <AdminField
            help="卡面圖片 URL 會顯示在信用卡詳情頁、銀行詳情頁的信用卡列表，以及優惠詳情頁的適用信用卡區塊。"
            label="卡面圖片 URL"
          >
            <input className={adminInputClass} name="imageUrl" placeholder="/uploads/cards/example.png" />
          </AdminField>
          <AdminField label="圖片 Alt"><input className={adminInputClass} name="imageAlt" placeholder="例：CUBE 卡卡面圖片" /></AdminField>
          <AdminField label="適用對象"><input className={adminInputClass} name="targetAudience" placeholder="例：常用餐飲、網購與旅遊權益的使用者" /></AdminField>
          <AdminField label="年費"><input className={adminInputClass} name="annualFee" placeholder="例：NT$36,000／終身免年費" /></AdminField>
          <AdminField label="免年費條件"><input className={adminInputClass} name="annualFeeWaiver" placeholder="例：首年免年費，次年起年刷 36 萬免年費" /></AdminField>
          <AdminField label="卡片等級"><input className={adminInputClass} name="cardLevel" placeholder="例：無限卡" /></AdminField>
          <AdminField label="發卡組織"><input className={adminInputClass} name="cardNetwork" placeholder="例：Visa" /></AdminField>
          <AdminField label="優點" help="一行一項，前台會以條列顯示。"><textarea className={adminInputClass} name="prosLines" rows={3} placeholder={"例：\n國內 18 元/哩無上限\n送 8 次貴賓室"} /></AdminField>
          <AdminField label="注意事項" help="一行一項，前台會以條列顯示。"><textarea className={adminInputClass} name="consLines" rows={3} placeholder={"例：\n需事先登錄\n排除公共事業費"} /></AdminField>
          <AdminField label="摘要"><textarea className={adminInputClass} name="summary" rows={2} placeholder="例：可切換權益方案，指定消費享小樹點回饋。" /></AdminField>
          <AdminField label="說明"><textarea className={adminInputClass} name="description" rows={2} placeholder="例：卡片定位、主要權益與適合使用情境。" /></AdminField>
          <AdminField label="SEO 標題" help="SEO 欄位不會因優惠更新自動覆蓋。"><input className={adminInputClass} name="seoTitle" /></AdminField>
          <AdminField label="SEO 描述" help="可留空使用卡片摘要 fallback。"><textarea className={adminInputClass} name="seoDescription" rows={2} /></AdminField>
          <label className="flex items-center gap-3 text-sm font-semibold"><input defaultChecked name="isActive" type="checkbox" />啟用</label>
          <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white" type="submit">新增信用卡</button>
        </form>
      </section>

      <form className="mb-4"><input className={adminInputClass} name="q" placeholder="搜尋信用卡" defaultValue={q} /></form>
      <section className="grid gap-3">
        {cards.map((card) => (
          <article className="rounded-md border border-line bg-white p-4 shadow-soft" key={card.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold">{card.name}</h2>
                <p className="text-sm text-slate-600">發卡銀行：{card.bank.name} - {card.isActive ? "啟用" : "停用"}</p>
              </div>
              <div className="flex gap-2">
                <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold" href={`/admin/cards/${card.id}`}>編輯</Link>
                <form action={toggleCard}>
                  <input name="id" type="hidden" value={card.id} />
                  <input name="nextIsActive" type="hidden" value={card.isActive ? "" : "on"} />
                  <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" type="submit">{card.isActive ? "停用" : "啟用"}</button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
