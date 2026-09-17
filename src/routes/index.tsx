import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
const Globe3D = lazy(() =>
  import("@/components/Globe3D").then((module) => ({ default: module.Globe3D })),
);
import { BusinessCard } from "@/components/BusinessCard";
import { getPublicStats } from "@/lib/stats.functions";
import { getExploreBusinesses, getGlobalLists } from "@/lib/business-public.functions";
import {
  Search,
  Globe2,
  ChevronDown,
  MapPin,
  Cpu,
  Landmark,
  Building2,
  Factory,
  ShoppingBag,
  Plane,
  GraduationCap,
  HeartPulse,
  UtensilsCrossed,
  Truck,
  Wheat,
  Zap,
  Megaphone,
  Scale,
  HardHat,
  Shirt,
  Music,
  Car,
  MoreHorizontal,
  Send,
  Users,
  UserPlus,
  Sparkles,
  QrCode,
  FolderLock,
  Handshake,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: HomePage,
  head: () => ({
    meta: [
      { title: "BizConnect.One — Danh bạ doanh nghiệp toàn cầu 3D" },
      {
        name: "description",
        content:
          "Danh bạ 3D tương tác kết nối hàng ngàn doanh nghiệp toàn cầu theo quốc gia và ngành nghề. Tạo danh thiếp online, gửi card visit và mở rộng đối tác B2B quốc tế chỉ từ $5/năm.",
      },
      { property: "og:title", content: "BizConnect.One — Danh bạ doanh nghiệp toàn cầu 3D" },
      {
        property: "og:description",
        content:
          "Danh bạ 3D tương tác kết nối doanh nghiệp toàn cầu theo quốc gia & ngành nghề. Tạo danh thiếp online, gửi card visit, mở rộng đối tác B2B quốc tế.",
      },
      { property: "og:url", content: "https://bizconnect.one/" },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/00a22ce0-49e6-49b7-90b4-01df776e6cc4/id-preview-2ea6aefd--f585c186-6c05-4cf6-909f-f5ed83a67e7f.lovable.app-1780538420894.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/00a22ce0-49e6-49b7-90b4-01df776e6cc4/id-preview-2ea6aefd--f585c186-6c05-4cf6-909f-f5ed83a67e7f.lovable.app-1780538420894.png",
      },
    ],
    links: [{ rel: "canonical", href: "https://bizconnect.one/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "WebSite",
              "@id": "https://bizconnect.one/#website",
              url: "https://bizconnect.one/",
              name: "BizConnect.One",
              description: "Danh bạ 3D tương tác kết nối doanh nghiệp toàn cầu theo quốc gia & ngành nghề.",
              potentialAction: [
                {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://bizconnect.one/explore?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              ],
            },
            {
              "@type": "Organization",
              "@id": "https://bizconnect.one/#organization",
              name: "BizConnect.One",
              url: "https://bizconnect.one/",
              logo: "https://bizconnect.one/logo.png",
              sameAs: [
                "https://www.facebook.com/BizConnect.One",
              ]
            }
          ]
        }),
      }
    ]
  }),
  loader: async () => {
    const [bizRes, listRes] = await Promise.all([getExploreBusinesses(), getGlobalLists()]);
    return {
      businesses: bizRes.businesses,
      totalCount: bizRes.total,
      countries: listRes.countries,
      industries: listRes.industries,
    };
  },
});

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  technology: Cpu,
  finance: Landmark,
  "real-estate": Building2,
  manufacturing: Factory,
  retail: ShoppingBag,
  hospitality: Plane,
  education: GraduationCap,
  healthcare: HeartPulse,
  "food-beverage": UtensilsCrossed,
  logistics: Truck,
  agriculture: Wheat,
  energy: Zap,
  marketing: Megaphone,
  consulting: Scale,
  construction: HardHat,
  fashion: Shirt,
  entertainment: Music,
  automotive: Car,
  other: MoreHorizontal,
};

