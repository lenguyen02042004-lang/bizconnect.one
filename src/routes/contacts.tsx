import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building2,
  User,
  Plus,
  Edit,
  Lock,
  X,
  QrCode,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getMyWallet, buyContactBlock, type WalletLimits } from "@/lib/connect";
import { PaymentModal } from "@/components/PaymentModal";

const BANK = {
  name: "TPBank (Tiên Phong Bank)",
  account: "00003554020",
  owner: "LE TAN LOI",
  bin: "970423",
  vndRate: 1,
};

function vietQrUrl(amount: number, content: string, bankInfo: typeof BANK) {
  const vnd = amount * bankInfo.vndRate;
  const cleanAccount = bankInfo.account.replace(/\s+/g, "");
  return `https://img.vietqr.io/image/${bankInfo.bin}-${cleanAccount}-compact2.png?amount=${vnd}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(bankInfo.owner)}`;
}

export const Route = createFileRoute("/contacts")({
  component: ContactsPage,
  head: () => ({
    meta: [
      { title: "Ví Danh Bạ — BizConnect.One" },
      { name: "description", content: "Danh bạ các liên hệ bạn đã lưu." },
      { name: "robots", content: "noindex" },
    ],
  }),
});

type SavedContact = {
  id: string;
  business_id: string | null;
  personal_profile_id: string | null;
  business_name: string;
  business_slug: string | null;
  industry: string | null;
  country_name: string | null;
  province: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  logo_url: string | null;
  note: string | null;
  created_at: string;
};

