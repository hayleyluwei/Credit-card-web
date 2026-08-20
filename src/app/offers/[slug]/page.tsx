import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isOfferExpired, getPublicOffers } from "@/lib/domain-offers";
import { formatTaipeiDate } from "@/lib/domain-date";
import { resolveSummaryPreview } from "@/lib/domain-parsing";
import { CardTile } from "@/components/CardTile";
import { generateArticleJsonLd, generateFaqJsonLd, getCanonicalUrl } from "@/lib/domain-seo";
import { Breadcrumb, PageContainer, SectionHead } from "@/components/design-system";

interface OfferPageProps {
  params: {
    slug: string;
  };
}

// [T30] 一律以 Asia/Taipei 格式化；原本未指定 timeZone，在 Vercel（UTC）會少一天。
const formatDate = formatTaipeiDate;

/**
 * [T32 Scope E] 回饋類型代碼 → 中文顯示，對應資料蒐集規格書 v9 §5.3。
 *
 * `points`（舊代碼）刻意保留為籠統的「點數回饋」：資料庫現有 31 個 points 層裡混了
 * 等值點數、滙豐旅遊積分（非等值）與華航哩程三種，在 T32 Scope E 逐筆重新分類完成前，
 * 若把它們改稱「等值點數」會在前台顯示錯誤資訊。新資料改用細分後的代碼。
 */
function formatRewardType(type?: string | null) {
  const labels: Record<string, string> = {
    cashback: "現金回饋",
    "points-equivalent": "等值點數",
    "points-variable": "非等值點數",
    miles: "哩程",
    discount: "折扣優惠",
    voucher: "餐券贈品",
    installment: "分期零利率",
    other: "其他",
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
    <PageContainer>
      <Breadcrumb
        items={[
          { label: "首頁", href: "/" },
          { label: resolvedOffer.category.name, href: `/categories/${resolvedOffer.category.slug}` },
          { label: resolvedOffer.title }
        ]}
      />

      <header className="grid gap-5 rounded-panel border border-line bg-paper p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
        <div>
          <p className="cl-eyebrow">優惠詳情</p>
          <h1 className="mt-2 text-[26px] font-[850] leading-tight text-ink sm:text-[34px]">{resolvedOffer.title}</h1>
          <p className="cl-lead mt-3 max-w-2xl">{summary}</p>
        </div>
        <span
          className={`w-fit whitespace-nowrap rounded-control px-3 py-2 text-[11px] font-[850] ${
            expired ? "bg-rose text-status-off" : "bg-mint text-status-ok"
          }`}
        >
          {expired ? "已過期" : "進行中"}
        </span>
      </header>

      {highlights.length > 0 ? (
        <section className="mt-8 cl-panel">
          <SectionHead title="優惠亮點" />
          <div className="grid gap-3 sm:grid-cols-2">
            {highlights.map((highlight) => (
              <p className="rounded-card bg-blue-soft p-4 text-[13px] font-[850] leading-relaxed text-blue-deep" key={highlight}>
                {highlight}
              </p>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-8 cl-panel">
        <SectionHead title="怎麼拿到優惠" />
        <p className="whitespace-pre-line text-[13px] leading-[1.9] text-prose">
          {resolvedOffer.description ?? "請依適用信用卡、消費門檻、活動期間與官方條件完成消費。"}
        </p>
      </section>

      <section className="mt-8 cl-panel">
        <SectionHead copy={tiers.length > 1 ? `共 ${tiers.length} 個回饋層級` : undefined} title="回饋與限制" />

        {tiers.length > 0 ? (
          <div className={tiers.length > 1 ? "grid gap-3 lg:grid-cols-2" : ""}>
            {tiers.map((tier, index) => {
              const channelNames = tier.channels.map((link) => link.channel.name).filter(Boolean);
              const tierLabel = tier.label?.trim() || (tiers.length > 1 ? `回饋層 ${index + 1}` : null);
              const rows = [
                { label: "回饋方式", value: formatRewardType(tier.rewardType) },
                { label: "回饋內容", value: tier.rate ?? "請依官方公告為準" },
                {
                  label: "回饋上限",
                  value: `${tier.cap ?? "請依官方公告為準"}${tier.capPeriod ? `（${tier.capPeriod}）` : ""}`
                },
                tier.minSpend ? { label: "使用門檻", value: tier.minSpend } : null,
                channelNames.length > 0 ? { label: "適用通路", value: channelNames.join("、") } : null,
                tier.conditionsText ? { label: "注意事項", value: tier.conditionsText } : null
              ].filter((row): row is { label: string; value: string } => row !== null);

              return (
                <div className={tiers.length > 1 ? "rounded-card border border-line p-5" : ""} key={tier.id}>
                  {tierLabel ? <p className="cl-tag mb-3">{tierLabel}</p> : null}
                  <dl className="grid gap-x-6 sm:grid-cols-2">
                    {rows.map((row) => (
                      <div className="border-t border-line py-3 sm:col-span-2" key={row.label}>
                        <dt className="text-[12px] font-[850] text-ink">{row.label}</dt>
                        <dd className="mt-1 whitespace-pre-line text-[12.5px] leading-relaxed text-muted">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[13px] leading-relaxed text-muted">回饋內容請依官方公告與銀行活動頁為準。</p>
        )}

        <div className="mt-5 grid gap-x-6 border-t border-line pt-2 sm:grid-cols-2">
          <div className="py-3">
            <p className="text-[12px] font-[850] text-ink">優惠期間</p>
            <p className="mt-1 text-[12.5px] text-muted">
              {periodStart ?? "未設定開始日"} － {periodEnd ?? "未設定結束日"}
            </p>
          </div>
          <div className="py-3">
            <p className="text-[12px] font-[850] text-ink">最後查證</p>
            <p className="mt-1 text-[12.5px] text-muted">{formatDate(resolvedOffer.lastVerifiedAt) ?? "尚未設定"}</p>
          </div>
          <div className="py-3 sm:col-span-2">
            <p className="text-[12px] font-[850] text-ink">官方來源</p>
            {resolvedOffer.sourceUrl ? (
              <a
                className="mt-1 inline-block text-[12.5px] font-[850] text-blue-deep underline"
                href={resolvedOffer.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                前往官方活動頁 ↗
              </a>
            ) : (
              <p className="mt-1 text-[12.5px] text-muted">尚未提供官方來源。</p>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <SectionHead copy="每張卡的適用條件可能不同，點進去可以看完整資訊。" title="適用信用卡" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {resolvedOffer.cards.length > 0 ? (
            resolvedOffer.cards.map((offerCard) => (
              <CardTile card={offerCard.card} key={`${offerCard.offerId}-${offerCard.cardId}`} />
            ))
          ) : (
            <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted sm:col-span-2 lg:col-span-3">
              尚未設定適用信用卡。
            </p>
          )}
        </div>
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
              offer.updatedAt.toISOString(),
              offer.tags ?? undefined
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
    </PageContainer>
  );
}
