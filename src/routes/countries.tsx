import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { getGlobalLists } from "@/lib/business-public.functions";
import { Building2, ArrowRight, Search, Globe2, MapPin } from "lucide-react";
import countriesOg from "@/assets/countries-og.jpg";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/countries")({
  head: () => ({
    meta: [
      { title: "Danh mục quốc gia có doanh nghiệp — BizConnect.One" },
      {
        name: "description",
        content:
          "Duyệt danh mục doanh nghiệp theo từng quốc gia trên bản đồ B2B toàn cầu. Chọn thị trường bạn quan tâm để khám phá đối tác tiềm năng.",
      },
      { property: "og:title", content: "Danh mục quốc gia có doanh nghiệp — BizConnect.One" },
      {
        property: "og:description",
        content:
          "Duyệt danh mục doanh nghiệp theo từng quốc gia trên bản đồ B2B toàn cầu — chọn thị trường bạn quan tâm để khám phá đối tác.",
      },
      { property: "og:url", content: "https://bizconnect.one/countries" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `https://bizconnect.one${countriesOg}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `https://bizconnect.one${countriesOg}` },
    ],
    links: [{ rel: "canonical", href: "https://bizconnect.one/countries" }],
  }),

  component: CountriesPage,
  loader: async () => {
    const listRes = await getGlobalLists();
    return { countries: listRes.countries };
  },
});

// Region-based gradient for a distinctive thumbnail per country card.
const REGION_GRADIENTS: Record<string, string> = {
  asia: "from-rose-500/20 via-rose-500/5 to-transparent",
  americas: "from-sky-500/20 via-sky-500/5 to-transparent",
  europe: "from-emerald-500/20 via-emerald-500/5 to-transparent",
  mena: "from-amber-500/20 via-amber-500/5 to-transparent",
  oceania: "from-cyan-500/20 via-cyan-500/5 to-transparent",
};

const REGION_NAMES: Record<string, string> = {
  asia: "Châu Á",
  americas: "Châu Mỹ",
  europe: "Châu Âu",
  mena: "Trung Đông & Châu Phi",
  oceania: "Châu Đại Dương",
};

const REGION_BY_CODE: Record<string, keyof typeof REGION_GRADIENTS> = {
  VN: "asia",
  CN: "asia",
  JP: "asia",
  KR: "asia",
  SG: "asia",
  TH: "asia",
  MY: "asia",
  ID: "asia",
  PH: "asia",
  IN: "asia",
  US: "americas",
  CA: "americas",
  MX: "americas",
  BR: "americas",
  AR: "americas",
  GB: "europe",
  DE: "europe",
  FR: "europe",
  IT: "europe",
  ES: "europe",
  NL: "europe",
  CH: "europe",
  SE: "europe",
  RU: "europe",
  TR: "europe",
  AE: "mena",
  SA: "mena",
  EG: "mena",
  ZA: "mena",
  AU: "oceania",
};

function CountriesPage() {
  const { countries } = Route.useLoaderData();
  const [search, setSearch] = useState("");

  const filteredCountries = useMemo(() => {
    if (!search.trim()) return countries;
    const lower = search.toLowerCase();
    return countries.filter(
      (c) => c.name.toLowerCase().includes(lower) || c.code.toLowerCase().includes(lower)
    );
  }, [countries, search]);

  const groupedByRegion = useMemo(() => {
    const groups: Record<string, typeof countries> = {};
    for (const c of filteredCountries) {
      const region = REGION_BY_CODE[c.code] ?? "asia";
      if (!groups[region]) groups[region] = [];
      groups[region].push(c);
    }
    return groups;
  }, [filteredCountries]);

  const regions = Object.keys(groupedByRegion).sort();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-28 pb-20 overflow-hidden shrink-0 border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 ring-1 ring-primary/20">
            <Globe2 className="w-4 h-4" /> Bản đồ B2B Toàn cầu
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground mb-6">
            Khám phá Đối tác <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-vivid">
              Trên Toàn Thế Giới
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Duyệt danh mục hàng ngàn doanh nghiệp theo từng quốc gia và khu vực. Chọn thị trường chiến lược để mở rộng mạng lưới kết nối của bạn.
          </p>

          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm quốc gia (ví dụ: Việt Nam, US, JP...)"
              className="w-full h-14 pl-12 pr-4 rounded-2xl bg-card border-border/50 shadow-soft focus-visible:ring-primary focus-visible:border-primary text-base transition-all"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 py-12 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {filteredCountries.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Không tìm thấy quốc gia nào</h3>
              <p className="text-muted-foreground">Thử tìm kiếm với từ khóa khác (ví dụ: tên tiếng Anh hoặc mã quốc gia).</p>
            </div>
          ) : (
            <div className="space-y-16">
              {regions.map((region) => (
                <section key={region} className="animate-fade-up">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      {REGION_NAMES[region] || "Khu vực khác"}
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {groupedByRegion[region].map((c) => {
                      const gradient = REGION_GRADIENTS[region] || REGION_GRADIENTS["asia"];
                      
                      return (
                        <Link
                          key={c.code}
                          to="/country/$slug"
                          params={{ slug: c.code.toLowerCase() }}
                          aria-label={`Xem doanh nghiệp tại ${c.name}`}
                          className="group block relative h-full rounded-2xl bg-card border border-border/40 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                          {/* Glassmorphism Background Glow */}
                          <div
                            className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                          />
                          
                          <div className="relative p-5 h-full flex flex-col">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-12 h-12 rounded-xl bg-background shadow-sm border border-border/50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                                {c.flag ?? "🌐"}
                              </div>
                              <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                              </div>
                            </div>
                            
                            <div className="mt-auto">
                              <h3 className="font-semibold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">
                                {c.name}
                              </h3>
                              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Building2 className="w-4 h-4 opacity-70" />
                                <span>Xem danh mục</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
