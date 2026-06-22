"use client";

import { useRef } from "react";
import { adminInputClass } from "@/components/AdminField";

type StableSlugInputProps = {
  defaultValue?: string | null;
  name?: string;
  placeholder?: string;
  required?: boolean;
};

export function StableSlugInput({ defaultValue, name = "slug", placeholder, required }: StableSlugInputProps) {
  const originalValue = defaultValue ?? "";
  const confirmedRef = useRef(originalValue.length === 0);

  return (
    <input
      className={adminInputClass}
      defaultValue={originalValue}
      name={name}
      placeholder={placeholder}
      required={required}
      onChange={(event) => {
        if (confirmedRef.current || event.currentTarget.value === originalValue) return;

        const confirmed = window.confirm(
          `Slug 會影響公開網址。你正在把 Slug 從「${originalValue}」改成「${event.currentTarget.value}」。修改後舊網址可能失效，確定要修改嗎？`
        );

        if (confirmed) {
          confirmedRef.current = true;
          return;
        }

        event.currentTarget.value = originalValue;
      }}
    />
  );
}
