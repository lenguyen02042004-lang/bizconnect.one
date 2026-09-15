import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCount } from "@/lib/format";
import { Heart, Eye, MapPin, Loader2, Sparkles, ExternalLink, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/following")({
  component: FollowingPage,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      { title: "Doanh nghiệp tôi theo dõi — BizConnect.One" },
      {
        name: "description",
        content:
          "Quản lý danh sách doanh nghiệp bạn đang theo dõi trên BizConnect.One — cập nhật hoạt động, tin tức và liên hệ nhanh.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type FollowedBiz = {
  followId: string;
  followedAt: string;
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  short_intro: string | null;
  country_code: string | null;
  province: string | null;
  views_count: number;
  followers_count: number;
  icon_tier: "standard" | "premium";
  status: "draft" | "public";
};

function FollowingPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<FollowedBiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [unfollowing, setUnfollowing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    const { data, error } = await supabase
      .from("follows")
      .select(
        `
        id, created_at,
        business:businesses!inner (
          id, slug, name, logo_url, short_intro,
          country_code, province, views_count, followers_count,
          icon_tier, status
        )
      `,
      )
      .eq("follower_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const mapped: FollowedBiz[] = (data ?? [])
      .filter((r: any) => r.business)
      .map((r: any) => ({
        followId: r.id,
        followedAt: r.created_at,
        ...r.business,
      }));
    setItems(mapped);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleUnfollow = async (biz: FollowedBiz) => {
    setUnfollowing(biz.id);
    // Optimistic
    const prev = items;
    setItems((arr) => arr.filter((x) => x.id !== biz.id));
    const { error } = await supabase.from("follows").delete().eq("id", biz.followId);
    if (error) {
      setItems(prev);
      toast.error(error.message);
    } else {
      toast.success(`Đã bỏ theo dõi ${biz.name}`);
    }
    setUnfollowing(null);
  };

  return (
    <DashboardShell
      title="Doanh nghiệp tôi theo dõi"
      subtitle={loading ? "Đang tải..." : `${items.length} doanh nghiệp đang theo dõi`}
      maxWidth="5xl"
    >
      <>
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border bg-card/40">
            <Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="font-medium mb-1">Chưa theo dõi doanh nghiệp nào</p>
            <p className="text-sm text-muted-foreground mb-4">
              Khám phá và nhấn ❤ trên thẻ doanh nghiệp để theo dõi.
            </p>
            <Link to="/explore">
              <Button className="bg-gradient-vivid text-white border-0 shadow-pink">
                Khám phá ngay
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {items.map((b) => (
              <div
                key={b.followId}
                className="group rounded-2xl border border-border/60 bg-card p-4 hover:border-primary/40 hover:shadow-soft transition-smooth flex gap-3"
              >
                <Link
                  to="/business/$slug"
                  params={{ slug: b.slug }}
                  className={`shrink-0 ${b.icon_tier === "premium" ? "ring-premium" : ""}`}
                >
                  <img
                    src={b.logo_url ?? "/placeholder.svg"}
                    alt={b.name}
                    className="w-14 h-14 rounded-xl object-cover bg-muted"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-1.5 flex-wrap">
                    {b.icon_tier === "premium" && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 h-5 px-1.5 text-[10px]">
                        <Sparkles className="w-2.5 h-2.5" /> Premium
                      </Badge>
                    )}
                    {b.status === "draft" && (
                      <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                        Bản nháp
                      </Badge>
                    )}
                  </div>
                  <Link
                    to="/business/$slug"
                    params={{ slug: b.slug }}
                    className="font-semibold text-sm truncate block hover:text-primary transition-smooth mt-0.5"
                  >
                    {b.name}
                  </Link>
                  {b.short_intro && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{b.short_intro}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
                    {(b.province || b.country_code) && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          {[b.province, b.country_code].filter(Boolean).join(", ")}
                        </span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatCount(b.views_count)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3" />
                      {formatCount(b.followers_count)}
                    </span>
                  </div>
                  <div className="flex gap-1.5 mt-2.5">
                    <Link to="/business/$slug" params={{ slug: b.slug }} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full gap-1 h-8 text-xs">
                        <ExternalLink className="w-3 h-3" /> Xem
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleUnfollow(b)}
                      disabled={unfollowing === b.id}
                      className="gap-1 h-8 text-xs text-muted-foreground hover:text-destructive"
                    >
                      {unfollowing === b.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Heart className="w-3 h-3 fill-current" />
                      )}
                      Bỏ theo dõi
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="mt-8 text-center">
            <Link to="/explore">
              <Button variant="outline" className="gap-2">
                <Building2 className="w-4 h-4" /> Khám phá thêm doanh nghiệp
              </Button>
            </Link>
          </div>
        )}
      </>
    </DashboardShell>
  );
}
