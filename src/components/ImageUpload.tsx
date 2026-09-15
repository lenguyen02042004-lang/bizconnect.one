import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { uploadPublicFile } from "@/lib/upload";
import { toast } from "sonner";

interface Props {
  bucket: "avatars" | "business-logos" | "business-banners" | "business-gallery";
  userId: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  label: string;
  aspect?: "square" | "wide";
  className?: string;
}

export function ImageUpload({
  bucket,
  userId,
  value,
  onChange,
  label,
  aspect = "square",
  className,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Tệp vượt quá 5MB");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadPublicFile(bucket, file, userId);
      onChange(url);
      toast.success("Tải lên thành công");
    } catch (e: any) {
      toast.error(e.message ?? "Tải lên thất bại");
    } finally {
      setBusy(false);
    }
  };

  const aspectClass = aspect === "wide" ? "aspect-[3/1]" : "aspect-square";

  return (
    <div className={className}>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <div
        className={`relative ${aspectClass} rounded-2xl border-2 border-dashed border-border bg-muted/30 overflow-hidden group`}
      >
        {value ? (
          <>
            <img src={value} alt={label} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="w-full h-full flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-smooth disabled:opacity-50"
          >
            {busy ? (
              <Upload className="w-6 h-6 animate-pulse" />
            ) : (
              <ImageIcon className="w-6 h-6" />
            )}
            <span className="text-xs mt-1.5">{busy ? "Đang tải..." : "Bấm để tải lên"}</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}

interface GalleryProps {
  userId: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function GalleryUpload({ userId, value, onChange, max = 5 }: GalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const handleFiles = async (files: FileList) => {
    const remaining = max - value.length;
    if (remaining <= 0) {
      toast.error(`Tối đa ${max} ảnh`);
      return;
    }
    setBusy(true);
    try {
      const toUpload = Array.from(files).slice(0, remaining);
      const urls = await Promise.all(
        toUpload.map((f) => uploadPublicFile("business-gallery", f, userId)),
      );
      onChange([...value, ...urls]);
      toast.success(`Đã tải lên ${urls.length} ảnh`);
    } catch (e: any) {
      toast.error(e.message ?? "Tải lên thất bại");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">Thư viện ảnh (tối đa {max})</label>
      <div className="grid grid-cols-5 gap-2">
        {value.map((url, i) => (
          <div key={url} className="relative aspect-square rounded-xl overflow-hidden bg-muted">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:text-primary transition-smooth"
          >
            {busy ? (
              <Upload className="w-5 h-5 animate-pulse" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
    </div>
  );
}
