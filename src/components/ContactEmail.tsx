"use client";

import { useEffect, useState } from "react";

/**
 * [T28] 頁尾聯絡信箱，做過簡單防爬混淆。
 *
 * 原理：位址以 base64 存放，且只在瀏覽器掛載後（useEffect）才解出來組成 mailto。
 * 因此伺服器輸出的 HTML 完全不含這個位址——只讀靜態 HTML 的爬蟲抓不到。
 *
 * 這只擋得掉「不執行 JS 的爬蟲」，也就是絕大多數收信箱的爬蟲；會執行 JS 或
 * 直接翻 JS bundle 的爬蟲仍抓得到。要真正杜絕就得改成聯絡表單（需要寄信服務、
 * 額外機密與防濫用機制），那是獨立功能、不在 T28 範圍內。
 *
 * 無障礙／無 JS 情境：提供可讀的替代說明，不會只留一片空白。
 */
const ENCODED = "aGF5bGV5bHVzaG9wQGdtYWlsLmNvbQ==";

export function ContactEmail() {
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    try {
      setAddress(window.atob(ENCODED));
    } catch {
      setAddress(null);
    }
  }, []);

  if (!address) {
    return <span className="text-muted">（請開啟 JavaScript 以顯示聯絡信箱）</span>;
  }

  return (
    <a className="font-[850] text-blue-deep transition hover:underline" href={`mailto:${address}`}>
      {address}
    </a>
  );
}
