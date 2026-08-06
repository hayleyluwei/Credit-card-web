import { prisma } from "@/lib/prisma";
import { getPublicOffers } from "@/lib/domain-offers";
import { CardTile } from "@/components/CardTile";
import { getCanonicalUrl } from "@/lib/domain-seo";
import { Breadcrumb, PageContainer } from "@/components/design-system";

export const metadata = {
  title: "信用卡列表｜信用卡優惠查詢網站",
  description: "瀏覽所有信用卡，找到手上這張卡目前整理到的公開優惠。",
  alternates: {
    canonical: getCanonicalUrl("/cards")
  }
};

export default async function CardsPage() {
  const siteSetting = await prisma.siteSetting.findFirst();
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

  const cardEntries = cards
    .map((card) => {
      const publicOfferCount = getPublicOffers(
        card.offers.map((item) => item.offer),
        siteSetting?.showExpiredOffers ?? false
      ).length;

      return { card, publicOfferCount };
    })
    .sort((a, b) => {
      if (a.publicOfferCount !== b.publicOfferCount) {
        return b.publicOfferCount - a.publicOfferCount;
      }

      return a.card.name.localeCompare(b.card.name, "zh-Hant");
    });

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首頁", href: "/" }, { label: "信用卡" }]} />
      <p className="cl-eyebrow">Credit cards</p>
      <h1 className="cl-page-title">從手上的卡開始</h1>
      <p className="cl-lead mt-3 max-w-xl">
        目前整理了 {cardEntries.length} 張信用卡。點進去可以看到這張卡的定位、年費，以及現在有哪些優惠可以用。
      </p>

      <section className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cardEntries.length > 0 ? (
          cardEntries.map(({ card, publicOfferCount }) => (
            <CardTile card={card} key={card.id} offerCount={publicOfferCount} />
          ))
        ) : (
          <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted sm:col-span-2 lg:col-span-3">
            目前尚無可顯示的信用卡。
          </p>
        )}
      </section>
    </PageContainer>
  );
}
