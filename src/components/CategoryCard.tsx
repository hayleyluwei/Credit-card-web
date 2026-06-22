import Link from "next/link";
import type { Category } from "@prisma/client";

interface CategoryCardProps {
  category: Category;
  offerCount: number;
}

export function CategoryCard({ category, offerCount }: CategoryCardProps) {
  return (
    <Link
      href={`/categories/${category.slug}`}
      className="group block rounded-3xl border border-line bg-white p-6 shadow-soft transition duration-200 hover:-translate-y-1 hover:border-brand-300"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          {category.iconName ? category.iconName.charAt(0).toUpperCase() : "C"}
        </div>
        <div>
          <p className="text-sm font-semibold text-brand-700">{category.name}</p>
          <p className="text-xs text-slate-500">{offerCount} 則優惠</p>
        </div>
      </div>
      <h3 className="text-xl font-bold text-ink">{category.name}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{category.description ?? "此分類包含多種信用卡優惠。"}</p>
      <p className="mt-6 text-sm font-semibold text-brand-700">查看全部 {offerCount} 則優惠 →</p>
    </Link>
  );
}
