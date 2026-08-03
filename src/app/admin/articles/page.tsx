import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createArticle, deleteArticle, toggleArticlePublish } from "@/lib/admin-actions";
import { AdminArticleForm } from "@/components/AdminArticleForm";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

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
        <AdminArticleForm action={createArticle} />
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
                  <ConfirmSubmitButton
                    action={deleteArticle}
                    confirmMessage={`確定要刪除「${article.title}」嗎？此操作無法復原。`}
                    hiddenFields={{ id: article.id }}
                    label="刪除"
                    tone="danger"
                  />
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
