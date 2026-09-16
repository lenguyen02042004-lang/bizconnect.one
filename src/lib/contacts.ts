import { supabase } from "@/integrations/supabase/client";
import type { BusinessProfile } from "@/types/business";

export async function saveBusinessContact(b: BusinessProfile) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) {
    return { ok: false, reason: "auth" as const };
  }

  const { error } = await supabase.from("saved_contacts").upsert(
    {
      user_id: user.id,
      business_id: b.id,
      business_name: b.name,
      business_slug: b.slug,
      website: b.website || null,
      logo_url: b.logo_url || null,
    },
    { onConflict: "user_id,business_id" },
  );

  if (error) {
    return { ok: false, reason: "db" as const, message: error.message };
  }
  return { ok: true };
}

export async function isContactSaved(businessId: string): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return false;
  const { data } = await supabase
    .from("saved_contacts")
    .select("id")
    .eq("user_id", user.id)
    .eq("business_id", businessId)
    .maybeSingle();
  return !!data;
}
