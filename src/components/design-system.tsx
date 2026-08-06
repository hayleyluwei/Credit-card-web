/**
 * [T28] 卡片生活誌設計系統的共用語意元件。
 *
 * 直接對應風格契約移交包的 `reference-components.tsx`，用來取代各頁重複的樣式字串。
 * 契約為鎖定狀態：這裡只能在契約內新增內容，不得自行改造風格
 * （見 docs/design-system/card-life-pop-style/STYLE_CONTRACT.md）。
 */

import Link from "next/link";
import type { ReactNode } from "react";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PageContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <main className={cx("cl-container py-10 sm:py-12", className)}>{children}</main>;
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
