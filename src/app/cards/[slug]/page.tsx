import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicOffers, sortOffers } from "@/lib/domain-offers";
import { parseJsonStringArray } from "@/lib/domain-parsing";
import { CardImage } from "@/components/CardImage";
import { OfferCard } from "@/components/OfferCard";
import { generateWebPageJsonLd, getCanonicalUrl } from "@/lib/domain-seo";
import { Breadcrumb, IssuerLink, PageContainer, SectionHead } from "@/components/design-system";

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

  const details = [
    { label: "發卡銀行", value: card.bank.name },
    { label: "適用對象", value: card.targetAudience ?? "不限客群" },
    card.cardLevel ? { label: "卡片等級", value: card.cardLevel } : null,
    card.cardNetwork ? { label: "發卡組織", value: card.cardNetwork } : null,
    card.annualFee ? { label: "年費", value: card.annualFee } : null,
    card.annualFeeWaiver ? { label: "免年費條件", value: card.annualFeeWaiver } : null
  ].filter((item): item is { label: string; value: string } => item !== null);

  return (
    <PageContainer>
      {/* 契約 4.3：卡片詳情的麵包屑固定為「首頁 / 信用卡 / 卡片名稱」，
          發卡銀行是可點選的內容關聯（IssuerLink），不是假的麵包屑層級。 */}
      <Breadcrumb items={[{ label: "首頁", href: "/" }, { label: "信用卡", href: "/cards" }, { label: card.name }]} />

      <header className="grid gap-6 rounded-panel border border-line bg-paper p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="cl-eyebrow">信用卡詳情</p>
          <h1 className="mt-2 text-[28px] font-[850] leading-tight text-ink sm:text-[38px]">{card.name}</h1>
          <p className="cl-lead mt-3 max-w-2xl">{card.summary ?? "這張信用卡提供多種優惠機會，詳情如下。"}</p>
          <IssuerLink bankName={card.bank.name} href={`/banks/${card.bank.slug}`} />
        </div>
        <div className="w-full max-w-[250px] shrink-0">
          <p className="sr-only">卡面圖片</p>
          <CardImage
            alt={card.imageAlt}
            bankName={card.bank.name}
            cardBgColorFrom={card.cardBgColorFrom}
            cardBgColorTo={card.cardBgColorTo}
            cardChipColorFrom={card.cardChipColorFrom}
            cardChipColorTo={card.cardChipColorTo}
            cardTextColor={card.cardTextColor}
            imageUrl={card.imageUrl}
            name={card.name}
            slug={card.slug}
          />
        </div>
      </header>

      <section className="mt-8 cl-panel">
        <SectionHead title="卡片資訊" />
        <div className="grid gap-x-6 sm:grid-cols-2">
          {details.map((item) => (
            <div className="border-t border-line py-3.5" key={item.label}>
              <p className="text-[12px] font-[850] text-ink">{item.label}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{item.value}</p>
            </div>
          ))}
          <div className="border-t border-line py-3.5 sm:col-span-2">
            <p className="text-[12px] font-[850] text-ink">卡片說明</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">{card.description ?? "尚未提供更多說明。"}</p>
          </div>
        </div>
      </section>

      {pros.length > 0 || cons.length > 0 ? (
        <section className="mt-8 cl-panel">
          <SectionHead title="優點與注意事項" />
          <div className="grid gap-6 sm:grid-cols-2">
            {pros.length > 0 ? (
              <div>
                <p className="cl-tag">優點</p>
                <ul className="mt-2.5 list-disc space-y-2 pl-5 text-[12.5px] leading-relaxed text-muted">
                  {pros.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {cons.length > 0 ? (
              <div>
                <p className="cl-tag bg-yellow text-ink">注意事項</p>
                <ul className="mt-2.5 list-disc space-y-2 pl-5 text-[12.5px] leading-relaxed text-muted">
                  {cons.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mt-8">
        <SectionHead
          action={{ href: "/search", label: "查看全部" }}
          copy={`目前整理到 ${sortedOffers.length} 筆可以用的優惠。`}
          title="這張卡的優惠"
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
    </PageContainer>
  );
}
