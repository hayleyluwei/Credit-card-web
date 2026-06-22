import type { ReactNode } from "react";
import { AdminHomeLink } from "@/components/AdminHomeLink";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdminHomeLink />
      {children}
    </>
  );
}
