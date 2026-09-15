import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UnlockedContact = {
  connected: boolean;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
};

export function isRealId(id: string) {
  return UUID_RE.test(id);
}

export async function isConnectedTo(businessId: string): Promise<boolean> {
  if (!isRealId(businessId)) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("connections")
    .select("id")
    .eq("requester_id", user.id)
    .eq("business_id", businessId)
    .maybeSingle();
  return !!data;
}

export async function connectAndExchange(businessId: string, source: "qr" | "manual") {
  if (!isRealId(businessId)) {
    return {
      ok: false as const,
      reason: "demo" as const,
      message: "Doanh nghiệp mẫu chưa hỗ trợ kết nối",
    };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, reason: "auth" as const };

  const { data, error } = await supabase.rpc("connect_and_exchange", {
    _business_id: businessId,
    _source: source,
  });
  if (error) return { ok: false as const, reason: "db" as const, message: error.message };
  return { ok: true as const, data: data as unknown as UnlockedContact };
}

export type WalletLimits = {
  max_saved_allowed: number;
  current_saved_count: number;
  blocks_purchased: number;
};

export async function getMyWallet(): Promise<WalletLimits | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ count }, { data: subs }] = await Promise.all([
    supabase
      .from("saved_contacts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("subscriptions")
      .select("status, sub_type, current_period_end")
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  let activeBlocks = 0;
  let addonBlocks = 0;
  if (subs) {
    for (const sub of subs) {
      if (!sub.current_period_end || new Date(sub.current_period_end) > new Date()) {
        if (sub.sub_type === "b2b_block_500") activeBlocks++;
        if (sub.sub_type === "contact_block_addon") addonBlocks++;
      }
    }
  }

  const limit = 200 + activeBlocks * 500 + addonBlocks * 500;

  return {
    current_saved_count: count ?? 0,
    max_saved_allowed: limit,
    blocks_purchased: activeBlocks,
  };
}

export async function buyContactBlock() {
  const { data, error } = await supabase.rpc("buy_contact_block");
  if (error) return { ok: false as const, message: error.message };
  return { ok: true as const, wallet: data as unknown as WalletLimits };
}
