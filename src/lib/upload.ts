import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";

/**
 * Upload a file to a public Supabase storage bucket under {userId}/{filename}.
 * Returns the public URL. RLS expects folder name to equal the auth user id.
 */
export async function uploadPublicFile(
  bucket: "avatars" | "business-logos" | "business-banners" | "business-gallery" | "receipts",
  file: File,
  userId: string,
): Promise<string> {
  let fileToUpload = file;

  if (file.type.startsWith("image/")) {
    try {
      const options = {
        maxSizeMB: 0.2,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/webp" as string,
      };
      
      const compressedBlob = await imageCompression(file, options);
      const newName = file.name.replace(/\.[^/.]+$/, ".webp");
      fileToUpload = new File([compressedBlob], newName, {
        type: "image/webp",
      });
    } catch (error) {
      console.error("Lỗi khi nén ảnh, sẽ dùng ảnh gốc:", error);
    }
  }

  const ext = fileToUpload.name.split(".").pop()?.toLowerCase() || "webp";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(bucket).upload(path, fileToUpload, {
    cacheControl: "3600",
    upsert: false,
    contentType: fileToUpload.type,
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
