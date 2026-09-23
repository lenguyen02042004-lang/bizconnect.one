import { supabase } from "@/integrations/supabase/client";

export type PersonalProfile = {
  id: string;
  user_id: string;
  slug: string;
  full_name: string;
  job_title: string | null;
  company_name: string | null;
  phone: string | null;
  zalo: string | null;
  email: string | null;
  avatar_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  is_public: boolean;
};

export function slugifyProfile(name: string): string {
  const base = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  // Use a numeric suffix for cleaner looking URLs (e.g. 5 random digits)
  const suffix = Math.floor(10000 + Math.random() * 90000).toString();
  return `${base || "card"}-${suffix}`;
}

export async function getMyPersonalProfile(): Promise<PersonalProfile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("personal_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return (data as PersonalProfile) ?? null;
}

export type PersonalCardInput = {
  full_name: string;
  job_title?: string;
  company_name?: string;
  phone?: string;
  zalo?: string;
  email?: string;
  avatar_url?: string;
  facebook_url?: string;
  linkedin_url?: string;
  is_public?: boolean;
};

export async function upsertMyPersonalProfile(input: PersonalCardInput) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, reason: "auth" as const };

  const existing = await getMyPersonalProfile();
  const payload = {
    user_id: user.id,
    slug: existing?.slug ?? slugifyProfile(input.full_name),
    full_name: input.full_name,
    job_title: input.job_title || null,
    company_name: input.company_name || null,
    phone: input.phone || null,
    zalo: input.zalo || input.phone || null,
    email: input.email || user.email || null,
    avatar_url: input.avatar_url || null,
    facebook_url: input.facebook_url || null,
    linkedin_url: input.linkedin_url || null,
    is_public: input.is_public ?? true,
  };

  const { data, error } = await supabase
    .from("personal_profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select("*")
    .maybeSingle();

  if (error) return { ok: false as const, reason: "db" as const, message: error.message };
  return { ok: true as const, profile: data as PersonalProfile };
}
