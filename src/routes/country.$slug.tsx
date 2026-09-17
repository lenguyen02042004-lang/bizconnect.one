import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { BusinessCard } from "@/components/BusinessCard";
import { getExploreBusinesses, getGlobalLists } from "@/lib/business-public.functions";
import { ExploreCard } from "@/components/ExploreCard";
import { Loader2, ArrowLeft, Globe2, MapIcon, Building2, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const searchSchema = z.object({
  industry: z.string().optional(),
  q: z.string().optional(),
  biz: z.string().optional(),
});

export const Route = createFileRoute("/country/$slug")({
  validateSearch: (s) => searchSchema.parse(s),
  loaderDeps: ({ search }) => ({
    industry: search.industry,
    q: search.q,
  }),
  loader: async ({ params, deps }) => {
    const key = params.slug.toLowerCase();
    const listRes = await getGlobalLists();
    const country = listRes.countries.find(
      (c) => c.code.toLowerCase() === key || c.name.toLowerCase().replace(/\s+/g, "-") === key,
    );
    
    if (!country) throw notFound();

    const bizRes = await getExploreBusinesses({
      data: { page: 1, limit: 20, country: country.code, industry: deps.industry, q: deps.q }
    });

    return { 
      country, 
      initialBusinesses: bizRes.businesses, 
      totalCount: bizRes.total,
      industries: listRes.industries, 
      countries: listRes.countries 
    };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Không tìm thấy quốc gia - BizConnect.One" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { country } = loaderData;
    const title = `Doanh nghiệp ${country.name} - BizConnect.One`;
    const description = `Khám phá doanh nghiệp tại ${country.name} (${country.code}) trên danh bạ doanh nghiệp toàn cầu.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: CountryPage,
  notFoundComponent: CountryNotFound,
});

function CountryNotFound() {
  const { slug } = Route.useParams();
  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 max-w-xl mx-auto text-center px-4">
        <h1 className="text-2xl font-bold mb-2">Không tìm thấy quốc gia</h1>
        <p className="text-muted-foreground mb-4">Quốc gia "{slug}" không có trong danh sách.</p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/countries"
            className="text-primary hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Danh sách quốc gia
          </Link>
          <Link to="/explore" className="text-primary hover:underline">
            Khám phá danh bạ
          </Link>
        </div>
      </div>
    </div>
  );
}

function CountryPage() {
  const sp = Route.useSearch();
  const navigate = Route.useNavigate();
  const { country, initialBusinesses, totalCount, industries, countries } = Route.useLoaderData();

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
        data: { page: nextPage, limit: 20, country: country.code, industry: industry, q: search },
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
    <div className="min-h-screen bg-background pb-20">
      <div className="pt-16">
        {/* Header */}
        <header className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center flex-wrap gap-1.5 text-sm text-muted-foreground mb-3"
            >
              <Link to="/" className="hover:text-foreground">
                Trang chủ
              </Link>
              <span>/</span>
              <Link to="/countries" className="hover:text-foreground">
                Quốc gia
              </Link>
              <span>/</span>
              <span className="text-foreground font-medium">{country.name}</span>
            </nav>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4">
                <div className="text-[11px] font-mono font-bold px-2.5 py-1 rounded bg-muted text-muted-foreground">
                  {country.code}
                </div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold">
                  Doanh nghiệp tại {country.name}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/countries">
                    <Globe2 className="w-4 h-4 mr-1.5" />
                    Danh sách quốc gia
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/explore">
                    <MapIcon className="w-4 h-4 mr-1.5" />
                    Quay lại danh bạ
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 mt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {totalCount} doanh nghiệp
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-[1600px] mx-auto px-4 md:px-8 mt-8">
          {/* Sticky Filter Bar */}
          <div className="sticky top-16 z-30 bg-background/90 backdrop-blur-xl py-4 mb-8 border-b border-border/50">
            <div className="max-w-3xl flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm..."
                  value={search}
                  onChange={(e) => handleFilter('q', e.target.value)}
                  className="pl-9 bg-background/70 border-border/60"
                />
              </div>
              <Select value={industry} onValueChange={(v) => handleFilter('industry', v === 'all' ? '' : v)}>
                <SelectTrigger className="sm:w-[250px] bg-background/70">
                  <SelectValue placeholder="Tất cả ngành nghề" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value="all">Tất cả ngành nghề</SelectItem>
                  {industries.map((i: any) => (
                    <SelectItem key={i.slug} value={i.slug}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

        {/* Other countries */}
        <section className="max-w-[1600px] mx-auto px-4 md:px-8 pb-16 mt-16">
          <h2 className="font-display text-xl font-bold mb-4">Khám phá quốc gia khác</h2>
          <div className="flex flex-wrap gap-2">
            {countries
              .filter((c: any) => c.code !== country.code)
              .map((c: any) => (
                <Link
                  key={c.code}
                  to="/country/$slug"
                  params={{ slug: c.code.toLowerCase() }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card hover:bg-accent border border-border/50 text-sm transition-smooth"
                >
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                    {c.code}
                  </span>
                  {c.name}
                </Link>
              ))}
          </div>
        </section>
      </div>
      {selected && <BusinessCard business={selected} onClose={() => handleSelect(null)} />}
    </div>
  );
}
