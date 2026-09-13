import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
const Globe3D = lazy(() => import("@/components/Globe3D").then(module => ({ default: module.Globe3D })));
import { BusinessCard } from "@/components/BusinessCard";
import { getPublicStats } from "@/lib/stats.functions";
import { getExploreBusinesses, getGlobalLists } from "@/lib/business-public.functions";
import {
  Search, Globe2, LogIn, Sparkles, LayoutDashboard, LogOut, ChevronDown, MapPin,
  Cpu, Landmark, Building2, Factory, ShoppingBag, Plane, GraduationCap,
  HeartPulse, UtensilsCrossed, Truck, Wheat, Zap, Megaphone, Scale,
  HardHat, Shirt, Music, Car, MoreHorizontal, Send, Users,
} from "lucide-react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "BizConnect.One — Bản đồ doanh nghiệp toàn cầu 3D" },
      { name: "description", content: "Bản đồ 3D tương tác kết nối hàng ngàn doanh nghiệp toàn cầu theo quốc gia và ngành nghề. Tạo danh thiếp online, gửi card visit và mở rộng đối tác B2B quốc tế chỉ từ $5/năm." },
      { property: "og:title", content: "BizConnect.One — Bản đồ doanh nghiệp toàn cầu 3D" },
      { property: "og:description", content: "Bản đồ 3D tương tác kết nối doanh nghiệp toàn cầu theo quốc gia & ngành nghề. Tạo danh thiếp online, gửi card visit, mở rộng đối tác B2B quốc tế." },
      { property: "og:url", content: "https://earth-biz-link.lovable.app/" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/00a22ce0-49e6-49b7-90b4-01df776e6cc4/id-preview-2ea6aefd--f585c186-6c05-4cf6-909f-f5ed83a67e7f.lovable.app-1780538420894.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/00a22ce0-49e6-49b7-90b4-01df776e6cc4/id-preview-2ea6aefd--f585c186-6c05-4cf6-909f-f5ed83a67e7f.lovable.app-1780538420894.png" },
    ],
    links: [{ rel: "canonical", href: "https://earth-biz-link.lovable.app/" }],
  }),
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
  }
});


const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  technology: Cpu, finance: Landmark, "real-estate": Building2, manufacturing: Factory,
  retail: ShoppingBag, hospitality: Plane, education: GraduationCap, healthcare: HeartPulse,
  "food-beverage": UtensilsCrossed, logistics: Truck, agriculture: Wheat, energy: Zap,
  marketing: Megaphone, consulting: Scale, construction: HardHat, fashion: Shirt,
  entertainment: Music, automotive: Car, other: MoreHorizontal,
};

const ALL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu, Landmark, Building2, Factory, ShoppingBag, Plane, GraduationCap,
  HeartPulse, UtensilsCrossed, Truck, Wheat, Zap, Megaphone, Scale,
  HardHat, Shirt, Music, Car, MoreHorizontal,
};

