/**
 * [T28] 卡片生活誌設計系統的共用語意元件。
 *
 * 直接對應風格契約移交包的 `reference-components.tsx`，用來取代各頁重複的樣式字串。
 * 契約為鎖定狀態：這裡只能在契約內新增內容，不得自行改造風格
 * （見 docs/design-system/card-life-pop-style/STYLE_CONTRACT.md）。
 */

import Link from "next/link";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/SiteHeader";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

/**
 * 公開頁面的外殼：固定表頭 ＋ 內容區 ＋ 頁尾。
 * 表頭掛在這裡而不是 root layout，是為了讓 /admin 完全不受影響（T28 Non-scope）。
 */
export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <>
      <SiteHeader />
      <main className={cx("cl-container py-10 sm:py-12", className)}>{children}</main>
      <SiteFooter />
    </>
  );
}

/**
 * 頁尾同時是全站的次要導覽出口：三種平行入口（搜尋／生活情境／手上的卡）在這裡
 * 各自有落點，避免使用者捲到底之後無路可走。連結一律指向真實存在的 route。
 */
const FOOTER_GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "開始找",
    links: [
      { href: "/search", label: "搜尋優惠" },
      { href: "/categories", label: "瀏覽分類" },
      { href: "/cards", label: "所有信用卡" }
    ]
  },
  {
    title: "常見情境",
    links: [
      { href: "/scenarios/tax-payment", label: "繳稅" },
      { href: "/scenarios/travel-booking", label: "旅遊訂房" },
      { href: "/scenarios/food-delivery", label: "外送" },
      { href: "/scenarios/supermarket", label: "超市量販" }
    ]
  },
  {
    title: "看懂規則",
    links: [{ href: "/guides", label: "攻略文章" }]
  }
];

function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-paper">
      <div className="cl-container py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="flex items-center gap-2 text-[16px] font-[850] text-ink">
              <span className="grid h-6 w-6 place-items-center rounded-md bg-blue text-[12px] text-white" aria-hidden="true">
                卡
              </span>
              信用卡優惠查詢
            </p>
            <p className="mt-2.5 max-w-xs text-[12px] leading-relaxed text-muted">
              從今天想完成的事開始，找到適合的卡。每筆優惠都附官方來源與查證日期。
            </p>
          </div>

          {FOOTER_GROUPS.map((group) => (
            <nav aria-label={group.title} key={group.title}>
              <p className="text-[11px] font-[850] uppercase tracking-[0.09em] text-blue-deep">{group.title}</p>
              <ul className="mt-3 flex flex-col gap-2 text-[12.5px] text-muted">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link className="transition hover:text-blue-deep" href={link.href}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="mt-9 border-t border-line pt-6 text-[11.5px] leading-relaxed text-muted">
          本站整理公開的信用卡優惠資訊，僅供參考，不構成任何申辦建議。實際權益、回饋上限與活動條件以各發卡銀行的官方公告為準，
          使用前請自行至官方來源確認。
        </p>
      </div>
    </footer>
  );
}

export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="cl-action" href={href}>
      {children}
    </Link>
  );
}

export function SecondaryAction({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link className="cl-action-secondary" href={href}>
      {children}
    </Link>
  );
}

/** 麵包屑只能連向真實存在的上層 route；最後一層不可點（契約 4.1）。 */
export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="麵包屑" className="cl-breadcrumb">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 ? <span aria-hidden="true">/</span> : null}
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
        </span>
      ))}
    </nav>
  );
}

export function SurfaceCard({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={cx("cl-card", className)}>{children}</article>;
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx("cl-panel", className)}>{children}</section>;
}

/**
 * 區塊表頭：標題（必要）＋說明（選填）＋右側文字連結（選填）。
 * 各公開頁的區塊標題一律走這裡，避免字級與間距在頁面之間漂移。
 */
export function SectionHead({
  title,
  copy,
  action
}: {
  title: string;
  copy?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="cl-section-title">{title}</h2>
        {copy ? <p className="cl-section-copy">{copy}</p> : null}
      </div>
      {action ? (
        <Link className="cl-text-link whitespace-nowrap" href={action.href}>
          {action.label} →
        </Link>
      ) : null}
    </div>
  );
}

/** 卡片底部行動列：左側行動文字、右側輔助資訊，上緣有細分隔線。 */
export function CardFoot({ action, value }: { action: string; value?: string }) {
  return (
    <span className="cl-card-foot">
      <span className="text-blue-deep">{action}</span>
      {value ? <span className="text-ink">{value}</span> : <span aria-hidden="true">→</span>}
    </span>
  );
}

const PREVIEW_TONES = {
  blue: "cl-preview-card--blue",
  lime: "cl-preview-card--lime",
  rose: "cl-preview-card--rose",
  yellow: "cl-preview-card--yellow",
  ink: "cl-preview-card--ink"
} as const;

export type PreviewTone = keyof typeof PREVIEW_TONES;

/**
 * 首頁五張快速入口預覽卡。契約規定只有這裡可以使用 `preview-bob` 持續動畫
 * （4 秒、上下最多 6px、每張錯開延遲），其他頁面一律不得使用。
 */
export function PreviewCard({
  href,
  tone,
  children,
  delayClass
}: {
  href: string;
  tone: PreviewTone;
  children: ReactNode;
  delayClass?: string;
}) {
  return (
    <Link
      className={cx(
        "cl-preview-card animate-preview-bob transition hover:-translate-y-2 [animation-play-state:running] hover:[animation-play-state:paused]",
        PREVIEW_TONES[tone],
        delayClass
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

/** 發卡銀行是內容關聯入口，不是麵包屑層級（契約 4.3）。 */
export function IssuerLink({ href, bankName }: { href: string; bankName: string }) {
  return (
    <Link
      className="mt-4 inline-flex items-center gap-2 rounded-control border border-line bg-blue-soft px-3 py-2 text-xs font-[850] text-blue-deep transition hover:border-blue hover:bg-paper"
      href={href}
    >
      發卡銀行：{bankName} <span aria-hidden="true">→</span>
    </Link>
  );
}
