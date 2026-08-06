import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCanonicalUrl } from "@/lib/domain-seo";
import { Breadcrumb, CardFoot, PageContainer } from "@/components/design-system";

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
    <PageContainer>
      <Breadcrumb items={[{ label: "首頁", href: "/" }, { label: "攻略文章" }]} />
      <p className="cl-eyebrow">Guides</p>
      <h1 className="cl-page-title">把回饋規則，說成生活聽得懂的事。</h1>
      <p className="cl-lead mt-3 max-w-xl">
        結論先行，附上官方來源與查證日期。不急著推薦你辦卡，先幫你把判斷的依據整理清楚。
      </p>

      <section className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {articles.length > 0 ? (
          articles.map((article) => (
            <Link className="cl-card flex flex-col justify-between" href={`/guides/${article.slug}`} key={article.id}>
              <div>
                <span className="cl-tag">攻略</span>
                <h2 className="mt-2.5 text-[18px] font-[850] leading-snug text-ink">{article.title}</h2>
                {article.summary ? (
                  <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-relaxed text-muted">{article.summary}</p>
                ) : null}
              </div>
              <CardFoot
                action="閱讀攻略"
                value={
                  article.lastVerifiedAt
                    ? `查證 ${new Date(article.lastVerifiedAt).toISOString().slice(0, 10)}`
                    : undefined
                }
              />
            </Link>
          ))
        ) : (
          <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted sm:col-span-2 lg:col-span-3">
            攻略文章陸續整理中，先從首頁的生活情境開始找也可以。
          </p>
        )}
      </section>
    </PageContainer>
  );
}
