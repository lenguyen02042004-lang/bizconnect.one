import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListBusinesses } from "@/lib/admin.functions";
import { Users, ExternalLink, Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react";

export function BusinessTableSection({
  listFn,
}: {
  listFn: ReturnType<typeof useServerFn<typeof adminListBusinesses>>;
}) {
  const q = useQuery({ queryKey: ["admin-businesses"], queryFn: () => listFn() });
  const list = q.data?.businesses ?? [];
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  const filtered = list.filter((b) =>
    `${b.name} ${b.slug} ${b.owner_email}`.toLowerCase().includes(filter.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <section className="rounded-3xl bg-card border border-border p-6 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h2 className="font-display text-xl font-semibold">
            Tất cả doanh nghiệp ({list.length})
          </h2>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên, slug, email chủ..."
            className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm w-72 max-w-full"
          />
        </div>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải...</p>
      ) : (
        <div className="overflow-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-2">Tên</th>
                <th className="p-2">Slug</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2">Quốc gia</th>
                <th className="p-2">Chủ (email)</th>
                <th className="p-2">Views</th>
                <th className="p-2">Followers</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((b) => (
                <tr key={b.id} className="border-t border-border hover:bg-accent/40">
                  <td className="p-2 font-medium">{b.name}</td>
                  <td className="p-2 font-mono text-muted-foreground">{b.slug}</td>
                  <td className="p-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${b.status === "public" ? "bg-green-500/15 text-green-700" : "bg-muted text-muted-foreground"}`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="p-2">{b.country_code ?? "—"}</td>
                  <td className="p-2 text-muted-foreground">{b.owner_email}</td>
                  <td className="p-2">{b.views_count}</td>
                  <td className="p-2">{b.followers_count}</td>
                  <td className="p-2 flex gap-1">
                    <Link
                      to="/business/$slug"
                      params={{ slug: b.slug }}
                      target="_blank"
                      className="inline-flex items-center px-2 py-1 rounded hover:bg-accent"
                      title="Xem"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      to="/business/edit"
                      search={{ id: b.id }}
                      className="inline-flex items-center px-2 py-1 rounded hover:bg-accent"
                      title="Sửa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-muted-foreground">
                    Không tìm thấy doanh nghiệp nào.
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
