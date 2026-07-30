import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OfferCard } from "@/components/OfferCard";
import { performSearch } from "@/lib/domain-search";

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
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">
      <header className="border-b border-line pb-6">
        <Link className="text-sm font-semibold text-brand-700" href="/">
          回首頁
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-ink">搜尋優惠</h1>
      </header>

      <section className="rounded-3xl border border-line bg-white p-6 shadow-soft">
        <div className="mb-6">
          <p className="text-sm font-semibold text-ink">熱門搜尋</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {HOT_SEARCH_TERMS.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  query === term ? "bg-brand-700 text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"
                }`}
              >
                {term}
              </Link>
            ))}
          </div>
        </div>

        <form className="space-y-4">
          <label className="block text-sm font-semibold text-ink" htmlFor="keyword">
            關鍵字
          </label>
          <input
            className="w-full rounded-md border border-line px-4 py-3 outline-none focus:border-brand-600"
            id="keyword"
            name="q"
            placeholder="輸入優惠、銀行、信用卡或分類"
            type="search"
            defaultValue={query}
          />
        </form>

        <div className="mt-8">
          {results.length > 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">找到 {results.length} 筆結果</p>
              <div className="grid gap-4">
                {results.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-line bg-white p-8 text-center text-slate-600 shadow-soft">
              {query ? `找不到「${query}」相關優惠` : "請輸入關鍵字開始搜尋"}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
