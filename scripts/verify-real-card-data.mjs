// [T17 停用，2026-07-27] 本腳本斷言的是 T16 第一輪局部真實資料（僅 10 筆優惠）當時的英文
// 卡名與 slug（如 hsbc-taiwan、dawho-high-cashback-2026、cube-dining-2026）。T16 兩輪匯入
// 完成後的最終資料集（6家銀行/10張卡/16筆優惠）已完全不同，執行必定失敗。保留本檔供歷史
// 回溯，不刪除；正式資料時期的對應檢查由 scripts/verify-release-data.mjs 取代。詳見 T17 Summary。
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3000";
const failures = [];

async function expectText(path, requiredTexts, forbiddenTexts = []) {
  const response = await fetch(`${baseUrl}${path}`);
  const html = await response.text();
  if (response.status !== 200) failures.push(`${path} should return 200, got ${response.status}`);
  for (const text of requiredTexts) {
    if (!html.includes(text)) failures.push(`${path} missing text: ${text}`);
  }
  for (const text of forbiddenTexts) {
    if (html.includes(text)) failures.push(`${path} should not include text: ${text}`);
  }
}

try {
  const requiredBanks = ["國泰世華銀行", "滙豐銀行", "永豐銀行"];
  const requiredCards = [
    "CUBE 卡",
    "HSBC Traveller's Infinite Card",
    "HSBC TravelOne Signature Credit Card",
    "DAWHO現金回饋信用卡"
  ];
  const requiredOffers = [
    "CUBE 餐飲系列活動",
    "HSBC Traveller 海外消費點數",
    "TravelOne 海外與國內消費點數",
    "DAWHO 國內外最高 6% 現金回饋",
    "DAWHO 大戶屋套餐 9 折"
  ];

  for (const name of requiredBanks) {
    const bank = await prisma.bank.findFirst({ where: { name } });
    if (!bank) failures.push(`Missing bank: ${name}`);
  }

  for (const name of requiredCards) {
    const card = await prisma.card.findFirst({
      where: { name },
      include: { bank: true, offers: { include: { offer: true } } }
    });
    if (!card) {
      failures.push(`Missing card: ${name}`);
      continue;
    }
    if (!card.summary) failures.push(`${name} should have a summary`);
    if (!card.description) failures.push(`${name} should have a description`);
    if (!card.imageUrl) failures.push(`${name} should have imageUrl or a usable image reference`);
    if (card.offers.length < 1) failures.push(`${name} should have at least one related offer`);
  }

  for (const title of requiredOffers) {
    const offer = await prisma.offer.findFirst({
      where: { title },
      include: { cards: { include: { card: { include: { bank: true } } } } }
    });
    if (!offer) {
      failures.push(`Missing offer: ${title}`);
      continue;
    }
    if (!offer.sourceUrl) failures.push(`${title} should keep official sourceUrl`);
    if (!offer.conditions) failures.push(`${title} should describe conditions`);
    if (offer.cards.length < 1) failures.push(`${title} should link to at least one card`);
  }

  await expectText("/search?q=%E6%B0%B8%E8%B1%90", ["永豐銀行", "DAWHO現金回饋信用卡"]);
  await expectText("/cards/dawho-cashback-card", ["永豐銀行", "DAWHO 國內外最高 6% 現金回饋"]);
  await expectText("/offers/dawho-high-cashback-2026", ["DAWHO現金回饋信用卡", "永豐銀行"]);
  await expectText("/banks/hsbc-taiwan", ["滙豐銀行", "HSBC Traveller's Infinite Card", "HSBC TravelOne Signature Credit Card"]);
  await expectText(
    "/offers/cube-dining-2026",
    [
      "怎麼拿到優惠",
      "先確認是否需要登錄或領券",
      "每週四外出用餐",
      "單筆滿NT$2,000",
      "每月餐廳消費累積滿 NT$20,000",
      "不是所有餐廳都適用",
      "注意事項",
      "以國泰世華官方活動頁公告為準"
    ],
    ["points"]
  );
  await expectText(
    "/offers/dawho-otoya-10-percent-off-2026",
    [
      "怎麼拿到優惠",
      "活動期間：2026/5/15-2026/7/14",
      "至大戶屋餐廳點「永豐DAWHO幣倍套餐」",
      "結帳出示永豐DAWHO信用卡/幣倍卡",
      "專屬套餐優惠價$460元/份",
      "原價$510",
      "另須支付原價之10%服務費",
      "不得與其他店內優惠併用",
      "套餐內容：滑蛋豬排鍋定食/野菜豬肉鍋定食/炸腰內肉定食(3選1)+茶碗蒸1份+養生紅豆湯圓1份+紅茶(冷/熱)1杯",
      "折扣優惠"
    ]
  );
} finally {
  await prisma.$disconnect();
}

if (failures.length > 0) {
  console.error("Real card data smoke test failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Real card data smoke test passed.");
