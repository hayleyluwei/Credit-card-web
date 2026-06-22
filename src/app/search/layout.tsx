import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/domain-seo";

export const metadata: Metadata = {
  title: "搜尋優惠｜信用卡優惠查詢網站",
  description: "搜尋信用卡優惠、銀行、卡片與分類。",
  alternates: {
    canonical: getCanonicalUrl("/search")
  }
};

export default function SearchLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
