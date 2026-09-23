import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

/**
 * Maps a country name to its ISO 2-letter code.
 */
export function getCountryCode(countryName) {
  if (!countryName) return null;
  const map = {
    China: "CN",
    Vietnam: "VN",
    "Viet Nam": "VN",
    Taiwan: "TW",
    "South Korea": "KR",
    Korea: "KR",
    Japan: "JP",
    Singapore: "SG",
    Malaysia: "MY",
    Thailand: "TH",
    India: "IN",
    "Hong Kong": "HK",
    USA: "US",
    "United States": "US",
    Germany: "DE",
    Italy: "IT",
    UK: "GB",
    France: "FR",
  };
  return map[countryName.trim()] || null;
}

/**
 * Converts text into a URL-friendly slug.
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Generates a random delay between min and max milliseconds.
 */
export function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ensures the system account exists and returns its user ID.
 */
export async function setupSystemAccount() {
  const email = "system@bizconnect.one";

  // Try to create directly
  const { data: newUser, error } = await supabase.auth.admin.createUser({
    email: email,
    password: "SystemPassword2026!",
    email_confirm: true,
    user_metadata: { name: "BizConnect System" },
  });

  if (error && error.code !== "email_exists" && error.code !== "user_already_exists") {
    throw error;
  }

  // If it exists, find it by listing all users (we can fetch up to 1000)
  const { data: usersData, error: listError } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  if (listError) throw listError;

  const user = usersData.users.find((u) => u.email === email);
  if (!user) throw new Error("Could not find system account even though it exists.");

  return user.id;
}

/**
 * Ensures an industry exists by name and returns its ID.
 */
export async function setupIndustry(industryName) {
  const slug = slugify(industryName);
  const { data: existing, error: findErr } = await supabase
    .from("industries")
    .select("*")
    .eq("slug", slug)
    .single();

  if (existing) return existing.id;

  const { data: newInd, error: insErr } = await supabase
    .from("industries")
    .insert([{ name: industryName, slug: slug, icon: "Factory" }])
    .select()
    .single();

  if (insErr) throw insErr;
  return newInd.id;
}
