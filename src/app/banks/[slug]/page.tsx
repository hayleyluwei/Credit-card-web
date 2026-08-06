import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getPublicOffers, sortOffers } from "@/lib/domain-offers";
import { OfferCard } from "@/components/OfferCard";
import { CardTile } from "@/components/CardTile";
import { generateWebPageJsonLd, getCanonicalUrl } from "@/lib/domain-seo";
import { Breadcrumb, PageContainer, SectionHead } from "@/components/design-system";

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
    <PageContainer>
      {/* 契約 4.3：沒有銀行列表 route 時，麵包屑使用「首頁 / 銀行名稱」，不得連向不存在的層級。 */}
      <Breadcrumb items={[{ label: "首頁", href: "/" }, { label: bank.name }]} />

      <header className="grid gap-6 rounded-panel border border-line bg-lime p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-[11px] font-[850] uppercase tracking-[0.09em] text-blue-deep">發卡銀行</p>
          <h1 className="mt-2 text-[28px] font-[850] leading-tight text-ink sm:text-[38px]">{bank.name}的卡片與優惠</h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-[1.75] text-lime-ink">
            {bank.description ?? "這間銀行旗下的信用卡與公開優惠都整理在這裡。"}
          </p>
          {bank.websiteUrl ? (
            <a
              className="mt-4 inline-flex items-center gap-2 rounded-control border border-line bg-paper px-3 py-2 text-xs font-[850] text-blue-deep transition hover:border-blue"
              href={bank.websiteUrl}
              rel="noreferrer"
              target="_blank"
            >
              官方網站 ↗
            </a>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-card border border-line bg-paper">
            {bank.logoUrl ? (
              <Image
                alt={bank.logoAlt ?? bank.name}
                className="object-contain p-3"
                fill
                sizes="72px"
                src={bank.logoUrl}
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[28px] font-[850] text-ink">
                {bank.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="text-[38px] font-[850] leading-none tabular-nums text-blue-deep">{bank.cards.length}</p>
            <p className="mt-1 text-[11px] text-lime-ink">張信用卡</p>
          </div>
        </div>
      </header>

      <section className="mt-9">
        <SectionHead action={{ href: "/cards", label: "所有信用卡" }} title="這間銀行的信用卡" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {bank.cards.length > 0 ? (
            bank.cards.map((card) => (
              <CardTile
                card={{ ...card, bank }}
                key={card.id}
                offerCount={offerCountByCard.get(card.id) ?? 0}
              />
            ))
          ) : (
            <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted sm:col-span-2 lg:col-span-3">
              尚無可用的啟用卡片。
            </p>
          )}
        </div>
      </section>

      <section className="mt-9">
        <SectionHead
          action={{ href: "/search", label: "搜尋更多" }}
          copy={`目前整理到 ${sortedOffers.length} 筆可以用的優惠。`}
          title="相關優惠"
        />
        <div className="grid gap-3">
          {sortedOffers.length > 0 ? (
            sortedOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
          ) : (
            <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted">
              目前沒有可顯示的優惠。
            </p>
          )}
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
    </PageContainer>
  );
}
