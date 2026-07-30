import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateArticle } from "@/lib/admin-actions";
import { AdminField, adminInputClass } from "@/components/AdminField";
import { StableSlugInput } from "@/components/StableSlugInput";

function dateInput(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export default async function AdminArticleEditPage({ params }: { params: { id: string } }) {
  const article = await prisma.article.findUnique({ where: { id: Number(params.id) } });
  if (!article) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-ink">編輯文章</h1>
      <p className="mt-2 text-sm text-slate-600">狀態：{article.isPublished ? "已發布" : "草稿"}</p>
      <form action={updateArticle} className="mt-6 grid gap-4 rounded-md border border-line bg-white p-6 shadow-soft">
        <input name="id" type="hidden" value={article.id} />
        <AdminField label="標題">
          <input className={adminInputClass} name="title" required defaultValue={article.title} />
        </AdminField>
        <AdminField label="Slug" help="Slug 會影響公開網址，修改時會跳出確認提醒。">
          <StableSlugInput defaultValue={article.slug} required />
        </AdminField>
        <AdminField label="摘要">
          <textarea className={adminInputClass} name="summary" rows={2} defaultValue={article.summary ?? ""} />
        </AdminField>
        <AdminField label="最後查證日期">
          <input className={adminInputClass} name="lastVerifiedAt" type="date" defaultValue={dateInput(article.lastVerifiedAt)} />
        </AdminField>
        <AdminField label="內文（Markdown）" help="支援表格語法；不接受 raw HTML，會以純文字顯示。">
          <textarea className={adminInputClass} name="contentMd" rows={16} required defaultValue={article.contentMd} />
        </AdminField>
        <AdminField label="SEO 標題">
          <input className={adminInputClass} name="seoTitle" defaultValue={article.seoTitle ?? ""} />
        </AdminField>
        <AdminField label="SEO 描述">
          <textarea className={adminInputClass} name="seoDescription" rows={2} defaultValue={article.seoDescription ?? ""} />
        </AdminField>
        <AdminField label="FAQ JSON" help='格式：[{"question":"問題","answer":"答案"}]，留空則不顯示 FAQ 區塊。'>
          <textarea className={adminInputClass} name="faqJson" rows={4} defaultValue={article.faqJson ?? ""} />
        </AdminField>
        <button className="rounded-md bg-brand-700 px-4 py-3 text-sm font-semibold text-white" type="submit">
          儲存文章
        </button>
      </form>
    </main>
  );
}
