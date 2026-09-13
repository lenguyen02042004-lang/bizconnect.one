import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Sparkles, Mail, Eye, Send, Plus, Pencil, Globe2, Loader2, MapPin,
  Heart, Inbox, ArrowRight, Users, Share2, Copy, CheckCircle2, BookOpen, BarChart3,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DashboardShell, DEMO_OWNER_PREFIX } from "@/components/DashboardShell";
import { SubscriptionWidget } from "@/components/SubscriptionWidget";
import { getMyQuota, getInbox } from "@/lib/messaging.functions";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Bảng điều khiển — BizConnect.One" }] }),
});

type Biz = {
  id: string; slug: string; name: string; logo_url: string | null;
  status: "draft" | "public"; icon_tier: "standard" | "premium";
  country_code: string | null; province: string | null;
  views_count: number; followers_count: number;
};

type Stats = { unread: number; used: number; limit: number; contacts: number; following: number; tier: "free" | "b2b_premium"; };

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ display_name: string | null; email: string | null; account_type?: string } | null>(null);
  const [businesses, setBusinesses] = useState<Biz[]>([]);
  const [loadingBiz, setLoadingBiz] = useState(true);
  const [stats, setStats] = useState<Stats>({ unread: 0, used: 0, limit: 100, contacts: 0, following: 0, tier: "free" });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const [{ data: prof }, { data: bizes }, { count: contactsCount }, { count: followingCount }, myQuotaRes, inboxRes] =
        await Promise.all([
          supabase.from("profiles").select("display_name, email, account_type").eq("id", user.id).single(),
          supabase.from("businesses")
            .select("id, slug, name, logo_url, status, icon_tier, country_code, province, views_count, followers_count")
            .eq("owner_id", user.id)
            .order("created_at", { ascending: false }),
          supabase.from("saved_contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
          getMyQuota(),
          getInbox({}),
        ]);
      if (cancelled) return;
      
      if ((prof as any)?.account_type === "personal") {
        navigate({ to: "/me" });
        return;
      }
      setProfile(prof as any);
      
      // Hide system-seeded demo businesses from the user's own dashboard
      const list = ((bizes ?? []) as Biz[]).filter((b) => !b.id.startsWith(DEMO_OWNER_PREFIX));
      setBusinesses(list);
      setLoadingBiz(false);
      
      const unread = inboxRes?.messages?.filter((m: any) => !m.read_at).length ?? 0;
      const quota = myQuotaRes as any;

      setStats({
        unread,
        used: quota?.used_count ?? 0,
        limit: quota?.limit ?? 100,
        tier: (quota?.limit ?? 100) > 100 ? "b2b_premium" : "free",
        contacts: contactsCount ?? 0,
        following: followingCount ?? 0,
      });
    })();
    return () => { cancelled = true; };
  }, [user, navigate]);
  const totalViews = useMemo(() => businesses.reduce((s, b) => s + (b.views_count ?? 0), 0), [businesses]);
  const totalFollowers = useMemo(() => businesses.reduce((s, b) => s + (b.followers_count ?? 0), 0), [businesses]);
  const publicBiz = businesses.find((b) => b.status === "public");

  const shareLink = async (slug: string) => {
    const url = `${window.location.origin}/business/${slug}`;
    try {
      if (navigator.share) await navigator.share({ url, title: "Danh thiếp doanh nghiệp" });
      else { await navigator.clipboard.writeText(url); toast.success("Đã sao chép liên kết"); }
    } catch { /* user cancelled */ }
  };

  const copyLink = async (slug: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}/business/${slug}`);
    toast.success("Đã sao chép liên kết");
  };

  return (
    <DashboardShell
      title={`Xin chào, ${profile?.display_name ?? user?.email?.split("@")[0] ?? ""} 👋`}
      subtitle="Quản lý danh thiếp, kết nối và hoạt động doanh nghiệp của bạn."
      actions={
        businesses.length === 0 ? (
          <Link to="/business/edit">
            <Button size="sm" className="gap-1.5 bg-gradient-vivid text-white border-0 shadow-pink">
              <Plus className="w-4 h-4" /> Tạo danh thiếp
            </Button>
          </Link>
        ) : null
      }
    >
      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <KpiCard icon={Eye} label="Lượt xem" value={totalViews.toLocaleString()} accent="from-rose-600 to-red-500" />
        <KpiCard icon={Users} label="Người theo dõi" value={totalFollowers.toLocaleString()} accent="from-pink-600 to-rose-500" />
        <KpiCard icon={Send} label={stats.tier === "b2b_premium" ? "Danh thiếp đã gửi (B2B)" : "Danh thiếp đã gửi (Free)"} value={`${stats.used} / ${stats.limit || 200}`} accent="from-orange-500 to-rose-500" highlight={stats.used >= stats.limit * 0.8} />
        <KpiCard icon={Mail} label="Lời ngỏ chưa đọc" value={stats.unread.toLocaleString()} accent="from-red-700 to-rose-500" highlight={stats.unread > 0} />
      </div>

      {/* Shortcuts */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-10">
        <ShortcutCard to="/inbox" icon={Inbox} title="Hộp thư"
          description={stats.unread > 0 ? `${stats.unread} lời ngỏ chưa đọc` : "Không có lời ngỏ mới"}
          badge={stats.unread > 0 ? stats.unread : undefined} />
        <ShortcutCard to="/contacts" icon={BookOpen} title="Danh bạ"
          description={`${stats.contacts} liên hệ đã lưu`} />
        <ShortcutCard to="/following" icon={Heart} title="Đang theo dõi"
          description={`${stats.following} doanh nghiệp`} />
        <ShortcutCard to="/business/stats" icon={BarChart3} title="Thống kê"
          description="Hiệu suất theo thời gian" />
      </div>

      {publicBiz && (
        <div className="mb-8 rounded-2xl border border-border bg-gradient-to-br from-card to-accent/40 p-5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Liên kết danh thiếp của bạn</p>
              <p className="text-xs text-muted-foreground truncate">/business/{publicBiz.slug}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => copyLink(publicBiz.slug)} className="gap-1.5">
              <Copy className="w-3.5 h-3.5" /> Sao chép
            </Button>
            <Button size="sm" onClick={() => shareLink(publicBiz.slug)} className="gap-1.5 bg-gradient-vivid text-white border-0">
              <Share2 className="w-3.5 h-3.5" /> Chia sẻ
            </Button>
          </div>
        </div>
      )}

      {/* Upgrade banner for free users */}
      {stats.tier === "free" && businesses.length > 0 && (
        <div className="mb-6 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-rose-500/5 p-4 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">🚀 Mua thêm Block Giao thương (Block 500) — <span className="text-primary">$5/năm</span></p>
            <p className="text-xs text-muted-foreground mt-0.5">Tài khoản Free chỉ có 200 lượt gửi/năm. Mua thêm block 500 để mở rộng ngay lập tức giới hạn gửi và lưu danh bạ.</p>
          </div>
          <Link to="/pricing">
            <Button size="sm" className="bg-gradient-vivid text-white border-0 gap-1.5 flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5" /> Nâng cấp ngay
            </Button>
          </Link>
        </div>
      )}

      {/* Subscription tracker */}
      {businesses.length > 0 && <SubscriptionWidget />}

      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold">Doanh nghiệp của bạn</h2>
        {businesses.length > 0 && (
          <Link to="/business/edit" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Thêm mới
          </Link>
        )}
      </div>

      {loadingBiz ? (
        <div className="py-12 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : businesses.length === 0 ? (
        <div className="relative overflow-hidden bg-gradient-vivid rounded-3xl p-8 text-white shadow-glow">
          <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative">
            <Sparkles className="w-8 h-8 mb-3" />
            <h2 className="text-2xl font-bold mb-2">Tạo danh thiếp doanh nghiệp đầu tiên</h2>
            <p className="opacity-90 mb-5 max-w-lg">
              Đưa doanh nghiệp lên bản đồ thế giới chỉ trong 2 phút.
            </p>
            <Link to="/business/edit">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2">
                Bắt đầu tạo <Sparkles className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {businesses.map((b) => (
            <div key={b.id} className="bg-card border border-border rounded-2xl p-4 shadow-card hover:shadow-pink/20 hover:border-primary/30 transition-smooth">
              <div className="flex gap-3 items-start">
                <div className={b.icon_tier === "premium" ? "ring-premium flex-shrink-0" : "flex-shrink-0"}>
                  {b.logo_url ? (
                    <img src={b.logo_url} alt={b.name} className="w-14 h-14 rounded-full bg-white object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                      <Globe2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold truncate">{b.name}</h3>
                    <Badge variant={b.status === "public" ? "default" : "secondary"} className={b.status === "public" ? "bg-primary text-primary-foreground border-0 gap-1" : ""}>
                      {b.status === "public" ? <><CheckCircle2 className="w-3 h-3" /> Công khai</> : "Bản nháp"}
                    </Badge>
                  </div>
                  {(b.country_code || b.province) && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{[b.province, b.country_code].filter(Boolean).join(", ")}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {b.views_count}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {b.followers_count}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-border">
                <Link to="/business/edit" search={{ id: b.id }}>
                  <Button size="sm" variant="outline" className="gap-1"><Pencil className="w-3 h-3" /> Sửa</Button>
                </Link>
                {b.status === "public" && (
                  <>
                    <Link to="/business/$slug" params={{ slug: b.slug }}>
                      <Button size="sm" variant="ghost" className="gap-1"><Eye className="w-3 h-3" /> Xem</Button>
                    </Link>
                    <Button size="sm" variant="ghost" onClick={() => shareLink(b.slug)} className="gap-1">
                      <Share2 className="w-3 h-3" /> Chia sẻ
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}

function KpiCard({ icon: Icon, label, value, accent, highlight }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; accent: string; highlight?: boolean;
}) {
  return (
    <div className={`bg-card border rounded-2xl p-4 shadow-card transition-smooth ${highlight ? "border-primary/50 ring-1 ring-primary/20" : "border-border"}`}>
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center text-white mb-2 shadow-sm`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl sm:text-2xl font-bold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function ShortcutCard({ to, icon: Icon, title, description, badge }: {
  to: "/inbox" | "/contacts" | "/following" | "/business/stats";
  icon: React.ComponentType<{ className?: string }>;
  title: string; description: string; badge?: number;
}) {
  return (
    <Link to={to} className="group bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:shadow-card transition-smooth flex items-center gap-3">
      <div className="relative w-10 h-10 rounded-xl bg-accent/60 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-smooth flex-shrink-0">
        <Icon className="w-5 h-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-card">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-smooth" />
    </Link>
  );
}
