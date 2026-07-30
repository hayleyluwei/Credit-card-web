/**
 * Consistent icon badges for homepage entry points (scenario tags and
 * category cards). Hand-authored inline SVGs to avoid adding an icon
 * library dependency — style consistency only, not final art direction.
 */

type IconKey =
  // scenario icons (keyed by scenario slug)
  | "tax-payment"
  | "tuition"
  | "utilities"
  | "insurance-premium"
  | "gas"
  | "food-delivery"
  | "supermarket"
  | "travel-booking"
  | "subscription"
  | "movies"
  | "hsr-tra"
  | "etag"
  | "parking"
  | "roadside-assistance"
  // category icons (keyed by category slug)
  | "cashback"
  | "dining"
  | "travel"
  | "online-shopping"
  | "transport"
  | "installment";

const ICON_PATHS: Record<IconKey, React.ReactNode> = {
  "tax-payment": (
    <>
      <path d="M7 3.5h7l3 3v14a.5.5 0 0 1-.5.5h-9.5a.5.5 0 0 1-.5-.5v-16.5a.5.5 0 0 1 .5-.5Z" />
      <path d="M9 9h6M9 12h6M9 15h3" />
    </>
  ),
  tuition: (
    <>
      <path d="M2.5 9 12 4.5 21.5 9 12 13.5 2.5 9Z" />
      <path d="M6 11v4.5c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V11" />
    </>
  ),
  utilities: <path d="M13 2 4.5 14h6l-1.5 8L19.5 10h-6l1.5-8Z" strokeLinejoin="round" />,
  "insurance-premium": (
    <>
      <path d="M12 3 5 6v6c0 5 3 8.5 7 9 4-.5 7-4 7-9V6l-7-3Z" />
      <path d="M9 12.2 11.2 14.5 15.5 10" />
    </>
  ),
  gas: (
    <>
      <path d="M5 21V6a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v15" />
      <path d="M5 11h7" />
      <path d="M13 8.5 16 11v6.5a1.5 1.5 0 0 0 3 0V12l-2-2" />
      <path d="M4 21h10" />
    </>
  ),
  "food-delivery": (
    <>
      <path d="M4 8.5 12 4l8 4.5-8 4.5-8-4.5Z" />
      <path d="M4 8.5V16l8 4.5 8-4.5V8.5" />
      <path d="M12 13v7.5" />
    </>
  ),
  supermarket: (
    <>
      <path d="M3 4h2l1.6 10.2A2 2 0 0 0 8.6 16h8.8a2 2 0 0 0 2-1.6L21 7H6" />
      <circle cx="9" cy="20" r="1.4" />
      <circle cx="17" cy="20" r="1.4" />
    </>
  ),
  "travel-booking": (
    <>
      <path d="M3 18.5V8a1 1 0 0 1 1-1h1.5v6" />
      <path d="M3 18.5h18M4.5 13h14a2.5 2.5 0 0 1 2.5 2.5V17H4.5v-4Z" />
      <circle cx="8" cy="9.5" r="1.5" />
      <path d="M9.5 9.5h6a2 2 0 0 1 2 2V13h-8V9.5Z" />
    </>
  ),
  subscription: (
    <>
      <path d="M4 12a8 8 0 0 1 13.66-5.66L20 8.5" />
      <path d="M20 4v4.5h-4.5" />
      <path d="M20 12a8 8 0 0 1-13.66 5.66L4 15.5" />
      <path d="M4 20v-4.5h4.5" />
    </>
  ),
  movies: (
    <>
      <path d="M3 9.5 4.5 4h15L21 9.5" />
      <path d="M3 9.5h18V19a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
      <path d="m7 4 2 5.5M12 4l2 5.5M17 4l2 5.5" />
    </>
  ),
  "hsr-tra": (
    <>
      <rect height="12" rx="3" width="14" x="5" y="3.5" />
      <path d="M5 12h14" />
      <circle cx="9" cy="16.2" r="0.9" />
      <circle cx="15" cy="16.2" r="0.9" />
      <path d="m7 20-2 2M17 20l2 2" />
    </>
  ),
  etag: (
    <>
      <path d="M12.5 3.5H20a.5.5 0 0 1 .5.5v7.5a1 1 0 0 1-.3.7l-8.5 8.5a1 1 0 0 1-1.4 0l-7.5-7.5a1 1 0 0 1 0-1.4l8.5-8.5a1 1 0 0 1 .7-.3Z" />
      <circle cx="16" cy="8" r="1.5" />
    </>
  ),
  parking: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 16V8h3a2.5 2.5 0 0 1 0 5h-3" />
    </>
  ),
  "roadside-assistance": (
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2 2.6-2.6Z" strokeLinejoin="round" />
  ),
  cashback: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 15 6-6M9.5 10a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1ZM14.5 15a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1Z" />
    </>
  ),
  dining: (
    <>
      <path d="M6 3v7a2 2 0 0 0 2 2v9M6 3v5M8 3v5M4 3v5" />
      <path d="M17 3c-1.7 0-3 1.9-3 5s1.3 5 3 5v8" />
    </>
  ),
  travel: (
    <path d="M21 15.5 13.5 11V4.5a1.5 1.5 0 0 0-3 0V11L3 15.5V17l7.5-2.3V19l-2 1.5V22l3.5-1 3.5 1v-1.5L14 19v-4.3l7 2.3v-1.5Z" strokeLinejoin="round" />
  ),
  "online-shopping": (
    <>
      <path d="M6 8V6.5a5 5 0 0 1 10 0V8" strokeLinecap="round" />
      <path d="M4.5 8h14l.9 12a1 1 0 0 1-1 1.1H4.6a1 1 0 0 1-1-1.1L4.5 8Z" />
    </>
  ),
  transport: (
    <>
      <rect height="12" rx="2.5" width="16" x="4" y="4" />
      <path d="M4 14h16" />
      <circle cx="7.5" cy="17.5" r="1.1" />
      <circle cx="16.5" cy="17.5" r="1.1" />
    </>
  ),
  installment: (
    <>
      <rect height="15" rx="2" width="16" x="4" y="4.5" />
      <path d="M4 9.5h16" />
      <path d="M8 3v3M16 3v3" />
      <path d="M8 13.5h2M14 13.5h2M8 17h2M14 17h2" />
    </>
  )
};

