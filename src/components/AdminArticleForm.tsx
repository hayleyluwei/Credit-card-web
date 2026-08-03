"use client";

import type { Article } from "@prisma/client";
import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { AdminField, adminInputClass } from "@/components/AdminField";
import { StableSlugInput } from "@/components/StableSlugInput";
import type { AdminActionState } from "@/lib/admin-actions";

type AdminArticleFormProps = {
  action: (state: AdminActionState, formData: FormData) => Promise<AdminActionState>;
  article?: Article | null;
};

const initialState: AdminActionState = {
  errors: [],
  ok: true
};

function dateInput(value?: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

function SubmitButton({ children }: { children: string }) {
  const { pending } = useFormStatus();

  return (
    <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 md:col-span-2" disabled={pending} type="submit">
      {pending ? "儲存中..." : children}
    </button>
  );
}

export function AdminArticleForm({ action, article }: AdminArticleFormProps) {
  const [state, formAction] = useFormState(action, initialState);
  const isEdit = Boolean(article);

  return (
    <form action={formAction} className="mt-4 grid gap-4 md:grid-cols-2">
      {isEdit ? <input name="id" type="hidden" value={article!.id} /> : null}

      {state.errors.length > 0 ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800 md:col-span-2" role="alert">
          <h2 className="font-bold">儲存失敗</h2>
          <ul className="mt-2 list-disc pl-5">
            {state.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </section>
      ) : state.message ? (
        <section className="rounded-md border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800 md:col-span-2" role="status">
          <h2 className="font-bold">{state.message}</h2>
        </section>
      ) : null}

      <AdminField label="標題">
        <input className={adminInputClass} name="title" required defaultValue={article?.title ?? ""} />
      </AdminField>
      <AdminField label="Slug" help={isEdit ? "Slug 會影響公開網址，修改時會跳出確認提醒。" : "留空會自動依標題產生，建立後不建議修改。"}>
        {isEdit ? <StableSlugInput defaultValue={article!.slug} required /> : <input className={adminInputClass} name="slug" />}
      </AdminField>
      <AdminField label="摘要">
        <textarea className={adminInputClass} name="summary" rows={2} defaultValue={article?.summary ?? ""} />
      </AdminField>
      <AdminField label="最後查證日期">
        <input className={adminInputClass} name="lastVerifiedAt" type="date" defaultValue={dateInput(article?.lastVerifiedAt)} />
      </AdminField>
      <div className="md:col-span-2">
        <AdminField label="內文（Markdown）" help="支援表格語法；不接受 raw HTML，會以純文字顯示。">
          <textarea className={adminInputClass} name="contentMd" rows={isEdit ? 16 : 12} required defaultValue={article?.contentMd ?? ""} />
        </AdminField>
      </div>
      <AdminField label="SEO 標題">
        <input className={adminInputClass} name="seoTitle" defaultValue={article?.seoTitle ?? ""} />
      </AdminField>
      <AdminField label="SEO 描述">
        <textarea className={adminInputClass} name="seoDescription" rows={2} defaultValue={article?.seoDescription ?? ""} />
      </AdminField>
      <div className="md:col-span-2">
        <AdminField label="FAQ JSON" help='格式：[{"question":"問題","answer":"答案"}]，留空則不顯示 FAQ 區塊。'>
          <textarea className={adminInputClass} name="faqJson" rows={4} defaultValue={article?.faqJson ?? ""} />
        </AdminField>
      </div>

      <SubmitButton>{isEdit ? "儲存文章" : "新增文章（草稿）"}</SubmitButton>

      {isEdit ? (
        <div className="flex gap-3 md:col-span-2">
          <Link className="rounded-md border border-line px-3 py-2 text-sm font-semibold text-ink" href="/admin/articles">
            回文章列表
          </Link>
        </div>
      ) : null}
    </form>
  );
}
