import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { formatCount } from "@/lib/format";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Props {
  businessId: string;
  initialCount?: number;
  variant?: "icon" | "full";
  className?: string;
}

export function FollowButton({ businessId, initialCount, variant = "full", className }: Props) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState<number>(initialCount ?? 0);
  const [loading, setLoading] = useState(false);

  // Initial fetch: real follower count (from businesses.followers_count, publicly readable)
  // + whether current user follows. The follows table is now restricted, so the
  // denormalized count on businesses (maintained by DB trigger) is what we read.
  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: biz }, sessionData] = await Promise.all([
        supabase.from("businesses").select("followers_count").eq("id", businessId).maybeSingle(),
        supabase.auth.getSession(),
      ]);
      if (!active) return;
      if (biz && typeof biz.followers_count === "number") setCount(biz.followers_count);
      const user = sessionData?.data?.session?.user;
      if (user) {
        const { data } = await supabase
          .from("follows")
          .select("id")
          .eq("business_id", businessId)
          .eq("follower_id", user.id)
          .maybeSingle();
        if (active) setFollowing(!!data);
      }
    })();
    return () => {
      active = false;
    };
  }, [businessId]);

  // Note: realtime subscription on `follows` intentionally removed — the
  // table is no longer part of the realtime publication to prevent leaking
  // follow events across users. Count updates rely on the denormalized
  // `businesses.followers_count` (refreshed on mount + optimistic UI).

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      toast.error("Vui lòng đăng nhập để theo dõi");
      navigate({ to: "/login" });
      return;
    }
    setLoading(true);
    // Optimistic
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setCount((c) => Math.max(0, c + (wasFollowing ? -1 : 1)));

    if (wasFollowing) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("business_id", businessId)
        .eq("follower_id", user.id);
      if (error) {
        setFollowing(true);
        setCount((c) => c + 1);
        toast.error(error.message);
      }
    } else {
      const { error } = await supabase.from("follows").insert({
        business_id: businessId,
        follower_id: user.id,
      });
      if (error) {
        console.error("Follow Insert Error:", error);
        setFollowing(false);
        setCount((c) => Math.max(0, c - 1));
        toast.error("Có lỗi xảy ra: " + error.message);
      }
    }
    setLoading(false);
  };

  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
        <Button
          type="button"
          size="icon"
          variant={following ? "default" : "outline"}
          onClick={handleToggle}
          disabled={loading}
          title={following ? "Bỏ theo dõi" : "Theo dõi"}
          className={`h-10 w-10 ${following ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}`}
        >
          <Heart className={`w-4 h-4 ${following ? "fill-current" : ""}`} />
        </Button>
        <span className="text-xs font-medium tabular-nums text-muted-foreground min-w-[1.5rem]">
          {formatCount(count)}
        </span>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={following ? "default" : "outline"}
      onClick={handleToggle}
      disabled={loading}
      className={`gap-1.5 ${following ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""} ${className ?? ""}`}
    >
      <Heart className={`w-3.5 h-3.5 ${following ? "fill-current" : ""}`} />
      <span className="text-xs font-medium">{following ? "Đang theo dõi" : "Theo dõi"}</span>
      <span className="text-xs opacity-75 tabular-nums">· {formatCount(count)}</span>
    </Button>
  );
}
