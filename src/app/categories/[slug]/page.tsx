import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getPublicOffers, sortOffers } from "@/lib/domain-offers";
import { OfferCard } from "@/components/OfferCard";
import { generateWebPageJsonLd, generateFaqJsonLd, getCanonicalUrl } from "@/lib/domain-seo";

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug }
  });

  if (!category) {
    return {};
  }

  return {
    title: category.seoTitle ?? `${category.name}｜信用卡優惠查詢網站`,
    description: category.seoDescription ?? category.description ?? "瀏覽分類優惠。",
    alternates: {
      canonical: getCanonicalUrl(`/categories/${category.slug}`)
    }
  };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const category = await prisma.category.findUnique({
    where: { slug: params.slug },
    include: {
      offers: {
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
      }
    }
  });

  if (!category || !category.isActive) {
    notFound();
  }

  const siteSetting = await prisma.siteSetting.findFirst();
  const faqItems = category.faqJson ? JSON.parse(category.faqJson ?? "[]") : [];
  const publicOffers = getPublicOffers(category.offers, siteSetting?.showExpiredOffers ?? false);
  const sortedOffers = sortOffers(publicOffers);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-10 border-b border-line pb-6">
        <nav className="text-sm font-semibold text-brand-700">
          <Link href="/">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/categories">分類列表</Link>
          <span className="mx-2">/</span>
          {category.name}
        </nav>
        <h1 className="mt-4 text-3xl font-bold text-ink">{category.name}</h1>
        <p className="mt-3 text-base leading-7 text-slate-700">{category.description ?? "這個分類包含多種精選信用卡優惠。"}</p>
      </header>

      <section className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="space-y-8">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <h2 className="text-2xl font-bold text-ink">{category.name} 優惠</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              已發布優惠會依據推薦排序顯示，請進入優惠詳情確認適用信用卡、消費門檻、回饋上限與官方條件。
            </p>
          </div>

          <div className="space-y-4">
            {sortedOffers.length > 0 ? (
              sortedOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
            ) : (
              <div className="rounded-3xl border border-line bg-white p-8 text-center text-slate-600 shadow-soft">
                目前沒有可公開顯示的優惠。
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            <h2 className="text-xl font-bold text-ink">分類說明</h2>
            <p className="mt-4 text-sm leading-6 text-slate-600">{category.description ?? "整理此分類下常見的信用卡優惠與活動。"}</p>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              先確認你手上的信用卡是否適用，再比較回饋上限、最低消費、活動期間與官方限制。
            </div>
          </div>

          {faqItems.length > 0 ? (
            <div className="rounded-3xl border border-line bg-white p-6 shadow-soft">
              <h2 className="text-xl font-bold text-ink">常見問題</h2>
              <div className="mt-4 space-y-4">
                {faqItems.slice(0, 2).map((item: { question: string; answer: string }, index: number) => (
                  <div key={index}>
                    <p className="text-sm font-semibold text-ink">{item.question}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </aside>
      </section>

      <script
        id="category-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateWebPageJsonLd(
              category.seoTitle ?? `${category.name}｜信用卡優惠查詢網站`,
              category.seoDescription ?? category.description ?? "瀏覽分類優惠。",
              getCanonicalUrl(`/categories/${category.slug}`)
            )
          )
        }}
      />

      {faqItems.length > 0 ? (
        <script
          id="faq-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFaqJsonLd(category.faqJson, getCanonicalUrl(`/categories/${category.slug}`)))
          }}
        />
      ) : null}
    </main>
  );
}
