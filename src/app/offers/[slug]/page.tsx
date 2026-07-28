import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { isOfferExpired, getPublicOffers } from "@/lib/domain-offers";
import { resolveSummaryPreview } from "@/lib/domain-parsing";
import { CardImage } from "@/components/CardImage";
import { generateArticleJsonLd, generateFaqJsonLd, getCanonicalUrl } from "@/lib/domain-seo";

interface OfferPageProps {
  params: {
    slug: string;
  };
}

function formatDate(date?: Date | null) {
  return date ? new Date(date).toLocaleDateString("zh-TW") : null;
}

function formatRewardType(type?: string | null) {
  const labels: Record<string, string> = {
    cashback: "現金回饋",
    discount: "折扣優惠",
    installment: "分期零利率",
    miles: "哩程 / 旅遊回饋",
    points: "點數回饋",
    "travel-benefit": "旅遊權益"
  };

  return type ? labels[type] ?? type : "請依官方公告為準";
}

export async function generateMetadata({ params }: OfferPageProps) {
  const offer = await prisma.offer.findUnique({ where: { slug: params.slug } });

  if (!offer) {
    return {};
  }

  return {
    title: offer.seoTitle ?? `${offer.title}｜信用卡優惠`,
    description: offer.seoDescription ?? offer.summary ?? `查看 ${offer.title} 的回饋內容、適用信用卡、消費門檻與注意事項。`,
    alternates: {
      canonical: getCanonicalUrl(`/offers/${offer.slug}`)
    }
  };
}

