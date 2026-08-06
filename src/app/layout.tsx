import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "信用卡優惠查詢網站",
  description: "信用卡優惠查詢網站 MVP"
};

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const enableGa =
  process.env.NODE_ENV === "production" && Boolean(gaMeasurementId);

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
        {enableGa && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
