/**
 * [T28] 首頁情境卡的分組標籤與口語文案。
 *
 * 為什麼放在程式碼而不是資料庫：`SCENARIO_TAGS`（見 domain-scenarios.ts）自 T20 起就
 * 是寫死的設定，不開後台管理；本檔沿用同一慣例，不新增 schema 欄位、不寫入資料庫。
 * 新增第 15 個情境時，兩個檔案要一起更新。
 *
 * 文案語氣依 T28 核准內容：口語、溫暖、不推銷，用問句貼近使用者當下在煩惱的事。
 */

export interface ScenarioCopy {
  /** 分組標籤，顯示在卡片左上角。 */
  group: string;
  /** 問句式標題，取代直接顯示情境標籤名稱。 */
  title: string;
  /** 一句白話說明。 */
  description: string;
  /** 卡片底部左側的行動文字。 */
  action: string;
}

/** key 為 ScenarioTagConfig.slug。 */
export const SCENARIO_COPY: Record<string, ScenarioCopy> = {
  "travel-booking": {
    group: "旅遊回饋",
    title: "出國前，哪張卡刷起來最划算？",
    description: "訂房、機票和海外消費常常分屬不同活動，先看清楚再決定帶哪張。",
    action: "查看優惠"
  },
  supermarket: {
    group: "生活採買",
    title: "每週的採買，能多拿一點回饋嗎？",
    description: "超市和量販的活動通常有指定日或指定通路，看懂就不會白刷。",
    action: "查看優惠"
  },
  "food-delivery": {
    group: "吃得開心",
    title: "常常叫外送，用哪張卡比較好？",
    description: "外送平台的回饋多半綁行動支付，先確認你習慣的付款方式。",
    action: "查看優惠"
  },
  "tax-payment": {
    group: "帳單日常",
    title: "繳稅金額大，回饋能省下多少？",
    description: "繳稅通常有分期或指定卡優惠，金額大的時候差異特別明顯。",
    action: "查看優惠"
  },
  tuition: {
    group: "帳單日常",
    title: "學費也可以刷卡拿回饋嗎？",
    description: "學雜費與補習費多半有專屬方案，開學前先確認會比較安心。",
    action: "查看優惠"
  },
  utilities: {
    group: "帳單日常",
    title: "水電瓦斯設定代扣，划算嗎？",
    description: "固定支出設定自動扣繳，回饋雖然不高但每個月都會回來。",
    action: "查看優惠"
  },
  "insurance-premium": {
    group: "帳單日常",
    title: "保費一次繳，怎麼刷才有感？",
    description: "續期保費金額不小，有些卡有分期或加碼，值得先比一下。",
    action: "查看優惠"
  },
  subscription: {
    group: "數位訂閱",
    title: "那些每月自動扣款的訂閱呢？",
    description: "影音、雲端這類小額扣款累積起來也不少，適合固定用一張卡。",
    action: "查看優惠"
  },
  gas: {
    group: "交通移動",
    title: "加油這件事，能省則省。",
    description: "加油站的折扣常有指定卡或指定時段，順手看一下就好。",
    action: "查看優惠"
  },
  "hsr-tra": {
    group: "交通移動",
    title: "搭高鐵台鐵，有回饋可以拿嗎？",
    description: "訂票平台與車站購票的優惠條件不一定相同，出發前先看看。",
    action: "查看優惠"
  },
  etag: {
    group: "交通移動",
    title: "eTag 自動儲值，綁哪張卡好？",
    description: "國道通行費是長期固定支出，綁對卡就是每個月默默回饋。",
    action: "查看優惠"
  },
  parking: {
    group: "交通移動",
    title: "停車費，也有回饋這回事。",
    description: "停車場與繳費平台各自有合作卡別，通勤族可以留意一下。",
    action: "查看優惠"
  },
  movies: {
    group: "休閒娛樂",
    title: "看電影，順便拿張優惠票。",
    description: "影城與售票平台常有指定卡優惠，週末出門前先確認。",
    action: "查看優惠"
  },
  "roadside-assistance": {
    group: "安心保障",
    title: "車子拋錨的時候，誰來幫你？",
    description: "道路救援多半是卡片附帶權益，不用花錢但要先知道自己有。",
    action: "看權益"
  }
};

/** 找不到文案時回退為情境標籤本身，確保新增情境不會讓首頁破版。 */
export function getScenarioCopy(slug: string, tagLabel: string): ScenarioCopy {
  return (
    SCENARIO_COPY[slug] ?? {
      group: "生活情境",
      title: tagLabel,
      description: `找${tagLabel}相關的信用卡回饋。`,
      action: "查看優惠"
    }
  );
}
