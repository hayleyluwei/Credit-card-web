import { prisma } from "@/lib/prisma";
import { createOffer } from "@/lib/admin-actions";
import { AdminOfferForm } from "@/components/AdminOfferForm";

export default async function AdminOfferNewPage() {
  const [categories, cards] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.card.findMany({
      where: { isActive: true },
      include: { bank: true },
      orderBy: [{ bank: { name: "asc" } }, { name: "asc" }]
    })
  ]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8">
      <header className="mb-6 border-b border-line pb-5">
        <p className="text-sm font-semibold text-brand-700">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">新增優惠</h1>
      </header>
      <AdminOfferForm action={createOffer} cards={cards} categories={categories} />
    </main>
  );
}
