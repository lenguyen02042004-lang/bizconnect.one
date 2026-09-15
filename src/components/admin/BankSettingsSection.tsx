import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

export function BankSettingsSection() {
  const [bankInfo, setBankInfo] = useState({ name: "", account: "", owner: "", bin: "" });
  const [loading, setLoading] = useState(true);

  useQuery({
    queryKey: ["admin-bank-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "bank_info")
        .single();
      if (data?.value) {
        const val: any = data.value;
        setBankInfo({
          name: val.bank_name || "",
          account: val.account_number || "",
          owner: val.account_owner || "",
          bin: val.bin || "",
        });
      }
      setLoading(false);
      return data;
    },
  });

  const mut = useMutation({
    mutationFn: async () => {
      const payload = {
        bank_name: bankInfo.name,
        account_number: bankInfo.account,
        account_owner: bankInfo.owner,
        bin: bankInfo.bin,
        vndRate: 25000,
      };
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "bank_info", value: payload });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Đã cập nhật thông tin thanh toán!"),
    onError: (e: any) => toast.error(e.message ?? "Lỗi cập nhật"),
  });

  return (
    <section className="rounded-3xl bg-card border border-border p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-primary" />
        <h2 className="font-display text-xl font-semibold">Cấu hình Thanh toán (VietQR)</h2>
      </div>
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <div>
            <Label className="mb-1 block">Tên Ngân hàng</Label>
            <Input
              value={bankInfo.name}
              onChange={(e) => setBankInfo({ ...bankInfo, name: e.target.value })}
              placeholder="VD: Vietcombank"
            />
          </div>
          <div>
            <Label className="mb-1 block">Mã Ngân hàng (BIN VietQR)</Label>
            <Input
              value={bankInfo.bin}
              onChange={(e) => setBankInfo({ ...bankInfo, bin: e.target.value })}
              placeholder="VD: 970436"
            />
          </div>
          <div>
            <Label className="mb-1 block">Số Tài khoản</Label>
            <Input
              value={bankInfo.account}
              onChange={(e) => setBankInfo({ ...bankInfo, account: e.target.value })}
              placeholder="123456789"
            />
          </div>
          <div>
            <Label className="mb-1 block">Tên Chủ Tài khoản</Label>
            <Input
              value={bankInfo.owner}
              onChange={(e) => setBankInfo({ ...bankInfo, owner: e.target.value })}
              placeholder="NGUYEN VAN A"
            />
          </div>
          <div className="sm:col-span-2 pt-2">
            <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
              {mut.isPending ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
