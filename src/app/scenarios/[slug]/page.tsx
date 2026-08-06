import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPublicOffers, sortOffers } from "@/lib/domain-offers";
import { OfferCard } from "@/components/OfferCard";
import { generateWebPageJsonLd, getCanonicalUrl } from "@/lib/domain-seo";
import { getScenarioTagBySlug, offerHasTag, SCENARIO_TAGS } from "@/lib/domain-scenarios";
import { getScenarioCopy } from "@/lib/domain-scenario-copy";
import { Breadcrumb, CardFoot, PageContainer, SectionHead } from "@/components/design-system";

interface ScenarioPageProps {
  params: {
    slug: string;
  };
}

export function generateStaticParams() {
  return SCENARIO_TAGS.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({ params }: ScenarioPageProps) {
  const scenario = getScenarioTagBySlug(params.slug);

  if (!scenario) {
    return {};
  }

  return {
    title: `${scenario.pageTitle}｜信用卡優惠查詢網站`,
    description: scenario.seoDescription,
    alternates: {
      canonical: getCanonicalUrl(`/scenarios/${scenario.slug}`)
    }
  };
}

export default async function ScenarioDetailPage({ params }: ScenarioPageProps) {
  const scenario = getScenarioTagBySlug(params.slug);

  if (!scenario) {
    notFound();
  }

  const [siteSetting, offers, guide] = await Promise.all([
    prisma.siteSetting.findFirst(),
    prisma.offer.findMany({
      where: { isPublished: true },
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
      }
    }),
    // 情境頁與攻略文章的第一版關聯方式：slug 相同即視為對應攻略文（見任務卡風險項）。
    prisma.article.findFirst({
      where: { slug: scenario.slug, isPublished: true }
    })
  ]);

  const taggedOffers = offers.filter((offer) => offerHasTag(offer.tags, scenario.tagLabel));
  const publicOffers = getPublicOffers(taggedOffers, siteSetting?.showExpiredOffers ?? false);
  const sortedOffers = sortOffers(publicOffers);
  const canonicalUrl = getCanonicalUrl(`/scenarios/${scenario.slug}`);

  const copy = getScenarioCopy(scenario.slug, scenario.tagLabel);

  /**
   * 14 個情境標籤中有幾個目前還沒有任何優惠資料（規格先行、資料待補）。
   * 沒有資料時頁面會非常單薄而且是死路，因此一律附上其他「確實有資料」的情境當出口。
   */
  const otherScenarios = SCENARIO_TAGS.filter((entry) => entry.slug !== scenario.slug)
    .map((entry) => ({
      entry,
      count: getPublicOffers(
        offers.filter((offer) => offerHasTag(offer.tags, entry.tagLabel)),
        siteSetting?.showExpiredOffers ?? false
      ).length
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首頁", href: "/" }, { label: "生活情境" }, { label: scenario.tagLabel }]} />
      <p className="cl-eyebrow">Scenario</p>
      <h1 className="cl-page-title max-w-3xl text-balance">{copy.title}</h1>
      <p className="cl-lead mt-3 max-w-xl">{scenario.seoDescription}</p>

      <section className="mt-9">
        <SectionHead
          action={{ href: "/search", label: "搜尋更多" }}
          copy="先看重點，完整條件點進去都查得到。"
          title={`${scenario.tagLabel}相關的優惠`}
        />
        <div className="grid gap-3">
          {sortedOffers.length > 0 ? (
            sortedOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
          ) : (
            <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted">
              這個情境還在整理中，目前沒有已發布的優惠。下面有幾個現在就找得到東西的情境。
            </p>
          )}
        </div>
      </section>

      {otherScenarios.length > 0 ? (
        <section className="mt-9">
          <SectionHead
            copy={sortedOffers.length > 0 ? "順手看看其他常用的情境。" : "這些情境現在都有整理好的優惠。"}
            title="其他生活情境"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {otherScenarios.map(({ entry, count }) => {
              const otherCopy = getScenarioCopy(entry.slug, entry.tagLabel);
              return (
                <Link className="cl-card flex flex-col justify-between" href={`/scenarios/${entry.slug}`} key={entry.slug}>
                  <div>
                    <span className="cl-tag">{otherCopy.group}</span>
                    <h3 className="mt-2.5 text-[17px] font-[850] leading-snug text-ink">{otherCopy.title}</h3>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{otherCopy.description}</p>
                  </div>
                  <CardFoot action={`${count} 筆優惠`} value={entry.tagLabel} />
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      {guide ? (
        <section className="mt-9">
          <div className="rounded-panel border border-line bg-blue-soft p-6">
            <p className="cl-eyebrow">延伸閱讀</p>
            <h2 className="mt-2 text-[20px] font-[850] leading-snug text-ink">想看更深入的整理？</h2>
            <p className="mt-2 text-[13px] leading-relaxed text-muted">
              攻略文章裡有結論判斷、比較表與常見問題，適合想一次弄懂的時候看。
            </p>
            <Link className="mt-3 inline-flex items-center rounded-control bg-blue px-4 py-2.5 text-[13px] font-[850] text-white transition hover:bg-blue-deep" href={`/guides/${guide.slug}`}>
              閱讀《{guide.title}》→
            </Link>
          </div>
        </section>
      ) : null}

      <script
        id="scenario-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateWebPageJsonLd(`${scenario.pageTitle}｜信用卡優惠查詢網站`, scenario.seoDescription, canonicalUrl))
        }}
      />
    </PageContainer>
  );
}
