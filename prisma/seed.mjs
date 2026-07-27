import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "replace-with-a-local-admin-password";

const daysFromNow = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const fixedDate = (value) => {
  const date = new Date(`${value}T00:00:00+08:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const categories = [
  {
    name: "現金回饋",
    slug: "cashback",
    iconName: "wallet",
    sortOrder: 10,
    description: "整理信用卡現金回饋、刷卡金與一般消費回饋活動。"
  },
  {
    name: "餐飲美食",
    slug: "dining",
    iconName: "utensils",
    sortOrder: 20,
    description: "整理餐廳、外送、聚餐與指定美食通路優惠。"
  },
  {
    name: "旅遊交通",
    slug: "travel",
    iconName: "plane",
    sortOrder: 30,
    description: "整理海外消費、哩程、機場接送、貴賓室與旅遊保險權益。"
  },
  {
    name: "網購電商",
    slug: "online-shopping",
    iconName: "shopping-bag",
    sortOrder: 40,
    description: "整理網購平台、訂閱服務與行動支付線上消費優惠。"
  },
  {
    name: "交通通勤",
    slug: "transport",
    iconName: "train",
    sortOrder: 50,
    description: "整理加油、停車、捷運、公車與電子票證自動加值優惠。"
  },
  {
    name: "分期零利率",
    slug: "installment",
    iconName: "calendar",
    sortOrder: 60,
    description: "整理 3C、旅遊、家電與指定通路分期零利率優惠。"
  }
];

const banks = [
  {
    name: "國泰世華銀行",
    slug: "cathay",
    logoUrl: "/uploads/banks/cathay-logo.png",
    logoAlt: "國泰世華銀行 Logo",
    websiteUrl: "https://www.cathaybk.com.tw/",
    description: "國泰世華銀行信用卡與 CUBE 卡權益測試資料。",
    isActive: true
  },
  {
    name: "台新銀行",
    slug: "taishin",
    logoUrl: "/uploads/banks/taishin-logo.png",
    logoAlt: "台新銀行 Logo",
    websiteUrl: "https://www.taishinbank.com.tw/",
    description: "台新銀行信用卡優惠測試資料，用來保留多銀行比較情境。",
    isActive: true
  },
  {
    name: "永豐銀行",
    slug: "sinopac",
    logoUrl: "/uploads/banks/sinopac-logo.png",
    logoAlt: "永豐銀行 Logo",
    websiteUrl: "https://bank.sinopac.com/",
    description: "永豐銀行信用卡資料，包含 DAWHO 現金回饋信用卡。",
    isActive: true
  },
  {
    name: "滙豐銀行",
    slug: "hsbc-taiwan",
    logoUrl: "/uploads/banks/hsbc-logo.png",
    logoAlt: "滙豐銀行 Logo",
    websiteUrl: "https://www.hsbc.com.tw/",
    description: "滙豐銀行旅遊信用卡資料，包含 Traveller 與 TravelOne 卡。",
    isActive: true
  }
];

const cards = [
  {
    bankSlug: "cathay",
    name: "CUBE 卡",
    slug: "cube-card",
    imageUrl: "/uploads/cards/cube-card.png",
    summary: "CUBE 卡主打可切換權益方案，指定消費最高 3.3% 小樹點回饋。",
    description:
      "國泰世華 CUBE 卡可依生活場景切換玩數位、樂饗購、趣旅行、集精選等權益，指定消費回饋依等級與任務條件而異。",
    targetAudience: "想用一張卡覆蓋餐飲、網購、旅行與指定通路回饋的使用者。",
    sourceUrl: "https://www.cathay-cube.com.tw/cathaybk/personal/product/credit-card/cards/cube"
  },
  {
    bankSlug: "cathay",
    name: "國泰世華蝦皮購物聯名卡",
    slug: "cathay-shopee-card",
    imageUrl: "/uploads/cards/cathay-shopee-card.png",
    summary: "適合蝦皮購物與指定網購場景的測試卡片。",
    description: "保留作為網購電商分類的關聯測試卡，資料為 MVP 測試用途。",
    targetAudience: "經常使用蝦皮或網購平台的使用者。"
  },
  {
    bankSlug: "taishin",
    name: "台新 Giving 卡",
    slug: "giving-card",
    imageUrl: "/uploads/cards/giving-card.png",
    summary: "保留作為餐飲與一般消費分類的測試卡片。",
    description: "台新 Giving 卡在 seed 中用於測試跨銀行、跨分類優惠呈現。",
    targetAudience: "想比較不同銀行現金回饋的使用者。"
  },
  {
    bankSlug: "taishin",
    name: "FlyGo 卡",
    slug: "flygo-card",
    imageUrl: "/uploads/cards/flygo-card.png",
    summary: "保留作為旅遊交通分類的測試卡片。",
    description: "FlyGo 卡在 seed 中用於測試旅遊類優惠與多卡關聯呈現。",
    targetAudience: "常訂機票、住宿或旅行服務的使用者。"
  },
  {
    bankSlug: "sinopac",
    name: "DAWHO現金回饋信用卡",
    slug: "dawho-cashback-card",
    imageUrl: "/uploads/cards/dawho-cashback-card.png",
    summary: "大戶 Plus 等級國內一般消費最高 5%、國外最高 6% 現金回饋。",
    description:
      "永豐 DAWHO 現金回饋信用卡主打大戶等級加碼回饋、國內外一般消費現金回饋、悠遊卡自動加值回饋與新戶行動支付活動。",
    targetAudience: "已使用或準備使用 DAWHO 數位帳戶、想要國內外現金回饋的使用者。",
    sourceUrl: "https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html"
  },
  {
    bankSlug: "sinopac",
    name: "永豐 Sport 卡",
    slug: "sport-card",
    imageUrl: "/uploads/cards/sport-card.png",
    summary: "保留作為交通通勤與運動生活情境的測試卡片。",
    description: "Sport 卡在 seed 中用於保留永豐銀行其他信用卡與多卡關聯情境。",
    targetAudience: "想比較通勤、運動與生活回饋的使用者。"
  },
  {
    bankSlug: "hsbc-taiwan",
    name: "HSBC Traveller's Infinite Card",
    slug: "hsbc-travellers-infinite-card",
    imageUrl: "/uploads/cards/hsbc-travellers-infinite-card.png",
    summary: "海外消費 NT$10 累積 1 點，並提供機場接送與貴賓室權益。",
    description:
      "HSBC Traveller's Infinite Card 主打海外消費點數、航空與飯店兌換、每年機場接送與機場貴賓室使用次數。",
    targetAudience: "高頻海外旅遊、重視機場服務與點數兌換的使用者。",
    sourceUrl: "https://www.hsbc.com.tw/credit-cards/products/travel/visa-infinite/"
  },
  {
    bankSlug: "hsbc-taiwan",
    name: "HSBC TravelOne Signature Credit Card",
    slug: "hsbc-travelone-signature-card",
    imageUrl: "/uploads/cards/hsbc-travelone-signature-card.png",
    summary: "海外 TWD15、國內 TWD18 累積 1 travel point，含旅遊權益與保險。",
    description:
      "HSBC TravelOne Signature Credit Card 主打國內外消費累積 travel points、旅遊點數兌換、機場接送、貴賓室與旅遊保險。",
    targetAudience: "想用較低門檻累積旅遊點數並需要基本旅遊權益的使用者。",
    sourceUrl: "https://www.hsbc.com.tw/credit-cards/products/travelone-signature/"
  }
];

const offerSeeds = [
  {
    categorySlug: "cashback",
    cardSlugs: ["cube-card", "flygo-card"],
    title: "CUBE 卡指定權益最高 3% 回饋",
    slug: "cube-cashback-3",
    summary: "CUBE 卡指定權益最高 3% 回饋，本月推薦測試優惠。",
    description: "以 CUBE 卡指定權益作為現金回饋分類測試，保留 FlyGo 卡作為多卡關聯顯示範例。",
    rewardType: "points",
    rewardValue: "最高 3%",
    rewardCap: "依 CUBE 權益等級與官方活動規則計算。",
    minSpend: "依官方指定通路與活動門檻。",
    conditions: "需依 CUBE App 權益切換、等級與指定任務規則判定。",
    sourceUrl: "https://www.cathay-cube.com.tw/cathaybk/personal/product/credit-card/cards/cube",
    startDate: fixedDate("2026-01-01"),
    endDate: fixedDate("2026-12-31"),
    tags: "CUBE,小樹點,指定權益",
    isFeatured: true,
    recommendScore: 95,
    sortOrder: 10
  },
  {
    categorySlug: "dining",
    cardSlugs: ["cube-card"],
    title: "CUBE 餐飲系列活動",
    slug: "cube-dining-2026",
    summary: "每週四持 CUBE 信用卡國內餐廳消費單筆滿 NT$2,000，可獲加碼 5% 優惠券。",
    description:
      "每週四外出用餐任務：每週四持CUBE信用卡國內餐廳消費單筆滿NT$2,000(下稱「週四外出用餐任務」)，可獲加碼5%優惠券，每張優惠券回饋上限100點小樹點 (信用卡)。\n\n單月餐廳消費累積滿 NT$20,000 時，可再依官方活動規則取得指定餐廳 10% 小樹點優惠券。使用前要先確認是否需要登錄或領券，並確認消費餐廳是否在國泰世華認列的國內餐廳範圍內。",
    rewardType: "points",
    rewardValue: "加碼 5% 優惠券；指定餐廳最高 10% 小樹點",
    rewardCap: "週四外出用餐任務每張優惠券回饋上限 100 點小樹點；其他優惠券上限以官方活動頁為準。",
    minSpend: "每週四國內餐廳消費單筆滿 NT$2,000；指定餐廳加碼需每月餐廳消費累積滿 NT$20,000。",
    conditions: "先確認是否需要登錄或領券。不是所有餐廳都適用，交易是否符合國內餐廳消費、請款時間、優惠券使用期間與回饋上限，均以國泰世華官方活動頁公告為準。",
    sourceUrl:
      "https://www.cathay-cube.com.tw/cathaybk/personal/event/overview/credit-card/dining/202604/cube_dining",
    startDate: fixedDate("2026-06-01"),
    endDate: fixedDate("2026-12-31"),
    tags: "餐飲,CUBE,小樹點",
    isFeatured: true,
    recommendScore: 93,
    sortOrder: 20
  },
  {
    categorySlug: "transport",
    cardSlugs: ["cube-card"],
    title: "CUBE 台塑家權益 2% 小樹點",
    slug: "cube-fpc-2-percent",
    summary: "切換台塑家權益後，指定台塑通路與便利商店享 2% 小樹點。",
    description: "用於測試同一張信用卡可連到多個不同生活場景權益。",
    rewardType: "points",
    rewardValue: "2%",
    rewardCap: "依官方權益方案公告。",
    minSpend: "依指定台塑通路與便利商店交易認定。",
    conditions: "需於 CUBE App 切換台塑家權益，且符合官方指定通路。",
    sourceUrl:
      "https://www.cathay-cube.com.tw/cathaybk/personal/product/credit-card/cards/cube-list#FPC",
    startDate: fixedDate("2026-01-01"),
    endDate: fixedDate("2026-12-31"),
    tags: "台塑家,加油,便利商店",
    isFeatured: false,
    recommendScore: 82,
    sortOrder: 30
  },
  {
    categorySlug: "travel",
    cardSlugs: ["hsbc-travellers-infinite-card"],
    title: "HSBC Traveller 海外消費點數",
    slug: "hsbc-traveller-overseas-points",
    summary: "海外消費 NT$10 累積 1 點，可兌換航空與飯店合作夥伴。",
    description: "Traveller's Infinite Card 以海外消費累點與旅遊兌換作為主要賣點。",
    rewardType: "points",
    rewardValue: "NT$10 = 1 點",
    rewardCap: "依滙豐官方點數與兌換規則。",
    minSpend: "海外一般消費。",
    conditions: "點數累積與兌換須依官方公告、合作航空與飯店規則。",
    sourceUrl: "https://www.hsbc.com.tw/credit-cards/products/travel/visa-infinite/",
    startDate: fixedDate("2026-01-01"),
    endDate: fixedDate("2026-12-31"),
    tags: "HSBC,海外消費,旅遊點數",
    isFeatured: true,
    recommendScore: 91,
    sortOrder: 40
  },
  {
    categorySlug: "travel",
    cardSlugs: ["hsbc-travellers-infinite-card"],
    title: "HSBC Traveller 機場接送與貴賓室",
    slug: "hsbc-traveller-airport-benefits",
    summary: "每年 4 次機場接送與 8 次機場貴賓室使用權益。",
    description: "用於測試非現金回饋型旅遊權益是否能放入現有 Offer 欄位。",
    rewardType: "travel-benefit",
    rewardValue: "接送 4 次 / 貴賓室 8 次",
    rewardCap: "每年使用次數依官方資格與預約規則。",
    minSpend: "依官方旅遊權益使用條件。",
    conditions: "需符合卡別、年度次數、預約方式與滙豐官方服務條款。",
    sourceUrl: "https://www.hsbc.com.tw/credit-cards/products/travel/visa-infinite/",
    startDate: fixedDate("2026-01-01"),
    endDate: fixedDate("2026-12-31"),
    tags: "機場接送,貴賓室,旅遊權益",
    isFeatured: false,
    recommendScore: 86,
    sortOrder: 50
  },
  {
    categorySlug: "travel",
    cardSlugs: ["hsbc-travelone-signature-card"],
    title: "TravelOne 海外與國內消費點數",
    slug: "hsbc-travelone-spending-points",
    summary: "海外 TWD15、國內 TWD18 累積 1 travel point，點數可兌換旅遊合作夥伴。",
    description: "TravelOne 卡用於測試同時有海外與國內累點規則的真實卡片資料。",
    rewardType: "points",
    rewardValue: "海外 TWD15 / 國內 TWD18 = 1 點",
    rewardCap: "點數累積與兌換依官方規則。",
    minSpend: "國內外一般消費。",
    conditions: "須符合 TravelOne 卡消費與旅遊點數兌換規則。",
    sourceUrl: "https://www.hsbc.com.tw/credit-cards/products/travelone-signature/",
    startDate: fixedDate("2026-01-01"),
    endDate: fixedDate("2026-12-31"),
    tags: "TravelOne,海外消費,國內消費,旅遊點數",
    isFeatured: true,
    recommendScore: 89,
    sortOrder: 60
  },
  {
    categorySlug: "travel",
    cardSlugs: ["hsbc-travelone-signature-card"],
    title: "TravelOne 旅遊保險與機場權益",
    slug: "hsbc-travelone-travel-benefits",
    summary: "提供機場接送、貴賓室與最高 TWD20,000,000 旅遊保險相關權益。",
    description: "用於測試旅遊保險、年費與申請門檻等資訊放在現有條件欄位是否好讀。",
    rewardType: "travel-benefit",
    rewardValue: "旅遊保險最高 TWD20,000,000",
    rewardCap: "依官方保險與權益條款。",
    minSpend: "依官方旅遊保險與權益啟用條件。",
    conditions: "正卡年費 TWD2,500；申請資格與權益使用需依滙豐官方公告。",
    sourceUrl: "https://www.hsbc.com.tw/credit-cards/products/travelone-signature/",
    startDate: fixedDate("2026-01-01"),
    endDate: fixedDate("2026-12-31"),
    tags: "旅遊保險,機場接送,貴賓室",
    isFeatured: false,
    recommendScore: 80,
    sortOrder: 70
  },
  {
    categorySlug: "cashback",
    cardSlugs: ["dawho-cashback-card"],
    title: "DAWHO 一般消費最高6%現金回饋",
    slug: "dawho-general-cashback-2026h2",
    summary: "DAWHO卡一般消費國內1%、國外2%，完成指定任務與等級條件最高國內5%、國外6%。",
    description:
      "活動期間：2026/7/1-2026/12/31。\n\n持 DAWHO 現金回饋信用卡刷一般消費，國內1%、國外2%現金回饋無上限。\n\n想拿最高國內5%、國外6%，需同時滿足兩件事：\n一、完成指定任務：綁定 DAWHO 數位存款新臺幣帳戶自動扣繳信用卡帳款且扣款成功，並使用電子或行動帳單（取消實體帳單）。兩項須同時達成。\n二、達到 DAWHO 帳戶等級：「大戶」等級加碼2.5%、「大戶Plus」等級加碼4%；一般等級（大大）無加碼。\n\nDAWHO 等級是什麼：永豐 DAWHO 數位帳戶依資產分為大大、大戶、大戶Plus 三級。大戶＝當月平均財富達新臺幣30萬元以上（新開戶、以帳戶扣繳永豐信貸、當月台股成交或單筆換匯5,000元以上亦可達成），次月生效；大戶Plus＝當月平均財富達新臺幣100萬元以上，且當月完成台股現貨交易或單筆換匯5,000元以上，次月生效。詳細規則見官方分級制度說明：https://dawho.tw/faq/memberloyalty/\n\n回饋金依官方規則匯入持卡人永豐銀行 DAWHO 數位存款新臺幣帳戶。",
    rewardType: "cashback",
    rewardValue: "國內最高5%、國外最高6%；一般消費國內1%、國外2%",
    rewardCap: "大戶Plus加碼上限NT$1,000/月帳單週期；大戶加碼上限NT$400/月帳單週期；基本回饋無上限。",
    minSpend: null,
    conditions:
      "需完成 DAWHO 數位存款新臺幣帳戶自動扣繳信用卡帳款，並使用電子或行動帳單且取消實體帳單。加碼回饋不含保費代繳金額且限一般消費。分期交易不享原卡片國內1%、國外2%與任務加碼現金回饋。國外消費限外幣交易，排除國外消費結匯手續費、動態外幣交易、預借現金、賭場交易、爭議款、帳務調整、各項手續費等官方列示項目。",
    sourceUrl: "https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html",
    lastVerifiedAt: fixedDate("2026-07-08"),
    startDate: fixedDate("2026-07-01"),
    endDate: fixedDate("2026-12-31"),
    tags: "現金回饋,免切換,期間限定,電子帳單,自動扣繳",
    isFeatured: true,
    recommendScore: 94,
    sortOrder: 80
  },
  {
    categorySlug: "transport",
    cardSlugs: ["dawho-cashback-card"],
    title: "DAWHO 悠遊卡自動加值最高 5%",
    slug: "dawho-easycard-autoload-cashback-2026h2",
    summary: "DAWHO卡完成指定任務後，悠遊卡自動加值大戶Plus享5%、大戶享3%現金回饋。",
    description:
      "活動期間：2026/7/1-2026/12/31。\n\n持 DAWHO 現金回饋信用卡設定悠遊卡自動加值，完成指定任務（綁定 DAWHO 數位帳戶自動扣繳信用卡帳款＋使用電子或行動帳單並取消實體帳單，兩項須同時達成）後，依 DAWHO 帳戶等級回饋：大戶Plus 享5%、大戶享3%；一般等級（大大）無此回饋。\n\nDAWHO 等級是什麼：大戶＝當月平均財富達新臺幣30萬元以上（次月生效）；大戶Plus＝當月平均財富達新臺幣100萬元以上且當月完成台股現貨交易或單筆換匯5,000元以上（次月生效）。詳細規則見官方分級制度說明：https://dawho.tw/faq/memberloyalty/\n\n此回饋與一般消費基本回饋、指定任務加碼分開計算。",
    rewardType: "cashback",
    rewardValue: "大戶Plus 5%；大戶 3%",
    rewardCap: "大戶Plus上限NT$500/月帳單週期；大戶上限NT$100/月帳單週期；大大等級無回饋。",
    minSpend: null,
    conditions:
      "悠遊卡自動加值限完成指定任務之客戶，依前月帳單符合悠遊卡自動加值消費計算；不含基本消費回饋及指定任務加碼回饋。指定任務為完成數位帳戶扣繳信用卡款，並使用電子或行動帳單且取消實體帳單。",
    sourceUrl: "https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html",
    lastVerifiedAt: fixedDate("2026-07-08"),
    startDate: fixedDate("2026-07-01"),
    endDate: fixedDate("2026-12-31"),
    tags: "現金回饋,悠遊卡,自動加值,通勤,小額支付,期間限定",
    isFeatured: false,
    recommendScore: 84,
    sortOrder: 90
  },
  {
    categorySlug: "online-shopping",
    cardSlugs: ["dawho-cashback-card"],
    title: "DAWHO 新戶行動支付 20% 刷卡金",
    slug: "dawho-mobile-pay-new-cardholder-2026",
    summary: "新戶核卡後 45 日內綁定指定行動支付，一般消費享 20% 刷卡金回饋。",
    description: "用於測試新戶限定、行動支付、名額與核卡日條件較多的活動。",
    rewardType: "cashback",
    rewardValue: "20%",
    rewardCap: "回饋上限 NT$500，且限量名額依官方公告。",
    minSpend: "核卡後指定期間內的行動支付一般消費。",
    conditions: "限新戶，須綁定 Apple Pay / Google Pay / Samsung Pay / Garmin Pay 並符合核卡與請款期限。",
    sourceUrl: "https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html",
    startDate: fixedDate("2026-01-01"),
    endDate: fixedDate("2026-06-30"),
    tags: "新戶,行動支付,刷卡金",
    isFeatured: true,
    recommendScore: 90,
    sortOrder: 100
  },
  {
    categorySlug: "dining",
    cardSlugs: ["dawho-cashback-card"],
    title: "DAWHO 大戶屋套餐 9 折",
    slug: "dawho-otoya-10-percent-off-2026",
    summary: "活動期間至大戶屋點「永豐DAWHO幣倍套餐」，出示永豐 DAWHO 信用卡或幣倍卡享 9 折優惠價。",
    description:
      "活動期間：2026/5/15-2026/7/14\n\n至大戶屋餐廳點「永豐DAWHO幣倍套餐」，結帳出示永豐DAWHO信用卡/幣倍卡，享專屬套餐優惠價$460元/份(原價$510，期間限定9折優惠)，另須支付原價之10%服務費，不得與其他店內優惠併用。\n\n套餐內容：滑蛋豬排鍋定食/野菜豬肉鍋定食/炸腰內肉定食(3選1)+茶碗蒸1份+養生紅豆湯圓1份+紅茶(冷/熱)1杯。",
    rewardType: "discount",
    rewardValue: "9 折",
    rewardCap: "專屬套餐優惠價 $460 元/份，原價 $510；仍須另支付原價之 10% 服務費。",
    minSpend: "需於大戶屋餐廳點購「永豐DAWHO幣倍套餐」。",
    conditions: "結帳須出示永豐DAWHO信用卡/幣倍卡。不得與其他店內優惠併用，套餐內容與活動限制以永豐銀行官方公告為準。",
    sourceUrl: "https://bank.sinopac.com/sinopacBT/personal/credit-card/introduction/bankcard/DAWHO.html",
    startDate: fixedDate("2026-05-15"),
    endDate: fixedDate("2026-07-14"),
    tags: "大戶屋,餐飲,折扣",
    isFeatured: false,
    recommendScore: 78,
    sortOrder: 110
  },
  {
    categorySlug: "cashback",
    cardSlugs: ["giving-card"],
    title: "台新 Giving 卡一般消費回饋",
    slug: "giving-card-cashback",
    summary: "測試用一般消費現金回饋優惠。",
    description: "保留非真實主資料的測試優惠，用於多銀行與非精選列表呈現。",
    rewardType: "cashback",
    rewardValue: "2%",
    rewardCap: "依測試資料。",
    minSpend: "一般消費。",
    conditions: "測試資料，不作為實際優惠依據。",
    sourceUrl: "https://example.com/offers/giving-card-cashback",
    startDate: daysFromNow(-30),
    endDate: daysFromNow(60),
    tags: "台新,現金回饋",
    isFeatured: false,
    recommendScore: 70,
    sortOrder: 120
  },
  {
    categorySlug: "dining",
    cardSlugs: ["giving-card"],
    title: "週末餐飲回饋測試優惠",
    slug: "weekend-dining-reward",
    summary: "週末餐飲測試優惠，用來保留餐飲分類資料量。",
    description: "測試資料，不作為實際優惠依據。",
    rewardType: "cashback",
    rewardValue: "6%",
    rewardCap: "依測試資料。",
    minSpend: "指定餐飲消費。",
    conditions: "測試資料。",
    sourceUrl: "https://example.com/offers/weekend-dining-reward",
    startDate: daysFromNow(-20),
    endDate: daysFromNow(25),
    tags: "餐飲,週末",
    isFeatured: false,
    recommendScore: 62,
    sortOrder: 130
  },
  {
    categorySlug: "dining",
    cardSlugs: ["giving-card"],
    title: "日系餐飲點數測試優惠",
    slug: "japanese-dining-offer",
    summary: "日系餐飲點數測試優惠。",
    description: "測試資料，用於卡片頁相關優惠數量與排序。",
    rewardType: "points",
    rewardValue: "5x",
    rewardCap: "依測試資料。",
    minSpend: "指定餐飲消費。",
    conditions: "測試資料。",
    sourceUrl: "https://example.com/offers/japanese-dining-offer",
    startDate: daysFromNow(-15),
    endDate: daysFromNow(50),
    tags: "餐飲,點數",
    isFeatured: false,
    recommendScore: 58,
    sortOrder: 140
  },
  {
    categorySlug: "travel",
    cardSlugs: ["flygo-card"],
    title: "FlyGo 旅遊訂房測試優惠",
    slug: "flygo-travel-booking",
    summary: "旅遊訂房測試優惠，用於旅遊分類與銀行頁資料量。",
    description: "測試資料，不作為實際優惠依據。",
    rewardType: "miles",
    rewardValue: "5%",
    rewardCap: "依測試資料。",
    minSpend: "指定旅遊平台。",
    conditions: "測試資料。",
    sourceUrl: "https://example.com/offers/flygo-travel-booking",
    startDate: daysFromNow(-30),
    endDate: daysFromNow(120),
    tags: "旅遊,訂房",
    isFeatured: true,
    recommendScore: 88,
    sortOrder: 150
  },
  {
    categorySlug: "online-shopping",
    cardSlugs: ["cathay-shopee-card"],
    title: "蝦皮購物節測試優惠",
    slug: "shopee-shopping-festival",
    summary: "網購電商測試優惠。",
    description: "測試資料，用於網購分類與卡片頁關聯。",
    rewardType: "cashback",
    rewardValue: "8%",
    rewardCap: "依測試資料。",
    minSpend: "指定平台消費。",
    conditions: "測試資料。",
    sourceUrl: "https://example.com/offers/shopee-shopping-festival",
    startDate: daysFromNow(-10),
    endDate: daysFromNow(35),
    tags: "網購,蝦皮",
    isFeatured: true,
    recommendScore: 87,
    sortOrder: 160
  },
  {
    categorySlug: "online-shopping",
    cardSlugs: ["sport-card"],
    title: "Pi 拍錢包網購測試優惠",
    slug: "pi-online-shopping",
    summary: "網購與行動支付測試優惠。",
    description: "測試資料，用於搜尋與分類排序。",
    rewardType: "points",
    rewardValue: "4%",
    rewardCap: "依測試資料。",
    minSpend: "指定網購消費。",
    conditions: "測試資料。",
    sourceUrl: "https://example.com/offers/pi-online-shopping",
    startDate: daysFromNow(-5),
    endDate: daysFromNow(65),
    tags: "網購,行動支付",
    isFeatured: false,
    recommendScore: 72,
    sortOrder: 170
  },
  {
    categorySlug: "transport",
    cardSlugs: ["sport-card"],
    title: "Sport 卡通勤測試優惠",
    slug: "sport-card-transport",
    summary: "交通通勤測試優惠。",
    description: "測試資料，用於永豐銀行頁多卡資料呈現。",
    rewardType: "cashback",
    rewardValue: "3%",
    rewardCap: "依測試資料。",
    minSpend: "指定交通消費。",
    conditions: "測試資料。",
    sourceUrl: "https://example.com/offers/sport-card-transport",
    startDate: daysFromNow(-20),
    endDate: daysFromNow(55),
    tags: "交通,通勤",
    isFeatured: false,
    recommendScore: 66,
    sortOrder: 180
  },
  {
    categorySlug: "installment",
    cardSlugs: ["cube-card"],
    title: "CUBE 3C 分期零利率",
    slug: "cube-3c-installment",
    summary: "指定 3C 通路分期零利率測試優惠。",
    description: "測試資料，用於分期分類與 CUBE 卡相關優惠呈現。",
    rewardType: "installment",
    rewardValue: "0%",
    rewardCap: "依測試資料。",
    minSpend: "指定 3C 通路。",
    conditions: "測試資料。",
    sourceUrl: "https://example.com/offers/cube-3c-installment",
    startDate: daysFromNow(-30),
    endDate: daysFromNow(100),
    tags: "分期,3C",
    isFeatured: false,
    recommendScore: 76,
    sortOrder: 190
  },
  {
    categorySlug: "installment",
    cardSlugs: ["giving-card"],
    title: "家電分期測試優惠",
    slug: "appliance-installment",
    summary: "家電分期零利率測試優惠。",
    description: "測試資料，用於分期分類資料量。",
    rewardType: "installment",
    rewardValue: "0%",
    rewardCap: "依測試資料。",
    minSpend: "指定家電通路。",
    conditions: "測試資料。",
    sourceUrl: "https://example.com/offers/appliance-installment",
    startDate: daysFromNow(-20),
    endDate: daysFromNow(110),
    tags: "分期,家電",
    isFeatured: false,
    recommendScore: 64,
    sortOrder: 200
  },
  {
    categorySlug: "dining",
    cardSlugs: ["flygo-card"],
    title: "已過期餐飲測試優惠",
    slug: "expired-dining-campaign",
    summary: "已過期優惠測試資料，預設前台不顯示。",
    description: "用於測試 showExpiredOffers 關閉時的前台過期優惠隱藏規則。",
    rewardType: "cashback",
    rewardValue: "5%",
    rewardCap: "依測試資料。",
    minSpend: "指定餐飲消費。",
    conditions: "測試資料。",
    sourceUrl: "https://example.com/offers/expired-dining-campaign",
    startDate: daysFromNow(-90),
    endDate: daysFromNow(-10),
    tags: "過期,餐飲",
    isFeatured: false,
    recommendScore: 30,
    sortOrder: 210
  },
  {
    categorySlug: "installment",
    cardSlugs: ["dawho-cashback-card"],
    title: "旅遊分期草稿測試優惠",
    slug: "travel-installment-fee",
    summary: "草稿優惠測試資料，前台不應顯示。",
    description: "用於測試草稿優惠仍可在後台編輯，但不進入前台公開列表。",
    rewardType: "installment",
    rewardValue: "0%",
    rewardCap: "依測試資料。",
    minSpend: "指定旅遊消費。",
    conditions: "測試資料。",
    sourceUrl: "https://example.com/offers/travel-installment-fee",
    startDate: daysFromNow(-5),
    endDate: daysFromNow(130),
    tags: "草稿,分期",
    isPublished: false,
    isFeatured: false,
    recommendScore: 40,
    sortOrder: 220
  }
];

async function main() {
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.offerCard.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.card.deleteMany();
  await prisma.bank.deleteMany();
  await prisma.category.deleteMany();
  await prisma.adminUser.deleteMany();
  await prisma.siteSetting.deleteMany();

  await prisma.siteSetting.create({
    data: {
      siteName: "信用卡優惠查詢",
      defaultSeoTitle: "信用卡優惠查詢｜現金回饋、餐飲、旅遊與分期比較",
      defaultSeoDescription: "查詢信用卡現金回饋、餐飲、旅遊、交通、網購與分期優惠，並從銀行與卡片關係找到適合自己的優惠。",
      homepageFeaturedCount: 6,
      categoryPageSize: 12,
      showExpiredOffers: false
    }
  });

  await prisma.adminUser.create({
    data: {
      email: adminEmail,
      passwordHash,
      displayName: "系統管理員",
      isActive: true
    }
  });

  const categoryBySlug = new Map();
  for (const category of categories) {
    const created = await prisma.category.create({
      data: {
        ...category,
        seoTitle: `${category.name}信用卡優惠`,
        seoDescription: `比較${category.name}信用卡優惠、回饋條件與適用卡片。`,
        faqJson: JSON.stringify([
          {
            question: `${category.name}優惠怎麼比較？`,
            answer: "先看適用卡片、回饋上限、最低消費、活動期間與官方條件，再依自己的消費習慣選擇。"
          }
        ])
      }
    });
    categoryBySlug.set(created.slug, created);
  }

  const bankBySlug = new Map();
  for (const bank of banks) {
    const created = await prisma.bank.create({
      data: {
        ...bank,
        seoTitle: `${bank.name}信用卡優惠`,
        seoDescription: `查看${bank.name}信用卡、相關優惠與公開活動。`
      }
    });
    bankBySlug.set(created.slug, created);
  }

  const cardBySlug = new Map();
  for (const card of cards) {
    const bank = bankBySlug.get(card.bankSlug);
    if (!bank) throw new Error(`Missing bank for card: ${card.name}`);

    const created = await prisma.card.create({
      data: {
        bankId: bank.id,
        name: card.name,
        slug: card.slug,
        imageUrl: card.imageUrl,
        imageAlt: `${card.name}卡面圖片`,
        summary: card.summary,
        description: card.description,
        targetAudience: card.targetAudience,
        seoTitle: `${card.name}優惠與權益`,
        seoDescription: card.summary,
        isActive: true
      }
    });
    cardBySlug.set(created.slug, created);
  }

  const inactiveBank = await prisma.bank.create({
    data: {
      name: "停用測試銀行",
      slug: "inactive-bank",
      logoUrl: "/uploads/banks/inactive-logo.png",
      logoAlt: "停用測試銀行 Logo",
      websiteUrl: "https://example.com/inactive-bank",
      description: "停用狀態測試資料，不應作為前台主要內容。",
      seoTitle: "停用測試銀行",
      seoDescription: "停用狀態測試資料。",
      isActive: false
    }
  });

  const inactiveCard = await prisma.card.create({
    data: {
      bankId: inactiveBank.id,
      name: "停用測試卡",
      slug: "inactive-test-card",
      imageUrl: "/uploads/cards/inactive-test-card.png",
      imageAlt: "停用測試卡卡面圖片",
      summary: "停用狀態測試卡，不應作為前台主要內容。",
      description: "用於保留 T03 停用卡片資料覆蓋。",
      targetAudience: "測試用。",
      seoTitle: "停用測試卡",
      seoDescription: "停用狀態測試資料。",
      isActive: false
    }
  });
  cardBySlug.set(inactiveCard.slug, inactiveCard);

  for (const [index, seed] of offerSeeds.entries()) {
    const category = categoryBySlug.get(seed.categorySlug);
    if (!category) throw new Error(`Missing category for offer: ${seed.title}`);

    // [T21] 回饋改由 RewardTier 承載。多層優惠可在 seed 提供 seed.tiers 陣列；
    // 未提供時，用既有扁平欄位組出單一層 tier。
    const tiers = (
      seed.tiers ?? [
        {
          label: null,
          rewardType: seed.rewardType,
          rate: seed.rewardValue,
          cap: seed.rewardCap,
          capPeriod: null,
          minSpend: seed.minSpend,
          conditionsText: seed.conditions,
          conditions: null
        }
      ]
    ).map((tier, tierIndex) => ({
      label: tier.label ?? null,
      rewardType: tier.rewardType ?? null,
      rate: tier.rate ?? null,
      cap: tier.cap ?? null,
      capPeriod: tier.capPeriod ?? null,
      minSpend: tier.minSpend ?? null,
      conditionsText: tier.conditionsText ?? null,
      conditions: tier.conditions ?? null,
      sortOrder: tierIndex
    }));

    const offer = await prisma.offer.create({
      data: {
        categoryId: category.id,
        title: seed.title,
        slug: seed.slug,
        summary: seed.summary,
        summaryMode: index % 3 === 0 ? "manual" : "system",
        targetAudience: "想比較信用卡優惠條件與適用卡片的使用者。",
        highlight1: seed.rewardValue,
        highlight2: seed.rewardCap,
        manualSummary: index % 3 === 0 ? seed.summary : null,
        summaryPreview: seed.summary,
        description: seed.description,
        startDate: seed.startDate,
        endDate: seed.endDate,
        headlineRate: tiers.find((tier) => tier.rate)?.rate ?? seed.rewardValue ?? null,
        sourceUrl: seed.sourceUrl,
        lastVerifiedAt: seed.lastVerifiedAt ?? fixedDate("2026-06-16"),
        tags: seed.tags,
        seoTitle: `${seed.title}｜信用卡優惠`,
        seoDescription: seed.summary,
        faqJson: JSON.stringify([
          {
            question: "這個優惠適合誰？",
            answer: "請先確認適用卡片、活動期間、回饋上限與官方條件，再依自己的消費情境判斷。"
          }
        ]),
        isFeatured: seed.isFeatured,
        recommendScore: seed.recommendScore,
        sortOrder: seed.sortOrder,
        isPublished: seed.isPublished ?? true,
        tiers: { create: tiers }
      }
    });

    for (const cardSlug of seed.cardSlugs) {
      const card = cardBySlug.get(cardSlug);
      if (!card) throw new Error(`Missing card ${cardSlug} for offer: ${seed.title}`);
      await prisma.offerCard.create({
        data: {
          offerId: offer.id,
          cardId: card.id
        }
      });
    }
  }

  const inactiveCategory = categoryBySlug.get("cashback");
  await prisma.offer.create({
    data: {
      categoryId: inactiveCategory.id,
      title: "停用卡片測試優惠",
      slug: "inactive-card-test-offer",
      summary: "停用卡片關聯測試優惠，不作為前台主要內容。",
      summaryMode: "system",
      targetAudience: "測試用。",
      highlight1: "1%",
      highlight2: "停用測試",
      summaryPreview: "停用卡片關聯測試優惠。",
      description: "用於保留 T03 停用卡片與草稿資料覆蓋。",
      startDate: daysFromNow(-10),
      endDate: daysFromNow(20),
      rewardType: "cashback",
      rewardValue: "1%",
      rewardCap: "測試資料。",
      minSpend: "測試資料。",
      conditions: "測試資料。",
      sourceUrl: "https://example.com/offers/inactive-card-test-offer",
      lastVerifiedAt: fixedDate("2026-06-16"),
      tags: "停用,測試",
      seoTitle: "停用卡片測試優惠",
      seoDescription: "停用卡片關聯測試優惠。",
      isFeatured: false,
      recommendScore: 10,
      sortOrder: 230,
      isPublished: false,
      cards: {
        create: {
          cardId: inactiveCard.id
        }
      }
    }
  });

  console.log(`Seed completed: ${banks.length + 1} banks, ${cards.length + 1} cards, ${categories.length} categories, ${offerSeeds.length + 1} offers.`);
  console.log(`Admin login email: ${adminEmail}`);
  console.log("Admin password source: ADMIN_PASSWORD in .env");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
