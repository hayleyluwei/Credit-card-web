import Image from "next/image";
import { resolveCardColors, wrapCardName, type CardColorInput } from "@/lib/cardVisual";

type CardImageProps = CardColorInput & {
  alt?: string | null;
  bankName: string;
  className?: string;
  imageUrl?: string | null;
  name: string;
  slug: string;
};

export function CardImage({ alt, bankName, className = "", imageUrl, name, slug, ...colors }: CardImageProps) {
  return (
    <div
      className={`relative flex aspect-[1.58/1] min-h-[88px] w-full items-center justify-center overflow-hidden rounded-control border border-line bg-canvas text-ink ${className}`}
    >
      {imageUrl ? (
        <Image src={imageUrl} alt={alt ?? name} fill sizes="220px" className="object-contain p-3" unoptimized />
      ) : (
        <GeneratedCardArt slug={slug} name={name} bankName={bankName} colors={colors} />
      )}
    </div>
  );
}

/**
 * 零官方素材的參數化卡面（T23 v5）：配色優先取自資料庫欄位（抽自官網卡面的色彩印象），
 * 留空則回退為依卡片代號雜湊的預設色。晶片／光澤／細邊框都是所有信用卡通用的視覺語言，
 * 未重製任何銀行的 Logo 或專屬構圖。卡片名稱是主視覺，不顯示發卡組織。
 */
function GeneratedCardArt({
  slug,
  name,
  bankName,
  colors
}: {
  slug: string;
  name: string;
  bankName: string;
  colors: CardColorInput;
}) {
  const { bgFrom, bgTo, text, chipFrom, chipTo, borderFrom, borderTo } = resolveCardColors(slug, colors);

  const bgId = `card-bg-${slug}`;
  const sheenId = `card-sheen-${slug}`;
  const chipId = `card-chip-${slug}`;
  const borderId = `card-border-${slug}`;

  const nameFontSize = 22;
  const nameLineHeight = 27;
  const nameMaxWidth = 344 - 26 - 26;
  const nameLines = wrapCardName(name, nameMaxWidth, nameFontSize);
  const lastLineY = 182;

  return (
    <svg
      viewBox="0 0 344 216"
      className="absolute inset-0 h-full w-full"
      role="img"
      aria-label={`${bankName} ${name} 卡面示意圖`}
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={bgFrom} />
          <stop offset="1" stopColor={bgTo} />
        </linearGradient>
        <radialGradient id={sheenId} cx="30%" cy="16%" r="70%">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={chipId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={chipFrom} />
          <stop offset="1" stopColor={chipTo} />
        </linearGradient>
        <linearGradient id={borderId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={borderFrom} />
          <stop offset="0.5" stopColor={borderTo} />
          <stop offset="1" stopColor={borderFrom} />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="344" height="216" rx="18" fill={`url(#${bgId})`} />
      <rect x="0" y="0" width="344" height="216" rx="18" fill={`url(#${sheenId})`} />

      <text
        x="26"
        y="42"
        fontFamily="system-ui, -apple-system, 'Noto Sans TC', sans-serif"
        fontSize="20"
        fontWeight="700"
        fill={text}
        fillOpacity="0.97"
      >
        {bankName}
      </text>

      <rect x="26" y="68" width="40" height="28" rx="4" fill={`url(#${chipId})`} />

      {nameLines.map((line, i) => (
        <text
          key={i}
          x="26"
          y={lastLineY - (nameLines.length - 1 - i) * nameLineHeight}
          fontFamily="system-ui, -apple-system, 'Noto Sans TC', sans-serif"
          fontSize={nameFontSize}
          fontWeight="400"
          fill={text}
          fillOpacity="0.92"
        >
          {line}
        </text>
      ))}

      <rect x="4" y="4" width="336" height="208" rx="15" fill="none" stroke={`url(#${borderId})`} strokeWidth="2" />
    </svg>
  );
}
