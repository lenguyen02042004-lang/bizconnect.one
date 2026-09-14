import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { getPersonalBySlug } from "@/lib/personal-public.functions";
import {
  Phone, Mail, MessageCircle, Download, Share2, Printer, Send,
  BookmarkPlus, CheckCircle2, Loader2, Briefcase, Building2,
  Globe, Copy, QrCode, ExternalLink, Facebook, Linkedin,
} from "lucide-react";
import { toast } from "sonner";
import { SendCardDialog } from "@/components/SendCardDialog";
import { QuickSignupExchange } from "@/components/QuickSignupExchange";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const { profile } = await getPersonalBySlug({ data: { slug: params.slug } });
    if (!profile) throw notFound();
    return { profile };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.profile;
    const title = p
      ? `${p.full_name}${p.job_title ? ` — ${p.job_title}` : ""} | Danh thiếp cá nhân`
      : "Danh thiếp cá nhân";
    const desc = p
      ? `Danh thiếp online của ${p.full_name}${p.company_name ? ` tại ${p.company_name}` : ""}. Lưu liên hệ, gọi, nhắn Zalo chỉ với một chạm.`
      : "Danh thiếp cá nhân online.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: p?.avatar_url ?? "" },
        { property: "og:type", content: "profile" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  component: PublicPersonalCard,
});

function esc(v: string) {
  return (v ?? "").replace(/\\/g, "\\\\").replace(/,/g, "\\,").replace(/;/g, "\\;").replace(/\n/g, "\\n");
}

