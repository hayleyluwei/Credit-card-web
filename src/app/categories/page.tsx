import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CategoryCard } from "@/components/CategoryCard";
import { getCanonicalUrl } from "@/lib/domain-seo";

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
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-10 border-b border-line pb-6">
        <nav className="text-sm font-semibold text-brand-700">
          <Link href="/">首頁</Link>
          <span className="mx-2">/</span>
          分類列表
        </nav>
        <h1 className="mt-4 text-3xl font-bold text-ink">優惠分類</h1>
        <p className="mt-3 text-base leading-7 text-slate-700">
          依照分類快速瀏覽公開優惠，找到最適合自己的信用卡活動類型。
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => {
          const count = offerCounts.find((item) => item.categoryId === category.id)?.count ?? 0;
          return <CategoryCard key={category.id} category={category} offerCount={count} />;
        })}
      </section>
    </main>
  );
}
