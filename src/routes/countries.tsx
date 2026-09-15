import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { getGlobalLists } from "@/lib/business-public.functions";
import { Building2, ArrowRight } from "lucide-react";
import countriesOg from "@/assets/countries-og.jpg";

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
      { property: "og:url", content: "https://earth-biz-link.lovable.app/countries" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: `https://earth-biz-link.lovable.app${countriesOg}` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: `https://earth-biz-link.lovable.app${countriesOg}` },
    ],
    links: [{ rel: "canonical", href: "https://earth-biz-link.lovable.app/countries" }],
  }),

  component: CountriesPage,
  loader: async () => {
    const listRes = await getGlobalLists();
    return { countries: listRes.countries };
  },
});

// Region-based gradient for a distinctive thumbnail per country card.
const REGION_GRADIENTS: Record<string, string> = {
  asia: "from-rose-500/20 via-amber-500/10 to-transparent",
  americas: "from-sky-500/20 via-indigo-500/10 to-transparent",
  europe: "from-emerald-500/20 via-teal-500/10 to-transparent",
  mena: "from-yellow-500/20 via-orange-500/10 to-transparent",
  oceania: "from-cyan-500/20 via-blue-500/10 to-transparent",
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
  const sorted = [...countries];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 max-w-7xl mx-auto px-4 pb-16">
        <h1 className="font-display text-3xl sm:text-4xl font-bold mb-2">Quốc gia</h1>
        <p className="text-muted-foreground mb-8">
          Chọn một quốc gia để xem doanh nghiệp trong khu vực đó.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {sorted.map((c) => {
            const region = REGION_BY_CODE[c.code] ?? "asia";
            const gradient = REGION_GRADIENTS[region];
            return (
              <Link
                key={c.code}
                to="/country/$slug"
                params={{ slug: c.code.toLowerCase() }}
                aria-label={`Xem doanh nghiệp tại ${c.name}`}
                className="group relative overflow-hidden p-4 rounded-2xl bg-card hover:bg-accent border border-border/50 hover:border-primary/40 transition-smooth hover:shadow-soft"
              >
                <div
                  className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} opacity-70 group-hover:opacity-100 transition-opacity`}
                />
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-background/70 backdrop-blur text-muted-foreground">
                      {c.flag ?? c.code}
                    </span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="font-semibold text-base truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground inline-flex items-center gap-1 mt-1">
                    <Building2 className="w-3 h-3" /> Xem doanh nghiệp
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
