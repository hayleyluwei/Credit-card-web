import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createArticle, toggleArticlePublish } from "@/lib/admin-actions";
import { AdminField, adminInputClass } from "@/components/AdminField";

export default async function AdminArticlesPage() {
  const articles = await prisma.article.findMany({ orderBy: { updatedAt: "desc" } });

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8">
      <header className="mb-6 border-b border-line pb-5">
        <p className="text-sm font-semibold text-brand-700">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">攻略文章管理</h1>
      </header>

      <section className="mb-6 rounded-md border border-line bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold text-ink">新增文章</h2>
        <form action={createArticle} className="mt-4 grid gap-4 md:grid-cols-2">
          <AdminField label="標題">
            <input className={adminInputClass} name="title" required />
          </AdminField>
          <AdminField label="Slug" help="留空會自動依標題產生，建立後不建議修改。">
            <input className={adminInputClass} name="slug" />
          </AdminField>
          <AdminField label="摘要">
            <textarea className={adminInputClass} name="summary" rows={2} />
          </AdminField>
          <AdminField label="最後查證日期">
            <input className={adminInputClass} name="lastVerifiedAt" type="date" />
          </AdminField>
          <div className="md:col-span-2">
            <AdminField label="內文（Markdown）" help="支援表格語法；不接受 raw HTML，會以純文字顯示。">
              <textarea className={adminInputClass} name="contentMd" rows={12} required />
            </AdminField>
          </div>
          <AdminField label="SEO 標題">
            <input className={adminInputClass} name="seoTitle" />
          </AdminField>
          <AdminField label="SEO 描述">
            <textarea className={adminInputClass} name="seoDescription" rows={2} />
          </AdminField>
          <div className="md:col-span-2">
            <AdminField label="FAQ JSON" help='格式：[{"question":"問題","answer":"答案"}]，留空則不顯示 FAQ 區塊。'>
              <textarea className={adminInputClass} name="faqJson" rows={4} />
            </AdminField>
          </div>
          <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white md:col-span-2" type="submit">
            新增文章（草稿）
          </button>
        </form>
      </section>

      <section className="grid gap-3">
        {articles.length === 0 ? (
          <div className="rounded-md border border-line bg-white p-6 text-center text-slate-600 shadow-soft">尚無文章。</div>
        ) : (
          articles.map((article) => (
            <article className="rounded-md border border-line bg-white p-4 shadow-soft" key={article.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-bold">{article.title}</h2>
                  <p className="text-sm text-slate-600">
                    /guides/{article.slug} · {article.isPublished ? "已發布" : "草稿"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold" href={`/admin/articles/${article.id}`}>
                    編輯
                  </Link>
                  <form action={toggleArticlePublish}>
                    <input name="id" type="hidden" value={article.id} />
                    <input name="nextIsPublished" type="hidden" value={article.isPublished ? "" : "on"} />
                    <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" type="submit">
                      {article.isPublished ? "下架" : "發布"}
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
