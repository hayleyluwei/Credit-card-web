import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateCardWithState } from "@/lib/admin-actions";
import { AdminCardForm } from "@/components/AdminCardForm";

export default async function AdminCardEditPage({ params }: { params: { id: string } }) {
  const [card, banks] = await Promise.all([
    prisma.card.findUnique({ where: { id: Number(params.id) } }),
    prisma.bank.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })
  ]);

  if (!card) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-4xl px-5 py-8">
      <h1 className="text-3xl font-bold text-ink">編輯信用卡</h1>
      <p className="mt-3 text-sm text-slate-600">
        儲存成功後可以回到信用卡管理列表或後台首頁；查看公開頁會另開新分頁。
      </p>
      <AdminCardForm action={updateCardWithState} banks={banks} card={card} />
    </main>
  );
}