const ICON_COLORS: Record<IconKey, string> = {
  "tax-payment": "bg-sky-50 text-sky-600",
  tuition: "bg-amber-50 text-amber-600",
  utilities: "bg-cyan-50 text-cyan-600",
  "insurance-premium": "bg-emerald-50 text-emerald-600",
  gas: "bg-orange-50 text-orange-600",
  "food-delivery": "bg-rose-50 text-rose-600",
  supermarket: "bg-lime-50 text-lime-700",
  "travel-booking": "bg-indigo-50 text-indigo-600",
  subscription: "bg-purple-50 text-purple-600",
  movies: "bg-fuchsia-50 text-fuchsia-600",
  "hsr-tra": "bg-teal-50 text-teal-600",
  etag: "bg-yellow-50 text-yellow-700",
  parking: "bg-slate-100 text-slate-600",
  "roadside-assistance": "bg-red-50 text-red-600",
  cashback: "bg-brand-50 text-brand-700",
  dining: "bg-orange-50 text-orange-600",
  travel: "bg-sky-50 text-sky-600",
  "online-shopping": "bg-pink-50 text-pink-600",
  transport: "bg-teal-50 text-teal-600",
  installment: "bg-indigo-50 text-indigo-600"
};

export function EntryIcon({ iconKey, className = "h-12 w-12" }: { iconKey: string; className?: string }) {
  const key = iconKey as IconKey;
  const path = ICON_PATHS[key];
  const colorClass = ICON_COLORS[key] ?? "bg-slate-100 text-slate-600";

  if (!path) {
    return <div className={`flex items-center justify-center rounded-2xl ${colorClass} ${className}`} />;
  }

  return (
    <div className={`flex shrink-0 items-center justify-center rounded-2xl ${colorClass} ${className}`}>
      <svg className="h-[55%] w-[55%]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} viewBox="0 0 24 24">
        {path}
      </svg>
    </div>
  );
}
