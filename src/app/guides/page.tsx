import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCanonicalUrl } from "@/lib/domain-seo";

export async function generateMetadata() {
  return {
    title: "攻略文章｜信用卡優惠查詢網站",
    description: "整理繳稅、學費、旅遊等情境的信用卡選卡攻略，結論先行、附官方來源與查證日期。",
    alternates: {
      canonical: getCanonicalUrl("/guides")
    }
  };
}

export default async function GuidesPage() {
  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" }
  });

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-10 border-b border-line pb-6">
        <Link className="text-sm font-semibold text-brand-700" href="/">
          首頁
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-ink">攻略文章</h1>
        <p className="mt-3 text-base leading-7 text-slate-700">情境式選卡整理，結論先行、附官方來源與查證日期。</p>
      </header>

      <section className="grid gap-4">
        {articles.length > 0 ? (
          articles.map((article) => (
            <Link
              className="block rounded-3xl border border-line bg-white p-6 shadow-soft transition hover:border-brand-300"
              href={`/guides/${article.slug}`}
              key={article.id}
            >
              <h2 className="text-xl font-bold text-ink">{article.title}</h2>
              {article.summary ? <p className="mt-2 text-sm leading-6 text-slate-600">{article.summary}</p> : null}
              {article.lastVerifiedAt ? (
                <p className="mt-3 text-xs font-semibold text-slate-500">
                  最後查證日期：{new Date(article.lastVerifiedAt).toISOString().slice(0, 10)}
                </p>
              ) : null}
            </Link>
          ))
        ) : (
          <div className="rounded-3xl border border-line bg-white p-8 text-center text-slate-600 shadow-soft">
            目前還沒有已發布的攻略文章。
          </div>
        )}
      </section>
    </main>
  );
}
