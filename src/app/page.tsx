import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getFeaturedOffers, getLatestOffers, getPublicOffers } from "@/lib/domain-offers";
import { CardTile } from "@/components/CardTile";
import { CategoryCard } from "@/components/CategoryCard";
import { OfferCard } from "@/components/OfferCard";
import { generateOrganizationJsonLd, getCanonicalUrl } from "@/lib/domain-seo";
import { SCENARIO_TAGS } from "@/lib/domain-scenarios";
import { getScenarioCopy } from "@/lib/domain-scenario-copy";
import { EntryIcon } from "@/components/EntryIcon";
import { CardFoot, PageContainer, PreviewCard, SectionHead, type PreviewTone } from "@/components/design-system";

export const metadata = {
  title: "信用卡優惠查詢網站",
  description: "整理信用卡現金回饋、餐飲、旅遊、網購、交通與分期優惠，幫助快速比較適合的信用卡活動.",
  alternates: {
    canonical: getCanonicalUrl("/")
  }
};

/** 首頁五張快速入口預覽卡。契約規定五張與三種入口都不得刪除。 */
const PREVIEW_ENTRIES: {
  tone: PreviewTone;
  label: string;
  iconKey: string;
  title: string;
  copy: string;
  action: string;
  href: string;
  delayClass: string;
}[] = [
  {
    tone: "blue",
    label: "情境",
    iconKey: "tax-payment",
    title: "繳稅季到了",
    copy: "從今天要付的帳單開始找。",
    action: "看情境",
    href: "/scenarios/tax-payment",
    delayClass: ""
  },
  {
    tone: "lime",
    label: "優惠",
    iconKey: "cashback",
    title: "現金回饋",
    copy: "把常刷的地方放在一起看。",
    action: "瀏覽優惠",
    href: "/categories/cashback",
    delayClass: "[animation-delay:-0.7s]"
  },
  {
    tone: "ink",
    label: "攻略",
    iconKey: "subscription",
    title: "卡片不用越多越好",
    copy: "從你的生活開始做選擇。",
    action: "讀一篇",
    href: "/guides",
    delayClass: "[animation-delay:-1.6s]"
  },
  {
    tone: "rose",
    label: "分類",
    iconKey: "travel",
    title: "旅遊交通",
    copy: "海外消費、哩程與訂房。",
    action: "查看分類",
    href: "/categories/travel",
    delayClass: "[animation-delay:-2.4s]"
  },
  {
    tone: "yellow",
    label: "卡片",
    iconKey: "installment",
    title: "從手上的卡開始",
    copy: "看懂卡片與相關優惠。",
    action: "查看卡片",
    href: "/cards",
    delayClass: "[animation-delay:-3.1s]"
  }
];

