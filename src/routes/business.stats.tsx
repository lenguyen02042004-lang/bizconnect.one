import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getMyBusinesses, getBusinessStats } from "@/lib/messaging.functions";
import { Eye, Send, Inbox, Users, ArrowDownLeft, ArrowUpRight, Loader2 } from "lucide-react";

export const Route = createFileRoute("/business/stats")({
  component: StatsPage,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [{ title: "Thống kê doanh nghiệp — BizConnect.One" }] }),
});

function StatsPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);

  const { data: mineData, isLoading: loadingMine } = useQuery({
    queryKey: ["my-businesses"],
    queryFn: () => getMyBusinesses(),
  });
  const businesses = mineData?.businesses ?? [];

  useEffect(() => {
    if (!businessId && businesses.length) setBusinessId(businesses[0].id);
  }, [businesses, businessId]);

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ["business-stats", businessId],
    queryFn: () => getBusinessStats({ data: { business_id: businessId! } }),
    enabled: !!businessId,
  });

  const maxDay = useMemo(
    () => Math.max(1, ...(stats?.timeline ?? []).map((d) => d.sent + d.received)),
    [stats],
  );

  return (
    <DashboardShell
      title="Thống kê doanh nghiệp"
      subtitle="Theo dõi lượt xem, gửi danh thiếp và lịch sử kết nối."
      actions={
        businesses.length > 1 ? (
          <Select value={businessId ?? ""} onValueChange={setBusinessId}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Chọn doanh nghiệp" />
            </SelectTrigger>
            <SelectContent>
              {businesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null
      }
    >
      <>
        {loadingMine || loadingStats ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : !businesses.length ? (
          <div className="bg-card border rounded-2xl p-8 text-center">
            <p className="text-muted-foreground mb-4">Bạn chưa có doanh nghiệp nào để thống kê.</p>
            <Link to="/business/edit">
              <Button>Tạo doanh nghiệp đầu tiên</Button>
            </Link>
          </div>
        ) : stats ? (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  icon: Eye,
                  label: "Lượt xem",
                  value: stats.business.views_count,
                  color: "from-red-700 to-red-500",
                },
                {
                  icon: Send,
                  label: "Card đã gửi",
                  value: stats.counts.sent,
                  color: "from-rose-700 to-red-500",
                },
                {
                  icon: Inbox,
                  label: "Card nhận",
                  value: stats.counts.received,
                  color: "from-red-800 to-rose-500",
                },
                {
                  icon: Users,
                  label: "Người theo dõi",
                  value: stats.business.followers_count,
                  color: "from-pink-700 to-red-500",
                },
              ].map((s, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-5 shadow-card">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-white mb-3`}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums">{s.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Timeline chart */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-8 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold">Hoạt động 30 ngày qua</h2>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-primary" /> Gửi
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-primary/30" /> Nhận
                  </span>
                </div>
              </div>
              <div className="flex items-end gap-1 h-40">
                {stats.timeline.map((d) => {
                  const total = d.sent + d.received;
                  const sentH = (d.sent / maxDay) * 100;
                  const recvH = (d.received / maxDay) * 100;
                  return (
                    <div
                      key={d.date}
                      className="flex-1 flex flex-col justify-end gap-0.5 group relative"
                      title={`${d.date}: ${d.sent} gửi, ${d.received} nhận`}
                    >
                      <div
                        className="bg-primary/30 rounded-sm transition-all"
                        style={{ height: `${recvH}%` }}
                      />
                      <div
                        className="bg-primary rounded-sm transition-all"
                        style={{ height: `${sentH}%` }}
                      />
                      {total > 0 && (
                        <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-foreground opacity-0 group-hover:opacity-100">
                          {total}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mt-2 tabular-nums">
                <span>{stats.timeline[0]?.date.slice(5)}</span>
                <span>{stats.timeline[stats.timeline.length - 1]?.date.slice(5)}</span>
              </div>
            </div>

            {/* History */}
            <div className="bg-card border border-border rounded-2xl shadow-card overflow-hidden">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-lg font-bold">Lịch sử kết nối</h2>
                <span className="text-xs text-muted-foreground">
                  {stats.history.length} bản ghi gần nhất
                </span>
              </div>
              {stats.history.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                  Chưa có hoạt động kết nối nào.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {stats.history.map((h) => (
                    <li
                      key={h.id}
                      className="px-5 py-3 flex items-center gap-3 hover:bg-accent/40 transition-smooth"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          h.direction === "out"
                            ? "bg-primary/15 text-primary"
                            : "bg-emerald-500/15 text-emerald-600"
                        }`}
                      >
                        {h.direction === "out" ? (
                          <ArrowUpRight className="w-4 h-4" />
                        ) : (
                          <ArrowDownLeft className="w-4 h-4" />
                        )}
                      </div>
                      {h.partner?.logo_url ? (
                        <img
                          src={h.partner.logo_url}
                          alt=""
                          className="w-9 h-9 rounded-full object-cover bg-white shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-muted shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm truncate">
                            {h.direction === "out" ? "Đã gửi tới " : "Nhận từ "}
                            {h.partner ? (
                              <Link
                                to="/business/$slug"
                                params={{ slug: h.partner.slug }}
                                className="text-primary hover:underline"
                              >
                                {h.partner.name}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">đối tác đã xoá</span>
                            )}
                          </p>
                          {h.direction === "in" && !h.read_at && (
                            <span className="text-[10px] font-bold uppercase text-primary">
                              Mới
                            </span>
                          )}
                        </div>
                        {h.subject && (
                          <p className="text-xs text-muted-foreground truncate">{h.subject}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                        {new Date(h.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : null}
      </>
    </DashboardShell>
  );
}
