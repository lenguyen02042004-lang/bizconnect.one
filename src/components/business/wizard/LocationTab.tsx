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
import { GeocodeField } from "@/components/GeocodeField";
import { COUNTRY_LIST } from "@/lib/constants";
import { BusinessFormValues } from "./schema";

export function LocationTab() {
  const { register, watch, setValue } = useFormContext<BusinessFormValues>();
  const address = watch("address");
  const lat = watch("lat");
  const lng = watch("lng");
  const country_code = watch("country_code");
  const province = watch("province");

  return (
    <div className="space-y-4">
      <GeocodeField
        value={{ address, lat, lng, country_code, province }}
        onChange={(v) => {
          if (v.address !== undefined) setValue("address", v.address, { shouldDirty: true });
          if (v.lat !== undefined) setValue("lat", v.lat, { shouldDirty: true });
          if (v.lng !== undefined) setValue("lng", v.lng, { shouldDirty: true });
          if (v.country_code !== undefined)
            setValue("country_code", v.country_code, { shouldDirty: true });
          if (v.province !== undefined) setValue("province", v.province, { shouldDirty: true });
        }}
      />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Quốc gia</Label>
          <Select
            value={country_code ?? ""}
            onValueChange={(v) => setValue("country_code", v, { shouldDirty: true })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {COUNTRY_LIST.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="inline-flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted">
                      {c.code}
                    </span>
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="province">Tỉnh/Thành phố</Label>
          <Input id="province" {...register("province")} />
        </div>
      </div>
    </div>
  );
}
