import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { MapView } from "@/components/MapView";
import { BusinessCard } from "@/components/BusinessCard";
import { FilterBar } from "@/components/FilterBar";
import { FollowButton } from "@/components/FollowButton";
import { getExploreBusinesses, getGlobalLists } from "@/lib/business-public.functions";
import { formatCount } from "@/lib/format";
import { Eye } from "lucide-react";

const exploreSearchSchema = z.object({
  industry: z.string().optional(),
  country: z.string().optional(),
  q: z.string().optional(),
  biz: z.string().optional(),
});

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
  validateSearch: (s) => exploreSearchSchema.parse(s),
  loader: async () => {
    const [bizRes, listRes] = await Promise.all([
      getExploreBusinesses(),
      getGlobalLists()
    ]);
    return {
      businesses: bizRes.businesses,
      countries: listRes.countries,
      industries: listRes.industries
    };
  },
  head: () => ({
    meta: [
      { title: "Khám phá doanh nghiệp trên bản đồ — BizConnect.One" },
      { name: "description", content: "Bản đồ 2D doanh nghiệp toàn cầu — lọc theo quốc gia, ngành nghề, tìm kiếm nhanh và theo dõi các doanh nghiệp phù hợp với bạn." },
      { property: "og:title", content: "Khám phá doanh nghiệp trên bản đồ — BizConnect.One" },
      { property: "og:description", content: "Bản đồ 2D doanh nghiệp toàn cầu — lọc theo quốc gia, ngành nghề, tìm kiếm nhanh và theo dõi các doanh nghiệp phù hợp với bạn." },
      { property: "og:url", content: "https://earth-biz-link.lovable.app/explore" },
    ],
    links: [{ rel: "canonical", href: "https://earth-biz-link.lovable.app/explore" }],
  }),

});

function ExplorePage() {
  const sp = Route.useSearch();
  const navigate = Route.useNavigate();
  const { businesses, countries: dbCountries, industries: dbIndustries } = Route.useLoaderData();
  
  const [country, setCountry] = useState(sp.country ?? "all");
  const [industry, setIndustry] = useState(sp.industry ?? "all");
  const [search, setSearch] = useState(sp.q ?? "");

  const selectedSlug = sp.biz;
  const selected = useMemo(() => businesses.find((b) => b.slug === selectedSlug) || null, [businesses, selectedSlug]);

  const handleSelect = (b: any | null) => {
    navigate({ search: (prev: any) => ({ ...prev, biz: b ? b.slug : undefined }), replace: true });
  };

  const filtered = useMemo(() => businesses.filter((b) => {
    if (country !== "all" && b.country_code !== country) return false;
    if (industry !== "all" && b.industry_slug !== industry) return false;
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [businesses, country, industry, search]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 h-screen flex flex-col lg:flex-row">
        {/* Sidebar with filter + list */}
        <aside className="w-full lg:w-96 flex-shrink-0 border-r border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <h1 className="font-display text-2xl font-bold mb-1">Khám phá</h1>
            <p className="text-sm text-muted-foreground mb-3">
              {filtered.length} doanh nghiệp được hiển thị
            </p>
            <FilterBar
              countries={dbCountries as any} industries={dbIndustries as any}
              country={country} industry={industry} search={search}
              onCountry={setCountry} onIndustry={setIndustry} onSearch={setSearch}
            />
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filtered.map((b) => (
              <div
                key={b.id}
                onClick={() => handleSelect(b)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") handleSelect(b); }}
                className="w-full text-left p-3 rounded-2xl bg-background hover:bg-accent transition-smooth border border-border/40 hover:border-primary/40 hover:shadow-soft flex gap-3 items-center cursor-pointer"
              >
                <div className={b.icon_tier === "premium" ? "ring-premium flex-shrink-0" : "flex-shrink-0"}>
                  <img src={b.logo_url} alt={`Logo ${b.name}`} loading="lazy" decoding="async" className="w-12 h-12 rounded-full bg-white object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{b.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{b.country_name} · {b.industry}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Eye className="w-3 h-3" /> {formatCount(b.views_count)}
                  </p>
                </div>
                <FollowButton businessId={b.id} variant="icon" className="shrink-0" />
              </div>
            ))}
          </div>
        </aside>

        {/* Map */}
        <main className="flex-1 relative">
          <MapView businesses={filtered} onSelect={handleSelect} />
        </main>
      </div>
      {selected && <BusinessCard business={selected} onClose={() => handleSelect(null)} />}
    </div>
  );
}
