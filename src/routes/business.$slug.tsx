import { createFileRoute, notFound, useNavigate, redirect } from "@tanstack/react-router";
import { BusinessCard } from "@/components/BusinessCard";
import { useTranslation } from "react-i18next";

import { getBusinessBySlug } from "@/lib/business-public.functions";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClaimBusinessDialog } from "@/components/ClaimBusinessDialog";
import { ShieldCheck, Info } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/business/$slug")({
  component: BusinessDetailPage,
  loader: async ({ params }) => {
    const res = await getBusinessBySlug({ data: { slug: params.slug } });
    if (!res.business) throw notFound();

    // Redirect UUID access to friendly slug
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.slug,
    );
    if (isUuid && res.business.slug !== params.slug) {
      throw redirect({
        to: "/business/$slug",
        params: { slug: res.business.slug },
        replace: true,
      });
    }

    return { business: res.business };
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) return { meta: [] };
    const b: any = loaderData.business;
    const url = `https://bizconnect.one/business/${params.slug}`;
    const sameAs = Object.values(b.socials ?? {}).filter(Boolean) as string[];
    const jsonLd: Record<string, unknown> = {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: b.name,
      description: b.short_intro || b.description || undefined,
      url,
      image: b.banner_url || b.logo_url || undefined,
      logo: b.logo_url || undefined,
      telephone: b.phone || undefined,
      email: b.email || undefined,
      address: {
        "@type": "PostalAddress",
        streetAddress: b.address || undefined,
        addressLocality: b.province || undefined,
        addressCountry: b.country_code || undefined,
      },
      geo:
        b.lat && b.lng
          ? { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng }
          : undefined,
      sameAs: sameAs.length ? sameAs : undefined,
    };
    return {
      meta: [
        { title: `${b.name} — BizConnect.One` },
        { name: "description", content: b.short_intro },
        { property: "og:title", content: b.name },
        { property: "og:description", content: b.short_intro },
        { property: "og:image", content: b.banner_url },
        { property: "og:url", content: url },
        { property: "og:type", content: "business.business" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: b.banner_url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [{ type: "application/ld+json", children: JSON.stringify(jsonLd) }],
    };
  },
  errorComponent: ({ error }) => {
    const { t } = useTranslation();
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-32 text-center px-4">
          <h1 className="font-display text-2xl font-bold mb-2">{t("businessCard.errorLoad")}</h1>
          <p className="text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  },
  notFoundComponent: () => {
    const { t } = useTranslation();
    return (
      <div className="min-h-screen bg-background">
        <div className="pt-32 text-center px-4">
          <h1 className="font-display text-2xl font-bold mb-2">
            {t("businessCard.errorNotFound")}
          </h1>
          <p className="text-muted-foreground">{t("businessCard.errorNotFoundDesc")}</p>
        </div>
      </div>
    );
  },
});

function BusinessDetailPage() {
  const { business } = Route.useLoaderData();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isClaimOpen, setIsClaimOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Mesh-like Background */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-rose-500/20 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-pink-500/20 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <main className="relative pt-24 pb-16 px-4 z-10">
        <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" /> {t("businessCard.back")}
          </Button>
        </div>

        {business.is_claimed === false && (
          <div className="max-w-4xl mx-auto mb-6 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 bg-amber-500/20 p-2 rounded-full">
                <Info className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-lg">
                  {t("business.claimTitle")}
                </h3>
                <p className="text-muted-foreground text-sm mt-1 leading-relaxed">
                  {t("business.claimDesc")}
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsClaimOpen(true)}
              className="whitespace-nowrap bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20 gap-2 font-semibold"
            >
              <ShieldCheck className="w-4 h-4" /> {t("business.claimBtn")}
            </Button>
          </div>
        )}

        <BusinessCard business={business as any} mode="inline" />

        <ClaimBusinessDialog
          businessId={business.id}
          businessName={business.name}
          isOpen={isClaimOpen}
          onClose={() => setIsClaimOpen(false)}
        />
      </main>
    </div>
  );
}
