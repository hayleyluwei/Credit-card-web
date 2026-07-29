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

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** 後台是自由文字輸入，擋掉空字串與格式不對的值，避免壞資料直接進 SVG。 */
function validHex(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed && HEX_COLOR.test(trimmed) ? trimmed : null;
}

/** [T23 v5] 資料庫可填的卡面配色欄位，皆可選；留空的項目各自回退預設值。 */
export type CardColorInput = {
  cardBgColorFrom?: string | null;
  cardBgColorTo?: string | null;
  cardTextColor?: string | null;
  cardChipColorFrom?: string | null;
  cardChipColorTo?: string | null;
};

export type ResolvedCardColors = {
  bgFrom: string;
  bgTo: string;
  text: string;
  chipFrom: string;
  chipTo: string;
  chipLine: string;
  borderFrom: string;
  borderTo: string;
};

const DEFAULT_TEXT = "#F7F8FA";
const DEFAULT_CHIP_FROM = "#F4D385";
const DEFAULT_CHIP_TO = "#B8860B";

/**
 * [T23 v5] 解析一張卡的卡面配色：資料庫欄位優先，留空回退為 slug 雜湊的預設色。
 * 邊框不另存欄位，跟著晶片色調走（同一組金屬色系），避免金晶片配銀邊框這種打架的組合。
 */
export function resolveCardColors(cardSlug: string, input: CardColorInput = {}): ResolvedCardColors {
  const hashed = getCardColorway(cardSlug);

  const bgFrom = validHex(input.cardBgColorFrom) ?? hashed.light;
  const bgTo = validHex(input.cardBgColorTo) ?? (validHex(input.cardBgColorFrom) ? mix(bgFrom, [0, 0, 0], 0.28) : hashed.dark);
  const chipFrom = validHex(input.cardChipColorFrom) ?? DEFAULT_CHIP_FROM;
  const chipTo = validHex(input.cardChipColorTo) ?? DEFAULT_CHIP_TO;

  return {
    bgFrom,
    bgTo,
    text: validHex(input.cardTextColor) ?? DEFAULT_TEXT,
    chipFrom,
    chipTo,
    chipLine: mix(chipTo, [0, 0, 0], 0.35),
    borderFrom: chipFrom,
    borderTo: chipTo
  };
}

function isWideChar(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
    (code >= 0x3000 && code <= 0x303f) || // CJK punctuation
    (code >= 0xff00 && code <= 0xffef) // Fullwidth forms
  );
}

/**
 * 卡片名稱是卡面主視覺，長度不一（如「DAWHO現金回饋信用卡」vs「滙豐旅人無限卡」），
 * 用寬窄字元估算寬度做斷行；超過 maxLines 時，末行截斷加刪節號防止溢出卡面。
 */
export function wrapCardName(name: string, maxWidth: number, fontSize: number, maxLines = 3): string[] {
  const wideWidth = fontSize;
  const narrowWidth = fontSize * 0.56;
  const charWidth = (char: string) => (isWideChar(char) ? wideWidth : narrowWidth);

  const lines: string[] = [];
  let current = "";
  let currentWidth = 0;

  for (const char of name) {
    const w = charWidth(char);
    if (current && currentWidth + w > maxWidth) {
      lines.push(current);
      current = "";
      currentWidth = 0;
    }
    current += char;
    currentWidth += w;
  }
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;

  const kept = lines.slice(0, maxLines);
  let last = kept[maxLines - 1] + lines.slice(maxLines).join("");
  let lastWidth = [...last].reduce((sum, c) => sum + charWidth(c), 0);
  while (last.length > 0 && lastWidth + narrowWidth > maxWidth) {
    lastWidth -= charWidth(last[last.length - 1]);
    last = last.slice(0, -1);
  }
  kept[maxLines - 1] = `${last}…`;
  return kept;
}
