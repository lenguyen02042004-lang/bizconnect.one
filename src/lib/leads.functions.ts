import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Lead = {
  id: string;
  created_at: string;
  source: string;
  business_id: string;
  business_name: string;
  full_name: string;
  job_title: string | null;
  company_name: string | null;
  phone: string | null;
  zalo: string | null;
  email: string | null;
  avatar_url: string | null;
  slug: string | null;
};

export const getMyLeads = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ leads: Lead[] }> => {
    const { supabase, userId } = context;
    const { data: bizs } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("owner_id", userId);
    if (!bizs?.length) return { leads: [] };
    const bizMap = new Map(bizs.map((b) => [b.id, b.name]));

    const { data: conns, error } = await supabase
      .from("connections")
      .select("id, created_at, source, business_id, requester_id")
      .in(
        "business_id",
        bizs.map((b) => b.id),
      )
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw new Error(error.message);
    if (!conns?.length) return { leads: [] };

    // Requester profiles may be private; owner of the scanned business is entitled to the lead.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const ids = Array.from(new Set(conns.map((c) => c.requester_id)));
    const [{ data: pps }, { data: profs }] = await Promise.all([
      supabaseAdmin
        .from("personal_profiles")
        .select("user_id, slug, full_name, job_title, company_name, phone, zalo, email, avatar_url")
        .in("user_id", ids),
      supabaseAdmin.from("profiles").select("id, display_name, email, avatar_url").in("id", ids),
    ]);
    const ppMap = new Map((pps ?? []).map((p) => [p.user_id, p]));
    const prMap = new Map((profs ?? []).map((p) => [p.id, p]));

    const leads: Lead[] = conns.map((c) => {
      const pp = ppMap.get(c.requester_id);
      const pr = prMap.get(c.requester_id);
      return {
        id: c.id,
        created_at: c.created_at,
        source: c.source,
        business_id: c.business_id,
        business_name: bizMap.get(c.business_id) ?? "",
        full_name: pp?.full_name ?? pr?.display_name ?? "Khách",
        job_title: pp?.job_title ?? null,
        company_name: pp?.company_name ?? null,
        phone: pp?.phone ?? null,
        zalo: pp?.zalo ?? null,
        email: pp?.email ?? pr?.email ?? null,
        avatar_url: pp?.avatar_url ?? pr?.avatar_url ?? null,
        slug: pp?.slug ?? null,
      };
    });
    return { leads };
  });
