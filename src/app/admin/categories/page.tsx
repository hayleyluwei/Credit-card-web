import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createCategory, toggleCategory } from "@/lib/admin-actions";
import { AdminField, adminInputClass } from "@/components/AdminField";

export default async function AdminCategoriesPage() {
  const categories = await prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-5 py-8">
      <header className="mb-6 border-b border-line pb-5"><p className="text-sm font-semibold text-brand-700">Admin</p><h1 className="mt-2 text-3xl font-bold text-ink">分類管理</h1></header>
      <section className="mb-6 rounded-md border border-line bg-white p-5 shadow-soft">
        <h2 className="text-xl font-bold text-ink">新增分類</h2>
        <form action={createCategory} className="mt-4 grid gap-4 md:grid-cols-2">
          <AdminField label="分類名稱"><input className={adminInputClass} name="name" required /></AdminField>
          <AdminField label="Slug"><input className={adminInputClass} name="slug" /></AdminField>
          <AdminField label="Icon"><input className={adminInputClass} name="iconName" /></AdminField>
          <AdminField label="排序"><input className={adminInputClass} name="sortOrder" type="number" defaultValue={0} /></AdminField>
          <AdminField label="描述"><textarea className={adminInputClass} name="description" rows={2} /></AdminField>
          <AdminField label="FAQ JSON"><textarea className={adminInputClass} name="faqJson" rows={2} /></AdminField>
          <AdminField label="SEO 標題"><input className={adminInputClass} name="seoTitle" /></AdminField>
          <AdminField label="SEO 描述"><textarea className={adminInputClass} name="seoDescription" rows={2} /></AdminField>
          <label className="flex items-center gap-3 text-sm font-semibold"><input defaultChecked name="isActive" type="checkbox" />啟用</label>
          <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white" type="submit">新增分類</button>
        </form>
      </section>
      <section className="grid gap-3">
        {categories.map((category) => (
          <article className="rounded-md border border-line bg-white p-4 shadow-soft" key={category.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-bold">{category.name}</h2><p className="text-sm text-slate-600">排序：{category.sortOrder} · {category.isActive ? "啟用" : "停用"}</p></div>
              <div className="flex gap-2">
                <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold" href={`/admin/categories/${category.id}`}>編輯</Link>
                <form action={toggleCategory}>
                  <input name="id" type="hidden" value={category.id} />
                  <input name="nextIsActive" type="hidden" value={category.isActive ? "" : "on"} />
                  <button className="rounded-md border border-line px-3 py-2 text-sm font-semibold" type="submit">{category.isActive ? "停用" : "啟用"}</button>
                </form>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
