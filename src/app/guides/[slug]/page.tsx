import { notFound } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { prisma } from "@/lib/prisma";
import {
  generateArticleJsonLd,
  generateFaqJsonLd,
  generateBreadcrumbListJsonLd,
  getCanonicalUrl
} from "@/lib/domain-seo";

interface GuidePageProps {
  params: {
    slug: string;
  };
}

const markdownComponents = {
  h1: (props: React.ComponentPropsWithoutRef<"h1">) => <h2 className="mt-8 text-2xl font-bold text-ink" {...props} />,
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => <h2 className="mt-8 text-2xl font-bold text-ink" {...props} />,
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => <h3 className="mt-6 text-xl font-bold text-ink" {...props} />,
  p: (props: React.ComponentPropsWithoutRef<"p">) => <p className="mt-4 text-base leading-7 text-slate-700" {...props} />,
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-slate-700" {...props} />,
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-7 text-slate-700" {...props} />,
  a: (props: React.ComponentPropsWithoutRef<"a">) => <a className="font-semibold text-brand-700 underline" {...props} />,
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => <strong className="font-bold text-ink" {...props} />,
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th className="border border-line bg-paper px-3 py-2 text-left font-bold text-ink" {...props} />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => <td className="border border-line px-3 py-2 text-slate-700" {...props} />
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
    <main className="mx-auto min-h-screen w-full max-w-3xl px-5 py-8 sm:px-8 lg:px-10">
      <header className="mb-10 border-b border-line pb-6">
        <nav className="text-sm font-semibold text-brand-700">
          <Link href="/">首頁</Link>
          <span className="mx-2">/</span>
          <Link href="/guides">攻略文章</Link>
          <span className="mx-2">/</span>
          {article.title}
        </nav>
        <h1 className="mt-4 text-3xl font-bold text-ink">{article.title}</h1>
        {article.summary ? <p className="mt-3 text-base leading-7 text-slate-700">{article.summary}</p> : null}
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
          <span>最後更新：{new Date(article.updatedAt).toISOString().slice(0, 10)}</span>
          {article.lastVerifiedAt ? <span>最後查證：{new Date(article.lastVerifiedAt).toISOString().slice(0, 10)}</span> : null}
        </div>
      </header>

      <article>
        <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
          {article.contentMd}
        </ReactMarkdown>
      </article>

      {faqItems.length > 0 ? (
        <section className="mt-12 border-t border-line pt-8">
          <h2 className="text-2xl font-bold text-ink">常見問題</h2>
          <div className="mt-4 space-y-4">
            {faqItems.map((item, index) => (
              <div className="rounded-2xl border border-line bg-white p-4 shadow-soft" key={index}>
                <p className="text-sm font-semibold text-ink">{item.question}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.answer}</p>
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
    </main>
  );
}
