import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPublicOffers } from "@/lib/domain-offers";
import { CardImage } from "@/components/CardImage";
import { getCanonicalUrl } from "@/lib/domain-seo";

export const metadata = {
  title: "信用卡列表｜信用卡優惠查詢網站",
  description: "瀏覽所有信用卡，找到手上這張卡目前整理到的公開優惠。",
  alternates: {
    canonical: getCanonicalUrl("/cards")
  }
};

export default async function CardsPage() {
  const siteSetting = await prisma.siteSetting.findFirst();
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

  const cardEntries = cards
    .map((card) => {
      const publicOfferCount = getPublicOffers(
        card.offers.map((item) => item.offer),
        siteSetting?.showExpiredOffers ?? false
      ).length;

      return { card, publicOfferCount };
    })
    .sort((a, b) => {
      if (a.publicOfferCount !== b.publicOfferCount) {
        return b.publicOfferCount - a.publicOfferCount;
      }

      return a.card.name.localeCompare(b.card.name, "zh-Hant");
    });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-10 border-b border-line pb-6">
        <nav className="text-sm font-semibold text-brand-700">
          <Link href="/">首頁</Link>
          <span className="mx-2">/</span>
          信用卡列表
        </nav>
        <h1 className="mt-4 text-3xl font-bold text-ink">所有信用卡</h1>
        <p className="mt-3 text-base leading-7 text-slate-700">
          共 {cardEntries.length} 張信用卡，點進去看這張卡目前整理到的公開優惠。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                <h2 className="mt-2 text-xl font-bold text-ink">{card.name}</h2>
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
      </section>
    </main>
  );
}
