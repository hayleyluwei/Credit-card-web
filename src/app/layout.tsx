import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "信用卡優惠查詢網站",
  description: "信用卡優惠查詢網站 MVP"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
