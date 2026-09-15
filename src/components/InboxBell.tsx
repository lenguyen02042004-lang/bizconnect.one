import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export function InboxBell() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const [bizIds, setBizIds] = useState<string[]>([]);

  // Load my business ids + initial unread count
  useEffect(() => {
    if (!user) {
      setUnread(0);
      setBizIds([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: bizes } = await supabase
        .from("businesses")
        .select("id, name")
        .eq("owner_id", user.id);
      if (cancelled) return;
      const ids = (bizes ?? []).map((b) => b.id);
      setBizIds(ids);
      if (ids.length === 0) {
        setUnread(0);
        return;
      }
      const { count } = await supabase
        .from("connect_messages")
        .select("*", { count: "exact", head: true })
        .in("to_business_id", ids)
        .is("read_at", null);
      if (!cancelled) setUnread(count ?? 0);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Realtime subscription
  useEffect(() => {
    if (!user || bizIds.length === 0) return;
    const idSet = new Set(bizIds);
    const channel = supabase
      .channel(`inbox-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "connect_messages" },
        (payload) => {
          const row = payload.new as {
            to_business_id: string;
            subject?: string;
            from_business_id?: string;
          };
          if (!idSet.has(row.to_business_id)) return;
          setUnread((u) => u + 1);
          toast("📩 Lời ngỏ giao thương mới", {
            description: row.subject ?? "Bạn có yêu cầu kết nối mới.",
            action: { label: "Mở hộp thư", onClick: () => (window.location.href = "/inbox") },
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "connect_messages" },
        (payload) => {
          const row = payload.new as { to_business_id: string; read_at: string | null };
          const old = payload.old as { read_at: string | null };
          if (!idSet.has(row.to_business_id)) return;
          // Transition from unread -> read: decrement
          if (!old.read_at && row.read_at) setUnread((u) => Math.max(0, u - 1));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, bizIds]);

  if (!user) return null;

  return (
    <Link to="/inbox" className="relative">
      <Button variant="ghost" size="icon" title="Hộp thư">
        <Inbox className="w-4 h-4" />
      </Button>
      {unread > 0 && (
        <span
          aria-label={`${unread} lời ngỏ chưa đọc`}
          className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center shadow-pink border-2 border-background pointer-events-none"
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
