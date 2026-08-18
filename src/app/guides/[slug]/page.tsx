import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import {
  generateArticleJsonLd,
  generateFaqJsonLd,
  generateBreadcrumbListJsonLd,
  getCanonicalUrl
} from "@/lib/domain-seo";
import { Breadcrumb, PageContainer, SectionHead } from "@/components/design-system";
import { taipeiDayKey } from "@/lib/domain-date";

interface GuidePageProps {
  params: {
    slug: string;
  };
}

/** [T28] 契約 4.3：文章維持單欄可閱讀寬度，不以卡片堆疊切碎內容；引用改用淡藍 callout。 */
const markdownComponents = {
  h1: (props: React.ComponentPropsWithoutRef<"h1">) => <h2 className="mt-9 text-[24px] font-[850] leading-snug text-ink" {...props} />,
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => <h2 className="mt-9 text-[24px] font-[850] leading-snug text-ink" {...props} />,
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => <h3 className="mt-7 text-[19px] font-[850] leading-snug text-ink" {...props} />,
  p: (props: React.ComponentPropsWithoutRef<"p">) => <p className="mt-4 text-[14px] leading-[1.9] text-prose" {...props} />,
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-[14px] leading-[1.9] text-prose" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-[14px] leading-[1.9] text-prose" {...props} />
  ),
  a: (props: React.ComponentPropsWithoutRef<"a">) => <a className="font-[850] text-blue-deep underline" {...props} />,
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => <strong className="font-[850] text-ink" {...props} />,
  blockquote: (props: React.ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="my-6 border-l-4 border-blue bg-blue-soft px-4 py-3 text-[13px] leading-relaxed text-callout-ink" {...props} />
  ),
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-[13px]" {...props} />
    </div>
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th className="border border-line bg-blue-soft px-3 py-2 text-left font-[850] text-ink" {...props} />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => (
    <td className="border border-line px-3 py-2 text-prose" {...props} />
  )
};

export async function generateMetadata({ params }: GuidePageProps) {
  const article = await prisma.article.findUnique({ where: { slug: params.slug } });

  if (!article || !article.isPublished) {
    return {};
  }

  return {
    title: article.seoTitle ?? `${article.title}｜信用卡優惠查詢網站`,
    description: article.seoDescription ?? article.summary ?? "信用卡選卡攻略。",
    alternates: {
      canonical: getCanonicalUrl(`/guides/${article.slug}`)
    }
  };
}

export default async function GuideDetailPage({ params }: GuidePageProps) {
  const article = await prisma.article.findUnique({ where: { slug: params.slug } });

  if (!article || !article.isPublished) {
    notFound();
  }

  const faqItems: { question: string; answer: string }[] = article.faqJson ? JSON.parse(article.faqJson) : [];
  const canonicalUrl = getCanonicalUrl(`/guides/${article.slug}`);
  const publishedAt = (article.publishedAt ?? article.createdAt).toISOString();
  const updatedAt = article.updatedAt.toISOString();

  return (
    <PageContainer className="max-w-[860px]">
      <Breadcrumb
        items={[{ label: "首頁", href: "/" }, { label: "攻略文章", href: "/guides" }, { label: article.title }]}
      />

      <article className="cl-panel">
        <p className="cl-eyebrow">Guide</p>
        <h1 className="mt-2 text-[28px] font-[850] leading-tight text-ink sm:text-[36px]">{article.title}</h1>
        {article.summary ? <p className="cl-lead mt-3">{article.summary}</p> : null}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4 text-[11px] font-[850] text-muted">
          <span>最後更新：{taipeiDayKey(article.updatedAt)}</span>
          {article.lastVerifiedAt ? (
            <span>最後查證：{taipeiDayKey(article.lastVerifiedAt)}</span>
          ) : null}
        </div>

        <div className="mt-2">
          <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
            {article.contentMd}
          </ReactMarkdown>
        </div>
      </article>

      {faqItems.length > 0 ? (
        <section className="mt-10">
          <SectionHead title="常見問題" />
          <div className="grid gap-3">
            {faqItems.map((item, index) => (
              <div className="rounded-card border border-line bg-paper p-5" key={index}>
                <p className="text-[14px] font-[850] text-ink">{item.question}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-muted">{item.answer}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <script
        id="guide-article-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateArticleJsonLd(
              article.title,
              article.seoDescription ?? article.summary ?? "信用卡選卡攻略。",
              canonicalUrl,
              publishedAt,
              updatedAt
            )
          )
        }}
      />

      <script
        id="guide-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateBreadcrumbListJsonLd([
              { name: "首頁", url: getCanonicalUrl("/") },
              { name: "攻略文章", url: getCanonicalUrl("/guides") },
              { name: article.title, url: canonicalUrl }
            ])
          )
        }}
      />

      {faqItems.length > 0 ? (
        <script
          id="guide-faq-jsonld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateFaqJsonLd(article.faqJson, canonicalUrl))
          }}
        />
      ) : null}
    </PageContainer>
  );
}
