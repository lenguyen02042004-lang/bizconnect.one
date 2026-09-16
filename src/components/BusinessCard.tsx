import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  MapPin,
  Phone,
  Mail,
  Globe,
  Eye,
  Share2,
  X,
  Sparkles,
  Send,
  BookmarkPlus,
  BookmarkCheck,
  Building2,
  Award,
  FileText,
  Lock,
  Handshake,
  Printer,
  ExternalLink,
  Users,
  QrCode,
  Copy,
  CheckCircle2,
  Factory,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SocialIconList } from "./SocialIconList";
import { SendCardDialog } from "./SendCardDialog";
import { PrintableQRModal } from "@/components/PrintableQRModal";
import { FollowButton } from "./FollowButton";
import { QuickSignupExchange } from "./QuickSignupExchange";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatCount } from "@/lib/format";
import type { BusinessProfile } from "@/types/business";
import { saveBusinessContact, isContactSaved } from "@/lib/contacts";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { maskPhone, maskEmail } from "@/lib/mask";
import { isConnectedTo } from "@/lib/connect";
import { useTranslation } from "react-i18next";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const viewedThisSession = new Set<string>();

interface Props {
  business: BusinessProfile;
  onClose?: () => void;
  mode?: "modal" | "inline";
}

export function BusinessCard({ business, onClose, mode = "modal" }: Props) {
  const [qrUrl, setQrUrl] = useState<string>("");
  const [showSend, setShowSend] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQuickSignup, setShowQuickSignup] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const profileUrl =
    typeof window !== "undefined" ? `https://bizconnect.one/business/${business.slug}` : "";

  const description = business.description || business.short_intro || "";
  const certifications = business.certifications || [];

  useEffect(() => {
    if (profileUrl) {
      QRCode.toDataURL(`${profileUrl}?src=qr`, {
        margin: 1,
        color: { dark: "#c8102e", light: "#ffffff" },
        width: 260,
      }).then(setQrUrl);
    }
  }, [profileUrl]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    isContactSaved(business.id).then(setSaved);
    isConnectedTo(business.id).then(setUnlocked);
  }, [business.id]);

  // Track view + QR scan (once per session per business)
  useEffect(() => {
    if (!UUID_RE.test(business.id)) return;
    if (viewedThisSession.has(business.id)) return;
    viewedThisSession.add(business.id);
    supabase.rpc("increment_business_views", { _id: business.id }).then(({ error }) => {
      if (error) viewedThisSession.delete(business.id);
    });
    if (typeof window !== "undefined") {
      const src = new URLSearchParams(window.location.search).get("src");
      if (src === "qr") {
        supabase.rpc("increment_business_qr_scans", { _id: business.id });
      }
    }
  }, [business.id]);

  const handleShare = async () => {
    if (UUID_RE.test(business.id)) {
      supabase.rpc("increment_business_shares", { _id: business.id });
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: business.name,
          text: business.short_intro,
          url: profileUrl,
        });
      } catch {}
    } else {
      await navigator.clipboard.writeText(profileUrl);
      toast.success(t("publicCard.copiedExclaim"));
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t("publicCard.copiedExclaim"));
  };

  const handleSaveContact = async () => {
    if (!user) {
      setShowQuickSignup(true);
      return;
    }
    if (saving) return;
    setSaving(true);
    const res = await saveBusinessContact(business);
    setSaving(false);
    console.error("SAVE RESULT:", res);
    if (!res.ok) {
      toast.error(res.message || t("businessCard.saveError"));
      return;
    }
    setSaved(true);
    toast.success(t("businessCard.saveSuccess"), {
      description: t("businessCard.saveSuccessDesc"),
      action: {
        label: t("businessCard.openContacts"),
        onClick: () => navigate({ to: "/contacts" }),
      },
    });
  };

  const isPremium = business.icon_tier === "premium";

  const innerContent = (
    <>
      <div
        className={
          mode === "modal"
            ? "relative w-full max-w-md md:max-w-2xl max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] rounded-2xl sm:rounded-3xl bg-card shadow-glow border border-border/40 flex flex-col overflow-hidden"
            : "relative w-full max-w-md md:max-w-2xl mx-auto rounded-2xl sm:rounded-3xl bg-card shadow-glow border border-border/40 flex flex-col overflow-hidden"
        }
      >
        {/* Close button */}
        {mode === "modal" && onClose && (
          <button
            onClick={onClose}
            aria-label={t("businessCard.close")}
            className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur text-white flex items-center justify-center hover:bg-black/70 transition-smooth"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* === HERO HEADER === */}
        <div className="relative shrink-0 overflow-hidden">
          {/* Background: banner or gradient */}
          {business.banner_url ? (
            <img
              src={business.banner_url || undefined}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#c8102e] via-[#9b0d23] to-[#5c0715]" />
          )}
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

          {/* Decorative orbs */}
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-rose-400/20 rounded-full blur-xl" />

          <div className="relative z-10 px-5 pt-6 pb-5">
            <div className="flex gap-4 items-start">
              {/* Logo */}
              <div className="shrink-0 relative">
                <div
                  className={`${isPremium ? "ring-2 ring-yellow-400 ring-offset-2 ring-offset-transparent" : ""} rounded-2xl shadow-2xl`}
                >
                  {business.logo_url ? (
                    <img
                      src={business.logo_url ? `https://wsrv.nl/?url=${encodeURIComponent(business.logo_url)}&w=160&h=160&fit=cover` : undefined}
                      alt={business.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/90 object-contain p-1"
                    />
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/20 backdrop-blur border-2 border-white/30 flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-white/80" />
                    </div>
                  )}
                </div>
                {isPremium && (
                  <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center shadow-lg">
                    <Star className="w-3.5 h-3.5 text-yellow-900 fill-yellow-900" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-white">
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {isPremium && (
                    <Badge className="bg-yellow-400/90 text-yellow-900 border-0 gap-1 h-5 px-2 text-[10px] font-bold">
                      <Sparkles className="w-2.5 h-2.5" /> Premium
                    </Badge>
                  )}
                  {business.industry && (
                    <Badge className="bg-white/15 text-white border-white/20 h-5 px-2 text-[10px] backdrop-blur">
                      <Factory className="w-2.5 h-2.5 mr-1" /> {business.industry}
                    </Badge>
                  )}
                  {business.country_name && (
                    <Badge className="bg-white/15 text-white border-white/20 h-5 px-2 text-[10px] backdrop-blur">
                      {business.country_name}
                    </Badge>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold leading-tight tracking-tight mb-1">
                  <a
                    href={profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-white/90 flex items-start gap-1.5 group"
                  >
                    <span>{business.name}</span>
                    <ExternalLink className="w-4 h-4 opacity-60 group-hover:opacity-100 mt-0.5 shrink-0" />
                  </a>
                </h1>

                {business.short_intro && (
                  <p className="text-sm text-white/80 line-clamp-2 leading-snug mb-2">
                    {business.short_intro}
                  </p>
                )}

                <div className="flex items-center gap-3 text-xs text-white/70 mb-3">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {t("businessCard.views", { count: formatCount(business.views_count || 0) })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {t("businessCard.followers", {
                      count: formatCount(business.followers_count || 0),
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2 relative z-20">
                  <FollowButton
                    businessId={business.id}
                    variant="full"
                    className="bg-white text-primary hover:bg-white/90 border-0 shadow-md h-8 text-xs font-semibold relative z-20"
                  />
                </div>
              </div>

              {/* QR Code desktop */}
              {qrUrl && (
                <button
                  onClick={() => setShowQR(true)}
                  title={t("businessCard.viewPrintQR")}
                  className="shrink-0 hidden sm:block group"
                >
                  <div className="w-20 h-20 rounded-xl bg-white p-1.5 shadow-xl hover:scale-105 transition-smooth relative">
                    <img
                      src={qrUrl || undefined}
                      alt={`QR ${business.name}`}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <QrCode className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* === BODY === */}
        <div className="flex-1 overflow-y-auto">
          {/* QR mobile strip */}
          {qrUrl && (
            <button
              onClick={() => setShowQR(true)}
              className="w-full sm:hidden flex items-center gap-3 px-4 py-3 bg-accent/30 border-b border-border/50 text-left hover:bg-accent/50 transition-colors"
            >
              <img
                src={qrUrl || undefined}
                alt="QR Code"
                loading="lazy"
                decoding="async"
                className="w-14 h-14 rounded-lg bg-white p-1 shadow-sm"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{t("businessCard.qrTitle")}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {profileUrl.replace(/^https?:\/\//, "")}
                </p>
              </div>
              <QrCode className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          )}

          <div className="px-4 sm:px-6 py-5 space-y-6">
            {/* Contact info cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Address */}
              {(business.address || business.province || business.country_name) && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-accent/40 border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      {t("businessCard.address")}
                    </p>
                    <p className="text-sm font-medium leading-snug">
                      {[business.address, business.province, business.country_name]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {business.phone &&
                (unlocked ? (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-accent/40 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Phone className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        {t("businessCard.phone")}
                      </p>
                      <p className="text-sm font-semibold text-primary">{business.phone}</p>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-accent/40 border border-border/50">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        {t("businessCard.phone")}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {maskPhone(business.phone)}
                      </p>
                    </div>
                  </div>
                ))}

              {/* Email */}
              {business.email &&
                (unlocked ? (
                  <a
                    href={`mailto:${business.email}`}
                    className="flex items-start gap-3 p-3.5 rounded-2xl bg-accent/40 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        {t("businessCard.email")}
                      </p>
                      <p className="text-sm font-medium truncate">{business.email}</p>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-accent/40 border border-border/50">
                    <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                        {t("businessCard.email")}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground truncate">
                        {maskEmail(business.email)}
                      </p>
                    </div>
                  </div>
                ))}

              {/* Website */}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3.5 rounded-2xl bg-accent/40 border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-colors group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Globe className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                      {t("businessCard.website")}
                    </p>
                    <p className="text-sm font-medium text-primary truncate">
                      {business.website.replace(/^https?:\/\//, "")}
                    </p>
                  </div>
                </a>
              )}
            </div>

            {/* Unlock contact CTA */}
            {!unlocked && (business.phone || business.email) && (
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-rose-500/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Handshake className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-0.5">{t("businessCard.unlockTitle")}</p>
                    <p className="text-xs text-muted-foreground mb-3">
                      {t("businessCard.unlockDesc")}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setShowSend(true)}
                      className="bg-gradient-vivid text-white border-0 shadow-pink gap-1.5"
                    >
                      <Handshake className="w-3.5 h-3.5" /> {t("businessCard.unlockBtn")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* About */}
            {description && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-gradient-vivid" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t("businessCard.about")}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line bg-accent/30 rounded-2xl p-4 border border-border/40">
                  {description}
                </p>
              </div>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-gradient-vivid" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t("businessCard.certifications")}
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {certifications.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-gradient-to-br from-accent/60 to-accent/20 border border-border/60"
                    >
                      <div className="text-2xl leading-none mt-0.5">{c.icon || "🏅"}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight">{c.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[c.issuer, c.year].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social links */}
            {business.socials && Object.keys(business.socials).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-gradient-vivid" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t("businessCard.socials")}
                  </p>
                </div>
                <SocialIconList socials={business.socials} size="sm" />
              </div>
            )}

            {/* Gallery */}
            {(business.gallery?.length || 0) > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-4 rounded-full bg-gradient-vivid" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t("businessCard.gallery")}
                  </p>
                </div>
                <div className="grid grid-cols-5 gap-1.5">
                  {business.gallery!.slice(0, 5).map((src, i) => (
                    <div
                      key={i}
                      className="aspect-square rounded-xl overflow-hidden bg-muted border border-border/40"
                    >
                      <img
                        src={src || undefined}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover hover:scale-110 transition-smooth"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Share link */}
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-accent/30 border border-border/40">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground truncate flex-1">
                {profileUrl.replace(/^https?:\/\//, "")}
              </p>
              <button
                onClick={handleCopyLink}
                className="shrink-0 text-primary hover:text-primary/80 transition-colors"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* === STICKY ACTION BAR === */}
        <div className="border-t border-border/40 bg-card/95 backdrop-blur px-3 sm:px-5 py-3 flex gap-1.5 sm:gap-2 shrink-0">
          <Button
            onClick={() => {
              if (!user) setShowQuickSignup(true);
              else setShowSend(true);
            }}
            className="flex-1 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink h-11 gap-1.5 font-semibold text-xs sm:text-sm px-2 sm:px-4"
          >
            <Send className="w-4 h-4 shrink-0" /> <span className="truncate">{t("businessCard.sendCard")}</span>
          </Button>
          <Button
            onClick={handleSaveContact}
            disabled={saving}
            variant={saved ? "default" : "outline"}
            className={`flex-1 h-11 px-2 sm:px-4 gap-1.5 font-semibold text-xs sm:text-sm ${saved ? "bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/20" : ""}`}
            title={saved ? t("businessCard.savedToContacts") : t("businessCard.saveToContacts")}
          >
            {saved ? <BookmarkCheck className="w-4 h-4 shrink-0" /> : <BookmarkPlus className="w-4 h-4 shrink-0" />}
            <span className="truncate">
              {saved ? t("businessCard.savedToContacts") || "Đã lưu" : t("businessCard.saveToContacts") || "Lưu danh bạ"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            onClick={handleShare}
            title={t("businessCard.shareTitle")}
          >
            <Share2 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11"
            title={t("businessCard.printTitle")}
            onClick={() =>
              navigate({
                to: "/print/$type/$slug",
                params: { type: "business", slug: business.slug },
              })
            }
          >
            <Printer className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showSend && (
        <SendCardDialog
          toId={business.id}
          toName={business.name}
          toType="business"
          onClose={() => setShowSend(false)}
        />
      )}

      {showQR && (
        <PrintableQRModal
          business={business}
          qrUrl={qrUrl}
          isOpen={showQR}
          onClose={() => setShowQR(false)}
        />
      )}

      {showQuickSignup && (
        <Dialog open={showQuickSignup} onOpenChange={setShowQuickSignup}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <QuickSignupExchange
              toId={business.id}
              toType="business"
              onSuccess={() => {
                setShowQuickSignup(false);
                // Also trigger saving the contact after signup
                setTimeout(() => window.location.reload(), 1500);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );

  return (
    <>
      {mode === "modal" ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 animate-fade-up">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          {innerContent}
        </div>
      ) : (
        innerContent
      )}
    </>
  );
}