function ContactsPage() {
  const [items, setItems] = useState<SavedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [wallet, setWallet] = useState<WalletLimits | null>(null);
  const [buying, setBuying] = useState(false);
  const [editing, setEditing] = useState<SavedContact | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const [showModal, setShowModal] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [bankInfo, setBankInfo] = useState(BANK);

  const load = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setAuthed(false);
      setLoading(false);
      return;
    }
    setAuthed(true);
    setUserId(user.id);
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "bank_info")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const val = data.value as any;
          setBankInfo({
            ...BANK,
            name: val.bank_name || BANK.name,
            account: val.account_number || BANK.account,
            owner: val.account_owner || BANK.owner,
            bin: val.bin || BANK.bin,
          });
        }
      });
    const { data, error } = await supabase
      .from("saved_contacts")
      .select("*")
      // Order by created_at ASC so oldest is kept when quota drops
      .order("created_at", { ascending: true });

    if (error) toast.error(error.message);
    setItems((data as unknown as SavedContact[]) ?? []);
    setWallet(await getMyWallet());
    setLoading(false);
  };

  const handleBuy = async () => {
    setShowModal(true);
  };

  useEffect(() => {
    let active = true;

    const doLoad = async () => {
      if (active) await load();
    };
    doLoad();

    // Listen to subscriptions table changes (triggered when admin approves payment)
    const channel = supabase
      .channel("contacts_wallet_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        async () => {
          if (!active) return;
          // Refresh only the wallet when subscription changes
          const newWallet = await getMyWallet();
          if (active) setWallet(newWallet);
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "message_quotas" }, () => {
        doLoad();
      })
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Poll wallet every 10s while payment modal is open so user sees update without manual refresh
  useEffect(() => {
    if (!showModal) return;
    const interval = setInterval(async () => {
      const newWallet = await getMyWallet();
      setWallet(newWallet);
    }, 10000);
    return () => clearInterval(interval);
  }, [showModal]);

  const handleRemove = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa liên hệ này khỏi danh bạ?")) return;
    const prev = items;
    setItems((s) => s.filter((x) => x.id !== id));
    const { error } = await supabase.from("saved_contacts").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error(error.message);
    } else {
      toast.success("Đã xoá khỏi danh bạ");
      if (wallet) {
        setWallet({ ...wallet, current_saved_count: Math.max(0, wallet.current_saved_count - 1) });
      }
    }
  };

  const handleSaveEdit = async (id: string, newNote: string) => {
    const { error } = await supabase.from("saved_contacts").update({ note: newNote }).eq("id", id);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Đã cập nhật danh bạ");
    setItems((s) => s.map((c) => (c.id === id ? { ...c, note: newNote } : c)));
    setEditing(null);
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((c) =>
      [c.business_name, c.industry, c.country_name, c.province, c.email, c.phone, c.note]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [items, q]);

  useEffect(() => {
    setCurrentPage(1);
  }, [q]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const maxAllowed = wallet?.max_saved_allowed ?? 200;

  return (
    <DashboardShell title="Ví Danh Bạ" subtitle="Danh bạ các liên hệ bạn đã lưu.">
      {wallet && (
        <div className="mb-5 rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <div>
              <p className="text-sm font-semibold">Hạn mức lưu danh bạ</p>
              <p className="text-xs text-muted-foreground">
                Đã dùng {wallet.current_saved_count.toLocaleString()} /{" "}
                {maxAllowed.toLocaleString()} liên hệ
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleBuy}
              disabled={buying}
              className="gap-1.5 bg-gradient-vivid text-white border-0"
            >
              <Plus className="w-3.5 h-3.5" /> {buying ? "Đang xử lý…" : "Mua gói mở rộng"}
            </Button>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-vivid"
              style={{
                width: `${Math.min(100, Math.round((wallet.current_saved_count / Math.max(1, maxAllowed)) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}

      <div className="relative mb-5 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, ngành nghề, quốc gia, email…"
            className="pl-9 h-11"
          />
        </div>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Đang tải…</p>
      ) : authed === false ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4">Vui lòng đăng nhập để xem danh bạ.</p>
          <Link to="/login">
            <Button>Đăng nhập</Button>
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl">
          <p className="text-muted-foreground mb-4">
            {items.length === 0 ? "Bạn chưa lưu liên hệ nào." : "Không có kết quả phù hợp."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {paginatedItems.map((c) => {
              const absoluteIndex = items.indexOf(c);
              const isLocked = absoluteIndex >= maxAllowed;

              return (
                <div
                  key={c.id}
                  className={`relative rounded-xl border border-border bg-card p-4 flex flex-col gap-3 transition-smooth ${isLocked ? "overflow-hidden" : "hover:shadow-pink"}`}
                >
                  {isLocked && (
                    <div className="absolute inset-0 z-10 backdrop-blur-[6px] bg-background/40 flex flex-col items-center justify-center p-4 text-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-2">
                        <Lock className="w-5 h-5" />
                      </div>
                      <p className="font-semibold text-sm">Danh bạ bị khóa</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                        Vượt quá hạn mức. Hãy nâng cấp để xem liên hệ này.
                      </p>
                      <div className="absolute top-2 right-2 flex gap-1 z-20">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove(c.id);
                          }}
                          className="h-8 w-8 hover:text-destructive bg-background/50 hover:bg-background/80"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    {c.logo_url ? (
                      <img
                        src={c.logo_url}
                        alt={`Ảnh ${c.business_name}`}
                        loading="lazy"
                        decoding="async"
                        className="w-12 h-12 rounded-lg object-cover border border-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-accent flex items-center justify-center">
                        {c.personal_profile_id ? (
                          <User className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Building2 className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {c.business_slug ? (
                        <Link
                          to={c.personal_profile_id ? "/p/$slug" : "/business/$slug"}
                          params={{ slug: c.business_slug }}
                          className="font-semibold leading-tight hover:text-primary line-clamp-2"
                        >
                          {c.business_name}
                        </Link>
                      ) : (
                        <p className="font-semibold leading-tight line-clamp-2">
                          {c.business_name}
                        </p>
                      )}
                      {c.industry && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {c.industry}
                        </p>
                      )}
                    </div>
                    {!isLocked && (
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditing(c)}
                          title="Chỉnh sửa"
                          className="h-7 w-7 text-muted-foreground"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemove(c.id)}
                          title="Xoá khỏi danh bạ"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-foreground/80">
                    {(c.province || c.country_name) && (
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">
                          {[c.province, c.country_name].filter(Boolean).join(", ")}
                        </span>
                      </p>
                    )}
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1.5 hover:text-primary"
                      >
                        <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{c.phone}</span>
                      </a>
                    )}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-1.5 hover:text-primary"
                      >
                        <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </a>
                    )}
                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 hover:text-primary"
                      >
                        <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{c.website.replace(/^https?:\/\//, "")}</span>
                      </a>
                    )}
                    {c.note && (
                      <p className="mt-2 text-muted-foreground italic border-t border-border pt-2 text-xs">
                        Ghi chú: {c.note}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <span className="text-sm font-medium text-muted-foreground px-2">
                Trang {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}

      {editing && (
        <EditDialog
          contact={editing}
          onClose={() => setEditing(null)}
          onSave={(note) => handleSaveEdit(editing.id, note)}
        />
      )}

      <PaymentModal
        open={showModal}
        onOpenChange={async (open) => {
          setShowModal(open);
          if (!open) {
            // Refresh wallet when modal is closed in case payment was approved
            const newWallet = await getMyWallet();
            setWallet(newWallet);
          }
        }}
        target={{
          name: "Mở rộng 500 liên hệ",
          price: 150000,
          subType: "contact_block_addon",
        }}
        userId={userId}
        bizId={null}
        bankInfo={bankInfo}
      />
    </DashboardShell>
  );
}

function EditDialog({
  contact,
  onClose,
  onSave,
}: {
  contact: SavedContact;
  onClose: () => void;
  onSave: (note: string) => void;
}) {
  const [note, setNote] = useState(contact.note || "");

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-glow">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-muted hover:bg-accent flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
        <h3 className="font-display text-xl font-bold mb-4">Ghi chú danh bạ</h3>

        <p className="text-sm text-muted-foreground mb-4">
          Tạo ghi chú cá nhân cho liên hệ này. Lưu ý: Tên liên hệ sẽ được đồng bộ tự động để luôn
          hiển thị đúng thông tin của họ.
        </p>

        <label className="text-xs font-medium text-muted-foreground">Ghi chú</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          maxLength={1000}
          className="w-full mt-1 mb-4 px-3 py-2 rounded-xl border border-border bg-card resize-none"
        />

        <Button
          onClick={() => onSave(note)}
          className="w-full bg-gradient-vivid hover:opacity-90 text-white border-0"
        >
          Lưu ghi chú
        </Button>
      </div>
    </div>
  );
}
