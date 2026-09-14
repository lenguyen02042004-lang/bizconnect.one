import { useEffect, useState } from "react";
import { createFileRoute, redirect, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import {
  Save, Sparkles, Loader2, ArrowLeft, ArrowRight,
  Building2, MapPin as MapPinIcon, Phone, Link2, Images, Award, FileText, CheckCircle2,
} from "lucide-react";
import { slugify } from "@/lib/upload";

// Wizard Components
import { businessFormSchema, BusinessFormValues } from "@/components/business/wizard/schema";
import { BasicInfoTab } from "@/components/business/wizard/BasicInfoTab";
import { AboutTab } from "@/components/business/wizard/AboutTab";
import { CertificationsTab } from "@/components/business/wizard/CertificationsTab";
import { LocationTab } from "@/components/business/wizard/LocationTab";
import { ContactTab } from "@/components/business/wizard/ContactTab";
import { SocialTab } from "@/components/business/wizard/SocialTab";
import { MediaTab } from "@/components/business/wizard/MediaTab";
import { ReviewTab } from "@/components/business/wizard/ReviewTab";

type SearchParams = { id?: string };

export const Route = createFileRoute("/business/edit")({
  component: EditBusinessPage,
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
});

type Industry = { id: string; name: string; slug: string };

const TABS = [
  { key: "basic", label: "Tổng quan", icon: Building2 },
  { key: "about", label: "Giới thiệu", icon: FileText },
  { key: "certifications", label: "Chứng nhận", icon: Award },
  { key: "location", label: "Địa chỉ", icon: MapPinIcon },
  { key: "contact", label: "Liên hệ", icon: Phone },
  { key: "social", label: "Mạng xã hội", icon: Link2 },
  { key: "media", label: "Hình ảnh", icon: Images },
  { key: "review", label: "Xuất bản", icon: CheckCircle2 },
] as const;

function EditBusinessPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useSearch({ from: "/business/edit" });

  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [tab, setTab] = useState<string>("basic");
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  const methods = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema) as any,
    defaultValues: {
      id: null, name: "", slug: "", short_intro: "", description: "", industry_id: null,
      logo_url: null, banner_url: null, address: "", province: null, country_code: null,
      lat: null, lng: null, phone: "", email: "", website: "", status: "draft",
      socials: {}, gallery: [], certifications: [],
    }
  });

  const { watch, reset, getValues } = methods;

  useEffect(() => {
    supabase.from("industries").select("id, name, slug").order("name").then(({ data }) => {
      if (data && data.length > 0) setIndustries(data);
    });
  }, []);

  // Initialization
  useEffect(() => {
    if (!user) return;
    (async () => {
      if (!id) {
        // If no ID, check if they already have a business
        const { data: existing } = await supabase.from("businesses").select("id").eq("owner_id", user.id).limit(1);
        if (existing && existing.length > 0) {
          navigate({ to: "/business/edit", search: { id: existing[0].id }, replace: true });
          return;
        }
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data: biz, error } = await supabase.from("businesses").select("*").eq("id", id).maybeSingle();
      if (error || !biz) {
        toast.error("Không tìm thấy doanh nghiệp hoặc bạn không có quyền");
        navigate({ to: "/dashboard" });
        return;
      }
      const [{ data: socials }, { data: gallery }] = await Promise.all([
        supabase.from("business_socials").select("platform, url").eq("business_id", id),
        supabase.from("business_gallery").select("image_url").eq("business_id", id).order("order_index"),
      ]);
      
      reset({
        id: biz.id,
        name: biz.name, slug: biz.slug,
        short_intro: biz.short_intro ?? "",
        description: (biz as any).description ?? "",
        industry_id: biz.industry_id,
        logo_url: biz.logo_url, banner_url: biz.banner_url,
        address: biz.address ?? "", province: biz.province, country_code: biz.country_code,
        lat: biz.lat, lng: biz.lng,
        phone: biz.phone ?? "", email: biz.email ?? "", website: biz.website ?? "",
        status: biz.status as "draft" | "public",
        socials: Object.fromEntries((socials ?? []).map((s) => [s.platform, s.url])),
        gallery: (gallery ?? []).map((g) => g.image_url),
        certifications: Array.isArray((biz as any).certifications) ? (biz as any).certifications : [],
      });
      setOwnerId(biz.owner_id);
      setLoading(false);
    })();
  }, [id, user, navigate, reset]);

  const save = async (publish: boolean, isAutoSave = false) => {
    const currentValues = getValues();
    if (!currentValues.name.trim()) return; 

    if (isAutoSave) setIsAutoSaving(true);
    else setSaving(true);

    const payload: any = {
      owner_id: ownerId ?? user!.id,
      name: currentValues.name.trim(),
      slug: currentValues.slug || slugify(currentValues.name),
      short_intro: currentValues.short_intro || null,
      description: currentValues.description || null,
      certifications: currentValues.certifications,
      industry_id: currentValues.industry_id && !currentValues.industry_id.startsWith("local-") ? currentValues.industry_id : null,
      logo_url: currentValues.logo_url, banner_url: currentValues.banner_url,
      address: currentValues.address || null, province: currentValues.province, country_code: currentValues.country_code,
      lat: currentValues.lat, lng: currentValues.lng,
      phone: currentValues.phone || null, email: currentValues.email || null, website: currentValues.website || null,
      status: publish ? "public" : currentValues.status,
    };

    let bizId = currentValues.id;
    let isNew = false;
    if (bizId) {
      const { error } = await supabase.from("businesses").update(payload).eq("id", bizId);
      if (error) { if (!isAutoSave) toast.error(error.message); setSaving(false); setIsAutoSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("businesses").insert(payload).select("id").single();
      if (error) { if (!isAutoSave) toast.error(error.message); setSaving(false); setIsAutoSaving(false); return; }
      bizId = data.id;
      isNew = true;
    }

    await supabase.from("business_socials").delete().eq("business_id", bizId);
    const socialRows = Object.entries(currentValues.socials)
      .filter(([, url]) => url.trim())
      .map(([platform, url]) => ({ business_id: bizId!, platform, url }));
    if (socialRows.length) await supabase.from("business_socials").insert(socialRows);

    await supabase.from("business_gallery").delete().eq("business_id", bizId);
    if (currentValues.gallery.length) {
      await supabase.from("business_gallery").insert(
        currentValues.gallery.map((image_url, order_index) => ({ business_id: bizId!, image_url, order_index })),
      );
    }

    setSaving(false);
    setTimeout(() => setIsAutoSaving(false), 500); // UI buffer for autosave spinner

    if (isNew) {
      reset({ ...currentValues, id: bizId });
      navigate({ search: { id: bizId } as any, replace: true });
    }
    
    if (!isAutoSave) {
      toast.success(publish ? "Đã xuất bản!" : "Đã lưu bản nháp");
      if (publish) navigate({ to: "/dashboard" });
      else if (!currentValues.id) navigate({ to: "/business/edit", search: { id: bizId! } });
    }
  };

  // Debounced auto-save using watch subscription
  useEffect(() => {
    if (loading || !user) return;
    const subscription = watch((value, { name, type }) => {
      if (type === "change" && value.name) {
        const timer = setTimeout(() => save(value.status === "public", true), 2000);
        return () => clearTimeout(timer);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, loading, user, save]);


  if (!user || loading) {
    return (
      <DashboardShell maxWidth="5xl">
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      </DashboardShell>
    );
  }

  const currentStatus = getValues("status");

  return (
    <DashboardShell
      maxWidth="5xl"
      title={getValues("id") ? "Chỉnh sửa danh thiếp" : "Tạo danh thiếp mới"}
      subtitle="Quản lý thông tin doanh nghiệp theo từng mục bên dưới."
      actions={
        <div className="flex items-center gap-2">
          {isAutoSaving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mr-2" />}
          <Badge variant={currentStatus === "public" ? "default" : "secondary"} className={currentStatus === "public" ? "bg-primary" : ""}>
            {currentStatus === "public" ? "Công khai" : "Bản nháp"}
          </Badge>
          <Button variant="outline" onClick={() => save(false)} disabled={saving} size="sm" className="gap-1.5">
            {saving && !isAutoSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Lưu nháp
          </Button>
          <Button onClick={() => save(true)} disabled={saving} size="sm" className="gap-1.5 bg-gradient-vivid text-white border-0 shadow-pink">
            {saving && !isAutoSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Xuất bản
          </Button>
        </div>
      }
    >
      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(() => save(true))}>
          <ProgressBar tab={tab} setTab={setTab} />

          <Tabs value={tab} onValueChange={setTab} className="space-y-5">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/60 p-1">
              {TABS.map((t, i) => {
                const Icon = t.icon;
                return (
                  <TabsTrigger key={t.key} value={t.key} className="gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
                    <span className="text-[10px] font-mono opacity-60">{i + 1}.</span>
                    <Icon className="w-3.5 h-3.5" /> <span className="text-xs sm:text-sm">{t.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            <div className="bg-card border border-border rounded-3xl p-5 sm:p-7 shadow-card">
              <TabsContent value="basic" className="mt-0">
                <BasicInfoTab industries={industries} userId={user.id} />
              </TabsContent>
              <TabsContent value="about" className="mt-0">
                <AboutTab />
              </TabsContent>
              <TabsContent value="certifications" className="mt-0">
                <CertificationsTab />
              </TabsContent>
              <TabsContent value="location" className="mt-0">
                <LocationTab />
              </TabsContent>
              <TabsContent value="contact" className="mt-0">
                <ContactTab />
              </TabsContent>
              <TabsContent value="social" className="mt-0">
                <SocialTab />
              </TabsContent>
              <TabsContent value="media" className="mt-0">
                <MediaTab userId={user.id} />
              </TabsContent>
              <TabsContent value="review" className="mt-0">
                <ReviewTab industries={industries} save={save} saving={saving && !isAutoSaving} />
              </TabsContent>

              <StepNav
                tab={tab} setTab={setTab}
                onPublish={() => save(true)}
                onSaveDraft={() => save(false)}
                saving={saving}
              />
            </div>
          </Tabs>
        </form>
      </FormProvider>
    </DashboardShell>
  );
}

function ProgressBar({ tab, setTab }: { tab: string; setTab: (v: string) => void }) {
  const idx = TABS.findIndex((t) => t.key === tab);
  const pct = Math.round(((idx + 1) / TABS.length) * 100);
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
        <span>Bước <span className="font-semibold text-foreground">{idx + 1}</span> / {TABS.length} · {TABS[idx]?.label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-gradient-vivid transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <div className="hidden md:flex items-center justify-between mt-2 gap-1">
        {TABS.map((t, i) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 h-1.5 rounded-full transition-smooth ${i <= idx ? "bg-primary" : "bg-muted"} hover:opacity-80`}
            title={`${i + 1}. ${t.label}`}
          />
        ))}
      </div>
    </div>
  );
}

function StepNav({
  tab, setTab, onPublish, onSaveDraft, saving,
}: { tab: string; setTab: (v: string) => void; onPublish: () => void; onSaveDraft: () => void; saving: boolean }) {
  const idx = TABS.findIndex((t) => t.key === tab);
  const prev = idx > 0 ? TABS[idx - 1] : null;
  const next = idx < TABS.length - 1 ? TABS[idx + 1] : null;
  const isLast = tab === "review";

  return (
    <div className="mt-6 pt-5 border-t border-border flex items-center justify-between gap-3 flex-wrap">
      <Button
        type="button" variant="outline" size="sm" className="gap-1.5"
        disabled={!prev}
        onClick={() => prev && setTab(prev.key)}
      >
        <ArrowLeft className="w-4 h-4" /> {prev ? prev.label : "Trước"}
      </Button>

      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onSaveDraft} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span className="hidden sm:inline">Lưu nháp & tiếp tục sau</span>
          <span className="sm:hidden">Lưu nháp</span>
        </Button>
        <p className="text-xs text-muted-foreground hidden md:block">
          Bước {idx + 1} / {TABS.length}
        </p>
      </div>

      {isLast ? (
        <Button type="button" size="sm" onClick={onPublish} disabled={saving} className="gap-1.5 bg-gradient-vivid text-white border-0 shadow-pink">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Xuất bản
        </Button>
      ) : (
        <Button
          type="button" size="sm" className="gap-1.5"
          onClick={() => next && setTab(next.key)}
        >
          {next?.label} <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
