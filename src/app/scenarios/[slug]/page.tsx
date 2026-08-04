import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPublicOffers, sortOffers } from "@/lib/domain-offers";
import { OfferCard } from "@/components/OfferCard";
import { generateWebPageJsonLd, getCanonicalUrl } from "@/lib/domain-seo";
import { getScenarioTagBySlug, offerHasTag, SCENARIO_TAGS } from "@/lib/domain-scenarios";

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

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-10 border-b border-line pb-6">
        <nav className="text-sm font-semibold text-brand-700">
          <Link href="/">首頁</Link>
          <span className="mx-2">/</span>
          {scenario.pageTitle}
        </nav>
        <h1 className="mt-4 text-3xl font-bold text-ink">{scenario.pageTitle}</h1>
        <p className="mt-3 text-base leading-7 text-slate-700">{scenario.seoDescription}</p>
      </header>

      <section className="space-y-8">
        <div className="space-y-4">
          {sortedOffers.length > 0 ? (
            sortedOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
          ) : (
            <div className="rounded-3xl border border-line bg-white p-8 text-center text-slate-600 shadow-soft">
              目前還沒有標註「{scenario.tagLabel}」情境的已發布優惠，之後有相關資料會更新在這裡。
            </div>
          )}
        </div>

        {guide ? (
          <div className="rounded-3xl border border-line bg-brand-50 p-6 shadow-soft">
            <h2 className="text-lg font-bold text-ink">找不到更深入的整理？</h2>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              查看攻略文章，有結論判斷、比較表與常見問題整理。
            </p>
            <Link className="mt-3 inline-block text-sm font-semibold text-brand-700 underline" href={`/guides/${guide.slug}`}>
              閱讀《{guide.title}》
            </Link>
          </div>
        ) : null}
      </section>

      <script
        id="scenario-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(generateWebPageJsonLd(`${scenario.pageTitle}｜信用卡優惠查詢網站`, scenario.seoDescription, canonicalUrl))
        }}
      />
    </main>
  );
}
