import type { ReactNode } from "react";

type AdminFieldProps = {
  children?: ReactNode;
  help?: string;
  label: string;
};

export function AdminField({ children, help, label }: AdminFieldProps) {
  return (
    <label className="block text-sm font-semibold text-ink">
      {label}
      <div className="mt-2">{children}</div>
      {help ? <p className="mt-1 text-xs leading-5 text-slate-500">{help}</p> : null}
    </label>
  );
}

export const adminInputClass =
  "w-full rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-brand-600";
