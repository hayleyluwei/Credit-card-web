import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OfferCard } from "@/components/OfferCard";
import { performSearch } from "@/lib/domain-search";
import { Breadcrumb, PageContainer, SectionHead } from "@/components/design-system";

type SearchPageProps = {
  searchParams?: {
    q?: string;
  };
};

// 熱門搜尋預設詞：從真實資料中挑選目前確實搜得到結果的關鍵字。
const HOT_SEARCH_TERMS = ["現金回饋", "旅遊", "繳稅", "學費", "水電瓦斯", "分期", "訂閱服務"];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = searchParams?.q?.trim() ?? "";
  const [siteSetting, offers] = await Promise.all([
    prisma.siteSetting.findFirst(),
    prisma.offer.findMany({
      where: {
        isPublished: true
      },
      include: {
        category: true,
        cards: {
          include: {
            card: {
              include: {
                bank: true
              }
            }
          }
        }
      }
    })
  ]);

  const results = performSearch(offers, query, siteSetting?.showExpiredOffers ?? false).map((result) => result.offer);

  return (
    <PageContainer>
      <Breadcrumb items={[{ label: "首頁", href: "/" }, { label: "搜尋優惠" }]} />
      <p className="cl-eyebrow">Search offers</p>
      <h1 className="cl-page-title">找一個適合現在的優惠</h1>
      <p className="cl-lead mt-3 max-w-xl">
        用關鍵字、生活情境或優惠分類開始都可以。找到之後再看完整規則與官方來源。
      </p>

      <section className="mt-8 cl-panel">
        <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-1.5 rounded-[14px] border border-line bg-paper p-1.5">
          <input
            aria-label="關鍵字"
            className="min-w-0 rounded-control bg-transparent px-3 py-2.5 text-sm text-ink outline-none placeholder:text-subtle"
            defaultValue={query}
            id="keyword"
            name="q"
            placeholder="輸入優惠、銀行、信用卡或分類"
            type="search"
          />
          <button className="rounded-control bg-blue px-4 py-2.5 text-sm font-[850] text-white transition hover:bg-blue-deep" type="submit">
            搜尋
          </button>
        </form>

        <div className="mt-4 flex flex-wrap gap-2">
          {HOT_SEARCH_TERMS.map((term) => (
            <Link
              className={`cl-filter ${query === term ? "cl-filter-active" : ""}`}
              href={`/search?q=${encodeURIComponent(term)}`}
              key={term}
            >
              {term}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <SectionHead
          copy={query ? `關鍵字：${query}` : "還沒輸入關鍵字，可以先從上面的熱門搜尋開始。"}
          title={results.length > 0 ? `找到 ${results.length} 筆結果` : "搜尋結果"}
        />
        <div className="grid gap-3">
          {results.length > 0 ? (
            results.map((offer) => <OfferCard key={offer.id} offer={offer} />)
          ) : (
            <p className="rounded-card border border-line bg-paper p-7 text-center text-[13px] text-muted">
              {query ? `找不到「${query}」相關的優惠，換個說法或從熱門搜尋看看。` : "請輸入關鍵字開始搜尋。"}
            </p>
          )}
        </div>
      </section>
    </PageContainer>
  );
}
