import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPublicOffers, sortOffers } from "@/lib/domain-offers";
import { OfferCard } from "@/components/OfferCard";
import { generateWebPageJsonLd, generateFaqJsonLd, getCanonicalUrl } from "@/lib/domain-seo";
import { Breadcrumb, PageContainer, SectionHead } from "@/components/design-system";

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
    <PageContainer>
      <Breadcrumb
        items={[{ label: "首頁", href: "/" }, { label: "分類列表", href: "/categories" }, { label: category.name }]}
      />
      <p className="cl-eyebrow">Category</p>
      <h1 className="cl-page-title">{category.name}</h1>
      <p className="cl-lead mt-3 max-w-xl">{category.description ?? "這個分類包含多種信用卡優惠。"}</p>

      <section className="mt-9">
        <SectionHead
          copy="依推薦排序顯示。進入優惠詳情可以確認適用卡片、消費門檻、回饋上限與官方條件。"
          title={`${category.name}的優惠`}
        />
        <div className="grid gap-3">
          {sortedOffers.length > 0 ? (
            sortedOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
          ) : (
            <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted">
              目前沒有可公開顯示的優惠。
            </p>
          )}
        </div>
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
    </PageContainer>
  );
}
