import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/ImageUpload";
import { supabase } from "@/integrations/supabase/client";
import { getMyPersonalProfile, upsertMyPersonalProfile, type PersonalProfile } from "@/lib/personal-card";
import { SubscriptionWidget } from "@/components/SubscriptionWidget";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Loader2, Save, Eye, Printer, Share2, Copy } from "lucide-react";

export const Route = createFileRoute("/me")({
  component: MePage,
  head: () => ({
    meta: [
      { title: "Danh thiếp cá nhân — BizConnect.One" },
      { name: "description", content: "Tạo và quản lý danh thiếp cá nhân với mã QR riêng, chia sẻ một chạm tại triển lãm." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

const EMPTY = { full_name: "", job_title: "", company_name: "", phone: "", zalo: "", email: "", avatar_url: "", facebook_url: "", linkedin_url: "", is_public: true };

function MePage() {
  const [form, setForm] = useState(EMPTY);
  const [profile, setProfile] = useState<PersonalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [qr, setQr] = useState("");
  const [userId, setUserId] = useState("");
  const navigate = useNavigate();
  const { t } = useTranslation();

  const publicUrl = profile && typeof window !== "undefined" ? `https://bizconnect.one/p/${profile.slug}` : "";

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthed(false); setLoading(false); return; }
      
      const { data: prof } = await supabase.from("profiles").select("account_type").eq("id", user.id).single();
      if (prof?.account_type === "business") {
        navigate({ to: "/dashboard" });
        return;
      }

      setAuthed(true);
      setUserId(user.id);
      const p = await getMyPersonalProfile();
      if (p) {
        setProfile(p);
        setForm({
          full_name: p.full_name, job_title: p.job_title ?? "", company_name: p.company_name ?? "", phone: p.phone ?? "",
          zalo: p.zalo ?? "", email: p.email ?? "", avatar_url: p.avatar_url ?? "", facebook_url: p.facebook_url ?? "",
          linkedin_url: p.linkedin_url ?? "", is_public: p.is_public,
        });
      } else {
        setForm((f) => ({ ...f, email: user.email ?? "" }));
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!publicUrl) return;
    QRCode.toDataURL(`${publicUrl}?src=qr`, { margin: 1, width: 240, color: { dark: "#c8102e", light: "#ffffff" } }).then(setQr);
  }, [publicUrl]);

  const save = async () => {
    if (!form.full_name.trim()) { toast.error(t("me.errName")); return; }
    setSaving(true);
    const res = await upsertMyPersonalProfile(form);
    setSaving(false);
    if (!res.ok) { toast.error("message" in res ? res.message : t("me.errSave")); return; }
    setProfile(res.profile);
    toast.success(t("me.successSave"));
  };

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const copy = async () => { await navigator.clipboard.writeText(publicUrl); toast.success(t("me.successCopy")); };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({ title: form.full_name, url: publicUrl }); } catch {} } else copy();
  };

  return (
    <DashboardShell
      title={t("me.title")}
      subtitle={t("me.subtitle")}
      maxWidth="5xl"
      actions={
        <>
          {profile && (
            <>
              <Link to="/p/$slug" params={{ slug: profile.slug }}><Button variant="outline" size="sm" className="gap-1.5"><Eye className="w-4 h-4" /> {t("me.view")}</Button></Link>
              <Link to="/print/$type/$slug" params={{ type: "personal", slug: profile.slug }}><Button variant="outline" size="sm" className="gap-1.5"><Printer className="w-4 h-4" /> {t("me.print")}</Button></Link>
            </>
          )}
          <Button onClick={save} disabled={saving || loading} size="sm" className="gap-1.5 bg-gradient-vivid text-white border-0 shadow-pink">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {t("me.save")}
          </Button>
        </>
      }
    >
      {loading ? (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start animate-pulse">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-24 h-24 rounded-2xl bg-muted" />
              <div className="flex-1 grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 h-10 bg-muted rounded-md" />
                <div className="h-10 bg-muted rounded-md" />
                <div className="h-10 bg-muted rounded-md" />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="h-10 bg-muted rounded-md" />
              <div className="h-10 bg-muted rounded-md" />
              <div className="sm:col-span-2 h-10 bg-muted rounded-md" />
              <div className="h-10 bg-muted rounded-md" />
              <div className="h-10 bg-muted rounded-md" />
            </div>
          </div>
          <aside className="space-y-4">
            <div className="h-[280px] rounded-2xl bg-muted" />
            <div className="h-[180px] rounded-2xl bg-muted" />
          </aside>
        </div>
      ) : authed === false ? (
        <div className="text-center py-16"><Link to="/login"><Button>{t("me.login")}</Button></Link></div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="rounded-2xl border border-border bg-card p-6 space-y-8">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">1</div>
                {t("me.avatar")}
              </h2>
              <ImageUpload
                bucket="avatars"
                userId={userId}
                value={form.avatar_url || null}
                onChange={(url) => setForm({ ...form, avatar_url: url ?? "" })}
                label={t("me.uploadAvatar")}
                aspect="square"
                className="w-32"
              />
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">2</div>
                {t("me.personalInfo")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2"><Label>{t("me.fullName")}</Label><Input value={form.full_name} onChange={set("full_name")} className="h-11" placeholder={t("me.fullNamePlaceholder")} /></div>
                <div className="space-y-1.5"><Label>{t("me.jobTitle")}</Label><Input value={form.job_title} onChange={set("job_title")} className="h-11" placeholder={t("me.jobTitlePlaceholder")} /></div>
                <div className="space-y-1.5"><Label>{t("me.company")}</Label><Input value={form.company_name} onChange={set("company_name")} className="h-11" placeholder={t("me.companyPlaceholder")} /></div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">3</div>
                {t("me.contactInfo")}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>{t("me.phone")}</Label><Input value={form.phone} onChange={set("phone")} inputMode="tel" className="h-11" placeholder="09xxxx" /></div>
                <div className="space-y-1.5"><Label>{t("me.zalo")}</Label><Input value={form.zalo} onChange={set("zalo")} className="h-11" placeholder={t("me.zaloPlaceholder")} /></div>
                <div className="space-y-1.5 sm:col-span-2"><Label>{t("me.email")}</Label><Input value={form.email} onChange={set("email")} type="email" className="h-11" placeholder="email@example.com" /></div>
                <div className="space-y-1.5"><Label>{t("me.facebook")}</Label><Input value={form.facebook_url} onChange={set("facebook_url")} className="h-11" placeholder="https://facebook.com/…" /></div>
                <div className="space-y-1.5"><Label>{t("me.linkedin")}</Label><Input value={form.linkedin_url} onChange={set("linkedin_url")} className="h-11" placeholder="https://linkedin.com/in/…" /></div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div>
                <p className="text-sm font-semibold">{t("me.status")}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t("me.statusDesc")}</p>
              </div>
              <Switch checked={form.is_public} onCheckedChange={(v) => setForm({ ...form, is_public: v })} />
            </div>
          </div>

          <aside className="space-y-6 flex-col-reverse flex lg:flex-col">
            <SubscriptionWidget />
            
            <div className="rounded-[2rem] overflow-hidden border border-border bg-card/50 shadow-2xl relative">
              {/* Glassmorphism Header */}
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-vivid opacity-90" />
              <div className="absolute top-0 left-0 right-0 h-32 bg-white/10 backdrop-blur-md" />
              
              <div className="relative pt-12 pb-6 px-6 flex flex-col items-center text-center">
                {form.avatar_url ? (
                  <img src={form.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg z-10" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted border-4 border-background shadow-lg flex items-center justify-center text-3xl font-bold text-muted-foreground z-10">
                    {(form.full_name || "?").slice(0, 1)}
                  </div>
                )}
                
                <div className="mt-4 w-full">
                  <p className="font-bold text-xl leading-tight truncate text-foreground">{form.full_name || t("me.defaultName")}</p>
                  <p className="text-sm text-muted-foreground truncate mt-1">
                    {[form.job_title, form.company_name].filter(Boolean).join(" tại ") || t("me.defaultJob")}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 text-center">
                {qr ? (
                  <div className="bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-white/20 shadow-inner">
                    <img src={qr} alt="QR danh thiếp cá nhân" className="w-48 h-48 mx-auto rounded-xl bg-white p-2 border border-border/50" />
                    <p className="text-[11px] text-muted-foreground mt-3 break-all font-medium">{publicUrl.replace(/^https?:\/\//, "")}</p>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-10 rounded-xl" onClick={copy}>
                        <Copy className="w-4 h-4" /> {t("me.copy")}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-1.5 h-10 rounded-xl" onClick={share}>
                        <Share2 className="w-4 h-4" /> {t("me.share")}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/30 p-8 rounded-2xl border border-dashed border-border/50">
                    <p className="text-sm text-muted-foreground">{t("me.saveQR")}</p>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      )}
    </DashboardShell>
  );
}