function PublicPersonalCard() {
  const { profile } = Route.useLoaderData();
  const { slug } = Route.useParams();
  const [qr, setQr] = useState("");
  const [showSend, setShowSend] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showQuickSignup, setShowQuickSignup] = useState(false);
  const { user } = useAuth();

  const url = typeof window !== "undefined" ? `${window.location.origin}/p/${slug}` : "";

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(`${url}?src=qr`, {
      margin: 1,
      width: 280,
      color: { dark: "#c8102e", light: "#ffffff" },
    }).then(setQr);
  }, [url]);

  const saveVcf = () => {
    const lines = [
      "BEGIN:VCARD", "VERSION:3.0",
      `FN:${esc(profile.full_name)}`,
      profile.company_name ? `ORG:${esc(profile.company_name)}` : "",
      profile.job_title ? `TITLE:${esc(profile.job_title)}` : "",
      profile.phone ? `TEL;TYPE=CELL:${esc(profile.phone)}` : "",
      profile.email ? `EMAIL:${esc(profile.email)}` : "",
      url ? `URL:${esc(url)}` : "",
      "END:VCARD",
    ].filter(Boolean).join("\r\n");
    const blob = new Blob([lines], { type: "text/vcard;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${slug}.vcf`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: profile.full_name, url }); return; } catch { /* cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Đã sao chép liên kết");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Đã sao chép liên kết!");
  };

  const zalo = (profile.zalo || profile.phone || "").replace(/\D/g, "");

  const saveContact = async () => {
    if (!user) { setShowQuickSignup(true); return; }
    if (saving) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("saved_contacts").upsert({
        user_id: user.id,
        business_id: null,
        business_name: profile.full_name,
        business_slug: profile.slug,
        phone: profile.phone ?? null,
        email: profile.email ?? null,
        website: null,
        logo_url: profile.avatar_url ?? null,
        note: null,
        personal_profile_id: profile.id,
      }, { onConflict: profile.id ? "user_id,personal_profile_id" : "user_id,business_id" });
      if (error) throw error;
      setSaved(true);
      toast.success(`Đã lưu "${profile.full_name}" vào danh bạ!`);
    } catch (e: any) {
      toast.error(e.message ?? "Lỗi khi lưu danh bạ");
    } finally { setSaving(false); }
  };

  const hasSocials = profile.facebook_url || profile.linkedin_url;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed top-0 left-0 w-[600px] h-[600px] bg-rose-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-pink-600/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <Navbar />

      <main className="relative pt-20 pb-20 px-4 z-10">
        <article className="max-w-sm mx-auto">

          {/* ===== CARD ===== */}
          <div className="rounded-[2rem] overflow-hidden border border-border/30 bg-card shadow-2xl">

            {/* Hero */}
            <div className="relative overflow-hidden">
              {/* Gradient header */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#c8102e] via-[#a01028] to-[#6b0a1a]" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15)_0%,_transparent_60%)]" />

              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-6 -left-6 w-28 h-28 bg-rose-300/20 rounded-full blur-xl" />

              <div className="relative z-10 pt-8 pb-6 px-6 flex flex-col items-center text-center">
                {/* Avatar */}
                <div className="relative mb-4">
                  {profile.avatar_url ? (
                    <div className="relative">
                      <div className="w-28 h-28 rounded-full ring-4 ring-white/30 shadow-2xl overflow-hidden">
                        <img
                          src={profile.avatar_url}
                          alt={`${profile.full_name}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="absolute inset-0 rounded-full ring-2 ring-white/20 ring-offset-4 ring-offset-transparent" />
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-full ring-4 ring-white/30 shadow-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl font-bold text-white">
                      {profile.full_name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name & role */}
                <h1 className="text-2xl font-display font-bold text-white leading-tight tracking-tight mb-1">
                  {profile.full_name}
                </h1>
                {profile.job_title && (
                  <p className="text-sm font-semibold text-white/90 mb-1">{profile.job_title}</p>
                )}
                {profile.company_name && (
                  <div className="flex items-center gap-1.5 text-sm text-white/75">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{profile.company_name}</span>
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  {profile.job_title && (
                    <Badge className="bg-white/15 text-white border-white/20 text-xs backdrop-blur">
                      <Briefcase className="w-3 h-3 mr-1" /> {profile.job_title}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* ===== CONTACT ACTIONS ===== */}
            <div className="px-5 py-5 space-y-2.5 border-b border-border/30">

              {profile.phone && (
                <a href={`tel:${profile.phone}`}
                  className="flex items-center gap-3.5 p-4 rounded-2xl bg-accent/50 hover:bg-primary/5 hover:border-primary/30 border border-transparent transition-all duration-200 group">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Điện thoại</p>
                    <p className="font-bold text-sm">{profile.phone}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}

              {profile.email && (
                <a href={`mailto:${profile.email}`}
                  className="flex items-center gap-3.5 p-4 rounded-2xl bg-accent/50 hover:bg-primary/5 hover:border-primary/30 border border-transparent transition-all duration-200 group">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Email</p>
                    <p className="font-bold text-sm truncate">{profile.email}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}

              {zalo && (
                <a href={`https://zalo.me/${zalo}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3.5 p-4 rounded-2xl bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 hover:border-blue-500/30 transition-all duration-200 group">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:bg-blue-500/20 transition-colors">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Zalo</p>
                    <p className="font-bold text-sm text-blue-700 dark:text-blue-400">Chat Zalo ngay</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-blue-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              )}

              {/* Social links */}
              {hasSocials && (
                <div className="flex gap-2.5 pt-1">
                  {profile.facebook_url && (
                    <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/10 hover:border-blue-600/30 text-blue-700 dark:text-blue-400 transition-all font-semibold text-sm">
                      <Facebook className="w-4 h-4" /> Facebook
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-2 h-12 rounded-2xl bg-sky-600/10 hover:bg-sky-600/20 border border-sky-600/10 hover:border-sky-600/30 text-sky-700 dark:text-sky-400 transition-all font-semibold text-sm">
                      <Linkedin className="w-4 h-4" /> LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* ===== QR CODE SECTION ===== */}
            <div className="px-5 py-5 border-b border-border/30 flex flex-col items-center">
              <div className="flex items-center gap-2 mb-4 self-start">
                <div className="w-1 h-4 rounded-full bg-gradient-vivid" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mã QR danh thiếp</p>
              </div>
              <div className="flex gap-5 items-center w-full">
                <div className="bg-white rounded-2xl p-3 shadow-md border border-gray-100 shrink-0">
                  {qr ? (
                    <img src={qr} alt="QR Code" className="w-32 h-32 rounded-xl" />
                  ) : (
                    <div className="w-32 h-32 rounded-xl bg-gray-50 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-foreground leading-snug">
                    Cho đối tác quét để xem & lưu danh thiếp
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Hoạt động ngay trên điện thoại, không cần cài app
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-primary font-mono bg-primary/5 rounded-lg px-2.5 py-1.5 border border-primary/10">
                    <Globe className="w-3 h-3 shrink-0" />
                    <span className="truncate">/p/{slug}</span>
                    <button onClick={copyLink} className="ml-auto shrink-0">
                      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ===== ACTION BUTTONS ===== */}
            <div className="px-5 py-5 space-y-2.5">

              {/* Save to contacts */}
              <Button
                onClick={saveContact}
                disabled={saving || saved}
                className={`w-full h-13 rounded-2xl gap-2 font-bold text-sm transition-all ${
                  saved
                    ? "bg-green-500/10 text-green-700 border-green-500/30 hover:bg-green-500/15"
                    : "bg-card border border-border hover:bg-accent text-foreground"
                }`}
                variant="outline"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                {saved ? "Đã lưu vào danh bạ" : saving ? "Đang lưu..." : "Lưu vào danh bạ"}
              </Button>

              {/* Send card */}
              <Button
                onClick={() => {
                  if (!user) setShowQuickSignup(true);
                  else setShowSend(true);
                }}
                className="w-full h-13 rounded-2xl bg-gradient-vivid text-white shadow-pink hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-bold text-sm border-0 gap-2"
              >
                <Send className="w-4 h-4" /> Gửi danh thiếp của tôi
              </Button>

              {/* Secondary actions */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={saveVcf}
                  variant="outline"
                  className="h-11 rounded-xl gap-1.5 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5 text-primary" /> VCF
                </Button>
                <Button
                  onClick={share}
                  variant="outline"
                  className="h-11 rounded-xl gap-1.5 text-xs font-semibold"
                >
                  <Share2 className="w-3.5 h-3.5 text-primary" /> Chia sẻ
                </Button>
                <Link to="/print/$type/$slug" params={{ type: "personal", slug }}>
                  <Button variant="outline" className="w-full h-11 rounded-xl gap-1.5 text-xs font-semibold">
                    <Printer className="w-3.5 h-3.5 text-primary" /> In thẻ
                  </Button>
                </Link>
              </div>
            </div>

            {/* ===== POWERED BY ===== */}
            <div className="px-5 pb-5 pt-1">
              <a href="/" className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-accent/30 hover:bg-accent/50 border border-border/30 transition-colors">
                <div className="w-5 h-5 rounded-md bg-gradient-vivid flex items-center justify-center">
                  <span className="text-[8px] font-black text-white">B</span>
                </div>
                <span className="text-xs text-muted-foreground font-medium">Powered by <strong className="text-foreground">BizConnect.One</strong></span>
                <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
              </a>
            </div>
          </div>

        </article>
      </main>

      {showSend && (
        <SendCardDialog
          toId={profile.user_id}
          toName={profile.full_name}
          toType="personal"
          onClose={() => setShowSend(false)}
        />
      )}

      {showQuickSignup && (
        <Dialog open={showQuickSignup} onOpenChange={setShowQuickSignup}>
          <DialogContent className="sm:max-w-md bg-card border-border">
            <QuickSignupExchange 
              toId={profile.user_id} 
              toType="personal" 
              onSuccess={() => {
                setShowQuickSignup(false);
                setTimeout(() => window.location.reload(), 1500);
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
