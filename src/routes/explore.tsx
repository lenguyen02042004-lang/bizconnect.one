import { useState, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { BusinessCard } from "@/components/BusinessCard";
import { FilterBar } from "@/components/FilterBar";
import { getExploreBusinesses, getGlobalLists } from "@/lib/business-public.functions";
import { useTranslation } from "react-i18next";
import { ExploreCard } from "@/components/ExploreCard";
import { Loader2 } from "lucide-react";

const exploreSearchSchema = z.object({
  industry: z.string().optional(),
  country: z.string().optional(),
  q: z.string().optional(),
  biz: z.string().optional(),
});

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
  validateSearch: (s) => exploreSearchSchema.parse(s),
  loaderDeps: ({ search }) => ({
    country: search.country,
    industry: search.industry,
    q: search.q,
  }),
  loader: async ({ deps }) => {
    const [bizRes, listRes] = await Promise.all([
      getExploreBusinesses({ data: { page: 1, limit: 20, country: deps.country, industry: deps.industry, q: deps.q } }),
      getGlobalLists()
    ]);
    return {
      initialBusinesses: bizRes.businesses,
      totalCount: bizRes.total,
      countries: listRes.countries,
      industries: listRes.industries,
    };
  },
  head: () => {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Khám phá danh bạ doanh nghiệp toàn cầu - BizConnect.One",
      description: "Khám phá danh bạ hơn 100,000+ doanh nghiệp trên toàn cầu. Lọc nhanh theo quốc gia, ngành nghề để tìm kiếm đối tác B2B phù hợp nhất.",
      url: "https://bizconnect.one/explore",
    };

    return {
      meta: [
        { title: "Khám phá doanh nghiệp trên danh bạ - BizConnect.One" },
        {
          name: "description",
          content:
            "Danh bạ 2D doanh nghiệp toàn cầu - lọc theo quốc gia, ngành nghề, tìm kiếm nhanh và theo dõi các doanh nghiệp phù hợp với bạn.",
        },
        { property: "og:title", content: "Khám phá doanh nghiệp trên danh bạ - BizConnect.One" },
        {
          property: "og:description",
          content:
            "Danh bạ 2D doanh nghiệp toàn cầu - lọc theo quốc gia, ngành nghề, tìm kiếm nhanh và theo dõi các doanh nghiệp phù hợp với bạn.",
        },
        { property: "og:url", content: "https://bizconnect.one/explore" },
      ],
      links: [{ rel: "canonical", href: "https://bizconnect.one/explore" }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
});

function ExplorePage() {
  const sp = Route.useSearch();
  const navigate = Route.useNavigate();
  const { initialBusinesses, totalCount, countries: dbCountries, industries: dbIndustries } = Route.useLoaderData();
  const { t } = useTranslation();

  const country = sp.country ?? "all";
  const industry = sp.industry ?? "all";
  const search = sp.q ?? "";

  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const hasMore = businesses.length < totalCount;

  // Reset local state when loader changes initial data
  useEffect(() => {
    setBusinesses(initialBusinesses);
    setPage(1);
  }, [initialBusinesses]);

  const selectedSlug = sp.biz;
  const selected = businesses.find((b) => b.slug === selectedSlug) || null;

  const handleSelect = (b: any | null) => {
    navigate({ search: (prev: any) => ({ ...prev, biz: b ? b.slug : undefined }), replace: true });
  };

  const handleFilter = (key: string, value: string) => {
    navigate({
      search: (prev: any) => ({ ...prev, [key]: value || undefined, biz: undefined }),
      replace: true,
    });
  };

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getExploreBusinesses({
        data: { page: nextPage, limit: 20, country: country, industry: industry, q: search },
      });
      setBusinesses((prev) => [...prev, ...res.businesses]);
      setPage(nextPage);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-20 px-4 md:px-8 max-w-[1600px] mx-auto pb-20">
        {/* Sticky Header & Filter Bar */}
        <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-xl py-6 mb-8 border-b border-border/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div className="text-center md:text-left">
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-2 text-gradient">
                {t("nav.explore")}
              </h1>
              {/* Answer-First Summary for AEO / SEO */}
              <p className="sr-only">
                Khám phá danh bạ hơn 100,000+ doanh nghiệp trên toàn cầu. Lọc nhanh theo quốc gia, ngành nghề để tìm kiếm đối tác B2B phù hợp nhất trên hệ sinh thái BizConnect.One.
              </p>
              <p className="text-muted-foreground text-sm">
                {totalCount} {t("home.matchedBusinesses")}
              </p>
            </div>
          </div>
          
          <div className="max-w-4xl mx-auto md:mx-0">
            <FilterBar
              countries={dbCountries as any}
              industries={dbIndustries as any}
              country={country}
              industry={industry}
              search={search}
              onCountry={(v) => handleFilter('country', v === 'all' ? '' : v)}
              onIndustry={(v) => handleFilter('industry', v === 'all' ? '' : v)}
              onSearch={(v) => handleFilter('q', v)}
            />
          </div>
        </div>

        {/* Dynamic Card Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {businesses.map((b) => (
            <ExploreCard key={b.id} business={b} onSelect={() => handleSelect(b)} />
          ))}
          {businesses.length === 0 && (
            <div className="col-span-full py-20 text-center text-muted-foreground">
              <p>Không tìm thấy doanh nghiệp nào phù hợp với tiêu chí lọc.</p>
            </div>
          )}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center mt-12 mb-8">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-card border border-border/50 hover:bg-accent hover:border-primary/50 transition-all font-medium disabled:opacity-50"
            >
              {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              {isLoadingMore ? "Đang tải..." : "Tải thêm"}
            </button>
          </div>
        )}
      </div>
      {selected && <BusinessCard business={selected} onClose={() => handleSelect(null)} />}
    </div>
  );
}