const ALL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Cpu,
  Landmark,
  Building2,
  Factory,
  ShoppingBag,
  Plane,
  GraduationCap,
  HeartPulse,
  UtensilsCrossed,
  Truck,
  Wheat,
  Zap,
  Megaphone,
  Scale,
  HardHat,
  Shirt,
  Music,
  Car,
  MoreHorizontal,
};

function HomePage() {
  const { businesses, totalCount, countries, industries } = Route.useLoaderData();
  const [selected, setSelected] = useState<any | null>(null);
  const [industry, setIndustry] = useState("all");
  const [country, setCountry] = useState("all");
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submittingContact, setSubmittingContact] = useState(false);

  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc.");
      return;
    }
    setSubmittingContact(true);
    const { error } = await (supabase as any).from("contact_submissions").insert([
      { ...contactForm, company: "" }
    ]);
    setSubmittingContact(false);
    if (error) {
      toast.error("Gửi thất bại, vui lòng thử lại sau.");
    } else {
      toast.success("Đã gửi tin nhắn thành công. Chúng tôi sẽ phản hồi sớm nhất!");
      setContactForm({ name: "", email: "", phone: "", message: "" });
    }
  };

  const { data: stats } = useQuery({
    queryKey: ["public-stats"],
    queryFn: () => getPublicStats(),
    staleTime: 60_000,
  });

  useEffect(() => setMounted(true), []);

  const counts = useMemo(() => {
    if (stats?.industryCounts) return stats.industryCounts;
    const m: Record<string, number> = {};
    for (const b of businesses) m[b.industry_slug] = (m[b.industry_slug] || 0) + 1;
    return m;
  }, [businesses, stats?.industryCounts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return businesses.filter((b) => {
      if (industry !== "all" && b.industry_slug !== industry) return false;
      if (country !== "all" && b.country_code !== country) return false;
      if (q) {
        const indName = t("industry." + b.industry_slug).toLowerCase();
        const cName =
          countries.find((c: any) => c.code === b.country_code)?.name.toLowerCase() ?? "";
        if (!b.name.toLowerCase().includes(q) && !indName.includes(q) && !cName.includes(q))
          return false;
      }
      return true;
    });
  }, [industry, country, search, t, businesses, countries]);

  function scrollToExplore() {
    document
      .getElementById("explore-panel")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <Suspense
              fallback={
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                  <p className="mt-4 text-sm text-muted-foreground animate-pulse">Loading Map...</p>
                </div>
              }
            >
              <Globe3D businesses={filtered} onSelect={setSelected} />
            </Suspense>
          )}
        </div>

        {/* SSR-rendered hero copy — paints instantly for fast LCP */}
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none px-4">
          <div className="max-w-3xl text-center">
            <h1 className="font-display font-bold text-white text-4xl sm:text-6xl leading-[1.05] tracking-tight drop-shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
              {t("home.heroTitlePrefix")}{" "}
              <span className="text-gradient">{t("home.heroTitleGradient")}</span>
            </h1>
            
            {/* Answer-First Summary for AEO / SEO */}
            <p className="sr-only">
              BizConnect.One là danh bạ doanh nghiệp toàn cầu 3D, giúp kết nối hàng ngàn công ty theo quốc gia và ngành nghề. 
              Cho phép tạo danh thiếp online, lưu trữ thông tin đối tác an toàn và mở rộng giao thương B2B quốc tế nhanh chóng.
            </p>

            <div className="mt-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-base sm:text-lg font-medium text-white backdrop-blur-md shadow-glow">
              <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Hướng đến cộng đồng hơn 100k+ doanh nghiệp toàn cầu!
            </div>
            <p className="mt-5 text-white/80 text-base sm:text-lg max-w-2xl mx-auto">
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

        {/* Subtle hint to scroll */}
        <button
          onClick={scrollToExplore}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1 text-white/70 hover:text-white transition-smooth animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <span className="text-xs uppercase tracking-widest font-semibold">
            {t("home.scrollHint")}
          </span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </button>
      </section>

      {/* ===== Search + Industry panel (below globe) ===== */}
      <section id="explore-panel" className="relative z-10 px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto">
          {/* Search row */}
          <div className="animate-fade-up">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">
              {t("home.searchFilterTitle")}{" "}
              <span className="text-gradient">{t("home.searchFilterGradient")}</span>
            </h2>

            <p className="text-white/60 text-sm mb-5">
              {t("home.searchFilterDesc", { count: totalCount })}
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
                      <SelectItem key={i.slug} value={i.slug}>
                        {t("industry." + i.slug, { defaultValue: i.name })}
                      </SelectItem>
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
                      <SelectItem key={c.code} value={c.code}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="mt-3 text-sm text-white/70">
              <span className="font-semibold text-primary-glow">{filtered.length}</span>{" "}
              {t("home.matchedBusinesses")}
              {(industry !== "all" || country !== "all" || search) && (
                <button
                  onClick={() => {
                    setIndustry("all");
                    setCountry("all");
                    setSearch("");
                  }}
                  className="ml-3 underline text-white/60 hover:text-white"
                >
                  {t("home.clearFilter")}
                </button>
              )}
            </div>
          </div>

          {/* Live network stats */}
          <div
            className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-up"
            style={{ animationDelay: "0.05s" }}
          >
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-vivid flex items-center justify-center shadow-pink">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {(stats?.businesses ?? businesses.length).toLocaleString()}
                </div>
                <div className="text-xs text-white/60 uppercase tracking-wide">
                  {t("home.statsBusinesses")}
                </div>
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
                <div className="text-xs text-white/60 uppercase tracking-wide">
                  {t("home.statsConnections")}
                </div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 p-4 flex items-center gap-3 col-span-2 sm:col-span-1">
              <div className="w-11 h-11 rounded-xl bg-gradient-vivid flex items-center justify-center shadow-pink">
                <Globe2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-xl font-bold text-white tabular-nums">{countries.length}+</div>
                <div className="text-xs text-white/60 uppercase tracking-wide">
                  {t("home.statsCountries")}
                </div>
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
                {t("home.showAll", { count: totalCount })}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {industries.map((ind: any) => {
                const Icon =
                  (ind.icon ? ALL_ICONS[ind.icon] : null) ||
                  INDUSTRY_ICONS[ind.slug] ||
                  MoreHorizontal;
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
                    <span
                      className={`text-xs font-bold tabular-nums ${
                        active ? "text-white" : "text-primary-glow"
                      }`}
                    >
                      {count} {t("home.businessUnit")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Features Section */}
          <div className="mt-20 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                Danh bạ doanh nghiệp <span className="text-gradient">Ưu việt</span>
              </h2>
              <p className="text-white/70 max-w-2xl mx-auto">
                Kết nối giao thương nhanh chóng chỉ với 3 bước đơn giản, lưu trữ an toàn không lo thất lạc.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-smooth group">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-6 h-6 text-primary-glow" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">1. Tạo tài khoản</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Đăng ký dễ dàng và tạo hồ sơ doanh nghiệp của bạn trong vòng chưa đầy 1 phút.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-smooth group">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <QrCode className="w-6 h-6 text-primary-glow" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">2. Quét QR - Gửi danh thiếp</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Trao đổi thông tin tức thì qua mã QR, gửi danh thiếp số để kết nối giao thương nhanh chóng.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-smooth group">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FolderLock className="w-6 h-6 text-primary-glow" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">3. Lưu trữ an toàn</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Lưu hàng ngàn danh bạ vào một nơi duy nhất. Đảm bảo an toàn, không bao giờ lo thất lạc!
                </p>
              </div>
            </div>
          </div>

          {/* B2B Trade & RFQ Section (Coming Soon) */}
          <div className="mt-24 animate-fade-up">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-white/10 p-8 sm:p-12 text-center md:text-left flex flex-col md:flex-row items-center gap-8 shadow-2xl">
              {/* Coming soon badge */}
              <div className="absolute top-4 right-4 bg-gradient-vivid text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-pink animate-pulse">
                Sắp triển khai
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                    <Handshake className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-white">
                    Giao thương B2B & Yêu cầu Báo giá
                  </h2>
                </div>
                <p className="text-white/70 text-lg leading-relaxed mb-6">
                  Mô hình kết nối thương mại chuẩn quốc tế. Khám phá cơ hội hợp tác, tạo yêu cầu mua hàng (RFQ) và nhận báo giá trực tiếp từ hàng ngàn nhà cung cấp uy tín trên hệ sinh thái BizConnect.One.
                </p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Search className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white/90">Tìm nguồn hàng</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white/90">Đăng yêu cầu RFQ</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-lg flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-white/90">Giao dịch an toàn</span>
                  </div>
                </div>
              </div>
              <div className="shrink-0 w-full md:w-1/3">
                <div className="aspect-video md:aspect-square rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent opacity-50"></div>
                  <MessageSquare className="w-16 h-16 text-white/20 group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur rounded-xl p-3 border border-white/10">
                     <p className="text-xs text-white/60 mb-1">Gửi từ: Buyer International</p>
                     <p className="text-sm font-semibold text-white">"Tôi cần báo giá 10,000 SP..."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form Section */}
          <div className="mt-24 animate-fade-up max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                Liên hệ với chúng tôi
              </h2>
              <p className="text-white/70">
                Bạn cần hỗ trợ, tư vấn hay trao đổi hợp tác? Hãy để lại thông tin, đội ngũ Admin sẽ liên hệ lại với bạn sớm nhất.
              </p>
            </div>
            
            <form onSubmit={handleContactSubmit} className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-10 backdrop-blur-xl shadow-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Họ và tên *</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input 
                      required
                      placeholder="Nhập tên của bạn"
                      value={contactForm.name}
                      onChange={e => setContactForm(prev => ({...prev, name: e.target.value}))}
                      className="pl-10 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/30 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-white/80">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <Input 
                      placeholder="Nhập số điện thoại"
                      value={contactForm.phone}
                      onChange={e => setContactForm(prev => ({...prev, phone: e.target.value}))}
                      className="pl-10 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/30 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5 mb-5">
                <label className="text-sm font-medium text-white/80">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <Input 
                    required
                    type="email"
                    placeholder="Nhập địa chỉ email"
                    value={contactForm.email}
                    onChange={e => setContactForm(prev => ({...prev, email: e.target.value}))}
                    className="pl-10 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/30 rounded-xl focus-visible:ring-primary focus-visible:border-primary"
                  />
                </div>
              </div>
              <div className="space-y-1.5 mb-8">
                <label className="text-sm font-medium text-white/80">Nội dung trao đổi *</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Nhập nội dung cần hỗ trợ..."
                  value={contactForm.message}
                  onChange={e => setContactForm(prev => ({...prev, message: e.target.value}))}
                  className="w-full p-4 bg-black/20 border border-white/10 text-white placeholder:text-white/30 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary resize-none transition-smooth"
                />
              </div>
              <Button 
                type="submit" 
                disabled={submittingContact}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-glow text-base"
              >
                {submittingContact ? "Đang gửi..." : "Gửi thông tin liên hệ"}
              </Button>
            </form>
          </div>

          {/* Footer CTA */}
          <div
            className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-3 text-center animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            <Link to="/explore">
              <Button
                size="lg"
                className="bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink gap-2"
              >
                <Globe2 className="w-5 h-5" /> {t("home.footerCtaMap")}
              </Button>
            </Link>
            {!user && (
              <Link to="/signup">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/15 gap-2"
                >
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
