import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListPayments, adminUpdatePaymentStatus } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Shield, ExternalLink, X, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

const SUB_TYPE_LABELS: Record<string, string> = {
  b2b_block_500: "Block 500 B2B",
  b2b_premium: "B2B Premium",
  icon_premium: "Icon Premium",
  extra_quota: "Thêm lượt gửi",
  contact_block_addon: "Mở rộng danh bạ",
  membership: "Thành viên",
};

export function PaymentReviewSection() {
  const listFn = useServerFn(adminListPayments);
  const updateFn = useServerFn(adminUpdatePaymentStatus);
  const query = useQuery({ queryKey: ["admin-payments"], queryFn: () => listFn() });
  const mut = useMutation({
    mutationFn: (args: {
      payment_id: string;
      status: "verified" | "rejected";
      business_id?: string | null;
    }) => updateFn({ data: args }),
    onSuccess: () => {
      toast.success("Đã cập nhật — subscription được tạo tự động!");
      query.refetch();
    },
    onError: (e: any) => toast.error(e.message ?? "Lỗi cập nhật"),
  });

  const payments = query.data?.payments ?? [];
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  const filtered = payments.filter((p: any) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || 
      (p.receipt_url && p.receipt_url.toLowerCase().includes(q)) ||
      (p.provider_payment_id && p.provider_payment_id.toLowerCase().includes(q)) ||
      (p.businesses?.name && p.businesses.name.toLowerCase().includes(q)) ||
      (p.user_id && p.user_id.toLowerCase().includes(q));
    return matchesSearch;
  });

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);
  const pending = payments.filter((p: any) => p.status === "pending");

  return (
    <section className="rounded-3xl bg-card border border-border p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="font-display text-xl font-semibold">Lịch sử Giao dịch</h2>
            {pending.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500 text-white text-xs font-bold">
                {pending.length} chờ duyệt
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Bao gồm thanh toán tự động (sePay) và thủ công.
          </p>
        </div>
        
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm mã hóa đơn, tên KH..."
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm w-full sm:w-64"
          />
        </div>
      </div>

      {query.isLoading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted">
              <tr>
                <th className="p-2">PTTT</th>
                <th className="p-2">Khách hàng</th>
                <th className="p-2">Loại gói</th>
                <th className="p-2">Doanh nghiệp</th>
                <th className="p-2">Số tiền</th>
                <th className="p-2">Ngày gửi</th>
                <th className="p-2">Biên lai</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p: any) => (
                <tr
                  key={p.id}
                  className={`border-t border-border ${p.status === "pending" ? "bg-yellow-500/5" : ""}`}
                >
                  <td className="p-2 font-mono text-[10px] uppercase font-bold text-muted-foreground">
                    {p.provider}
                  </td>
                  <td className="p-2 font-mono text-[10px]">
                    {p.user_id?.slice(0, 8)}…<br/>
                    <span className="font-sans text-xs font-medium text-foreground">{p.businesses?.name || "—"}</span>
                  </td>
                  <td className="p-2">
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                      {SUB_TYPE_LABELS[p.type] ?? p.type ?? "?"}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-[11px] whitespace-nowrap">{Number(p.amount).toLocaleString()} {p.currency}</td>
                  <td className="p-2">{new Date(p.created_at).toLocaleDateString("vi-VN")}</td>
                  <td className="p-2">
                    {p.receipt_url || p.provider_payment_id ? (
                      <a
                        href={p.receipt_url ?? p.provider_payment_id}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline flex items-center gap-1"
                      >
                        Xem ảnh <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      "Không có"
                    )}
                  </td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                        p.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-600"
                          : (p.status === "verified" || p.status === "completed")
                            ? "bg-green-500/20 text-green-600"
                            : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {p.status === "pending"
                        ? "⏳ CHỜ DUYỆT"
                        : (p.status === "verified" || p.status === "completed")
                          ? "✅ HOÀN TẤT"
                          : "❌ TỪ CHỐI"}
                    </span>
                  </td>
                  <td className="p-2 flex gap-1.5">
                    {p.status === "pending" && p.provider === "manual" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          onClick={() =>
                            mut.mutate({
                              payment_id: p.id,
                              status: "verified",
                              business_id: p.business_id,
                            })
                          }
                          disabled={mut.isPending}
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Từ chối thanh toán này?"))
                              mut.mutate({
                                payment_id: p.id,
                                status: "rejected",
                                business_id: p.business_id,
                              });
                          }}
                          disabled={mut.isPending}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-muted-foreground">
                    Không tìm thấy giao dịch nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-border bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Đang hiển thị {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, filtered.length)} trên tổng {filtered.length}
              </span>
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 px-2"
                  disabled={page <= 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-3 h-3" />
                </Button>
                <span className="text-xs font-medium px-2 py-1">
                  Trang {page} / {totalPages}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-7 px-2"
                  disabled={page >= totalPages} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
