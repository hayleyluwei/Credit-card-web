const PALETTE = [
  "#0F665F",
  "#1E3A5F",
  "#6B2D5C",
  "#2F5233",
  "#7A4419",
  "#4A4E69",
  "#8C1D18",
  "#1B4965",
  "#3D2645",
  "#21534F",
  "#5C4A1E",
  "#2E2A4A"
] as const;

const PREMIUM_TIER_KEYWORDS = ["無限", "infinite", "御璽", "signature", "白金", "platinum"];

function fnv1aHash(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (channel: number) => Math.max(0, Math.min(255, Math.round(channel)));
  return `#${[r, g, b].map((channel) => clamp(channel).toString(16).padStart(2, "0")).join("")}`;
}

function mix(hex: string, target: [number, number, number], amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r + (target[0] - r) * amount, g + (target[1] - g) * amount, b + (target[2] - b) * amount);
}

export type CardColorway = {
  base: string;
  light: string;
  dark: string;
};

/**
 * 卡片底色雜湊規則（T23 v2）：依卡片代號（非銀行代號）雜湊，避免同銀行不同卡片撞色；
 * 用 FNV-1a（而非簡單乘法雜湊）＋ 12 色調色盤，已用真實資料（滙豐旅人系列 3 卡）驗證無撞色。
 */
export function getCardColorway(cardSlug: string): CardColorway {
  const base = PALETTE[fnv1aHash(cardSlug) % PALETTE.length];
  return {
    base,
    light: mix(base, [255, 255, 255], 0.28),
    dark: mix(base, [0, 0, 0], 0.38)
  };
}

export function extractNetworkLabel(cardNetwork?: string | null): string | null {
  if (!cardNetwork) return null;
  const lower = cardNetwork.toLowerCase();
  const found: string[] = [];
  if (lower.includes("visa")) found.push("VISA");
  if (lower.includes("jcb")) found.push("JCB");
  if (lower.includes("mastercard") || lower.includes("master card")) found.push("MASTERCARD");
  if (lower.includes("amex") || cardNetwork.includes("美國運通")) found.push("AMEX");
  return found.length > 0 ? found.join(" / ") : null;
}

export function isPremiumTier(cardLevel?: string | null): boolean {
  if (!cardLevel) return false;
  const lower = cardLevel.toLowerCase();
  return PREMIUM_TIER_KEYWORDS.some((keyword) => lower.includes(keyword.toLowerCase()));
}
