import Link from "next/link";
import { isOfferExpired } from "@/lib/domain-offers";
import { resolveSummaryPreview } from "@/lib/domain-parsing";
import type { Bank, Card, Offer } from "@prisma/client";

interface OfferCardProps {
  offer: Offer & {
    cards: { id?: number; offerId?: number; cardId?: number; card?: (Card & { bank?: Bank | null }) | null }[];
    category?: { name: string } | null;
  };
}

export function OfferCard({ offer }: OfferCardProps) {
  const summary =
    offer.summaryPreview?.trim() ||
    resolveSummaryPreview({
      manualSummary: offer.manualSummary,
      highlight1: offer.highlight1,
      highlight2: offer.highlight2,
      summaryPreview: offer.summary,
      title: offer.title
    });
  const expired = isOfferExpired(offer);
  const cardSources = offer.cards
    .map((item) => {
      if (!item.card) return null;
      return `${item.card.bank?.name ? `${item.card.bank.name} ` : ""}${item.card.name}`;
    })
    .filter(Boolean);

  return (
    <article className="group rounded-3xl border border-line bg-white p-6 shadow-soft transition duration-200 hover:-translate-y-1 hover:border-brand-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-700">{offer.category?.name ?? "優惠"}</p>
          <h3 className="mt-2 text-xl font-bold text-ink">{offer.title}</h3>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            expired ? "bg-red-100 text-red-700" : "bg-brand-100 text-brand-800"
          }`}
        >
          {expired ? "已過期" : "進行中"}
        </span>
      </div>

      <p className="mt-4 text-sm leading-6 text-slate-600">{summary}</p>

      {cardSources.length > 0 ? (
        <p className="mt-3 text-sm leading-6 text-slate-600">{cardSources.join("、")}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
        <span>{offer.cards.length} 張適用卡片</span>
        {offer.headlineRate ? <span>回饋：{offer.headlineRate}</span> : null}
        {offer.endDate ? <span>截至 {new Date(offer.endDate).toLocaleDateString("zh-TW")}</span> : null}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Link
          href={`/offers/${offer.slug}`}
          className="rounded-full bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          查看優惠
        </Link>
        <span className="text-sm text-slate-500">{offer.isFeatured ? "精選" : "一般"}</span>
      </div>
    </article>
  );
}
