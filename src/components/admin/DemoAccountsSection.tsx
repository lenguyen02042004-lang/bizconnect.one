import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { seedDemoAccounts } from "@/lib/admin.functions";
import { Button } from "@/components/ui/button";
import { Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";

export function DemoAccountsSection({
  seedFn,
}: {
  seedFn: ReturnType<typeof useServerFn<typeof seedDemoAccounts>>;
}) {
  const [results, setResults] = useState<
    Awaited<ReturnType<typeof seedDemoAccounts>>["results"] | null
  >(null);
  const mut = useMutation({
    mutationFn: () => seedFn(),
    onSuccess: (res) => {
      setResults(res.results);
      const ok = res.results.filter((r) => r.ok).length;
      toast.success(`Đã chuẩn bị ${ok}/${res.results.length} tài khoản demo`);
    },
    onError: (e: any) => toast.error(e.message ?? "Lỗi seed demo"),
  });

  return (
    <section className="rounded-3xl bg-card border border-border p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">
            Tài khoản chủ sở hữu cho doanh nghiệp demo
          </h2>
        </div>
        <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
          {mut.isPending ? "Đang tạo..." : "Tạo / cập nhật 10 tài khoản demo"}
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Mỗi doanh nghiệp demo sẽ có 1 tài khoản độc lập (email{" "}
        <code>&lt;slug&gt;@demo.bizconnect.test</code>). Mỗi lần chạy sẽ{" "}
        <strong>sinh mật khẩu ngẫu nhiên mạnh, khác nhau</strong> cho từng tài khoản và luân chuyển
        mật khẩu cũ — hãy sao chép và lưu lại ngay từ bảng bên dưới, hệ thống không hiển thị lại.
      </p>

      {results && (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-2">Doanh nghiệp</th>
                <th className="p-2">Email đăng nhập</th>
                <th className="p-2">Mật khẩu</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.slug} className="border-t border-border">
                  <td className="p-2 font-medium">{r.slug}</td>
                  <td className="p-2 font-mono">{r.email}</td>
                  <td className="p-2 font-mono">{r.password}</td>
                  <td className="p-2">
                    {r.ok ? (
                      <span className="text-green-600">
                        {r.created ? "Mới tạo" : "Đã có"} · gán chủ
                      </span>
                    ) : (
                      <span className="text-destructive">{r.error}</span>
                    )}
                  </td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(`${r.email} / ${r.password}`);
                        toast.success("Đã sao chép");
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