export default async function HomePage() {
  const siteSetting = await prisma.siteSetting.findFirst();
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: 6,
    include: { _count: { select: { offers: true } } }
  });

  const offers = await prisma.offer.findMany({
    where: { isPublished: true },
    include: {
      cards: true,
      category: true
    }
  });

  const articles = await prisma.article.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: 3
  });

  const cards = await prisma.card.findMany({
    where: {
      isActive: true,
      bank: {
        isActive: true
      }
    },
    include: {
      bank: true,
      offers: {
        include: {
          offer: true
        }
      }
    },
    orderBy: [{ bank: { name: "asc" } }, { name: "asc" }]
  });

  const featuredOffers = getFeaturedOffers(offers, siteSetting?.homepageFeaturedCount ?? 6, siteSetting?.showExpiredOffers ?? false);
  const latestOffers = getLatestOffers(offers, 6, siteSetting?.showExpiredOffers ?? false);
  const cardEntries = cards
    .map((card) => {
      const publicOfferCount = getPublicOffers(
        card.offers.map((item) => item.offer),
        siteSetting?.showExpiredOffers ?? false
      ).length;

      return {
        card,
        publicOfferCount
      };
    })
    .sort((a, b) => {
      if (a.publicOfferCount !== b.publicOfferCount) {
        return b.publicOfferCount - a.publicOfferCount;
      }

      return a.card.name.localeCompare(b.card.name, "zh-Hant");
    })
    .slice(0, 6);

  return (
    <PageContainer>
      {/* ① 生活任務主張＋搜尋入口 */}
      <section className="text-center">
        <p className="cl-eyebrow">credit card rewards, all in one place</p>
        <h1 className="cl-page-title mx-auto max-w-3xl text-balance">信用卡回饋大集合！</h1>
        <p className="cl-lead mx-auto mt-4 max-w-lg">今天需要哪個優惠？</p>

        <form action="/search" className="mx-auto mt-6 grid max-w-xl grid-cols-[minmax(0,1fr)_auto] gap-1.5 rounded-[14px] border border-line bg-paper p-1.5">
          <input
            aria-label="搜尋優惠"
            className="min-w-0 rounded-control bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-subtle"
            name="q"
            placeholder="例如：繳稅、旅遊訂房、外送、現金回饋"
            type="search"
          />
          <button className="rounded-control bg-blue px-4 py-2.5 text-sm font-[850] text-white transition hover:bg-blue-deep" type="submit">
            開始找
          </button>
        </form>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {["tax-payment", "travel-booking", "food-delivery"].map((slug) => {
            const scenario = SCENARIO_TAGS.find((entry) => entry.slug === slug);
            if (!scenario) return null;
            return (
              <Link className="cl-filter" href={`/scenarios/${scenario.slug}`} key={scenario.slug}>
                {scenario.tagLabel}
              </Link>
            );
          })}
          <Link className="cl-filter" href="/cards">
            手上的卡
          </Link>
        </div>
      </section>

      {/* ② 五張快速入口預覽卡：手機改為左右滑動，讓下一張露出一角 */}
      {/*
        手機是橫向捲動容器：CSS 規範下 overflow-x 一旦非 visible，另一軸也會變成 auto
        而產生裁切。預覽卡的 preview-bob 會往上位移 6px，若上方沒有留白，卡片上緣
        （連同框線與陰影）就會被容器裁掉。pt-3 留 12px > 6px 的位移量。
      */}
      <div className="-mx-[18px] mt-8 flex snap-x snap-proximity gap-3 overflow-x-auto px-[18px] pb-4 pt-3 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5 lg:items-end">
        {PREVIEW_ENTRIES.map((entry) => (
          <PreviewCard delayClass={entry.delayClass} href={entry.href} key={entry.title} tone={entry.tone}>
            <div className="w-[162px] shrink-0 sm:w-auto">
              <div className="flex items-center justify-between text-[10px] font-extrabold">
                <span className={entry.tone === "ink" ? "text-paper/70" : "text-ink/70"}>{entry.label}</span>
              </div>
              <EntryIcon className="mt-3 h-9 w-9" iconKey={entry.iconKey} tone={entry.tone === "ink" ? "lime" : "ink"} />
              <h2 className="mt-3 text-[19px] font-[850] leading-tight">{entry.title}</h2>
              <p className={`mt-1 text-[11px] leading-snug ${entry.tone === "ink" ? "text-paper/70" : "text-ink/65"}`}>{entry.copy}</p>
            </div>
            <span
              className={`mt-3 flex items-center justify-between border-t pt-2.5 text-[10px] font-[850] ${
                entry.tone === "ink" ? "border-paper/25 text-lime" : "border-black/15 text-blue-deep"
              }`}
            >
              {entry.action}
              <span aria-hidden="true">→</span>
            </span>
          </PreviewCard>
        ))}
      </div>

      {/* ③ 本月情境選讀：T27 視覺預留版位，未核准前不接資料來源 */}
      <section className="mt-12">
        <SectionHead
          action={{ href: "/guides", label: "所有攻略" }}
          copy="每個月挑一件你可能正在煩惱的事（版位預留中）"
          title="本月情境選讀"
        />
        <article className="grid overflow-hidden rounded-panel bg-ink text-paper lg:grid-cols-[1.06fr_0.94fr]">
          <div className="flex flex-col items-start justify-center gap-3 p-8 sm:p-10">
            <p className="text-[10px] font-[850] uppercase tracking-[0.09em] text-lime">版位示意</p>
            <h3 className="text-[26px] font-[850] leading-tight sm:text-[32px]">每個月，我們挑一件你可能正在煩惱的事。</h3>
            <p className="text-[13px] leading-relaxed text-paper/70">
              這個位置的樣式已經定案，實際內容要等後台可以按月指定選讀之後才會填入。在那之前，先從下面的生活情境開始找。
            </p>
            <Link className="mt-2 inline-flex items-center rounded-control bg-lime px-4 py-2.5 text-[13px] font-[850] text-ink transition hover:brightness-95" href="/scenarios/travel-booking">
              先看旅遊情境 →
            </Link>
          </div>
          <div className="flex min-h-[200px] items-center justify-center bg-blue p-6">
            <div className="w-full max-w-[250px] rotate-3 rounded-card bg-paper p-5 text-ink shadow-preview">
              <p className="text-[11px] font-[850] text-blue-deep">待後台支援</p>
              <p className="mt-1.5 text-[19px] font-[850] leading-tight">本月選讀內容</p>
              <p className="mt-1.5 text-[11px] text-muted">連向真實存在的情境或攻略頁，不會是死連結。</p>
            </div>
          </div>
        </article>
      </section>

      {/* ④ 熱門情境 */}
      <section className="mt-12">
        <SectionHead
          action={{ href: "/search", label: "查看全部情境" }}
          copy="先從生活情境開始，不必一次讀完所有規則。"
          title="你最近想完成什麼？"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SCENARIO_TAGS.map((scenario) => {
            const copy = getScenarioCopy(scenario.slug, scenario.tagLabel);
            return (
              <Link className="cl-card flex flex-col justify-between" href={`/scenarios/${scenario.slug}`} key={scenario.slug}>
                <div>
                  <span className="cl-tag">{copy.group}</span>
                  <h3 className="mt-2.5 text-[19px] font-[850] leading-snug text-ink">{copy.title}</h3>
                  <p className="mt-1.5 text-[11.5px] leading-relaxed text-muted">{copy.description}</p>
                </div>
                <CardFoot action={copy.action} value={scenario.tagLabel} />
              </Link>
            );
          })}
        </div>
      </section>

      {/* ⑤ 熱門優惠分類 */}
      <section className="mt-12">
        <SectionHead
          action={{ href: "/categories", label: "查看全部分類" }}
          copy="已經知道自己想要哪一種回饋的話，從這裡開始比較快。"
          title="或者，直接從回饋類型看起"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <CategoryCard category={category} key={category.id} offerCount={category._count.offers} toneIndex={index} />
          ))}
        </div>
      </section>

      {/* ⑥ 正在發生的回饋（精選＋最新） */}
      <section className="mt-12">
        <SectionHead
          action={{ href: "/search", label: "看更多優惠" }}
          copy="先看幾個重點就好，詳細條件點進去都查得到。"
          title="現在正在跑的活動"
        />
        <div className="grid gap-3">
          {featuredOffers.length > 0 ? (
            featuredOffers.map((offer) => <OfferCard key={offer.id} offer={offer} />)
          ) : (
            <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted">
              目前還沒有標記為精選的優惠，下面是最近整理好的活動。
            </p>
          )}
          {latestOffers.map((offer) => (
            <OfferCard key={`latest-${offer.id}`} offer={offer} />
          ))}
        </div>
      </section>

      {/* ⑦ 從手上的卡開始：手機改為左右滑動，讓下一張露出一角 */}
      <section className="mt-12">
        <SectionHead
          action={{ href: "/cards", label: "所有信用卡" }}
          copy="不用再多辦一張。先看看手上這幾張，現在有哪些優惠可以用。"
          title="已經有卡了？看看它能做什麼"
        />
        {/* 同上：橫向捲動會裁切上下緣，留白讓 hover 位移與框線陰影不被切掉 */}
        <div className="-mx-[18px] flex snap-x snap-proximity gap-3 overflow-x-auto px-[18px] pb-4 pt-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 sm:pt-0 lg:grid-cols-3">
          {cardEntries.length > 0 ? (
            cardEntries.map(({ card, publicOfferCount }) => (
              <CardTile
                card={card}
                className="w-[78%] shrink-0 snap-start sm:w-auto"
                key={card.id}
                offerCount={publicOfferCount}
              />
            ))
          ) : (
            <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted sm:col-span-2 lg:col-span-3">
              目前尚無可顯示的信用卡。
            </p>
          )}
        </div>
      </section>

      {/* ⑧ 攻略文章 */}
      <section className="mt-12">
        <SectionHead
          action={{ href: "/guides", label: "更多文章" }}
          copy="把複雜的規則寫成看得懂的判斷，不急著推薦你辦卡。"
          title="想再多懂一點的時候"
        />
        {articles.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link className="cl-card flex flex-col justify-between" href={`/guides/${article.slug}`} key={article.id}>
                <div>
                  <span className="cl-tag">攻略</span>
                  <h3 className="mt-2.5 text-[17px] font-[850] leading-snug text-ink">{article.title}</h3>
                  {article.summary ? (
                    <p className="mt-1.5 line-clamp-3 text-[11.5px] leading-relaxed text-muted">{article.summary}</p>
                  ) : null}
                </div>
                <CardFoot action="閱讀攻略" />
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted">
            攻略文章陸續整理中，先從上面的生活情境開始找也可以。
          </p>
        )}
      </section>

      <script
        id="organization-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            generateOrganizationJsonLd(
              "信用卡優惠查詢網站",
              getCanonicalUrl("/"),
              "整理信用卡現金回饋、餐飲、旅遊、網購、交通與分期優惠，幫助快速比較適合的信用卡活動。"
            )
          )
        }}
      />
    </PageContainer>
  );
}
