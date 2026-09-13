import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { X, Share2, Download, Printer, Sun, Moon, Globe, Phone, Mail, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";

export type CardData =
  | {
      type: "business";
      name: string;
      slug: string;
      logo_url?: string | null;
      industry?: string | null;
      phone?: string | null;
      email?: string | null;
      website?: string | null;
      address?: string | null;
      province?: string | null;
      country_code?: string | null;
      short_intro?: string | null;
    }
  | {
      type: "personal";
      full_name: string;
      slug: string;
      avatar_url?: string | null;
      job_title?: string | null;
      company_name?: string | null;
      phone?: string | null;
      email?: string | null;
      zalo?: string | null;
      facebook_url?: string | null;
      linkedin_url?: string | null;
    };

interface MyCardModalProps {
  card: CardData;
  isOpen: boolean;
  onClose: () => void;
}

export function MyCardModal({ card, isOpen, onClose }: MyCardModalProps) {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [qrUrl, setQrUrl] = useState("");

  const profileUrl =
    typeof window !== "undefined"
      ? card.type === "business"
        ? `${window.location.origin}/business/${card.slug}`
        : `${window.location.origin}/p/${card.slug}`
      : "";

  useEffect(() => {
    if (!profileUrl) return;
    const qrColor =
      theme === "dark"
        ? { dark: "#ffffff", light: "#1a0a14" }
        : { dark: "#c8102e", light: "#ffffff" };
    QRCode.toDataURL(`${profileUrl}?src=qr`, {
      margin: 1,
      width: 260,
      color: qrColor,
    }).then(setQrUrl);
  }, [profileUrl, theme]);

  const handleShare = async () => {
    const title =
      card.type === "business"
        ? `Danh thiếp doanh nghiệp: ${card.name}`
        : `Danh thiếp cá nhân: ${card.full_name}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, url: profileUrl });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Đã sao chép liên kết danh thiếp!");
      }
    } catch {
      /* user cancelled */
    }
  };

  const handleDownload = async () => {
    try {
      const { toPng } = await import("html-to-image");
      const el = document.getElementById("my-card-print-area");
      if (!el) return;
      toast.info("Đang tạo ảnh...");
      const dataUrl = await toPng(el, { pixelRatio: 3 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `bizcard_${card.slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã tải danh thiếp!");
    } catch {
      toast.error("Lỗi khi tải ảnh");
    }
  };

  const isDark = theme === "dark";
  const displayName =
    card.type === "business" ? card.name : card.full_name;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden border-0 shadow-2xl bg-transparent gap-0"
        style={{ zIndex: 1200 }}
      >
        {/* Theme toggle header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 bg-card/95 backdrop-blur border border-border rounded-t-2xl">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Danh thiếp của tôi
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-accent hover:bg-accent/80 transition-colors text-xs font-medium"
            >
              {isDark ? (
                <Sun className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
              {isDark ? "Sáng" : "Tối"}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Preview */}
        <div
          id="my-card-print-area"
          className={`relative overflow-hidden transition-all duration-500 ${
            isDark
              ? "bg-gradient-to-br from-[#1a0a14] via-[#2d1022] to-[#0f0812]"
              : "bg-white"
          }`}
        >
          {/* Decorative glow – dark mode only */}
          {isDark && (
            <>
              <div className="absolute top-0 right-0 w-48 h-48 bg-primary/25 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-36 h-36 bg-rose-700/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />
            </>
          )}

          <div className="relative p-6 flex flex-col items-center text-center">
            {/* Logo / Avatar */}
            <div className="mb-4">
              {card.type === "business" && card.logo_url ? (
                <div
                  className={`w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center shadow-lg ${
                    isDark ? "bg-white/10" : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <img
                    src={`https://wsrv.nl/?url=${encodeURIComponent(card.logo_url)}&w=128&h=128&fit=cover`}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : card.type === "personal" && card.avatar_url ? (
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/40 shadow-lg">
                  <img
                    src={card.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    crossOrigin="anonymous"
                  />
                </div>
              ) : (
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg ${
                    isDark
                      ? "bg-primary/20 text-primary"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name */}
            <h2
              className={`text-xl font-bold mb-0.5 font-display leading-tight ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {displayName}
            </h2>

            {/* Subtitle */}
            {card.type === "business" && card.industry && (
              <p className="text-xs font-bold tracking-widest uppercase mb-1 text-primary">
                {card.industry}
              </p>
            )}
            {card.type === "personal" &&
              (card.job_title || card.company_name) && (
                <p
                  className={`text-sm mb-0.5 ${
                    isDark ? "text-white/70" : "text-gray-600"
                  }`}
                >
                  {[card.job_title, card.company_name]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}

            {/* QR Code */}
            <div
              className={`my-4 p-3 rounded-2xl shadow-md ${
                isDark
                  ? "bg-white/5 ring-1 ring-white/10"
                  : "bg-gray-50 ring-1 ring-gray-200"
              }`}
            >
              {qrUrl ? (
                <img
                  src={qrUrl}
                  alt="QR Code"
                  className="w-44 h-44 object-contain rounded-xl"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Contact info */}
            <div
              className={`w-full space-y-2 text-sm border-t pt-4 mt-1 text-left ${
                isDark ? "border-white/10" : "border-gray-200"
              }`}
            >
              {card.phone && (
                <div
                  className={`flex items-center gap-2.5 ${
                    isDark ? "text-white/80" : "text-gray-700"
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{card.phone}</span>
                </div>
              )}
              {card.email && (
                <div
                  className={`flex items-center gap-2.5 ${
                    isDark ? "text-white/80" : "text-gray-700"
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">{card.email}</span>
                </div>
              )}
              {card.type === "business" && card.website && (
                <div
                  className={`flex items-center gap-2.5 ${
                    isDark ? "text-white/80" : "text-gray-700"
                  }`}
                >
                  <Globe className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="truncate">
                    {card.website.replace(/^https?:\/\//, "")}
                  </span>
                </div>
              )}
              {card.type === "business" &&
                (card.address || card.province) && (
                  <div
                    className={`flex items-center gap-2.5 ${
                      isDark ? "text-white/80" : "text-gray-700"
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>
                      {[card.address, card.province]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </div>
                )}
              {card.type === "personal" && card.company_name && (
                <div
                  className={`flex items-center gap-2.5 ${
                    isDark ? "text-white/80" : "text-gray-700"
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>{card.company_name}</span>
                </div>
              )}
            </div>

            {/* Brand tag */}
            <p
              className={`mt-4 text-[10px] font-mono font-semibold tracking-widest ${
                isDark ? "text-white/30" : "text-gray-300"
              }`}
            >
              BIZCONNECT.ONE
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 p-3 bg-card border border-t-0 border-border rounded-b-2xl">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 h-10"
            onClick={handleShare}
          >
            <Share2 className="w-3.5 h-3.5" /> Chia sẻ
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 h-10"
            onClick={handleDownload}
          >
            <Download className="w-3.5 h-3.5" /> Tải ảnh
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1.5 h-10 bg-primary text-white border-0 hover:bg-primary/90"
            onClick={() => window.print()}
          >
            <Printer className="w-3.5 h-3.5" /> In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
