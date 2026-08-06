import { readFileSync } from "node:fs";

const failures = [];

function check(label, condition) {
  if (!condition) failures.push(label);
}

const layout = readFileSync("src/app/layout.tsx", "utf8");
const envExample = readFileSync(".env.example", "utf8");

check("layout imports next/script", layout.includes('import Script from "next/script";'));
check(
  "layout reads NEXT_PUBLIC_GA_MEASUREMENT_ID",
  layout.includes("process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID")
);
check("layout gates GA to production", layout.includes('process.env.NODE_ENV === "production"'));
check("layout checks measurement id before rendering GA", layout.includes("Boolean(gaMeasurementId)"));
check(
  "layout loads Google tag script with measurement id",
  layout.includes("https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}")
);
check("layout initializes dataLayer", layout.includes("window.dataLayer = window.dataLayer || [];"));
check("layout configures gtag with measurement id", layout.includes("gtag('config', '${gaMeasurementId}')"));
check("layout loads GA after interactive", layout.includes('strategy="afterInteractive"'));
check(
  ".env.example documents GA measurement id",
  /^NEXT_PUBLIC_GA_MEASUREMENT_ID=""/m.test(envExample)
);

if (failures.length > 0) {
  console.error("T26 GA verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("T26 GA verification passed.");
