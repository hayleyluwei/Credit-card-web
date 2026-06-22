"use client";

import { signOut } from "next-auth/react";

export function AdminLogoutButton() {
  return (
    <button
      className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      type="button"
    >
      登出
    </button>
  );
}
