import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const [{ count: connections }, { count: businesses }] = await Promise.all([
      supabaseAdmin.from("connect_messages").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .eq("status", "public"),
    ]);
    return {
      connections: connections ?? 0,
      businesses: businesses ?? 0,
    };
  } catch (e) {
    // Fail gracefully — show demo data if DB is unreachable or keys are missing
    console.error("[getPublicStats] Could not fetch stats:", e);
    return { connections: 0, businesses: 0 };
  }
});
