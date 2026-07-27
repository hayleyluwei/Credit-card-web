import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateOffer } from "@/lib/admin-actions";
import { AdminOfferForm } from "@/components/AdminOfferForm";

export default async function AdminOfferEditPage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id, 10);
  const [offer, categories, cards] = await Promise.all([
    prisma.offer.findUnique({
      where: { id },
      include: { cards: true, tiers: { orderBy: { sortOrder: "asc" } } }
    }),
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    prisma.card.findMany({
      include: { bank: true },
      orderBy: [{ bank: { name: "asc" } }, { name: "asc" }]
    })
  ]);

  if (!offer) notFound();

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-5 py-8">
      <header className="mb-6 border-b border-line pb-5">
        <p className="text-sm font-semibold text-brand-700">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-ink">編輯優惠</h1>
        <p className="mt-2 text-sm text-slate-600">{offer.isPublished ? "目前狀態：已發布" : "目前狀態：草稿"}</p>
      </header>
      <AdminOfferForm action={updateOffer} cards={cards} categories={categories} offer={offer} />
    </main>
  );
}
