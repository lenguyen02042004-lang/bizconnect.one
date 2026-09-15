import { supabase } from "@/integrations/supabase/client";

/**
 * Upload a file to a public Supabase storage bucket under {userId}/{filename}.
 * Returns the public URL. RLS expects folder name to equal the auth user id.
 */
export async function uploadPublicFile(
  bucket: "avatars" | "business-logos" | "business-banners" | "business-gallery" | "receipts",
  file: File,
  userId: string,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export function slugify(input: string): string {
  if (!input) return "business";
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "business"
  );
}
