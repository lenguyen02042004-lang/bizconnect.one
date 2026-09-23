import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export function AdminClaimsSection() {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    setLoading(true);
    // Fetch pending claims with related business and user details
    const { data, error } = await supabase
      .from("business_claims")
      .select(
        `
        *,
        businesses (name, slug),
        profiles:user_id (email, display_name)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Không thể tải danh sách yêu cầu xác thực.");
    } else {
      setClaims(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleApprove = async (claimId: string, businessId: string, userId: string) => {
    if (
      !confirm(
        "Bạn có chắc muốn phê duyệt yêu cầu này? User này sẽ được cấp quyền sở hữu trang doanh nghiệp.",
      )
    )
      return;

    // Call RPC function to approve claim safely (bypasses RLS)
    const { error } = await supabase.rpc("approve_business_claim", { claim_id: claimId });

    if (error) {
      toast.error("Lỗi khi phê duyệt: " + error.message);
    } else {
      toast.success("Đã phê duyệt và chuyển quyền quản lý thành công!");
      fetchClaims();
    }
  };

  const handleReject = async (claimId: string) => {
    if (!confirm("Từ chối yêu cầu này?")) return;
    const { error } = await supabase.rpc("reject_business_claim", { claim_id: claimId });

    if (error) toast.error("Lỗi: " + error.message);
    else {
      toast.success("Đã từ chối yêu cầu.");
      fetchClaims();
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Đang tải...</div>;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-bold font-display">Yêu cầu Nhận quyền Quản lý</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Phê duyệt hoặc từ chối các yêu cầu xác minh chủ sở hữu gian hàng từ người dùng.
        </p>
      </div>
      <div className="p-0">
        {claims.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">Không có yêu cầu nào.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Trạng thái</th>
                  <th className="px-6 py-4 font-medium">Doanh nghiệp</th>
                  <th className="px-6 py-4 font-medium">Người yêu cầu</th>
                  <th className="px-6 py-4 font-medium">Minh chứng</th>
                  <th className="px-6 py-4 font-medium">Ngày gửi</th>
                  <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {claims.map((claim) => (
                  <tr key={claim.id} className="bg-card hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {claim.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" /> Chờ duyệt
                        </span>
                      )}
                      {claim.status === "approved" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã duyệt
                        </span>
                      )}
                      {claim.status === "rejected" && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" /> Từ chối
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {claim.businesses?.name}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      <div className="font-medium text-foreground">
                        {claim.profiles?.display_name || "Unknown"}
                      </div>
                      <div className="text-xs">{claim.profiles?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="max-w-[200px] truncate text-muted-foreground text-xs p-2 bg-muted rounded border border-border"
                        title={claim.proof_text}
                      >
                        {claim.proof_text}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(claim.created_at).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      {claim.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleApprove(claim.id, claim.business_id, claim.user_id)
                            }
                            className="bg-emerald-500 hover:bg-emerald-600 text-white h-8"
                          >
                            Phê duyệt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(claim.id)}
                            className="h-8 border-rose-500/20 text-rose-500 hover:bg-rose-500/10"
                          >
                            Từ chối
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
