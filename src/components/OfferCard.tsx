import Link from "next/link";
import { resolveSummaryPreview } from "@/lib/domain-parsing";
import type { Bank, Card, Offer } from "@prisma/client";

interface OfferCardProps {
  offer: Offer & {
    cards: { id?: number; offerId?: number; cardId?: number; card?: (Card & { bank?: Bank | null }) | null }[];
    category?: { name: string } | null;
  };
}

/**
 * [T28] 優惠列：契約規定必須有「類別、標題、摘要、meta、右側回饋值」，
 * 明確禁止只丟一個高回饋數字。回饋值放右側大字，其餘資訊維持在左側可掃讀。
 */
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
  const cardSources = offer.cards
    .map((item) => {
      if (!item.card) return null;
      return `${item.card.bank?.name ? `${item.card.bank.name} ` : ""}${item.card.name}`;
    })
    .filter(Boolean);

  return (
    <Link className="cl-card grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" href={`/offers/${offer.slug}`}>
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-[850] text-blue-deep">{offer.category?.name ?? "優惠"}</span>
          {offer.badgeLabel ? <span className="cl-tag">{offer.badgeLabel}</span> : null}
        </div>

        <h3 className="mt-1.5 text-[17px] font-[850] leading-snug text-ink">{offer.title}</h3>
        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-relaxed text-[#707179]">{summary}</p>

        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-[#707179]">
          {cardSources.length > 0 ? <span className="line-clamp-1">{cardSources.join("、")}</span> : null}
          <span>{offer.cards.length} 張適用卡片</span>
          {offer.endDate ? <span>截至 {new Date(offer.endDate).toLocaleDateString("zh-TW")}</span> : null}
          {offer.isFeatured ? <span className="font-[850] text-blue-deep">精選</span> : null}
        </div>
      </div>

      {offer.headlineRate ? (
        <div className="text-left tabular-nums sm:text-right">
          <p className="text-[19px] font-[850] leading-tight text-ink">{offer.headlineRate}</p>
          <p className="mt-1 text-[10px] text-[#707179]">查看活動條件 →</p>
        </div>
      ) : (
        <p className="text-[11px] font-[850] text-blue-deep sm:text-right">查看優惠 →</p>
      )}
    </Link>
  );
}
