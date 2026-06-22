import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCategory } from "@/lib/admin-actions";
import { AdminField, adminInputClass } from "@/components/AdminField";
import { StableSlugInput } from "@/components/StableSlugInput";

export default async function AdminCategoryEditPage({ params }: { params: { id: string } }) {
  const category = await prisma.category.findUnique({ where: { id: Number(params.id) } });
  if (!category) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-ink">編輯分類</h1>
      <form action={updateCategory} className="mt-6 grid gap-4 rounded-md border border-line bg-white p-6 shadow-soft">
        <input name="id" type="hidden" value={category.id} />
        <AdminField label="分類名稱"><input className={adminInputClass} name="name" required defaultValue={category.name} /></AdminField>
        <AdminField label="Slug" help="Slug 會影響公開網址，修改時會跳出確認提醒。"><StableSlugInput defaultValue={category.slug} required /></AdminField>
        <AdminField label="Icon"><input className={adminInputClass} name="iconName" defaultValue={category.iconName ?? ""} /></AdminField>
        <AdminField label="排序"><input className={adminInputClass} name="sortOrder" type="number" defaultValue={category.sortOrder} /></AdminField>
        <AdminField label="描述"><textarea className={adminInputClass} name="description" rows={3} defaultValue={category.description ?? ""} /></AdminField>
        <AdminField label="FAQ JSON"><textarea className={adminInputClass} name="faqJson" rows={4} defaultValue={category.faqJson ?? ""} /></AdminField>
        <AdminField label="SEO 標題"><input className={adminInputClass} name="seoTitle" defaultValue={category.seoTitle ?? ""} /></AdminField>
        <AdminField label="SEO 描述"><textarea className={adminInputClass} name="seoDescription" rows={3} defaultValue={category.seoDescription ?? ""} /></AdminField>
        <label className="flex items-center gap-3 text-sm font-semibold"><input name="isActive" type="checkbox" defaultChecked={category.isActive} />啟用</label>
        <button className="rounded-md bg-brand-700 px-4 py-3 text-sm font-semibold text-white" type="submit">儲存分類</button>
      </form>
    </main>
  );
}
