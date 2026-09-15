import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { BusinessFormValues } from "./schema";

export function ContactTab() {
  const {
    register,
    formState: { errors },
  } = useFormContext<BusinessFormValues>();

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="phone">Số điện thoại</Label>
          <Input id="phone" {...register("phone")} placeholder="+84 ..." />
        </div>
        <div>
          <Label htmlFor="email">Email công khai</Label>
          <Input id="email" type="email" {...register("email")} placeholder="contact@congty.com" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>
      </div>
      <div>
        <Label htmlFor="website">Website</Label>
        <Input id="website" type="url" {...register("website")} placeholder="https://congty.com" />
        {errors.website && <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>}
      </div>
    </div>
  );
}
