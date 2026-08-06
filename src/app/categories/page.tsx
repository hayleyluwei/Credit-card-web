import { prisma } from "@/lib/prisma";
import { CategoryCard } from "@/components/CategoryCard";
import { getCanonicalUrl } from "@/lib/domain-seo";
import { Breadcrumb, PageContainer } from "@/components/design-system";

export const metadata = {
  title: "分類列表｜信用卡優惠查詢網站",
  description: "瀏覽所有信用卡優惠分類，快速進入現金回饋、餐飲、美食、旅遊等優惠頁面。",
  alternates: {
    canonical: getCanonicalUrl("/categories")
  }
};

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" }
  });

  const offerCounts = await Promise.all(
    categories.map(async (category) => {
      const count = await prisma.offer.count({
        where: { categoryId: category.id, isPublished: true }
      });
      return { categoryId: category.id, count };
    })
  );

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首頁", href: "/" }, { label: "分類列表" }]} />
      <p className="cl-eyebrow">Browse categories</p>
      <h1 className="cl-page-title">從你在意的回饋開始</h1>
      <p className="cl-lead mt-3 max-w-xl">
        還沒有明確想完成的事也沒關係，先看看有哪些類型的回饋，再決定要不要深入。
      </p>

      <section className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => {
          const count = offerCounts.find((item) => item.categoryId === category.id)?.count ?? 0;
          return <CategoryCard category={category} key={category.id} offerCount={count} toneIndex={index} />;
        })}
      </section>
    </PageContainer>
  );
}
