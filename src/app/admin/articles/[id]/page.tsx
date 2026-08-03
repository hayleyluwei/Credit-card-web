import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateArticle } from "@/lib/admin-actions";
import { AdminArticleForm } from "@/components/AdminArticleForm";

export default async function AdminArticleEditPage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({ where: { id: Number(params.id) } });
  if (!article) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-ink">編輯文章</h1>
      <p className="mt-2 text-sm text-slate-600">狀態：{article.isPublished ? "已發布" : "草稿"}</p>
      <section className="mt-6 rounded-md border border-line bg-white p-6 shadow-soft">
        <AdminArticleForm action={updateArticle} article={article} />
      </section>
    </main>
  );
}
