import { Suspense } from "react";
import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-5 py-8">
      <section className="rounded-md border border-line bg-white p-6 shadow-soft">
        <p className="text-sm font-semibold text-brand-700">Admin</p>
        <h1 className="mt-3 text-2xl font-bold text-ink">後台登入</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          請使用管理者帳號登入。登入後才能進入後台管理區。
        </p>

        <Suspense fallback={<div className="mt-6 text-sm text-slate-600">載入登入表單...</div>}>
          <AdminLoginForm />
        </Suspense>
      </section>
    </main>
  );
}
