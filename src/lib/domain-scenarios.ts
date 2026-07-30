/**
 * Domain Scenarios Module
 * Fixed config for the 14 core scenario tags used by /scenarios/[slug].
 * Not a database table (see T20 Non-scope): adding a 15th core scenario
 * requires updating the data-collection spec and this file together.
 */

export interface ScenarioTagConfig {
  slug: string;
  /** Must match the exact Chinese tag string stored in Offer.tags. */
  tagLabel: string;
  pageTitle: string;
  seoDescription: string;
}

export const SCENARIO_TAGS: ScenarioTagConfig[] = [
  {
    slug: "tax-payment",
    tagLabel: "繳稅",
    pageTitle: "繳稅信用卡優惠",
    seoDescription: "整理綜所稅、牌照稅、房屋稅、地價稅等繳稅可用的信用卡回饋優惠。"
  },
  {
    slug: "tuition",
    tagLabel: "學費",
    pageTitle: "學費信用卡優惠",
    seoDescription: "整理大專院校、中小學學費刷卡可用的信用卡回饋優惠。"
  },
  {
    slug: "utilities",
    tagLabel: "水電瓦斯",
    pageTitle: "水電瓦斯費信用卡優惠",
    seoDescription: "整理水費、電費、瓦斯費、電信費等公共事業費可用的信用卡回饋優惠。"
  },
  {
    slug: "insurance-premium",
    tagLabel: "保費",
    pageTitle: "保費信用卡優惠",
    seoDescription: "整理保險費刷卡可用的信用卡回饋優惠。"
  },
  {
    slug: "gas",
    tagLabel: "加油",
    pageTitle: "加油信用卡優惠",
    seoDescription: "整理加油可用的信用卡回饋優惠。"
  },
  {
    slug: "food-delivery",
    tagLabel: "外送",
    pageTitle: "外送信用卡優惠",
    seoDescription: "整理 foodpanda、Uber Eats 等外送平台可用的信用卡回饋優惠。"
  },
  {
    slug: "supermarket",
    tagLabel: "超市量販",
    pageTitle: "超市量販信用卡優惠",
    seoDescription: "整理全聯、家樂福、好市多等超市量販通路可用的信用卡回饋優惠。"
  },
  {
    slug: "travel-booking",
    tagLabel: "旅遊訂房",
    pageTitle: "旅遊訂房信用卡優惠",
    seoDescription: "整理訂房平台、飯店、機票等旅遊訂房可用的信用卡回饋優惠。"
  },
  {
    slug: "subscription",
    tagLabel: "訂閱服務",
    pageTitle: "訂閱服務信用卡優惠",
    seoDescription: "整理 Netflix、Spotify、YouTube Premium 等數位訂閱服務可用的信用卡回饋優惠。"
  },
  {
    slug: "movies",
    tagLabel: "電影",
    pageTitle: "電影信用卡優惠",
    seoDescription: "整理電影票、影城消費可用的信用卡回饋優惠。"
  },
  {
    slug: "hsr-tra",
    tagLabel: "高鐵台鐵",
    pageTitle: "高鐵台鐵信用卡優惠",
    seoDescription: "整理高鐵、台鐵訂票與消費可用的信用卡回饋優惠。"
  },
  {
    slug: "etag",
    tagLabel: "eTag",
    pageTitle: "eTag 信用卡優惠",
    seoDescription: "整理國道電子收費 eTag 預繳與儲值可用的信用卡回饋優惠。"
  },
  {
    slug: "parking",
    tagLabel: "停車",
    pageTitle: "停車信用卡優惠",
    seoDescription: "整理市區停車、路邊停車可用的信用卡回饋優惠。"
  },
  {
    slug: "roadside-assistance",
    tagLabel: "道路救援",
    pageTitle: "道路救援信用卡優惠",
    seoDescription: "整理信用卡附帶的免費道路救援權益。"
  }
];

export function getScenarioTagBySlug(slug: string): ScenarioTagConfig | undefined {
  return SCENARIO_TAGS.find((entry) => entry.slug === slug);
}

/**
 * Offer.tags is a comma-separated string (e.g. "現金回饋,新戶,繳稅").
 * Split and trim before comparing against the exact scenario tag label.
 */
export function offerHasTag(tags: string | null | undefined, tagLabel: string): boolean {
  if (!tags) return false;
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .includes(tagLabel);
}