function HomePage() {
  const { businesses, countries, industries } = Route.useLoaderData();
  const [selected, setSelected] = useState<any | null>(null);
  const [industry, setIndustry] = useState("all");
  const [country, setCountry] = useState("all");
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => getPublicStats(),
    staleTime: 60_000,
  });

  useEffect(() => setMounted(true), []);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const b of businesses) m[b.industry_slug] = (m[b.industry_slug] || 0) + 1;
    return m;
  }, [businesses]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return businesses.filter((b) => {
      if (industry !== "all" && b.industry_slug !== industry) return false;
      if (country !== "all" && b.country_code !== country) return false;
      if (q) {
        const indName = t("industry." + b.industry_slug).toLowerCase();
        const cName = countries.find((c: any) => c.code === b.country_code)?.name.toLowerCase() ?? "";
        if (
          !b.name.toLowerCase().includes(q) &&
          !indName.includes(q) &&
          !cName.includes(q)
        ) return false;
      }
      return true;
    });
  }, [industry, country, search, t, businesses, countries]);

  function scrollToExplore() {
    document.getElementById("explore-panel")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-gradient-globe">
      {/* Decorative gradient blobs */}
      <div className="fixed top-0 -left-32 w-[40rem] h-[40rem] rounded-full bg-primary/20 blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 -right-32 w-[40rem] h-[40rem] rounded-full bg-primary-glow/20 blur-[140px] pointer-events-none" />

      {/* ===== Hero: full-viewport globe ===== */}
      <section className="relative w-full h-screen overflow-hidden">
        <div className="absolute inset-0" suppressHydrationWarning>
          {mounted && (
            <Suspense fallback={
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading Map...</p>
              </div>
            }>
              <Globe3D businesses={filtered} onSelect={setSelected} />
            </Suspense>
          )}
        </div>

        {/* SSR-rendered hero copy — paints instantly for fast LCP */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-4">
          <div className="max-w-3xl text-center">
            <h1 className="font-display font-bold text-white text-4xl sm:text-6xl leading-[1.05] tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
              {t("home.heroTitlePrefix")} <span className="text-gradient">{t("home.heroTitleGradient")}</span>
            </h1>
            <p className="mt-4 text-white/80 text-base sm:text-lg max-w-2xl mx-auto">
              {t("home.heroSubtitle", { count: countries.length })}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center pointer-events-auto">
              <button
                onClick={scrollToExplore}
                className="px-5 h-11 rounded-xl bg-gradient-vivid text-white font-semibold shadow-pink hover:opacity-90 transition-smooth inline-flex items-center gap-2"
              >
                <Search className="w-4 h-4" /> {t("home.exploreBtn")}
              </button>
              <Link
                to="/explore"
                className="px-5 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/25 text-white font-semibold hover:bg-white/20 transition-smooth inline-flex items-center gap-2"
              >
                <Globe2 className="w-4 h-4" /> {t("home.map2dBtn")}
              </Link>
            </div>
          </div>
        </div>

        {/* Top-left logo */}
        <div className="absolute top-5 left-5 z-30">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-vivid blur-lg opacity-70 group-hover:opacity-100 transition-smooth" />
              <div className="relative w-11 h-11 rounded-2xl bg-gradient-vivid flex items-center justify-center shadow-glow">
                <Globe2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="font-display font-bold text-white text-lg leading-tight tracking-tight">
                BizConnect<span className="text-gradient">.One</span>
              </div>
              <div className="text-[10px] text-white/60 uppercase tracking-widest">{t("home.worldwideB2BMap")}</div>
            </div>
          </Link>
        </div>

        {/* Top-right nav — synced with Navbar.tsx */}
        <div className="absolute top-5 right-5 z-30 flex items-center gap-1">
          <LanguageSwitcher />
          <Link to="/explore">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-1.5">
              <Globe2 className="w-4 h-4" /> <span className="hidden md:inline">{t("nav.explore")}</span>
            </Button>
          </Link>
          <Link to="/countries">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-1.5 hidden md:inline-flex">
              <MapPin className="w-4 h-4" /> {t("nav.countries")}
            </Button>
          </Link>
          <Link to="/pricing">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white hidden sm:inline-flex">
              {t("nav.pricing")}
            </Button>
          </Link>
          {!loading && user ? (
            <>
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-1.5">
                  <LayoutDashboard className="w-4 h-4" /> <span className="hidden sm:inline">{t("nav.dashboard")}</span>
                </Button>
              </Link>
              <Button size="icon" variant="ghost" onClick={() => supabase.auth.signOut()} className="text-white hover:bg-white/10 hover:text-white" title={t("nav.logout")}>
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : !loading ? (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white gap-1.5 hidden sm:inline-flex">
                  <LogIn className="w-4 h-4" /> {t("nav.login")}
                </Button>
              </Link>
              <Link to="/signup">
                <Button size="sm" className="gap-1.5 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink">
                  <Sparkles className="w-4 h-4" /> <span className="hidden xs:inline">{t("nav.signup")}</span>
                </Button>
              </Link>
            </>
          ) : null}
        </div>

        {/* Subtle hint to scroll */}
        <button
          onClick={scrollToExplore}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 text-white/70 hover:text-white transition-smooth animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <span className="text-xs uppercase tracking-widest font-semibold">{t("home.scrollHint")}</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </section>


      {/* ===== Search + Industry panel (below globe) ===== */}
      <section id="explore-panel" className="relative z-10 px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto">
          {/* Search row */}
          <div className="animate-fade-up">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">
              {t("home.searchFilterTitle")} <span className="text-gradient">{t("home.searchFilterGradient")}</span>
            </h2>

            <p className="text-white/60 text-sm mb-5">
              {t("home.searchFilterDesc", { count: businesses.length })}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl shadow-glow">
              <div className="relative md:col-span-6">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t("home.searchPlaceholder")}
                  className="h-11 pl-10 bg-white/95 border-white/20 text-foreground placeholder:text-muted-foreground rounded-xl focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>
              <div className="md:col-span-3">
                <Select value={industry} onValueChange={setIndustry}>
                  <SelectTrigger className="h-11 bg-white/95 border-white/20 text-foreground rounded-xl">
                    <SelectValue placeholder={t("common.industry")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.allIndustries")}</SelectItem>
                    {industries.map((i: any) => (
                      <SelectItem key={i.slug} value={i.slug}>{t("industry." + i.slug, { defaultValue: i.name })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 flex gap-2">
                <Select value={country} onValueChange={setCountry}>
                  <SelectTrigger className="h-11 bg-white/95 border-white/20 text-foreground rounded-xl flex-1">
                    <SelectValue placeholder={t("common.country")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("common.allCountries")}</SelectItem>
                    {countries.map((c: any) => (
                      <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 text-sm text-white/70">
              <span className="font-semibold text-primary-glow">{filtered.length}</span> {t("home.matchedBusinesses")}
              {(industry !== "all" || country !== "all" || search) && (
                <button
                  onClick={() => { setIndustry("all"); setCountry("all"); setSearch(""); }}
                  className="ml-3 underline text-white/60 hover:text-white"
                >
                  {t("home.clearFilter")}
                </button>
              )}
            </div>
          </div>

          {/* Live network stats */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-up" style={{ animationDelay: "0.05s" }}>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-vivid flex items-center justify-center shadow-pink">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {(stats?.businesses ?? businesses.length).toLocaleString()}
                </div>
                <div className="text-xs text-white/60 uppercase tracking-wide">{t("home.statsBusinesses")}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-vivid flex items-center justify-center shadow-pink">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {(stats?.connections ?? 0).toLocaleString()}
                </div>
                <div className="text-xs text-white/60 uppercase tracking-wide">{t("home.statsConnections")}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="w-11 h-11 rounded-xl bg-gradient-vivid flex items-center justify-center shadow-pink">
                <Globe2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {countries.length}+
                </div>
                <div className="text-xs text-white/60 uppercase tracking-wide">{t("home.statsCountries")}</div>
              </div>
            </div>
          </div>


          {/* Industries grid */}
          <div className="mt-10 animate-fade-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm uppercase tracking-widest text-white/70 font-semibold">
                {t("home.industriesTitle")}
              </h3>
              <button
                onClick={() => setIndustry("all")}
                className={`text-xs font-medium transition-smooth ${
                  industry === "all" ? "text-primary-glow" : "text-white/60 hover:text-white"
                }`}
              >
                {t("home.showAll", { count: businesses.length })}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {industries.map((ind: any) => {
                const Icon = (ind.icon ? ALL_ICONS[ind.icon] : null) || INDUSTRY_ICONS[ind.slug] || MoreHorizontal;
                const count = counts[ind.slug] || 0;
                const active = industry === ind.slug;
                return (
                  <button
                    key={ind.slug}
                    onClick={() => navigate({ to: "/explore", search: { industry: ind.slug } })}
                    className={`group relative flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-smooth ${
                      active
                        ? "bg-gradient-vivid border-transparent text-white shadow-pink scale-[1.03]"
                        : "bg-white/10 border-white/10 text-white/85 hover:bg-white/20 hover:border-white/25 backdrop-blur-md hover:scale-[1.02]"
                    }`}
                    title={ind.name}
                  >
                    <Icon className="w-6 h-6 shrink-0" />
                    <span className="text-xs font-medium leading-tight text-center line-clamp-2">
                      {t("industry." + ind.slug, { defaultValue: ind.name })}
                    </span>
                    <span className={`text-xs font-bold tabular-nums ${
                      active ? "text-white" : "text-primary-glow"
                    }`}>
                      {count} {t("home.businessUnit")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer CTA */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 text-center animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <Link to="/explore">
              <Button size="lg" className="bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink gap-2">
                <Globe2 className="w-5 h-5" /> {t("home.footerCtaMap")}
              </Button>
            </Link>
            {!user && (
              <Link to="/signup">
                <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/15 gap-2">
                  <Sparkles className="w-5 h-5" /> {t("home.footerCtaRegister")}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {selected && <BusinessCard business={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
