"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminHomeLink() {
  const pathname = usePathname();

  if (pathname === "/admin" || pathname === "/admin/login") {
    return null;
  }

  return (
    <div className="border-b border-line bg-white">
      <div className="mx-auto flex w-full max-w-7xl justify-end px-5 py-3 sm:px-8">
        <Link
          className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          href="/admin"
        >
          回後台首頁
        </Link>
      </div>
    </div>
  );
}
