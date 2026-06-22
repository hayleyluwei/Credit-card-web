import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getFeaturedOffers, getLatestOffers } from "@/lib/domain-offers";
import { CategoryCard } from "@/components/CategoryCard";
import { OfferCard } from "@/components/OfferCard";
import { generateOrganizationJsonLd, getCanonicalUrl } from "@/lib/domain-seo";

export const metadata = {
  title: "信用卡優惠查詢網站",
  description: "整理信用卡現金回饋、餐飲、旅遊、網購、交通與分期優惠，幫助快速比較適合的信用卡活動.",
  alternates: {
    canonical: getCanonicalUrl("/")
  }
};

export default async function HomePage() {
  const siteSetting = await prisma.siteSetting.findFirst();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
    include: { _count: { select: { offers: true } } }
  });

  const offers = await prisma.offer.findMany({
    where: { isPublished: true },
    include: {
      cards: true,
      category: true
    }
  });

  const featuredOffers = getFeaturedOffers(offers, siteSetting?.homepageFeaturedCount ?? 6, siteSetting?.showExpiredOffers ?? false);
  const latestOffers = getLatestOffers(offers, 6, siteSetting?.showExpiredOffers ?? false);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-10 rounded-3xl border border-line bg-white p-8 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-brand-700">信用卡優惠查詢</p>
            <h1 className="mt-3 text-3xl font-bold text-ink sm:text-4xl">找到最適合你的信用卡優惠</h1>
            <p className="mt-4 text-base leading-7 text-slate-700">
              依照分類、銀行、卡片與優惠內容快速瀏覽公開優惠。首頁提供精選優惠、最新優惠與常見分類入口。
            </p>
          </div>

          <nav className="flex flex-wrap gap-3 text-sm font-semibold">
            <Link className="rounded-full bg-brand-700 px-5 py-3 text-white transition hover:bg-brand-800" href="/search">
              搜尋優惠
            </Link>
            <Link className="rounded-full border border-brand-700 px-5 py-3 text-brand-700 transition hover:bg-brand-50" href="/categories">
              瀏覽分類
            </Link>
          </nav>
        </div>
      </header>

      <section className="mb-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">分類入口</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">熱門優惠分類</h2>
          </div>
          <Link href="/categories" className="text-sm font-semibold text-brand-700">
            查看全部分類 →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} offerCount={category._count.offers} />
          ))}
        </div>
      </section>

      <section className="mb-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">精選優惠</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">本期精選</h2>
          </div>
          <Link href="/search" className="text-sm font-semibold text-brand-700">
            查看更多優惠 →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {featuredOffers.length > 0 ? (
            featuredOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
          ) : (
            <div className="rounded-3xl border border-line bg-white p-8 text-center text-slate-600 shadow-soft">
              目前尚無可顯示的精選優惠。
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">最新優惠</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">最近加入的優惠</h2>
          </div>
          <Link href="/search" className="text-sm font-semibold text-brand-700">
            搜尋更多 →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {latestOffers.length > 0 ? (
            latestOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
          ) : (
            <div className="rounded-3xl border border-line bg-white p-8 text-center text-slate-600 shadow-soft">
              目前尚無最新優惠。
            </div>
          )}
        </div>
      </section>

      <script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateOrganizationJsonLd(
              "信用卡優惠查詢網站",
              getCanonicalUrl("/"),
              "整理信用卡現金回饋、餐飲、旅遊、網購、交通與分期優惠，幫助快速比較適合的信用卡活動。"
            )
          )
        }}
      />
    </main>
  );
}
