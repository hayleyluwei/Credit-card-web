"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl
    });

    setLoading(false);

    if (!result || result.error) {
      setError("登入失敗，請確認帳號、密碼與帳號狀態。");
      return;
    }

    router.push(result.url ?? callbackUrl);
    router.refresh();
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <label className="block text-sm font-semibold text-ink" htmlFor="email">
        Email
        <input
          autoComplete="email"
          className="mt-2 w-full rounded-md border border-line px-4 py-3 outline-none focus:border-brand-600"
          id="email"
          name="email"
          placeholder="admin@example.com"
          required
          type="email"
        />
      </label>
      <label className="block text-sm font-semibold text-ink" htmlFor="password">
        Password
        <input
          autoComplete="current-password"
          className="mt-2 w-full rounded-md border border-line px-4 py-3 outline-none focus:border-brand-600"
          id="password"
          name="password"
          placeholder="輸入密碼"
          required
          type="password"
        />
      </label>
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}
      <button
        className="w-full rounded-md bg-brand-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
        disabled={loading}
        type="submit"
      >
        {loading ? "登入中..." : "登入"}
      </button>
    </form>
  );
}
