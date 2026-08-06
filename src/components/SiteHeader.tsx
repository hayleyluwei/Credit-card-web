"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * [T28] 公開頁面的固定表頭（契約 4.1）：
 * 白底、品牌在左、公開導覽在右，手機以單一選單圖示收合。
 *
 * 只掛在 PageContainer 底下，因此不會出現在 /admin（T28 Non-scope）。
 * 導覽項目一律指向真實存在的 route，不做假層級。
 */

const NAV_ITEMS = [
  { href: "/search", label: "搜尋優惠" },
  { href: "/categories", label: "瀏覽分類" },
  { href: "/cards", label: "信用卡" },
  { href: "/guides", label: "攻略文章" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // 換頁後自動收合，避免選單停在展開狀態
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur">
      <div className="cl-container flex min-h-[64px] items-center justify-between gap-5">
        <Link className="flex items-center gap-2 text-[17px] font-[850] text-ink" href="/">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-blue text-[12px] text-white" aria-hidden="true">
            卡
          </span>
          信用卡優惠查詢
        </Link>

        <nav aria-label="主要導覽" className="hidden items-center gap-6 text-[13px] md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              className={`border-b-2 py-1.5 transition ${
                isActive(item.href) ? "border-blue text-blue-deep font-[850]" : "border-transparent text-muted hover:text-blue-deep"
              }`}
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          aria-controls="site-nav-mobile"
          aria-expanded={open}
          aria-label={open ? "關閉選單" : "開啟選單"}
          className="grid h-9 w-9 place-items-center rounded-control border border-line bg-paper text-ink transition hover:border-blue md:hidden"
          onClick={() => setOpen((value) => !value)}
          type="button"
        >
          <svg fill="none" height="18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24" width="18">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open ? (
        <nav aria-label="主要導覽（手機）" className="border-t border-line bg-paper md:hidden" id="site-nav-mobile">
          <div className="cl-container flex flex-col py-2">
            {NAV_ITEMS.map((item) => (
              <Link
                className={`border-b border-line py-3 text-[14px] last:border-b-0 ${
                  isActive(item.href) ? "font-[850] text-blue-deep" : "text-ink"
                }`}
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
