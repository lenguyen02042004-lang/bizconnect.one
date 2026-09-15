import { useFormContext } from "react-hook-form";
import { ImageUpload, GalleryUpload } from "@/components/ImageUpload";
import { BusinessFormValues } from "./schema";

export function MediaTab({ userId }: { userId: string }) {
  const { watch, setValue } = useFormContext<BusinessFormValues>();
  const bannerUrl = watch("banner_url");
  const gallery = watch("gallery");

  return (
    <div className="space-y-5">
      <ImageUpload
        bucket="business-banners"
        userId={userId}
        value={bannerUrl}
        onChange={(url) => setValue("banner_url", url, { shouldDirty: true })}
        label="Ảnh bìa (3:1)"
        aspect="wide"
      />
      <GalleryUpload
        userId={userId}
        value={gallery}
        onChange={(urls) => setValue("gallery", urls, { shouldDirty: true })}
      />
    </div>
  );
}
