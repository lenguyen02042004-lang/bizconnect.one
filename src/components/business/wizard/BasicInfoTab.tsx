import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/ImageUpload";
import { slugify } from "@/lib/upload";
import { BusinessFormValues } from "./schema";

export function BasicInfoTab({ industries, userId }: { industries: any[]; userId: string }) {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<BusinessFormValues>();
  const logoUrl = watch("logo_url");
  const industryId = watch("industry_id");

  return (
    <div className="grid sm:grid-cols-[1fr_auto] gap-5 items-start">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Tên doanh nghiệp *</Label>
          <Input
            id="name"
            {...register("name", {
              onChange: (e) => {
                if (!watch("id") && !watch("slug")) {
                  setValue("slug", slugify(e.target.value), { shouldDirty: true });
                }
              },
            })}
            placeholder="Công ty TNHH ABC"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <Label htmlFor="slug">Đường dẫn (slug)</Label>
          <Input
            id="slug"
            {...register("slug")}
            onChange={(e) => setValue("slug", slugify(e.target.value), { shouldDirty: true })}
            placeholder="cong-ty-abc"
          />
          <p className="text-xs text-muted-foreground mt-1">
            URL: /business/{watch("slug") || "cong-ty-abc"}
          </p>
        </div>
        <div>
          <Label>Ngành nghề</Label>
          <Select
            value={industryId ?? ""}
            onValueChange={(v) => setValue("industry_id", v, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn ngành nghề" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {industries.map((i) => (
                <SelectItem key={i.id} value={i.id}>
                  {i.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <ImageUpload
        bucket="business-logos"
        userId={userId}
        value={logoUrl}
        onChange={(url) => setValue("logo_url", url, { shouldDirty: true })}
        label="Logo"
        aspect="square"
      />
    </div>
  );
}
