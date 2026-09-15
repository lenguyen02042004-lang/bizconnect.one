import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SOCIAL_PLATFORMS } from "@/lib/social-platforms";
import { BusinessFormValues } from "./schema";

export function SocialTab() {
  const { register } = useFormContext<BusinessFormValues>();

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Nhập đường dẫn cho các nền tảng bạn sử dụng. Để trống nếu không có.
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {SOCIAL_PLATFORMS.map((p) => (
          <div key={p.key}>
            <Label className="text-xs">{p.name}</Label>
            <Input {...register(`socials.${p.key}`)} placeholder={p.placeholder} />
          </div>
        ))}
      </div>
    </div>
  );
}
