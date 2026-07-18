import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getPublicOffers, sortOffers } from "@/lib/domain-offers";
import { parseJsonStringArray } from "@/lib/domain-parsing";
import { OfferCard } from "@/components/OfferCard";
import { generateWebPageJsonLd, getCanonicalUrl } from "@/lib/domain-seo";

interface CardPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CardPageProps) {
  const card = await prisma.card.findUnique({ where: { slug: params.slug } });

  if (!card) {
    return {};
  }

  return {
    title: card.seoTitle ?? `${card.name}｜信用卡詳情`,
    description: card.seoDescription ?? card.summary ?? `查看 ${card.name} 的信用卡與相關優惠。`,
    alternates: {
      canonical: getCanonicalUrl(`/cards/${card.slug}`)
    }
  };
}

export default async function CardDetailPage({ params }: CardPageProps) {
  const card = await prisma.card.findUnique({
    where: { slug: params.slug },
    include: {
      bank: true
    }
  });

  if (!card || !card.isActive) {
    notFound();
  }

  const siteSetting = await prisma.siteSetting.findFirst();
  const offers = await prisma.offer.findMany({
    where: {
      isPublished: true,
      cards: {
        some: {
          cardId: card.id
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
  const pros = parseJsonStringArray(card.prosJson);
  const cons = parseJsonStringArray(card.consJson);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-10 rounded-3xl border border-line bg-white p-8 shadow-soft">
        <nav className="text-sm font-semibold text-brand-700">
          <Link href="/">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/categories">分類列表</Link>
          <span className="mx-2">/</span>
          <Link href={`/banks/${card.bank.slug}`}>{card.bank.name}</Link>
          <span className="mx-2">/</span>
          {card.name}
        </nav>
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">信用卡詳情</p>
            <h1 className="mt-3 text-3xl font-bold text-ink">{card.name}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">{card.summary ?? "這張信用卡提供多種優惠機會，詳情如下。"}</p>
          </div>
          {card.imageUrl ? (
            <div className="relative h-28 min-h-[112px] min-w-[112px] overflow-hidden rounded-3xl border border-line bg-brand-50 p-4 text-center shadow-soft">
              <Image
                src={card.imageUrl}
                alt={card.imageAlt ?? card.name}
                fill
                sizes="112px"
                className="object-contain p-4"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-28 min-h-[112px] min-w-[112px] items-center justify-center rounded-3xl border border-line bg-brand-50 text-4xl font-bold text-brand-700 shadow-soft">
              {card.name.charAt(0)}
            </div>
          )}
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="space-y-8">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-ink">卡片資訊</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-900">銀行</p>
                <p className="mt-2 text-sm text-slate-600">{card.bank.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">目標客群</p>
                <p className="mt-2 text-sm text-slate-600">{card.targetAudience ?? "不限客群"}</p>
              </div>
              {card.cardLevel ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">卡片等級</p>
                  <p className="mt-2 text-sm text-slate-600">{card.cardLevel}</p>
                </div>
              ) : null}
              {card.cardNetwork ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">發卡組織</p>
                  <p className="mt-2 text-sm text-slate-600">{card.cardNetwork}</p>
                </div>
              ) : null}
              {card.annualFee ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">年費</p>
                  <p className="mt-2 text-sm text-slate-600">{card.annualFee}</p>
                </div>
              ) : null}
              {card.annualFeeWaiver ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">免年費條件</p>
                  <p className="mt-2 text-sm text-slate-600">{card.annualFeeWaiver}</p>
                </div>
              ) : null}
              <div className="sm:col-span-2">
                <p className="text-sm font-semibold text-slate-900">卡片說明</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{card.description ?? "尚未提供更多說明。"}</p>
              </div>
            </div>
          </div>

          {pros.length > 0 || cons.length > 0 ? (
            <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-bold text-ink">優點與注意事項</h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-2">
                {pros.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">優點</p>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                      {pros.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {cons.length > 0 ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-900">注意事項</p>
                    <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
                      {cons.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-ink">相關優惠</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">顯示與此卡片相關的公開優惠。</p>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm text-brand-700">{sortedOffers.length} 筆</span>
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

        <aside className="space-y-6">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-ink">卡片資訊</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <div>卡片名稱：{card.name}</div>
              <div>是否啟用：{card.isActive ? "啟用" : "停用"}</div>
              <div>SEO 標題：{card.seoTitle ?? "尚未設定"}</div>
            </div>
          </div>
        </aside>
      </section>

      <script
        id="card-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateWebPageJsonLd(
              card.seoTitle ?? `${card.name}｜信用卡詳情`,
              card.seoDescription ?? card.summary ?? `查看 ${card.name} 的信用卡與相關優惠。`,
              getCanonicalUrl(`/cards/${card.slug}`)
            )
          )
        }}
      />
    </main>
  );
}
