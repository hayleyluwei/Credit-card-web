// 補齊台新 Richart 卡「切換刷」優惠資料
// 依據：https://mkp.taishinbank.com.tw/TsCms/marketing/expose/WM_20251008205057150/index.html
//       （2026-08-18 以 WebFetch 三次逐項核對後取得的官方文字）
// 背景：中秋聚餐草稿引用本優惠時發現我方資料庫只記了「最高3.8%」，但官方頁面實際是
//       LEVEL1/LEVEL2 兩層資格 x 8 個子方案（2%~10%）。使用者 2026-08-18 明確授權補資料。
// 備份：richart-backup-before-2026-08-18.json（本次寫入前的完整 Offer + tiers 快照）

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SOURCE_URL = "https://mkp.taishinbank.com.tw/TsCms/marketing/expose/WM_20251008205057150/index.html";
const CAP_NOTE = "各方案每期帳單適用加碼之消費金額，以持卡人永久信用額度加計 NT$300,000 為限；超出部分僅適用一般消費 0.3%。";
const SWITCH_NOTE =
  "每位正卡人每日限轉換一次，方案依正卡人設定計算，正附卡交易於入帳日後次二營業日統一回饋至正卡人帳戶。指定通路、支付方式與不回饋項目依台新公告認定。";

async function main() {
  const offer = await prisma.offer.findUnique({
    where: { slug: "taishin-richart-switch-rewards-2026h2" },
    include: { tiers: true }
  });

  if (!offer) {
    throw new Error("找不到 taishin-richart-switch-rewards-2026h2，中止");
  }

  const tiers = [
    {
      label: "LEVEL 1（核卡即享）",
      rewardType: "points",
      rate: "1.3%",
      cap: CAP_NOTE,
      minSpend: "持有台新 Richart 卡，於 Richart Life App 切換任一方案即可，不需額外設定。",
      conditionsText: SWITCH_NOTE,
      sortOrder: 0
    },
    {
      label: "Chill刷（火鍋燒肉／飲品／娛樂）",
      rewardType: "points",
      rate: "指定火鍋燒肉品牌 10%；日常續命飲品 10%；約會犒賞餐廳 5%；追星應援平台 5%；熬夜追更娛樂 5%；數位外掛服務 3.3%",
      cap: CAP_NOTE,
      minSpend: "完成台新帳戶自動扣繳信用卡款並升級 LEVEL 2，消費前於 App 切換 Chill刷；2026/7/8–9/30 適用。",
      conditionsText:
        "指定餐廳例：詹記麻辣火鍋、萬客什鍋、海底撈、雞湯大叔、屋馬燒肉、茶六燒肉堂、新村站著吃、燒肉政宗、碳佐麻里。付款限實體卡（含輸入卡號）、台新Pay、Apple Pay、Google錢包、Samsung Pay、LINE Pay；街口支付、台灣Pay、My FamiPay、全支付、OPEN錢包、中油Pay等不適用。",
      sortOrder: 1
    },
    {
      label: "Pay著刷（行動支付）",
      rewardType: "points",
      rate: "台新Pay及台新Pay+ 3.8%；LINE Pay及全盈+Pay 2.3%",
      cap: CAP_NOTE,
      minSpend: "完成台新帳戶自動扣繳信用卡款並升級 LEVEL 2，消費前於 App 切換 Pay著刷。",
      conditionsText: SWITCH_NOTE,
      sortOrder: 2
    },
    {
      label: "天天刷（超商／交通／加油／藥妝）",
      rewardType: "points",
      rate: "3.3%",
      cap: CAP_NOTE,
      minSpend: "完成台新帳戶自動扣繳信用卡款並升級 LEVEL 2，消費前於 App 切換天天刷。",
      conditionsText:
        "指定通路例：全家、7-11、萬家福、樂家康、大買家；臺鐵、高鐵、台灣大車隊、LINEGO、Yoxi、Uber、台灣Bolt；中油直營、全國加油、充電站；寶雅、康是美、屈臣氏等藥妝藥局。",
      sortOrder: 3
    },
    {
      label: "大筆刷（百貨／Outlet／居家／服飾）",
      rewardType: "points",
      rate: "3.3%",
      cap: CAP_NOTE,
      minSpend: "完成台新帳戶自動扣繳信用卡款並升級 LEVEL 2，消費前於 App 切換大筆刷。",
      conditionsText:
        "指定通路例：新光三越、遠東百貨、遠東SOGO等指定百貨；MITSUI OUTLET PARK、華泰名品城等 Outlet；IKEA、特力屋等居家裝修；UNIQLO、ZARA 等時尚品牌。",
      sortOrder: 4
    },
    {
      label: "好饗刷（全台餐飲／外送／購票／飯店）",
      rewardType: "points",
      rate: "3.3%",
      cap: CAP_NOTE,
      minSpend: "完成台新帳戶自動扣繳信用卡款並升級 LEVEL 2，消費前於 App 切換好饗刷；不適用 LINE Pay。",
      conditionsText:
        "涵蓋全臺餐飲（不含餐券）、Uber Eats／Foodpanda 外送、拓元／KKTIX 等購票娛樂、錢櫃／好樂迪等指定 KTV、晶華／雲朗等指定飯店。",
      sortOrder: 5
    },
    {
      label: "數趣刷（網購／線上課程／影音／AI服務）",
      rewardType: "points",
      rate: "3.3%",
      cap: CAP_NOTE,
      minSpend: "完成台新帳戶自動扣繳信用卡款並升級 LEVEL 2，消費前於 App 切換數趣刷。",
      conditionsText:
        "指定通路例：蝦皮、momo、PChome 等網購；知識衛星、Hahow 等線上課程；Netflix、Disney+ 等影音；ChatGPT、Canva 等 AI 服務。",
      sortOrder: 6
    },
    {
      label: "玩旅刷（海外消費／航空／訂房／旅行社）",
      rewardType: "points",
      rate: "3.3%",
      cap: CAP_NOTE,
      minSpend: "完成台新帳戶自動扣繳信用卡款並升級 LEVEL 2，消費前於 App 切換玩旅刷。",
      conditionsText:
        "涵蓋海外消費（含實體及線上）、中華航空／長榮等航空公司、Klook／Agoda 等訂房平台、雄獅／易遊網等旅行社。",
      sortOrder: 7
    },
    {
      label: "假日刷（國內節假日）",
      rewardType: "points",
      rate: "2%",
      cap: CAP_NOTE,
      minSpend: "完成台新帳戶自動扣繳信用卡款並升級 LEVEL 2，消費前於 App 切換假日刷。",
      conditionsText: "國內節假日不限通路皆適用。",
      sortOrder: 8
    },
    {
      label: "一般消費／保費",
      rewardType: "points",
      rate: "一般消費 0.3%（無上限）；保費一次付清 1.3%",
      cap: null,
      minSpend: "不需切換方案，一般消費自動適用；保費一次付清另計。",
      conditionsText: "超出各方案加碼上限（NT$300,000）之消費，僅回饋一般消費 0.3%。",
      sortOrder: 9
    }
  ];

  const newOfferFields = {
    title: "台新Richart卡切換刷指定通路最高 10% 台新Point",
    headlineRate: "0.3%",
    highlight1: "一般消費 0.3% 無上限；LEVEL 1 核卡即享各方案 1.3%",
    highlight2: "完成台新帳戶自扣升級 LEVEL 2 後，Chill刷指定火鍋燒肉最高 10%",
    summary:
      "2026/7/1–2027/3/31，台新Richart卡於 App 切換方案。LEVEL 1 核卡即享 1.3%；完成自動扣繳升級 LEVEL 2 後，Chill刷（火鍋燒肉等）最高 10%，Pay著刷最高 3.8%，天天刷／大筆刷／好饗刷／數趣刷／玩旅刷 3.3%，假日刷 2%；一般消費 0.3% 無上限，保費一次付清 1.3%。",
    description:
      "活動期間：2026-07-01 至 2027-03-31。\n\n" +
      "持台新 Richart 卡於 Richart Life App 切換方案。既有卡友須於帳單結帳日 3 個工作天前設定台新帳戶自動扣繳信用卡款且持續未取消，資格於次期帳單結帳後次營業日生效（LEVEL 2）；2026/7/1–2027/3/31 新申辦本卡者，核卡日起 60 天內無論是否完成自扣，皆可直接享有 LEVEL 2 權益。\n\n" +
      "LEVEL 1（核卡即享）：各方案統一 1.3%。\n\n" +
      "LEVEL 2（完成自扣後）依切換方案回饋不同：Chill刷（指定火鍋燒肉品牌、日常續命飲品最高 10%，約會犒賞餐廳／追星應援平台／熬夜追更娛樂 5%，數位外掛服務 3.3%，2026/7/8–9/30）、Pay著刷（台新Pay 系列 3.8%、LINE Pay 系列 2.3%）、天天刷（超商、交通、加油、藥妝 3.3%）、大筆刷（百貨、Outlet、居家、服飾 3.3%）、好饗刷（全臺餐飲、外送、購票、KTV、飯店 3.3%，不適用 LINE Pay）、數趣刷（網購、線上課程、影音、AI服務 3.3%）、玩旅刷（海外消費、航空、訂房、旅行社 3.3%）、假日刷（國內節假日不限通路 2%）。\n\n" +
      "各方案每期帳單適用加碼之消費金額，以持卡人永久信用額度加計 NT$300,000 為限，超出部分僅回饋一般消費 0.3%。一般消費 0.3% 無上限；保費一次付清最高 1.3%。\n\n" +
      "每日僅能擇一方案、每日限切換一次，正附卡交易依正卡人設定方案計算，於入帳日後次二營業日回饋至正卡人帳戶。指定通路、支付方式與不回饋項目依台新公告認定。",
    tags: "行動支付,加碼,長期權益,指定通路,保費,餐飲美食,海外消費,網購電商",
    sourceUrl: SOURCE_URL,
    lastVerifiedAt: new Date("2026-08-18T00:00:00+08:00")
  };

  await prisma.$transaction(async (tx) => {
    await tx.offer.update({
      where: { id: offer.id },
      data: newOfferFields
    });

    await tx.rewardTier.deleteMany({ where: { offerId: offer.id } });

    await tx.rewardTier.createMany({
      data: tiers.map((t) => ({ ...t, offerId: offer.id }))
    });
  });

  const updated = await prisma.offer.findUnique({
    where: { id: offer.id },
    include: { tiers: { orderBy: { sortOrder: "asc" } } }
  });

  console.log("更新完成");
  console.log("title:", updated.title);
  console.log("headlineRate:", updated.headlineRate);
  console.log("tags:", updated.tags);
  console.log("lastVerifiedAt:", updated.lastVerifiedAt.toISOString());
  console.log("tiers 數量:", updated.tiers.length);
  updated.tiers.forEach((t) => console.log(`  [${t.sortOrder}] ${t.label} — ${t.rate}`));
}

main()
  .catch((e) => {
    console.error("更新失敗：", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
