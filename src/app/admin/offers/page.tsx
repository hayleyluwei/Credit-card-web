import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { adminInputClass } from "@/components/AdminField";

type AdminOffersPageProps = {
  searchParams?: {
    categoryId?: string;
    q?: string;
    status?: string;
  };
};

function statusLabel(isPublished: boolean) {
  return isPublished ? "已發布" : "草稿";
}

export default async function AdminOffersPage({ searchParams }: AdminOffersPageProps) {
  const q = searchParams?.q?.trim() ?? "";
  const status = searchParams?.status ?? "all";
  const categoryId = Number.parseInt(searchParams?.categoryId ?? "", 10);
  const where = {
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { summaryPreview: { contains: q } },
            { tags: { contains: q } }
          ]
        }
      : {}),
    ...(status === "published" ? { isPublished: true } : {}),
    ...(status === "draft" ? { isPublished: false } : {}),
    ...(Number.isFinite(categoryId) ? { categoryId } : {})
  };

  const [offers, categories] = await Promise.all([
    prisma.offer.findMany({
      where,
      include: {
        category: true,
        cards: {
          include: {
            card: {
              include: {
                bank: true
              }
            }
          }
        }
      },
      orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }]
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] })
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8">
      <header className="mb-6 flex flex-col gap-4 border-b border-line pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-700">Admin</p>
          <h1 className="mt-2 text-3xl font-bold text-ink">優惠管理</h1>
          <p className="mt-2 text-sm text-slate-600">「查看公開頁」會另開新分頁，方便你保留後台管理位置。</p>
        </div>
        <Link className="rounded-md bg-brand-700 px-4 py-3 text-sm font-semibold text-white" href="/admin/offers/new">
          新增優惠
        </Link>
      </header>

      <form className="mb-6 grid gap-3 rounded-md border border-line bg-white p-4 shadow-soft md:grid-cols-3">
        <label className="text-sm font-semibold text-ink">
          搜尋優惠
          <input className={`${adminInputClass} mt-2`} name="q" defaultValue={q} placeholder="標題、摘要或標籤" />
        </label>
        <label className="text-sm font-semibold text-ink">
          發布狀態
          <select className={`${adminInputClass} mt-2`} name="status" defaultValue={status}>
            <option value="all">全部</option>
            <option value="published">已發布</option>
            <option value="draft">草稿</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-ink">
          分類篩選
          <select className={`${adminInputClass} mt-2`} name="categoryId" defaultValue={Number.isFinite(categoryId) ? categoryId : ""}>
            <option value="">全部分類</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <button className="rounded-md border border-line px-4 py-3 text-sm font-semibold md:col-span-3" type="submit">
          套用篩選
        </button>
      </form>

      <section className="grid gap-3">
        {offers.map((offer) => (
          <article className="rounded-md border border-line bg-white p-4 shadow-soft" key={offer.id}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-bold text-ink">{offer.title}</h2>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${offer.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}>
                    {statusLabel(offer.isPublished)}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {offer.category.name} - {offer.cards.map((item) => `${item.card.bank.name} ${item.card.name}`).join("、") || "尚未設定適用信用卡"}
                </p>
                <p className="mt-1 text-xs text-slate-500">Slug: {offer.slug}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {offer.isPublished ? (
                  <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold" href={`/offers/${offer.slug}`} target="_blank" rel="noreferrer">
                    查看公開頁（另開新分頁）
                  </Link>
                ) : null}
                <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold" href={`/admin/offers/${offer.id}`}>
                  編輯
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
