import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { taipeiDayOffset, taipeiTodayStart } from "@/lib/domain-date";

const navItems = [
  { label: "儀表板", href: "/admin" },
  { label: "優惠管理", href: "/admin/offers" },
  { label: "銀行管理", href: "/admin/banks" },
  { label: "信用卡管理", href: "/admin/cards" },
  { label: "分類管理", href: "/admin/categories" },
  { label: "攻略文章管理", href: "/admin/articles" },
  { label: "網站設定", href: "/admin/settings" }
];

const quickActions = [
  { label: "新增優惠", href: "/admin/offers/new", description: "建立新的信用卡優惠草稿" },
  { label: "新增信用卡", href: "/admin/cards/new", description: "新增信用卡資料與圖片路徑" },
  { label: "管理分類", href: "/admin/categories", description: "調整分類排序與 SEO 欄位" }
];

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  // [T30] 以台北日曆日為基準，否則在 Vercel（UTC）上「過期」與「即將到期」的
  // 統計會比實際早一天，與前台顯示不一致。
  const today = taipeiTodayStart();
  const soon = taipeiDayOffset(14);
  const staleVerifiedDate = taipeiDayOffset(-30);

  const [
    publishedOffers,
    draftOffers,
    expiredOffers,
    cardCount,
    bankCount,
    soonExpiringOffers,
    missingSourceOffers,
    missingImageCards,
    staleVerificationOffers
  ] = await Promise.all([
    prisma.offer.count({ where: { isPublished: true } }),
    prisma.offer.count({ where: { isPublished: false } }),
    prisma.offer.count({ where: { endDate: { lt: today } } }),
    prisma.card.count({ where: { isActive: true } }),
    prisma.bank.count({ where: { isActive: true } }),
    prisma.offer.count({
      where: {
        isPublished: true,
        endDate: {
          gte: today,
          lte: soon
        }
      }
    }),
    prisma.offer.count({
      where: {
        isPublished: true,
        OR: [{ sourceUrl: null }, { sourceUrl: "" }]
      }
    }),
    prisma.card.count({
      where: {
        isActive: true,
        OR: [{ imageUrl: null }, { imageUrl: "" }]
      }
    }),
    prisma.offer.count({
      where: {
        isPublished: true,
        OR: [{ lastVerifiedAt: null }, { lastVerifiedAt: { lt: staleVerifiedDate } }]
      }
    })
  ]);

  const stats = [
    { label: "已發布優惠", value: publishedOffers, hint: "公開站可見的優惠" },
    { label: "草稿優惠", value: draftOffers, hint: "尚未發布或待補資料" },
    { label: "過期優惠", value: expiredOffers, hint: "endDate 已早於今日" },
    { label: "信用卡數", value: cardCount, hint: "目前啟用卡片" },
    { label: "銀行數", value: bankCount, hint: "目前啟用銀行" }
  ];

  const reminders = [
    { label: "即將到期", value: soonExpiringOffers, hint: "14 天內到期的已發布優惠" },
    { label: "缺少來源連結", value: missingSourceOffers, hint: "已發布但沒有 sourceUrl" },
    { label: "缺少圖片", value: missingImageCards, hint: "啟用卡片沒有 imageUrl" },
    { label: "待重新確認", value: staleVerificationOffers, hint: "超過 30 天未確認或未填 lastVerifiedAt" }
  ];

  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-5 py-6 lg:grid-cols-[240px_1fr] lg:px-8">
        <aside className="rounded-md border border-line bg-white p-4 shadow-soft lg:sticky lg:top-6 lg:h-fit">
          <div className="border-b border-line pb-4">
            <p className="text-sm font-semibold text-brand-700">信用卡優惠查詢</p>
            <h1 className="mt-2 text-xl font-bold text-ink">後台工作台</h1>
          </div>
          <nav className="mt-4 grid gap-2 text-sm font-semibold sm:grid-cols-3 lg:grid-cols-1">
            {navItems.map((item) => (
              <a
                className="rounded-md px-3 py-2 text-slate-700 transition hover:bg-brand-50 hover:text-brand-700"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-col gap-6">
          <header className="rounded-md border border-line bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-semibold text-brand-700">Admin Dashboard</p>
                <h2 className="mt-2 text-3xl font-bold text-ink">後台工作台</h2>
                <p className="mt-3 text-base leading-7 text-slate-700">
                  已登入：{session?.user?.email ?? "管理者"}。這裡集中顯示內容維護狀態、提醒與常用操作。
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a className="rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink" href="/">
                  回公開站
                </a>
                <AdminLogoutButton />
              </div>
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {stats.map((stat) => (
              <article className="rounded-md border border-line bg-white p-5 shadow-soft" key={stat.label}>
                <p className="text-sm font-semibold text-slate-600">{stat.label}</p>
                <p className="mt-3 text-3xl font-bold text-ink">{stat.value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{stat.hint}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="rounded-md border border-line bg-white p-6 shadow-soft">
              <div className="flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-700">Reminders</p>
                  <h2 className="mt-2 text-2xl font-bold text-ink">維護提醒</h2>
                </div>
                <p className="text-sm text-slate-500">優先處理會影響公開頁可信度的資料。</p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {reminders.map((reminder) => (
                  <article className="rounded-md border border-line bg-paper p-4" key={reminder.label}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-bold text-ink">{reminder.label}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{reminder.hint}</p>
                      </div>
                      <span className="rounded-md bg-white px-3 py-1 text-lg font-bold text-brand-700">
                        {reminder.value}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-line bg-white p-6 shadow-soft">
              <p className="text-sm font-semibold text-brand-700">Quick Actions</p>
              <h2 className="mt-2 text-2xl font-bold text-ink">快速操作</h2>
              <div className="mt-5 grid gap-3">
                {quickActions.map((action) => (
                  <a
                    className="rounded-md border border-line p-4 transition hover:border-brand-300 hover:bg-brand-50"
                    href={action.href}
                    key={action.href}
                  >
                    <p className="font-bold text-ink">{action.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
                  </a>
                ))}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
