import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { bulkImportBusinesses } from "@/lib/admin.functions";
import { parseCSV, BULK_CSV_TEMPLATE } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Download, Upload, CheckCircle2, Users, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function BulkImportSection({ importFn }: { importFn: ReturnType<typeof useServerFn<typeof bulkImportBusinesses>> }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [result, setResult] = useState<Awaited<ReturnType<typeof bulkImportBusinesses>> | null>(null);
  const [createOwners, setCreateOwners] = useState(true);

  const importMut = useMutation({
    mutationFn: (rows: Record<string, string>[]) =>
      importFn({ data: { rows, create_missing_owners: createOwners } }),
    onSuccess: (res) => {
      setResult(res);
      toast.success(`Đã import ${res.ok} doanh nghiệp, tạo mới ${res.created_users} tài khoản.`);
    },
    onError: (e: any) => toast.error(e.message ?? "Import lỗi"),
  });

  async function handleFile(f: File) {
    setFile(f);
    const text = await f.text();
    const rows = parseCSV(text);
    setPreview(rows.slice(0, 5));
  }

  function downloadTemplate() {
    const blob = new Blob([BULK_CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "business-import-template.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  function exportCredentials() {
    if (!result?.credentials.length) return;
    const header = "row,slug,email,password,created\n";
    const body = result.credentials
      .map((c) => [c.row, c.slug, c.email, c.password, c.created ? "yes" : "no"].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "business-import-credentials.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-3xl bg-card border border-border p-6">
      <h2 className="font-display text-xl font-semibold mb-2">Nhập hàng loạt doanh nghiệp + tài khoản (CSV)</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Mỗi dòng CSV tạo <strong>1 doanh nghiệp</strong> và (nếu bật) <strong>tài khoản chủ sở hữu</strong> tương ứng.
        Cột bắt buộc: <code>owner_email</code>, <code>name</code>, <code>slug</code>. Tùy chọn:{" "}
        <code>owner_password</code> (nếu để trống, hệ thống sinh mật khẩu ngẫu nhiên mạnh riêng cho từng tài khoản),{" "}
        <code>owner_display_name</code>. Hãy tải CSV mật khẩu ngay sau khi import — mật khẩu chỉ hiển thị một lần.
      </p>

      <label className="flex items-center gap-2 text-sm mb-4 select-none">
        <input type="checkbox" checked={createOwners} onChange={(e) => setCreateOwners(e.target.checked)} />
        Tự tạo tài khoản chủ sở hữu nếu email chưa tồn tại
      </label>

      <div className="flex flex-wrap gap-3 mb-4">
        <Button variant="outline" onClick={downloadTemplate}><Download className="w-4 h-4 mr-2" />Tải mẫu CSV</Button>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
          <Upload className="w-4 h-4" /> Chọn file CSV
          <input type="file" accept=".csv,text/csv" hidden onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </label>
        {file && (
          <Button onClick={async () => {
            const text = await file.text();
            const rows = parseCSV(text);
            setResult(null);
            importMut.mutate(rows);
          }} disabled={importMut.isPending}>
            {importMut.isPending ? "Đang import..." : `Import ${preview.length ? "tất cả" : ""}`}
          </Button>
        )}
        {result?.credentials.length ? (
          <Button variant="outline" onClick={exportCredentials}>
            <Download className="w-4 h-4 mr-2" />Tải CSV tài khoản
          </Button>
        ) : null}
      </div>

      {preview.length > 0 && (
        <div className="overflow-auto rounded-xl border border-border mb-4">
          <table className="w-full text-xs">
            <thead className="bg-muted"><tr>{Object.keys(preview[0]).map((k) => <th key={k} className="p-2 text-left">{k}</th>)}</tr></thead>
            <tbody>{preview.map((r, i) => <tr key={i} className="border-t border-border">{Object.keys(preview[0]).map((k) => <td key={k} className="p-2">{r[k]}</td>)}</tr>)}</tbody>
          </table>
          <p className="p-2 text-xs text-muted-foreground bg-muted/50">Xem trước 5 dòng đầu.</p>
        </div>
      )}

      {result && (
        <div className="p-4 rounded-xl bg-muted space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2"><CheckCircle2 className="text-green-600 w-5 h-5" /><span className="font-semibold">Doanh nghiệp: {result.ok}</span></div>
            <div className="flex items-center gap-2"><Users className="text-primary w-5 h-5" /><span className="font-semibold">Tài khoản mới: {result.created_users}</span></div>
            {result.failed.length > 0 && (
              <div className="flex items-center gap-2"><AlertCircle className="text-destructive w-5 h-5" /><span className="font-semibold">Lỗi: {result.failed.length}</span></div>
            )}
          </div>

          {result.credentials.length > 0 && (
            <div className="overflow-auto rounded-lg border border-border bg-background">
              <table className="w-full text-xs">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="p-2">Row</th>
                    <th className="p-2">Slug</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Mật khẩu (Copy ngay)</th>
                    <th className="p-2">Tài khoản</th>
                  </tr>
                </thead>
                <tbody>
                  {result.credentials.map((c) => (
                    <tr key={c.row} className="border-t border-border">
                      <td className="p-2">{c.row}</td>
                      <td className="p-2">{c.slug}</td>
                      <td className="p-2 font-mono">{c.email}</td>
                      <td className="p-2 font-mono text-primary font-bold">{c.password}</td>
                      <td className="p-2">{c.created ? "Tạo mới" : "Đã có"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.failed.length > 0 && (
            <div className="overflow-auto rounded-lg border border-border bg-background">
              <table className="w-full text-xs">
                <thead className="bg-muted text-left text-destructive">
                  <tr>
                    <th className="p-2">Row</th>
                    <th className="p-2">Slug</th>
                    <th className="p-2">Lỗi</th>
                  </tr>
                </thead>
                <tbody>
                  {result.failed.map((f) => (
                    <tr key={f.row} className="border-t border-border text-destructive">
                      <td className="p-2">{f.row}</td>
                      <td className="p-2">{f.slug}</td>
                      <td className="p-2">{f.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
