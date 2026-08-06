import Link from "next/link";
import type { Category } from "@prisma/client";
import { CardFoot } from "@/components/design-system";

/**
 * [T28] 分類卡的亮色底。契約允許「白底或指定亮色底」，用固定順序輪替，
 * 讓分類列表有節奏但不隨機跳色（第 1、4 張維持白底當留白）。
 */
const TONES = ["bg-paper", "bg-blue-soft", "bg-lime", "bg-paper", "bg-rose", "bg-yellow"] as const;

interface CategoryCardProps {
  category: Category;
  offerCount: number;
  toneIndex?: number;
}

export function CategoryCard({ category, offerCount, toneIndex = 0 }: CategoryCardProps) {
  const tone = TONES[toneIndex % TONES.length];

  return (
    <Link className={`cl-card flex flex-col justify-between ${tone}`} href={`/categories/${category.slug}`}>
      <div>
        <span className="cl-tag bg-paper/70">{offerCount} 則優惠</span>
        <h3 className="mt-2.5 text-[19px] font-[850] leading-snug text-ink">{category.name}</h3>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#707179]">
          {category.description ?? "此分類包含多種信用卡優惠。"}
        </p>
      </div>
      <CardFoot action={`查看全部 ${offerCount} 則`} />
    </Link>
  );
}
