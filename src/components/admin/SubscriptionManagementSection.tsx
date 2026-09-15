import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListSubscriptions, adminGrantSubscription } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, RefreshCw, Gift } from "lucide-react";
import { toast } from "sonner";

const SUB_TYPE_LABELS: Record<string, string> = {
  b2b_block_500: "Block 500 B2B",
  b2b_premium: "B2B Premium",
  icon_premium: "Icon Premium",
  extra_quota: "Thêm lượt gửi",
  contact_block_addon: "Mở rộng danh bạ",
  membership: "Thành viên",
};

export function SubscriptionManagementSection() {
  const listFn = useServerFn(adminListSubscriptions);
  const grantFn = useServerFn(adminGrantSubscription);
  const query = useQuery({ queryKey: ["admin-subscriptions"], queryFn: () => listFn() });
  const [showGrant, setShowGrant] = useState(false);
  const [grantForm, setGrantForm] = useState({
    user_id: "",
    business_id: "",
    sub_type: "b2b_premium" as const,
    months: 12,
  });

  const grantMut = useMutation({
    mutationFn: () =>
      grantFn({ data: { ...grantForm, business_id: grantForm.business_id || null } }),
    onSuccess: () => {
      toast.success("Đã cấp gói thành công!");
      setShowGrant(false);
      query.refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "Lỗi"),
  });

  const subs = query.data?.subscriptions ?? [];
  const active = subs.filter((s: any) => s.status === "active");

  return (
    <section className="rounded-3xl bg-card border border-border p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">
            Quản lý Gói Thành viên
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({active.length} đang hoạt động)
            </span>
          </h2>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            className="gap-1.5 bg-gradient-vivid text-white border-0"
            onClick={() => setShowGrant(!showGrant)}
          >
            <Gift className="w-3.5 h-3.5" /> Cấp gói thủ công
          </Button>
        </div>
      </div>

      {/* Manual grant form */}
      {showGrant && (
        <div className="mb-5 p-4 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
          <p className="text-sm font-semibold text-primary">🎁 Cấp gói thủ công cho user</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">User ID (UUID)</Label>
              <Input
                value={grantForm.user_id}
                onChange={(e) => setGrantForm({ ...grantForm, user_id: e.target.value })}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Business ID (UUID, tùy chọn)</Label>
              <Input
                value={grantForm.business_id}
                onChange={(e) => setGrantForm({ ...grantForm, business_id: e.target.value })}
                placeholder="Để trống nếu là gói cá nhân"
                className="font-mono text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loại gói</Label>
              <select
                value={grantForm.sub_type}
                onChange={(e) => setGrantForm({ ...grantForm, sub_type: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm"
              >
                <option value="b2b_premium">B2B Premium (500 lượt gửi/năm)</option>
                <option value="icon_premium">Icon Premium (icon lớn trên bản đồ)</option>
                <option value="contact_block_addon">Mở rộng danh bạ (+500)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Số tháng</Label>
              <Input
                type="number"
                min={1}
                max={120}
                value={grantForm.months}
                onChange={(e) => setGrantForm({ ...grantForm, months: Number(e.target.value) })}
              />
            </div>
          </div>
          <Button
            onClick={() => grantMut.mutate()}
            disabled={grantMut.isPending || !grantForm.user_id}
            className="bg-gradient-vivid text-white border-0"
          >
            {grantMut.isPending ? "Đang cấp..." : "✅ Cấp gói"}
          </Button>
        </div>
      )}

      {/* Subscription list */}
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-2">Email</th>
                <th className="p-2">Loại gói</th>
                <th className="p-2">Doanh nghiệp</th>
                <th className="p-2">Bắt đầu</th>
                <th className="p-2">Hết hạn</th>
                <th className="p-2">Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {subs.map((s: any) => {
                const expired = s.current_period_end && new Date(s.current_period_end) < new Date();
                return (
                  <tr key={s.id} className="border-t border-border hover:bg-accent/30">
                    <td className="p-2 text-muted-foreground">
                      {s.owner_email || s.user_id?.slice(0, 8) + "…"}
                    </td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                        {SUB_TYPE_LABELS[s.sub_type] ?? s.sub_type}
                      </span>
                    </td>
                    <td className="p-2">{s.businesses?.name ?? "—"}</td>
                    <td className="p-2">
                      {s.current_period_start
                        ? new Date(s.current_period_start).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>
                    <td className={`p-2 ${expired ? "text-destructive font-semibold" : ""}`}>
                      {s.current_period_end
                        ? new Date(s.current_period_end).toLocaleDateString("vi-VN")
                        : "Vĩnh viễn"}
                      {expired && " ⏰"}
                    </td>
                    <td className="p-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === "active" && !expired
                            ? "bg-green-500/20 text-green-700"
                            : s.status === "cancelled"
                              ? "bg-red-500/20 text-red-600"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.status === "active" && !expired
                          ? "✅ ACTIVE"
                          : s.status === "cancelled"
                            ? "HUỶ"
                            : "⏰ HẾT HẠN"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {subs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-muted-foreground">
                    Chưa có subscription nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
