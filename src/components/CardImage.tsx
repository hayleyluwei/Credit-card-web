import Image from "next/image";
import { extractNetworkLabel, getCardColorway, isPremiumTier } from "@/lib/cardVisual";

type CardImageProps = {
  alt?: string | null;
  className?: string;
  imageUrl?: string | null;
  name: string;
  slug: string;
  cardNetwork?: string | null;
  cardLevel?: string | null;
};

export function CardImage({ alt, className = "", imageUrl, name, slug, cardNetwork, cardLevel }: CardImageProps) {
  return (
    <div
      className={`relative flex aspect-[1.58/1] min-h-[88px] w-full items-center justify-center overflow-hidden rounded-md border border-line bg-brand-50 text-brand-700 ${className}`}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={alt ?? name} fill sizes="220px" className="object-contain p-3" unoptimized />
      ) : (
        <GeneratedCardArt slug={slug} name={name} cardNetwork={cardNetwork} cardLevel={cardLevel} />
      )}
    </div>
  );
}

/**
 * 零官方素材的參數化卡面（T23 v2）：底色雜湊自卡片代號，晶片／光澤／金色細邊框
 * 都是所有信用卡通用的視覺語言，未參考任何特定銀行的官方卡面設計。
 */
function GeneratedCardArt({
  slug,
  name,
  cardNetwork,
  cardLevel
}: {
  slug: string;
  name: string;
  cardNetwork?: string | null;
  cardLevel?: string | null;
}) {
  const { light, dark } = getCardColorway(slug);
  const networkLabel = extractNetworkLabel(cardNetwork);
  const premium = isPremiumTier(cardLevel);
  const initial = name.charAt(0);

  const bgId = `card-bg-${slug}`;
  const sheenId = `card-sheen-${slug}`;
  const chipId = `card-chip-${slug}`;
  const borderId = `card-border-${slug}`;

  const pillWidth = networkLabel ? Math.max(56, networkLabel.length * 7.5 + 28) : 0;
  const pillX = 344 - 26 - pillWidth;

  return (
    <svg
      viewBox="0 0 344 216"
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label={`${name} 卡面示意圖`}
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={light} />
          <stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id={sheenId} cx="30%" cy="16%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={chipId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F4D385" />
          <stop offset="1" stopColor="#B8860B" />
        </linearGradient>
        {premium ? (
          <linearGradient id={borderId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F4D385" />
            <stop offset="0.5" stopColor="#D9A441" />
            <stop offset="1" stopColor="#F4D385" />
          </linearGradient>
        ) : null}
      </defs>

      <rect x="0" y="0" width="344" height="216" rx="18" fill={`url(#${bgId})`} />
      <rect x="0" y="0" width="344" height="216" rx="18" fill={`url(#${sheenId})`} />

      <rect x="26" y="28" width="38" height="27" rx="4" fill={`url(#${chipId})`} />
      <line x1="26" y1="41.5" x2="64" y2="41.5" stroke="#8A6106" strokeWidth="0.8" />
      <line x1="45" y1="28" x2="45" y2="55" stroke="#8A6106" strokeWidth="0.8" />

      <text
        x="26"
        y="140"
        fontFamily="system-ui, -apple-system, 'Noto Sans TC', sans-serif"
        fontSize="44"
        fontWeight="600"
        fill="#F7F8FA"
        fillOpacity="0.96"
      >
        {initial}
      </text>

      {networkLabel ? (
        <>
          <rect x={pillX} y="176" width={pillWidth} height="22" rx="11" fill="#0A1620" fillOpacity="0.32" />
          <text
            x={pillX + pillWidth / 2}
            y="191"
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize="12.5"
            fontWeight="600"
            letterSpacing="1"
            fill="#F7F8FA"
          >
            {networkLabel}
          </text>
        </>
      ) : null}

      {premium ? (
        <rect x="4" y="4" width="336" height="208" rx="15" fill="none" stroke={`url(#${borderId})`} strokeWidth="2" />
      ) : null}
    </svg>
  );
}
