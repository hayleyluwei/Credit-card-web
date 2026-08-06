import Link from "next/link";
import type { Bank, Card } from "@prisma/client";
import { CardImage } from "@/components/CardImage";
import { CardFoot } from "@/components/design-system";

/**
 * [T28] 信用卡磚：首頁、/cards 與 /banks/[slug] 共用。
 * 卡面沿用 T23 既有 SVG 與配色（本任務 Non-scope，不修改），這裡只負責外圍版面：
 * 卡面約 72% 寬、水平置中，其餘資訊維持可掃讀。
 */
export function CardTile({
  card,
  offerCount,
  className = ""
}: {
  card: Card & { bank: Bank };
  /** 留空代表這個情境下不談優惠筆數（例如優惠詳情頁的「適用信用卡」）。 */
  offerCount?: number;
  className?: string;
}) {
  return (
    <Link className={`cl-card flex flex-col justify-between ${className}`} href={`/cards/${card.slug}`}>
      <div>
        <div className="mx-auto mb-3 w-[72%] max-w-[212px]">
          <CardImage
            alt={card.imageAlt}
            bankName={card.bank.name}
            cardBgColorFrom={card.cardBgColorFrom}
            cardBgColorTo={card.cardBgColorTo}
            cardChipColorFrom={card.cardChipColorFrom}
            cardChipColorTo={card.cardChipColorTo}
            cardTextColor={card.cardTextColor}
            imageUrl={card.imageUrl}
            name={card.name}
            slug={card.slug}
          />
        </div>
        <span className="cl-tag">{card.bank.name}</span>
        <h3 className="mt-2.5 text-[15.5px] font-[850] leading-snug text-ink">{card.name}</h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted">
          {card.summary ?? card.targetAudience ?? "查看這張信用卡目前整理到的優惠。"}
        </p>
      </div>
      <CardFoot action={offerCount === undefined ? "查看這張卡" : `${offerCount} 筆優惠可以用`} />
    </Link>
  );
}
