import { useState, useEffect } from "react";
import { ScanLine, IdCard, X, Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { QRScannerDialog } from "@/components/QRScannerDialog";
import { MyCardModal, type CardData } from "@/components/MyCardModal";
import { supabase } from "@/integrations/supabase/client";

import { useLocation } from "@tanstack/react-router";

/**
 * CardFAB — Floating Action Button visible on all pages for logged-in users.
 * Expands to reveal two actions:
 *   1. Scan QR code of another business/person
 *   2. Show own digital business card with QR
 */
export function CardFAB() {
  const { user, accountType } = useAuth();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [cardData, setCardData] = useState<CardData | null>(null);
  const [loadingCard, setLoadingCard] = useState(false);

  // Hide FAB on specific routes to prevent UI collision
  const hideFabRoutes = ["/business/", "/p/", "/login", "/signup"];
  const shouldHide = hideFabRoutes.some((route) => location.pathname.startsWith(route));

  if (shouldHide) return null;

  const openMyCard = async () => {
    setExpanded(false);
    if (!user) {
      window.location.href = "/login";
      return;
    }
    if (cardData) {
      setShowCard(true);
      return;
    }
    setLoadingCard(true);
    try {
      if (accountType === "personal") {
        const { data } = await supabase
          .from("personal_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        if (data) {
          setCardData({
            type: "personal",
            full_name: data.full_name,
            slug: data.slug,
            avatar_url: data.avatar_url,
            job_title: data.job_title,
            company_name: data.company_name,
            phone: data.phone,
            email: data.email,
            zalo: data.zalo,
            facebook_url: data.facebook_url,
            linkedin_url: data.linkedin_url,
          });
          setShowCard(true);
        } else {
          // No card yet — navigate to create
          window.location.href = "/me";
        }
      } else {
        // Business account — get first public business
        const { data } = await supabase
          .from("businesses")
          .select(
            "id, name, slug, logo_url, phone, email, website, address, province, country_code, short_intro, industry_id, industries(name)",
          )
          .eq("owner_id", user.id)
          .eq("status", "public")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) {
          setCardData({
            type: "business",
            name: data.name,
            slug: data.slug,
            logo_url: data.logo_url,
            industry: (data as any).industries?.name ?? null,
            phone: data.phone,
            email: data.email,
            website: data.website,
            address: data.address,
            province: data.province,
            country_code: data.country_code,
            short_intro: data.short_intro,
          });
          setShowCard(true);
        } else {
          window.location.href = "/business/edit";
        }
      }
    } finally {
      setLoadingCard(false);
    }
  };

  const openScanner = () => {
    setExpanded(false);
    setShowScanner(true);
  };

  return (
    <>
      {/* FAB container — bottom right */}
      <div className="fixed bottom-6 right-5 z-[1000] flex flex-col items-end gap-3">
        {/* Sub-action: My Card */}
        <div
          className={`flex items-center gap-2.5 transition-all duration-300 origin-bottom-right ${
            expanded
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-4 scale-75 pointer-events-none"
          }`}
        >
          <span className="bg-card/95 backdrop-blur text-sm font-medium px-3 py-1.5 rounded-full border border-border shadow-lg whitespace-nowrap">
            {accountType === "personal" ? "Card cá nhân" : "Card doanh nghiệp"}
          </span>
          <button
            onClick={openMyCard}
            disabled={loadingCard}
            className="w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-50"
            aria-label="Xem danh thiếp của tôi"
          >
            <IdCard className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Sub-action: Scan QR */}
        <div
          className={`flex items-center gap-2.5 transition-all duration-200 origin-bottom-right ${
            expanded
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-4 scale-75 pointer-events-none"
          }`}
          style={{ transitionDelay: expanded ? "0ms" : "50ms" }}
        >
          <span className="bg-card/95 backdrop-blur text-sm font-medium px-3 py-1.5 rounded-full border border-border shadow-lg whitespace-nowrap">
            Quét mã QR
          </span>
          <button
            onClick={openScanner}
            className="w-12 h-12 rounded-full bg-card border border-border shadow-lg flex items-center justify-center hover:bg-accent transition-colors"
            aria-label="Quét mã QR"
          >
            <ScanLine className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {/* Main FAB */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            expanded
              ? "bg-foreground text-background rotate-45"
              : "bg-gradient-to-br from-primary to-rose-600 text-white hover:scale-105 hover:shadow-2xl"
          }`}
          aria-label={expanded ? "Đóng" : "Trao đổi danh thiếp"}
        >
          {expanded ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* Backdrop when expanded */}
      {expanded && <div className="fixed inset-0 z-[999]" onClick={() => setExpanded(false)} />}

      {/* Scanner dialog */}
      {showScanner && <QRScannerDialog onClose={() => setShowScanner(false)} />}

      {/* My Card modal */}
      {showCard && cardData && (
        <MyCardModal card={cardData} isOpen={showCard} onClose={() => setShowCard(false)} />
      )}
    </>
  );
}
