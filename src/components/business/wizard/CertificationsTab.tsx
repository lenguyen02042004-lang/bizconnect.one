import { useFieldArray, useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Award, Plus, Trash2 } from "lucide-react";
import { BusinessFormValues } from "./schema";

export function CertificationsTab() {
  const { control, register } = useFormContext<BusinessFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "certifications",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold">Chứng nhận & Danh hiệu</p>
          <p className="text-xs text-muted-foreground">
            Liệt kê các giải thưởng, chứng chỉ chất lượng, danh hiệu của doanh nghiệp.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => append({ name: "", issuer: "", year: null, icon: "🏅" })}
          className="gap-1.5"
        >
          <Plus className="w-4 h-4" /> Thêm
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-10 border border-dashed border-border rounded-xl">
          <Award className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chưa có chứng nhận nào.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="grid grid-cols-[auto_1fr_auto] gap-2 p-3 rounded-xl border border-border bg-accent/30"
            >
              <Input
                {...register(`certifications.${idx}.icon` as const)}
                placeholder="🏅"
                className="w-14 text-center text-xl"
                maxLength={2}
              />
              <div className="grid sm:grid-cols-[2fr_1.5fr_auto] gap-2">
                <Input
                  {...register(`certifications.${idx}.name` as const)}
                  placeholder="Tên chứng nhận / danh hiệu *"
                />
                <Input
                  {...register(`certifications.${idx}.issuer` as const)}
                  placeholder="Đơn vị cấp"
                />
                <Input
                  type="number"
                  {...register(`certifications.${idx}.year` as const, { valueAsNumber: true })}
                  placeholder="Năm"
                  className="w-24"
                  min={1900}
                  max={2100}
                />
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => remove(idx)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
