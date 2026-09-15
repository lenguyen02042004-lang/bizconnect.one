import { useState } from "react";
import {
  X,
  BookmarkPlus,
  Send,
  ExternalLink,
  CheckCircle2,
  Loader2,
  Globe,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { QuickSignupExchange } from "@/components/QuickSignupExchange";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export type ScannedPreview = {
  type: "business" | "personal";
  id: string;
  slug: string;
  name: string;
  logo_url?: string | null;
  avatar_url?: string | null;
  industry?: string | null;
  job_title?: string | null;
  company_name?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  province?: string | null;
};

interface PostScanSheetProps {
  preview: ScannedPreview;
  onClose: () => void;
  onSendCard?: () => void;
}

export function PostScanSheet({ preview, onClose, onSendCard }: PostScanSheetProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showQuickSignup, setShowQuickSignup] = useState(false);

  const profileUrl =
    preview.type === "business" ? `/business/${preview.slug}` : `/p/${preview.slug}`;

  const displayName = preview.name;
  const subtitle =
    preview.type === "business"
      ? preview.industry
      : [preview.job_title, preview.company_name].filter(Boolean).join(" · ");

  const saveContact = async () => {
    if (!user) {
      setShowQuickSignup(true);
      return;
    }
    setSaving(true);
    try {
      // saved_contacts table stores both business and personal cards
      // For personal cards, we store the name, slug, phone, email, avatar in same columns
      const base = {
        user_id: user.id,
        business_name: preview.name,
        business_slug: preview.slug,
        phone: preview.phone ?? null,
        email: preview.email ?? null,
        website: preview.type === "business" ? (preview.website ?? null) : null,
        logo_url:
          preview.type === "business" ? (preview.logo_url ?? null) : (preview.avatar_url ?? null),
        note: null,
      };

      const payload: Database["public"]["Tables"]["saved_contacts"]["Insert"] =
        preview.type === "business"
          ? { ...base, business_id: preview.id }
          : { ...base, personal_profile_id: preview.id };

      const { error } = await supabase.from("saved_contacts").upsert(payload, {
        onConflict:
          preview.type === "business" ? "user_id,business_id" : "user_id,personal_profile_id",
      });

      if (error) throw error;
      setSaved(true);
      toast.success(`Đã lưu "${displayName}" vào danh bạ!`);
    } catch (e: any) {
      toast.error(e.message ?? "Lỗi khi lưu danh bạ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1300]" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[1400] animate-in slide-in-from-bottom-full duration-300">
        <div className="bg-card border border-border rounded-t-3xl shadow-2xl max-w-md mx-auto overflow-hidden">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
              Đã quét thành công ✓
            </p>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-muted hover:bg-accent flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card preview */}
          <div className="px-5 pb-4">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-accent/60 to-accent/20 border border-border">
              {/* Avatar / Logo */}
              <div className="flex-shrink-0">
                {preview.type === "business" && preview.logo_url ? (
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-background border border-border shadow-sm">
                    <img
                      src={`https://wsrv.nl/?url=${encodeURIComponent(preview.logo_url)}&w=112&h=112&fit=cover`}
                      alt="Logo"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : preview.type === "personal" && preview.avatar_url ? (
                  <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/30">
                    <img
                      src={preview.avatar_url}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base leading-tight mb-0.5 truncate">{displayName}</h3>
                {subtitle && (
                  <p className="text-sm text-primary font-medium mb-2 truncate">{subtitle}</p>
                )}
                <div className="space-y-0.5">
                  {preview.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-primary" />
                      {preview.phone}
                    </p>
                  )}
                  {preview.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3 h-3 text-primary" />
                      <span className="truncate">{preview.email}</span>
                    </p>
                  )}
                  {preview.website && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-primary" />
                      <span className="truncate">
                        {preview.website.replace(/^https?:\/\//, "")}
                      </span>
                    </p>
                  )}
                  {(preview.address || preview.province) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-primary" />
                      {[preview.address, preview.province].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="px-5 pb-6 space-y-2.5">
            {/* Primary: Save to contacts */}
            <Button
              className="w-full h-12 gap-2 text-sm font-semibold rounded-xl"
              onClick={saveContact}
              disabled={saving || saved}
              variant={saved ? "outline" : "default"}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <BookmarkPlus className="w-4 h-4" />
              )}
              {saved ? "Đã lưu vào danh bạ" : saving ? "Đang lưu..." : "Lưu vào danh bạ"}
            </Button>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Send my card */}
              {onSendCard && (
                <Button
                  variant="outline"
                  className="h-11 gap-2 text-sm rounded-xl"
                  onClick={() => {
                    if (!user) setShowQuickSignup(true);
                    else onSendCard();
                  }}
                >
                  <Send className="w-4 h-4" /> Gửi card lại
                </Button>
              )}

              {/* View full profile */}
              <Link
                to={profileUrl as any}
                onClick={onClose}
                className={user && onSendCard ? "" : "col-span-2"}
              >
                <Button variant="outline" className="w-full h-11 gap-2 text-sm rounded-xl">
                  <ExternalLink className="w-4 h-4" /> Xem đầy đủ
                </Button>
              </Link>
            </div>

            {!user && (
              <p className="text-center text-xs text-muted-foreground pt-1">
                <Link to="/login" className="text-primary underline font-medium">
                  Đăng nhập
                </Link>{" "}
                để lưu danh bạ và gửi danh thiếp lại
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Quick Signup Modal */}
      {showQuickSignup && (
        <Dialog open={showQuickSignup} onOpenChange={setShowQuickSignup}>
          <DialogContent className="sm:max-w-md bg-card border-border z-[1500]">
            <QuickSignupExchange
              toId={preview.id}
              toType={preview.type}
              onSuccess={() => {
                setShowQuickSignup(false);
                setTimeout(() => window.location.reload(), 1500);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
