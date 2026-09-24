import { createFileRoute, notFound, useNavigate, redirect, useRouter } from "@tanstack/react-router";
import { BusinessCard } from "@/components/BusinessCard";
import { useTranslation } from "react-i18next";
import { getBusinessBySlug } from "@/lib/business-public.functions";
import { ArrowLeft, ShieldCheck, Info, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClaimBusinessDialog } from "@/components/ClaimBusinessDialog";
import { WelcomeOfferModal } from "@/components/WelcomeOfferModal";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/business/$slug")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      invite: search.invite as string | undefined,
    };
  },
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
        search: { invite: undefined },
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
  const search = Route.useSearch();
  const navigate = useNavigate();
  const router = useRouter();
  const { t } = useTranslation();
  
  const [isClaimOpen, setIsClaimOpen] = useState(false);
  const [showWelcomeOffer, setShowWelcomeOffer] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id;
      if (uid) {
        setUserId(uid);
        supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle().then(({ data: roleData }) => {
          setIsAdmin(!!roleData);
        });
      }

      // Handle invite link
      if (search.invite) {
        if (!uid) {
          // Not logged in -> Redirect to login with redirectTo current url
          const currentUrl = window.location.pathname + window.location.search;
          navigate({ to: "/login", search: { redirectTo: currentUrl } });
        } else {
          // Process invite
          processInvite(search.invite);
        }
      }
    });
  }, [search.invite]);

  const processInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase.rpc('accept_business_invite' as any, { p_invite_id: inviteId });
      if (error) throw error;
      
      // Clean up URL
      navigate({ to: "/business/$slug", params: { slug: business.slug }, search: { invite: undefined }, replace: true });
      setShowWelcomeOffer(true);
      // Reload router to fetch updated business data (claimed_at etc)
      router.invalidate();
    } catch (err: any) {
      toast.error(err.message || "Failed to process invite link");
      navigate({ to: "/business/$slug", params: { slug: business.slug }, search: { invite: undefined }, replace: true });
    }
  };

  const generateInviteLink = async () => {
    setGeneratingLink(true);
    try {
      const { data: inviteId, error } = await supabase.rpc('create_business_invite' as any, { p_business_id: business.id });
      if (error) throw error;
      
      const link = `https://bizconnect.one/business/${business.slug}?invite=${inviteId}`;
      await navigator.clipboard.writeText(link);
      toast.success("Đã copy link bàn giao vào bộ nhớ tạm!");
    } catch (err: any) {
      toast.error("Lỗi tạo link bàn giao: " + err.message);
    } finally {
      setGeneratingLink(false);
    }
  };

  // Logic Trial 30 days & Blur
  const claimedAt = (business as any).claimed_at ? new Date((business as any).claimed_at) : null;
  const premiumUntil = (business as any).premium_until ? new Date((business as any).premium_until) : null;
  const now = new Date();
  
  let isTrialExpired = false;
  let hasPremium = false;

  if (premiumUntil && premiumUntil > now) {
    hasPremium = true;
  }
  
  if (claimedAt && !hasPremium) {
    const trialEndsAt = new Date(claimedAt.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    if (trialEndsAt < now) {
      isTrialExpired = true;
    }
  }

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

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateInviteLink}
              disabled={generatingLink}
              className="gap-2 bg-background shadow-sm hover:bg-accent border-primary/20"
            >
              <Share2 className="w-4 h-4 text-primary" />
              Tạo Link Bàn Giao
            </Button>
          )}
        </div>

        {business.is_claimed === false && !search.invite && (
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

        <div className="relative max-w-4xl mx-auto">
          <div className={isTrialExpired ? "filter blur-md pointer-events-none opacity-50 transition-all duration-500" : ""}>
            <BusinessCard business={business as any} mode="inline" />
          </div>
          
          {isTrialExpired && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-background/40 rounded-3xl z-20">
              <div className="bg-background border border-border shadow-xl rounded-2xl p-6 sm:p-8 max-w-md">
                <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                  <Info className="w-6 h-6 text-amber-600 dark:text-amber-500" />
                </div>
                <h3 className="text-xl font-bold mb-2">Hết hạn dùng thử 30 ngày</h3>
                <p className="text-muted-foreground text-sm mb-6">
                  Doanh nghiệp này đã hết hạn dùng thử miễn phí. Chủ doanh nghiệp vui lòng nâng cấp Gói Thành Viên để mở khóa hiển thị hồ sơ cho cộng đồng.
                </p>
                {/* Notice: A real owner would log in and go to dashboard to pay. For public visitors, they just see this. */}
              </div>
            </div>
          )}
        </div>

        <ClaimBusinessDialog
          businessId={business.id}
          businessName={business.name}
          isOpen={isClaimOpen}
          onClose={() => setIsClaimOpen(false)}
        />

        {userId && (
          <WelcomeOfferModal
            open={showWelcomeOffer}
            onOpenChange={setShowWelcomeOffer}
            bizId={business.id}
            userId={userId}
          />
        )}
      </main>
    </div>
  );
}
