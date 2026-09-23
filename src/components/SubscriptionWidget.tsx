import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { getMySubscriptions } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  CreditCard,
  Crown,
  Sparkles,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";

const SUB_LABELS: Record<string, { label: string; icon: React.ComponentType<any>; color: string }> =
  {
    b2b_premium: { label: "B2B Premium", icon: Sparkles, color: "from-rose-500 to-pink-600" },
    icon_premium: { label: "Icon Premium", icon: Crown, color: "from-amber-500 to-orange-500" },
    contact_block_addon: {
      label: "Mở rộng danh bạ (+500)",
      icon: BookOpen,
      color: "from-blue-500 to-cyan-500",
    },
  };

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function SubscriptionWidget() {
  const getFn = useServerFn(getMySubscriptions);
  const [data, setData] = useState<Awaited<ReturnType<typeof getMySubscriptions>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () => {
      getFn()
        .then((res) => {
          if (active) setData(res);
        })
        .catch(() => {})
        .finally(() => {
          if (active) setLoading(false);
        });
    };

    load();

    const channel = supabase
      .channel("sub_widget_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, () =>
        load(),
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "message_quotas" }, () =>
        load(),
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [getFn]);

  if (loading)
    return (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-3" />
        <div className="h-3 w-60 bg-muted/60 rounded" />
      </div>
    );

  const activeSubs = (data?.subscriptions ?? []).filter((s) => {
    if (s.status !== "active") return false;
    if (!s.current_period_end) return true;
    return new Date(s.current_period_end) > new Date();
  });

  const wallet = data?.wallet;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Gói thành viên của bạn</h3>
        </div>
        <Link to="/pricing">
          <Button size="sm" variant="outline" className="gap-1 text-xs">
            <Sparkles className="w-3 h-3" /> Nâng cấp
          </Button>
        </Link>
      </div>

      {activeSubs.length === 0 ? (
        <div className="rounded-xl bg-muted/50 p-4 text-center">
          <p className="text-sm font-medium mb-1">📦 Đang dùng gói Miễn phí</p>
          <p className="text-xs text-muted-foreground mb-3">
            200 lượt gửi danh thiếp/năm · Lưu tối đa {wallet ? wallet.max_saved_allowed : 200} liên
            hệ
          </p>
          <Link to="/pricing">
            <Button size="sm" className="bg-gradient-vivid text-white border-0 gap-1.5">
              <Sparkles className="w-3 h-3" /> Xem các gói Nâng cấp
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {activeSubs.map((s) => {
            const info = SUB_LABELS[s.sub_type] ?? {
              label: s.sub_type,
              icon: CreditCard,
              color: "from-gray-500 to-slate-500",
            };
            const days = daysLeft(s.current_period_end);
            const urgent = days !== null && days <= 30;
            return (
              <div
                key={s.id}
                className={`rounded-xl p-3 flex items-center gap-3 bg-gradient-to-r ${info.color} text-white`}
              >
                <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                  <info.icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{info.label}</p>
                  {s.businesses && (
                    <p className="text-xs text-white/80 truncate">📍 {s.businesses.name}</p>
                  )}
                  {s.current_period_end && (
                    <p
                      className={`text-xs flex items-center gap-1 mt-0.5 ${urgent ? "text-yellow-200 font-semibold" : "text-white/70"}`}
                    >
                      {urgent ? (
                        <AlertTriangle className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      Hết hạn: {new Date(s.current_period_end).toLocaleDateString("vi-VN")}
                      {days !== null && ` (còn ${days} ngày)`}
                    </p>
                  )}
                </div>
                <CheckCircle2 className="w-5 h-5 text-white/80 flex-shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Wallet / Contact limits */}
      {wallet && (
        <div className="rounded-xl bg-muted/50 p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Ví Danh bạ
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm">Đã lưu</span>
            <span className="font-semibold text-sm">
              {wallet.current_saved_count} / {wallet.max_saved_allowed}
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all"
              style={{
                width: `${Math.min(100, (wallet.current_saved_count / wallet.max_saved_allowed) * 100)}%`,
              }}
            />
          </div>
          {wallet.blocks_purchased > 0 && (
            <p className="text-xs text-muted-foreground">
              ✅ {wallet.blocks_purchased} gói mở rộng đã mua (+{wallet.blocks_purchased * 500} danh
              bạ)
            </p>
          )}
          {wallet.current_saved_count >= wallet.max_saved_allowed * 0.8 && (
            <p className="text-xs text-amber-600 font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Gần đầy — mua thêm gói mở rộng danh bạ
            </p>
          )}
        </div>
      )}
    </div>
  );
}
