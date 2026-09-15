import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMyBusinesses, sendCardVisit, getMyQuota } from "@/lib/messaging.functions";
import { getMyPersonalProfile } from "@/lib/personal-card";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Props {
  toId: string;
  toName: string;
  toType: "business" | "personal";
  onClose: () => void;
}

export function SendCardDialog({ toId, toName, toType, onClose }: Props) {
  const { user, accountType } = useAuth();
  const myBiz = useServerFn(getMyBusinesses);
  const myProfileFn = useServerFn(getMyPersonalProfile);
  const quotaFn = useServerFn(getMyQuota);
  const sendFn = useServerFn(sendCardVisit);

  const [fromId, setFromId] = useState<string>("");
  const [fromType, setFromType] = useState<"business" | "personal">("personal");
  const [subject, setSubject] = useState("Xin chào, tôi muốn kết nối giao thương");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  const bizQ = useQuery({
    queryKey: ["my-bizes"],
    queryFn: () => myBiz(),
    enabled: !!user,
  });
  const profileQ = useQuery({
    queryKey: ["my-profile"],
    queryFn: () => myProfileFn(),
    enabled: !!user,
  });

  const myBizList = bizQ.data?.businesses ?? [];
  const hasPersonal = !!profileQ.data;

  const quotaQ = useQuery({
    queryKey: ["quota"],
    enabled: !!user,
    queryFn: () => quotaFn(),
  });

  if (!user) {
    return (
      <Modal onClose={onClose}>
        <h3 className="font-display text-xl font-bold mb-2">Đăng nhập để gửi danh thiếp</h3>
        <p className="text-sm text-muted-foreground">
          Bạn cần đăng nhập để gửi thẻ danh thiếp kết nối.
        </p>
      </Modal>
    );
  }

  if (
    !bizQ.isLoading &&
    !profileQ.isLoading &&
    accountType === "business" &&
    myBizList.length === 0
  ) {
    return (
      <Modal onClose={onClose}>
        <h3 className="font-display text-xl font-bold mb-2">Bạn chưa tạo doanh nghiệp nào</h3>
        <p className="text-sm text-muted-foreground">
          Hãy tạo hồ sơ doanh nghiệp trước khi kết nối.
        </p>
      </Modal>
    );
  }

  if (!profileQ.isLoading && accountType === "personal" && !hasPersonal) {
    return (
      <Modal onClose={onClose}>
        <h3 className="font-display text-xl font-bold mb-2">Bạn chưa tạo thẻ</h3>
        <p className="text-sm text-muted-foreground">
          Hãy tạo danh thiếp cá nhân trước khi kết nối.
        </p>
      </Modal>
    );
  }

  // Set default selection when data loads
  if (fromId === "" && user) {
    if (user && accountType === "personal") {
      setFromId(user.id);
      setFromType("personal");
    } else if (myBizList.length > 0) {
      setFromId(myBizList[0].id);
      setFromType("business");
    }
  }

  async function handleSend() {
    if (!fromId || !subject.trim() || !body.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung");
      return;
    }
    setSending(true);
    try {
      await sendFn({
        data: {
          from_business: fromType === "business" ? fromId : undefined,
          from_user: fromType === "personal" ? user?.id : undefined,
          to_business: toType === "business" ? toId : undefined,
          to_user: toType === "personal" ? toId : undefined,
          subject,
          body,
        },
      });
      toast.success("Đã gửi danh thiếp thành công!");
      onClose();
    } catch (e: any) {
      toast.error(e.message ?? "Gửi thất bại");
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <h3 className="font-display text-xl font-bold mb-1">Gửi danh thiếp đến</h3>
      <p className="text-primary font-semibold mb-4">{toName}</p>

      {accountType === "business" ? (
        <>
          <label className="text-xs font-medium text-muted-foreground">Gửi từ doanh nghiệp</label>
          <select
            value={`${fromType}:${fromId}`}
            onChange={(e) => {
              const [type, id] = e.target.value.split(":");
              setFromType(type as "business" | "personal");
              setFromId(id);
            }}
            className="w-full mt-1 mb-3 px-3 py-2 rounded-xl border border-border bg-card"
          >
            {myBizList.map((b) => (
              <option key={b.id} value={`business:${b.id}`}>
                Doanh nghiệp: {b.name}
              </option>
            ))}
          </select>
        </>
      ) : (
        <p className="text-sm text-muted-foreground mb-3 font-medium">
          Bạn đang gửi bằng tư cách cá nhân.
        </p>
      )}

      {quotaQ.data && (
        <p className="text-xs text-muted-foreground mb-3">
          Tài khoản của bạn còn lại {Math.max(0, quotaQ.data.limit - quotaQ.data.used_count)} /{" "}
          {quotaQ.data.limit} lượt gửi trong năm nay.
        </p>
      )}

      <label className="text-xs font-medium text-muted-foreground">Tiêu đề (Lời ngỏ)</label>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        maxLength={200}
        className="w-full mt-1 mb-3 px-3 py-2 rounded-xl border border-border bg-card"
      />

      <label className="text-xs font-medium text-muted-foreground">
        Nội dung (Chi tiết lý do kết nối)
      </label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={2000}
        placeholder="Ví dụ: Xin chào, tôi ấn tượng với dự án của bạn và muốn mời hợp tác..."
        className="w-full mt-1 mb-4 px-3 py-2 rounded-xl border border-border bg-card resize-none"
      />

      <Button
        onClick={handleSend}
        disabled={sending || (quotaQ.data?.limit ?? 0) - (quotaQ.data?.used_count ?? 0) <= 0}
        className="w-full bg-gradient-vivid hover:opacity-90 text-white border-0"
      >
        <Send className="w-4 h-4 mr-2" />
        {sending ? "Đang gửi..." : "Gửi danh thiếp"}
      </Button>
    </Modal>
  );
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
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
        {children}
      </div>
    </div>
  );
}
