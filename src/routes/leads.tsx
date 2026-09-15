import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getMyLeads, type Lead } from "@/lib/leads.functions";
import { Search, Phone, Mail, MessageCircle, Download, QrCode, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/leads")({
  component: LeadsPage,
  head: () => ({
    meta: [
      { title: "Khách hàng tiềm năng — BizConnect.One" },
      {
        name: "description",
        content: "Danh sách khách đã quét mã QR và kết nối giao thương với doanh nghiệp của bạn.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
});

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function LeadsPage() {
  const fetchLeads = useServerFn(getMyLeads);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setAuthed(false);
        setLoading(false);
        return;
      }
      setAuthed(true);
      try {
        const res = await fetchLeads();
        setLeads(res.leads);
      } catch (e: any) {
        toast.error(e?.message || "Không tải được danh sách");
      }
      setLoading(false);
    })();
  }, [fetchLeads]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return leads;
    return leads.filter((l) =>
      [l.full_name, l.job_title, l.company_name, l.phone, l.email]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [leads, q]);

  const exportCsv = () => {
    const header = [
      "Thời gian",
      "Họ tên",
      "Chức vụ",
      "Công ty",
      "SĐT",
      "Zalo",
      "Email",
      "Nguồn",
      "Doanh nghiệp",
    ];
    const rows = filtered.map((l) => [
      new Date(l.created_at).toLocaleString("vi-VN"),
      l.full_name,
      l.job_title,
      l.company_name,
      l.phone,
      l.zalo,
      l.email,
      l.source,
      l.business_name,
    ]);
    const csv = "\uFEFF" + [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "khach-tiem-nang.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const qrCount = leads.filter((l) => l.source === "qr").length;

  return (
    <DashboardShell
      title="Khách hàng tiềm năng"
      subtitle="Người đã quét QR / bấm Kết nối giao thương với doanh nghiệp của bạn."
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={exportCsv}
          disabled={!filtered.length}
          className="gap-1.5"
        >
          <Download className="w-4 h-4" /> Xuất CSV
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Tổng kết nối
          </p>
          <p className="text-2xl font-bold mt-1">{leads.length}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5" /> Từ quét QR
          </p>
          <p className="text-2xl font-bold mt-1">{qrCount}</p>
        </div>
      </div>

      <div className="relative mb-5">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên, công ty, SĐT…"
          className="pl-9 h-11"
        />
      </div>

      {loading ? (
        <p className="text-muted-foreground">Đang tải…</p>
      ) : authed === false ? (
        <div className="text-center py-16">
          <Link to="/login">
            <Button>Đăng nhập</Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl text-muted-foreground text-sm">
          Chưa có khách nào kết nối. In standee QR và đặt tại gian hàng để bắt đầu thu lead.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((l) => (
            <div
              key={l.id}
              className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                {l.avatar_url ? (
                  <img
                    src={l.avatar_url}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover border border-border"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-vivid text-white flex items-center justify-center font-bold">
                    {l.full_name.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  {l.slug ? (
                    <Link
                      to="/p/$slug"
                      params={{ slug: l.slug }}
                      className="font-semibold hover:text-primary leading-tight block truncate"
                    >
                      {l.full_name}
                    </Link>
                  ) : (
                    <p className="font-semibold leading-tight truncate">{l.full_name}</p>
                  )}
                  <p className="text-xs text-muted-foreground truncate">
                    {[l.job_title, l.company_name].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] h-5">
                  {l.source === "qr" ? "QR" : "Web"}
                </Badge>
              </div>
              <div className="text-xs text-foreground/80 space-y-1">
                {l.phone && (
                  <p className="truncate">
                    <Phone className="inline w-3.5 h-3.5 mr-1.5 text-primary" />
                    {l.phone}
                  </p>
                )}
                {l.email && (
                  <p className="truncate">
                    <Mail className="inline w-3.5 h-3.5 mr-1.5 text-primary" />
                    {l.email}
                  </p>
                )}
                <p className="text-muted-foreground">
                  {new Date(l.created_at).toLocaleString("vi-VN")}
                </p>
              </div>
              <div className="flex gap-1.5">
                {l.phone && (
                  <a href={`tel:${l.phone}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-8">
                      <Phone className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}
                {(l.zalo || l.phone) && (
                  <a
                    href={`https://zalo.me/${(l.zalo || l.phone || "").replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button size="sm" variant="outline" className="w-full h-8">
                      <MessageCircle className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}
                {l.email && (
                  <a href={`mailto:${l.email}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-8">
                      <Mail className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