export default async function OfferDetailPage({ params }: OfferPageProps) {
  const offer = await prisma.offer.findUnique({
    where: { slug: params.slug },
    include: {
      category: true,
      tiers: {
        orderBy: { sortOrder: "asc" },
        include: {
          channels: {
            include: { channel: true }
          }
        }
      },
      cards: {
        include: {
          card: {
            include: {
              bank: true
            }
          }
        }
      }
    }
  });

  if (!offer || !offer.isPublished) {
    notFound();
  }

  const siteSetting = await prisma.siteSetting.findFirst();
  const publicOffers = getPublicOffers([offer], siteSetting?.showExpiredOffers ?? false);
  if (publicOffers.length === 0) {
    notFound();
  }

  const resolvedOffer = publicOffers[0];
  const expired = isOfferExpired(resolvedOffer);
  const summary = resolveSummaryPreview({
    manualSummary: resolvedOffer.manualSummary,
    highlight1: resolvedOffer.highlight1,
    highlight2: resolvedOffer.highlight2,
    summaryPreview: resolvedOffer.summaryPreview,
    title: resolvedOffer.title
  });
  const periodStart = formatDate(resolvedOffer.startDate);
  const periodEnd = formatDate(resolvedOffer.endDate);
  const highlights = [resolvedOffer.highlight1, resolvedOffer.highlight2].filter((item): item is string => Boolean(item?.trim()));
  // [T21] 優先使用結構化 RewardTier；若某筆優惠尚無 tier（過渡期防護），回退到舊扁平欄位。
  const tiers = resolvedOffer.tiers ?? [];

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-10 rounded-3xl border border-line bg-white p-8 shadow-soft">
        <nav className="text-sm font-semibold text-brand-700">
          <Link href="/">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/categories">分類列表</Link>
          <span className="mx-2">/</span>
          <Link href={`/categories/${resolvedOffer.category.slug}`}>{resolvedOffer.category.name}</Link>
          <span className="mx-2">/</span>
          {resolvedOffer.title}
        </nav>
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-700">優惠詳情</p>
            <h1 className="mt-3 text-3xl font-bold text-ink">{resolvedOffer.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-700">{summary}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${expired ? "bg-red-100 text-red-700" : "bg-brand-100 text-brand-800"}`}>
            {expired ? "已過期" : "進行中"}
          </span>
        </div>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="space-y-8">
          {highlights.length > 0 ? (
            <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
              <h2 className="text-2xl font-bold text-ink">優惠亮點</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {highlights.map((highlight) => (
                  <div key={highlight} className="rounded-2xl bg-brand-50 p-4 text-sm font-semibold leading-6 text-brand-900">
                    {highlight}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-ink">怎麼拿到優惠</h2>
            <div className="mt-5 space-y-5 text-sm leading-7 text-slate-700">
              {resolvedOffer.description ? (
                <p className="whitespace-pre-line">{resolvedOffer.description}</p>
              ) : (
                <p>請依適用信用卡、消費門檻、活動期間與官方條件完成消費。</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-ink">回饋與限制</h2>

            {tiers.length > 0 ? (
              <div className="mt-6 space-y-6">
                {tiers.map((tier, index) => {
                  const channelNames = tier.channels.map((link) => link.channel.name).filter(Boolean);
                  const tierLabel = tier.label?.trim() || (tiers.length > 1 ? `回饋層 ${index + 1}` : null);
                  return (
                    <div
                      key={tier.id}
                      className={tiers.length > 1 ? "rounded-2xl border border-line p-5" : ""}
                    >
                      {tierLabel ? <p className="mb-4 text-base font-bold text-brand-800">{tierLabel}</p> : null}
                      <div className="grid gap-5 text-sm leading-7 text-slate-700 sm:grid-cols-2">
                        <div>
                          <p className="font-semibold text-slate-900">回饋方式</p>
                          <p>{formatRewardType(tier.rewardType)}</p>
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">回饋內容</p>
                          <p>{tier.rate ?? "請依官方公告為準"}</p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="font-semibold text-slate-900">回饋上限</p>
                          <p>
                            {tier.cap ?? "請依官方公告為準"}
                            {tier.capPeriod ? `（${tier.capPeriod}）` : ""}
                          </p>
                        </div>
                        {tier.minSpend ? (
                          <div className="sm:col-span-2">
                            <p className="font-semibold text-slate-900">使用門檻</p>
                            <p>{tier.minSpend}</p>
                          </div>
                        ) : null}
                        {channelNames.length > 0 ? (
                          <div className="sm:col-span-2">
                            <p className="font-semibold text-slate-900">適用通路</p>
                            <p>{channelNames.join("、")}</p>
                          </div>
                        ) : null}
                        {tier.conditionsText ? (
                          <div className="sm:col-span-2">
                            <p className="font-semibold text-slate-900">注意事項</p>
                            <p className="whitespace-pre-line">{tier.conditionsText}</p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-6 text-sm leading-7 text-slate-600">回饋內容請依官方公告與銀行活動頁為準。</p>
            )}

            <div className="mt-6 grid gap-5 border-t border-line pt-6 text-sm leading-7 text-slate-700 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-slate-900">優惠期間</p>
                <p>
                  {periodStart ?? "未設定開始日"} - {periodEnd ?? "未設定結束日"}
                </p>
              </div>
              <div>
                <p className="font-semibold text-slate-900">最後驗證</p>
                <p>{formatDate(resolvedOffer.lastVerifiedAt) ?? "尚未設定"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="font-semibold text-slate-900">來源連結</p>
                {resolvedOffer.sourceUrl ? (
                  <a href={resolvedOffer.sourceUrl} target="_blank" rel="noreferrer" className="text-brand-700 underline">
                    前往官方來源
                  </a>
                ) : (
                  <p>尚未提供官方來源。</p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-ink">適用信用卡</h2>
            <div className="mt-4 space-y-3">
              {resolvedOffer.cards.length > 0 ? (
                resolvedOffer.cards.map((offerCard) => (
                  <Link
                    key={`${offerCard.offerId}-${offerCard.cardId}`}
                    href={`/cards/${offerCard.card.slug}`}
                    className="grid gap-4 rounded-2xl border border-line p-4 transition hover:border-brand-300 sm:grid-cols-[140px_1fr]"
                  >
                    <CardImage imageUrl={offerCard.card.imageUrl} alt={offerCard.card.imageAlt} name={offerCard.card.name} />
                    <div>
                      <p className="text-sm font-semibold text-brand-700">{offerCard.card.bank.name}</p>
                      <p className="mt-1 font-semibold text-slate-900">{offerCard.card.name}</p>
                      <p className="mt-2 text-sm text-slate-600">{offerCard.card.targetAudience ?? "尚未設定適用對象"}</p>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-600">尚未設定適用信用卡。</p>
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-ink">優惠摘要</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <div>分類：{resolvedOffer.category.name}</div>
              <div>標籤：{resolvedOffer.tags ?? "尚未設定"}</div>
              {resolvedOffer.isFeatured ? <div>精選優惠</div> : null}
            </div>
          </div>
        </aside>
      </section>

      <script
        id="offer-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateArticleJsonLd(
              offer.seoTitle ?? `${offer.title}｜信用卡優惠`,
              offer.seoDescription ?? offer.summary ?? `查看 ${offer.title} 的回饋內容、適用信用卡、消費門檻與注意事項。`,
              getCanonicalUrl(`/offers/${offer.slug}`),
              offer.createdAt.toISOString(),
              offer.updatedAt.toISOString()
            )
          )
        }}
      />

      {offer.faqJson ? (
        <script
          id="offer-faq-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFaqJsonLd(offer.faqJson, getCanonicalUrl(`/offers/${offer.slug}`)))
          }}
        />
      ) : null}
    </main>
  );
}
