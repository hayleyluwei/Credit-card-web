import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getPublicOffers, sortOffers, isOfferExpired } from "@/lib/domain-offers";
import { OfferCard } from "@/components/OfferCard";
import { CardImage } from "@/components/CardImage";
import { generateWebPageJsonLd, getCanonicalUrl } from "@/lib/domain-seo";

interface BankPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: BankPageProps) {
  const bank = await prisma.bank.findUnique({
    where: { slug: params.slug }
  });

  if (!bank) {
    return {};
  }

  return {
    title: bank.seoTitle ?? `${bank.name}｜銀行詳情`,
    description: bank.seoDescription ?? bank.description ?? `查看 ${bank.name} 的信用卡與相關優惠。`,
    alternates: {
      canonical: getCanonicalUrl(`/banks/${bank.slug}`)
    }
  };
}

export default async function BankDetailPage({ params }: BankPageProps) {
  const bank = await prisma.bank.findUnique({
    where: { slug: params.slug },
    include: {
      cards: {
        where: { isActive: true },
        orderBy: { updatedAt: "desc" }
      }
    }
  });

  if (!bank || !bank.isActive) {
    notFound();
  }

  const siteSetting = await prisma.siteSetting.findFirst();
  const offers = await prisma.offer.findMany({
    where: {
      isPublished: true,
      cards: {
        some: {
          card: {
            bankId: bank.id
          }
        }
      }
    },
    include: {
      category: true,
      cards: true
    }
  });

  const publicOffers = getPublicOffers(offers, siteSetting?.showExpiredOffers ?? false);
  const sortedOffers = sortOffers(publicOffers);

  const offerCountByCard = new Map<number, number>();
  for (const offer of publicOffers) {
    for (const offerCard of offer.cards) {
      offerCountByCard.set(offerCard.cardId, (offerCountByCard.get(offerCard.cardId) ?? 0) + 1);
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-10 rounded-3xl border border-line bg-white p-8 shadow-soft">
        <nav className="text-sm font-semibold text-brand-700">
          <Link href="/">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/categories">分類列表</Link>
          <span className="mx-2">/</span>
          {bank.name}
        </nav>
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">銀行詳情</p>
            <h1 className="mt-3 text-3xl font-bold text-ink">{bank.name}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">{bank.description ?? "此銀行擁有多張經典信用卡與合作優惠。"}</p>
          </div>
          <div className="relative h-28 min-h-[112px] min-w-[112px] overflow-hidden rounded-3xl border border-line bg-brand-50 p-4 text-center text-brand-700 shadow-soft">
            {bank.logoUrl ? (
              <Image
                src={bank.logoUrl}
                alt={bank.logoAlt ?? bank.name}
                fill
                sizes="112px"
                className="object-contain p-4"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl font-bold">{bank.name.charAt(0)}</div>
            )}
          </div>
        </div>
        {bank.websiteUrl ? (
          <a
            href={bank.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex rounded-full border border-brand-700 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-50"
          >
            官方網站
          </a>
        ) : null}
      </header>

      <section>
        <div className="space-y-8">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-ink">本行相關卡片</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">顯示此銀行可用的信用卡與它們所對應的公開優惠數。</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {bank.cards.length > 0 ? (
              bank.cards.map((card) => (
                <Link
                  key={card.id}
                  href={`/cards/${card.slug}`}
                  className="group rounded-3xl border border-line bg-white p-6 shadow-soft transition duration-200 hover:-translate-y-1 hover:border-brand-300"
                >
                  <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
                    <div>
                      <p className="sr-only">卡面圖片</p>
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
                    </div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-brand-700">信用卡</p>
                        <h3 className="mt-2 text-xl font-bold text-ink">{card.name}</h3>
                      </div>
                      <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-800">
                        {offerCountByCard.get(card.id) ?? 0} 則優惠
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{card.summary ?? "此卡片擁有專屬優惠，點擊查看詳情。"}</p>
                </Link>
              ))
            ) : (
              <div className="rounded-3xl border border-line bg-white p-8 text-center text-slate-600 shadow-soft">
                尚無可用的啟用卡片。
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-ink">相關優惠</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">顯示此銀行包含的所有公開優惠。</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">共 {sortedOffers.length} 筆</span>
            </div>
            <div className="grid gap-4">
              {sortedOffers.length > 0 ? (
                sortedOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
              ) : (
                <div className="rounded-3xl border border-line bg-white p-8 text-center text-slate-600 shadow-soft">
                  目前沒有可顯示的優惠。
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <script
        id="bank-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateWebPageJsonLd(
              bank.seoTitle ?? `${bank.name}｜銀行詳情`,
              bank.seoDescription ?? bank.description ?? `查看 ${bank.name} 的信用卡與相關優惠。`,
              getCanonicalUrl(`/banks/${bank.slug}`)
            )
          )
        }}
      />
    </main>
  );
}
