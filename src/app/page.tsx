import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getFeaturedOffers, getLatestOffers, getPublicOffers } from "@/lib/domain-offers";
import { CardImage } from "@/components/CardImage";
import { CategoryCard } from "@/components/CategoryCard";
import { OfferCard } from "@/components/OfferCard";
import { generateOrganizationJsonLd, getCanonicalUrl } from "@/lib/domain-seo";
import { SCENARIO_TAGS } from "@/lib/domain-scenarios";
import { EntryIcon } from "@/components/EntryIcon";

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

  const cards = await prisma.card.findMany({
    where: {
      isActive: true,
      bank: {
        isActive: true
      }
    },
    include: {
      bank: true,
      offers: {
        include: {
          offer: true
        }
      }
    },
    orderBy: [{ bank: { name: "asc" } }, { name: "asc" }]
  });

  const featuredOffers = getFeaturedOffers(offers, siteSetting?.homepageFeaturedCount ?? 6, siteSetting?.showExpiredOffers ?? false);
  const latestOffers = getLatestOffers(offers, 6, siteSetting?.showExpiredOffers ?? false);
  const cardEntries = cards
    .map((card) => {
      const publicOfferCount = getPublicOffers(
        card.offers.map((item) => item.offer),
        siteSetting?.showExpiredOffers ?? false
      ).length;

      return {
        card,
        publicOfferCount
      };
    })
    .sort((a, b) => {
      if (a.publicOfferCount !== b.publicOfferCount) {
        return b.publicOfferCount - a.publicOfferCount;
      }

      return a.card.name.localeCompare(b.card.name, "zh-Hant");
    })
    .slice(0, 6);

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
            <Link className="rounded-full border border-brand-700 px-5 py-3 text-brand-700 transition hover:bg-brand-50" href="/guides">
              攻略文章
            </Link>
          </nav>
        </div>
      </header>

      <section className="mb-10">
        <div className="mb-6">
          <p className="text-sm font-semibold text-brand-700">情境入口</p>
          <h2 className="mt-2 text-2xl font-bold text-ink">熱門情境</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">依生活情境快速找優惠，例如繳稅、學費、水電瓦斯或訂閱服務。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {SCENARIO_TAGS.map((scenario) => (
            <Link
              key={scenario.slug}
              href={`/scenarios/${scenario.slug}`}
              className="flex w-24 flex-col items-center gap-2 rounded-2xl border border-line bg-white p-3 text-center shadow-soft transition duration-200 hover:-translate-y-1 hover:border-brand-300"
            >
              <EntryIcon className="h-10 w-10" iconKey={scenario.slug} />
              <span className="text-xs font-semibold text-ink">{scenario.tagLabel}</span>
            </Link>
          ))}
        </div>
      </section>

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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">依信用卡查優惠</p>
            <h2 className="mt-2 text-2xl font-bold text-ink">信用卡優惠</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              不確定要看哪個分類時，先從手上的卡開始。點進信用卡頁，就能看到這張卡目前整理到的公開優惠。
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold">
            <Link href="/cards" className="text-brand-700">
              查看全部信用卡 →
            </Link>
            <Link href="/search" className="text-brand-700">
              用關鍵字搜尋優惠 →
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cardEntries.length > 0 ? (
            cardEntries.map(({ card, publicOfferCount }) => (
              <Link
                key={card.id}
                href={`/cards/${card.slug}`}
                className="group grid gap-4 rounded-3xl border border-line bg-white p-5 shadow-soft transition duration-200 hover:-translate-y-1 hover:border-brand-300"
              >
                <CardImage
                  imageUrl={card.imageUrl}
                  alt={card.imageAlt}
                  name={card.name}
                  slug={card.slug}
                  cardBgColorFrom={card.cardBgColorFrom}
                  cardBgColorTo={card.cardBgColorTo}
                  cardTextColor={card.cardTextColor}
                  cardChipColorFrom={card.cardChipColorFrom}
                  cardChipColorTo={card.cardChipColorTo}
                />
                <div>
                  <p className="text-sm font-semibold text-brand-700">{card.bank.name}</p>
                  <h3 className="mt-2 text-xl font-bold text-ink">{card.name}</h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">
                    {card.summary ?? card.targetAudience ?? "查看這張信用卡目前整理到的優惠。"}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="rounded-full bg-brand-50 px-3 py-1 font-semibold text-brand-700">{publicOfferCount} 筆優惠</span>
                  <span className="font-semibold text-brand-700 transition group-hover:translate-x-1">查看這張卡 →</span>
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-3xl border border-line bg-white p-8 text-center text-slate-600 shadow-soft md:col-span-2 xl:col-span-3">
              目前尚無可顯示的信用卡。
            </div>
          )}
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
