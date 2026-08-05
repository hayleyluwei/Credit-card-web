import type { ReactNode } from "react";
import Link from "next/link";

function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <main className="cl-container py-10 sm:py-12">{children}</main>;
}

export function PrimaryAction({ href, children }: { href: string; children: ReactNode }) {
  return <Link className="cl-action" href={href}>{children}</Link>;
}

export function Breadcrumb({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav aria-label="麵包屑" className="cl-breadcrumb">
      {items.map((item, index) => (
        <span key={item.label}>
          {index > 0 && <span>/</span>}
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
        </span>
      ))}
    </nav>
  );
}

export function SurfaceCard({ children, className }: { children: ReactNode; className?: string }) {
  return <article className={cx("cl-card", className)}>{children}</article>;
}

export function PreviewCard({
  href,
  tone,
  children,
  delayClass
}: {
  href: string;
  tone: "blue" | "lime" | "rose" | "yellow" | "ink";
  children: ReactNode;
  delayClass?: string;
}) {
  return (
    <Link
      className={cx("cl-preview-card animate-preview-bob", `cl-preview-card--${tone}`, delayClass)}
      href={href}
    >
      {children}
    </Link>
  );
}

export function IssuerLink({ href, bankName }: { href: string; bankName: string }) {
  return (
    <Link className="mt-4 inline-flex items-center gap-2 rounded-control border border-line bg-blue-soft px-3 py-2 text-xs font-[850] text-blue-deep hover:border-blue hover:bg-paper" href={href}>
      發卡銀行：{bankName} <span aria-hidden="true">→</span>
    </Link>
  );
}

