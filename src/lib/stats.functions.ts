import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getPublicStats = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const { data, error } = await supabaseAdmin.rpc("get_public_stats");
    if (error) throw error;
    const stats = (data ?? {}) as {
      connections?: number;
      businesses?: number;
      industryCounts?: Record<string, number>;
    };
    return {
      connections: stats.connections ?? 0,
      businesses: stats.businesses ?? 0,
      industryCounts: stats.industryCounts ?? {},
    };
  } catch (e) {
    // Fail gracefully — show demo data if DB is unreachable or keys are missing
    console.error("[getPublicStats] Could not fetch stats:", e);
    return { connections: 0, businesses: 0, industryCounts: {} };
  }
});
