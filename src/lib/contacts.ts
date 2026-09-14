import { supabase } from "@/integrations/supabase/client";
import type { BusinessProfile } from "@/types/business";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function saveBusinessContact(b: BusinessProfile) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "auth" as const };

  // Skip DB for non-uuid demo ids
  if (!UUID_RE.test(b.id)) {
    return { ok: true, demo: true };
  }

  const { error } = await supabase.from("saved_contacts").upsert(
    {
      user_id: user.id,
      business_id: b.id,
      business_name: b.name,
      business_slug: b.slug,
      industry: b.industry,
      country_name: b.country_name,
      province: b.province,
      phone: b.phone || null,
      email: b.email || null,
      website: b.website || null,
      logo_url: b.logo_url || null,
    },
    { onConflict: "user_id,business_id" },
  );
  if (error) return { ok: false, reason: "db" as const, message: error.message };
  return { ok: true };
}

export async function isContactSaved(businessId: string): Promise<boolean> {
  if (!UUID_RE.test(businessId)) return false;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("saved_contacts")
    .select("id")
    .eq("user_id", user.id)
    .eq("business_id", businessId)
    .maybeSingle();
  return !!data;
}
