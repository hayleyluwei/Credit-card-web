import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateBank } from "@/lib/admin-actions";
import { AdminField, adminInputClass } from "@/components/AdminField";
import { StableSlugInput } from "@/components/StableSlugInput";

export default async function AdminBankEditPage({ params }: { params: { id: string } }) {
  const bank = await prisma.bank.findUnique({ where: { id: Number(params.id) } });
  if (!bank) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-ink">編輯銀行</h1>
      <form action={updateBank} className="mt-6 grid gap-4 rounded-md border border-line bg-white p-6 shadow-soft">
        <input name="id" type="hidden" value={bank.id} />
        <AdminField label="銀行名稱"><input className={adminInputClass} name="name" required defaultValue={bank.name} /></AdminField>
        <AdminField label="Slug" help="Slug 會影響公開網址，修改時會跳出確認提醒。"><StableSlugInput defaultValue={bank.slug} required /></AdminField>
        <AdminField label="Logo URL"><input className={adminInputClass} name="logoUrl" defaultValue={bank.logoUrl ?? ""} /></AdminField>
        <AdminField label="Logo Alt"><input className={adminInputClass} name="logoAlt" defaultValue={bank.logoAlt ?? ""} /></AdminField>
        <AdminField label="網站 URL"><input className={adminInputClass} name="websiteUrl" defaultValue={bank.websiteUrl ?? ""} /></AdminField>
        <AdminField label="描述"><textarea className={adminInputClass} name="description" rows={3} defaultValue={bank.description ?? ""} /></AdminField>
        <AdminField label="SEO 標題"><input className={adminInputClass} name="seoTitle" defaultValue={bank.seoTitle ?? ""} /></AdminField>
        <AdminField label="SEO 描述"><textarea className={adminInputClass} name="seoDescription" rows={3} defaultValue={bank.seoDescription ?? ""} /></AdminField>
        <label className="flex items-center gap-3 text-sm font-semibold"><input name="isActive" type="checkbox" defaultChecked={bank.isActive} />啟用</label>
        <button className="rounded-md bg-brand-700 px-4 py-3 text-sm font-semibold text-white" type="submit">儲存銀行</button>
      </form>
    </main>
  );
}
