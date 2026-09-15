import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, LayoutGrid, List as ListIcon, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { MapView } from "@/components/MapView";
import { BusinessCard } from "@/components/BusinessCard";
import { FollowButton } from "@/components/FollowButton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { getExploreBusinesses, getGlobalLists } from "@/lib/business-public.functions";
import { formatCount } from "@/lib/format";
import { Eye, Search, MapPin, Building2, ArrowLeft, Globe2, Map as MapIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type BusinessProfile = {
  id: string;
  name: string;
  slug: string;
  logo_url: string;
  country_code: string;
  country_name: string;
  industry: string;
  industry_slug: string;
  lat: number | null;
  lng: number | null;
  views_count: number;
  icon_tier: "standard" | "premium";
  short_intro: string;
  description: string;
  certifications: any[];
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  banner_url?: string;
  socials?: any;
  gallery?: string[];
};

async function shareBusiness(b: BusinessProfile) {
  if (UUID_RE.test(b.id)) {
    supabase.rpc("increment_business_shares", { _id: b.id });
  }
  const url = `${window.location.origin}/business/${b.slug}`;
  const shareData = { title: b.name, text: b.short_intro || b.name, url };
  try {
    if (
      navigator.share &&
      (typeof navigator.canShare === "function" ? navigator.canShare(shareData) : true)
    ) {
      await navigator.share(shareData);
      return;
    }
  } catch {
    // fall through to clipboard
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Đã sao chép liên kết doanh nghiệp");
  } catch {
    toast.error("Không thể chia sẻ liên kết");
  }
}

export const Route = createFileRoute("/country/$slug")({
  loader: async ({ params }) => {
    const key = params.slug.toLowerCase();
    // Accept both SEO slug and legacy ISO code for backward compatibility.
    const listRes = await getGlobalLists();
    const country = listRes.countries.find(
      (c) => c.code.toLowerCase() === key || c.name.toLowerCase().replace(/\s+/g, "-") === key,
    );
    if (!country) throw notFound();
    const bizesRes = await getExploreBusinesses();
    const inCountry = bizesRes.businesses.filter((b) => b.country_code === country.code);
    return { country, inCountry, industries: listRes.industries, countries: listRes.countries };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Không tìm thấy quốc gia — BizConnect.One" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { country } = loaderData;
    const title = `Doanh nghiệp ${country.name} — BizConnect.One`;
    const description = `Khám phá doanh nghiệp tại ${country.name} (${country.code}) trên bản đồ doanh nghiệp toàn cầu.`;
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
      <Navbar />
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
            Khám phá bản đồ
          </Link>
        </div>
      </div>
    </div>
  );
}

function CountryPage() {
  const { country, inCountry, industries, countries } = Route.useLoaderData();
  const [selected, setSelected] = useState<any | null>(null);
  const [industry, setIndustry] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const filtered = useMemo(
    () =>
      inCountry.filter((b) => {
        if (industry !== "all" && b.industry_slug !== industry) return false;
        if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      }),
    [inCountry, industry, search],
  );

  const industryCounts = useMemo(() => {
    const m = new Map<string, number>();
    inCountry.forEach((b) => m.set(b.industry_slug, (m.get(b.industry_slug) ?? 0) + 1));
    return m;
  }, [inCountry]);

  const availableIndustries = industries.filter((i: any) => industryCounts.has(i.slug));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [page, totalPages]);
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page],
  );
  const pageNumbers = useMemo<(number | "…")[]>(() => {
    const range: (number | "…")[] = [];
    const add = (n: number | "…") => range.push(n);
    const around = 1;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - around && i <= page + around)) {
        add(i);
      } else if (range[range.length - 1] !== "…") {
        add("…");
      }
    }
    return range;
  }, [page, totalPages]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
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
                    Quay lại bản đồ
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 mt-4 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {inCountry.length} doanh nghiệp
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {availableIndustries.length} ngành nghề
              </span>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 py-6 grid lg:grid-cols-[1.4fr_1fr] gap-6">
          {/* List */}
          <section>
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm doanh nghiệp..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9"
                />
              </div>
              <Select
                value={industry}
                onValueChange={(v) => {
                  setIndustry(v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="sm:w-[200px]">
                  <SelectValue placeholder="Ngành nghề" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả ngành nghề</SelectItem>
                  {industries.map((ind) => (
                    <SelectItem key={ind.slug} value={ind.slug}>
                      {ind.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="inline-flex rounded-md border border-border overflow-hidden">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-pressed={view === "grid"}
                  className={`px-3 flex items-center gap-1.5 text-sm ${view === "grid" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-pressed={view === "list"}
                  className={`px-3 flex items-center gap-1.5 text-sm border-l border-border ${view === "list" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                Chưa có doanh nghiệp nào phù hợp.
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3 text-xs text-muted-foreground">
                  <span>
                    Hiển thị {(page - 1) * PAGE_SIZE + 1}–
                    {Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length}
                  </span>
                  <span>
                    Trang {page} / {totalPages}
                  </span>
                </div>

                {view === "grid" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {pageItems.map((b) => {
                      const thumbs = (b.gallery ?? []).slice(0, 5);
                      return (
                        <article
                          key={b.id}
                          onClick={() => setSelected(b)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setSelected(b);
                          }}
                          className="group relative rounded-2xl bg-card border border-border/40 hover:border-primary/40 hover:shadow-soft transition-smooth cursor-pointer overflow-hidden flex flex-col"
                        >
                          {/* Banner */}
                          <div className="relative h-28 w-full overflow-hidden bg-muted">
                            {b.banner_url ? (
                              <img
                                src={b.banner_url}
                                alt={`Ảnh bìa ${b.name}`}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                            <div
                              className="absolute top-2 right-2 flex gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => shareBusiness(b)}
                                aria-label={`Chia sẻ ${b.name}`}
                                className="w-8 h-8 inline-flex items-center justify-center rounded-full bg-background/85 hover:bg-background text-foreground shadow-sm backdrop-blur"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <FollowButton businessId={b.id} variant="icon" />
                            </div>
                          </div>

                          {/* Body */}
                          <div className="px-4 pt-0 pb-4 flex-1 flex flex-col">
                            <div className="flex items-start gap-3 -mt-7">
                              <div
                                className={`shrink-0 rounded-2xl bg-white p-1 shadow-md ${b.icon_tier === "premium" ? "ring-premium" : ""}`}
                              >
                                <img
                                  src={b.logo_url}
                                  alt={`Logo ${b.name}`}
                                  loading="lazy"
                                  decoding="async"
                                  className="w-14 h-14 rounded-xl object-cover"
                                />
                              </div>
                              <div className="min-w-0 flex-1 pt-8">
                                <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                                  {b.name}
                                </h3>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {b.industry}
                                </p>
                              </div>
                            </div>

                            {b.short_intro && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {b.short_intro}
                              </p>
                            )}

                            {/* Gallery — quick 5 */}
                            {thumbs.length > 0 && (
                              <div className="mt-3 grid grid-cols-5 gap-1">
                                {thumbs.map((src, i) => (
                                  <div
                                    key={i}
                                    className="relative aspect-square rounded-md overflow-hidden bg-muted"
                                  >
                                    <img
                                      src={src}
                                      alt={`${b.name} — ảnh ${i + 1}`}
                                      loading="lazy"
                                      className="w-full h-full object-cover"
                                    />
                                    {i === 4 && (b.gallery?.length ?? 0) > 5 && (
                                      <div className="absolute inset-0 bg-black/55 text-white text-[11px] font-medium flex items-center justify-center">
                                        +{b.gallery!.length - 5}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1 truncate">
                                <MapPin className="w-3 h-3 shrink-0" />
                                <span className="truncate">{b.province}</span>
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Eye className="w-3 h-3" /> {formatCount(b.views_count)}
                              </span>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {pageItems.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => setSelected(b)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setSelected(b);
                        }}
                        className="p-3 rounded-2xl bg-card hover:bg-accent transition-smooth border border-border/40 hover:border-primary/40 hover:shadow-soft flex gap-3 items-center cursor-pointer"
                      >
                        <div
                          className={
                            b.icon_tier === "premium"
                              ? "ring-premium flex-shrink-0"
                              : "flex-shrink-0"
                          }
                        >
                          <img
                            src={b.logo_url}
                            alt={`Logo ${b.name}`}
                            loading="lazy"
                            decoding="async"
                            className="w-12 h-12 rounded-full bg-white object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{b.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {b.industry} · {b.province}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Eye className="w-3 h-3" /> {formatCount(b.views_count)}
                          </p>
                        </div>
                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => shareBusiness(b)}
                            aria-label={`Chia sẻ ${b.name}`}
                            className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <FollowButton businessId={b.id} variant="icon" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {pageNumbers.map((n, i) =>
                      n === "…" ? (
                        <span key={`e${i}`} className="px-2 text-muted-foreground text-sm">
                          …
                        </span>
                      ) : (
                        <Button
                          key={n}
                          variant={n === page ? "default" : "outline"}
                          size="sm"
                          className="min-w-9"
                          onClick={() => setPage(n as number)}
                        >
                          {n}
                        </Button>
                      ),
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Map */}
          <aside className="lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)] h-[400px] rounded-2xl overflow-hidden border border-border">
            <MapView businesses={filtered} onSelect={setSelected} />
          </aside>
        </div>

        {/* Other countries */}
        <section className="max-w-7xl mx-auto px-4 pb-16">
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
      {selected && <BusinessCard business={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
