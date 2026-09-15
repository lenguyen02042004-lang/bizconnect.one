import { useFormContext } from "react-hook-form";
import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  MapPinIcon,
  Phone,
  Mail,
  GlobeIcon,
  FileText,
  Award,
  Loader2,
  Sparkles,
  Eye,
} from "lucide-react";
import { SocialIconList } from "@/components/SocialIconList";
import { BusinessFormValues } from "./schema";

export function ReviewTab({
  industries,
  save,
  saving,
}: {
  industries: any[];
  save: (publish: boolean) => Promise<void>;
  saving: boolean;
}) {
  const { watch } = useFormContext<BusinessFormValues>();
  const form = watch();

  return (
    <div className="space-y-5">
      {/* Polished public-card preview */}
      <div className="relative rounded-3xl border border-border overflow-hidden bg-card shadow-card">
        <div className="relative h-36 sm:h-44 bg-gradient-vivid">
          {form.banner_url && (
            <img
              src={form.banner_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="px-5 sm:px-7 pb-6 -mt-12 relative">
          <div className="flex items-end gap-4">
            {form.logo_url ? (
              <img
                src={form.logo_url}
                alt=""
                className="w-24 h-24 rounded-2xl border-4 border-card bg-white object-cover shadow-pink"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl border-4 border-card bg-muted flex items-center justify-center text-muted-foreground shadow-pink">
                <Building2 className="w-9 h-9" />
              </div>
            )}
            <Badge
              variant={form.status === "public" ? "default" : "secondary"}
              className={`mb-2 ${form.status === "public" ? "bg-primary" : ""}`}
            >
              {form.status === "public" ? "● Công khai" : "● Bản nháp"}
            </Badge>
          </div>

          <h3 className="font-display font-bold text-2xl mt-3">
            {form.name || "Tên doanh nghiệp"}
          </h3>
          {form.short_intro && (
            <p className="text-sm text-muted-foreground mt-1">{form.short_intro}</p>
          )}

          <div className="flex flex-wrap gap-1.5 mt-3">
            {form.country_code && (
              <Badge variant="secondary" className="gap-1">
                <MapPinIcon className="w-3 h-3" />
                {form.country_code}
                {form.province ? ` · ${form.province}` : ""}
              </Badge>
            )}
            {form.industry_id && industries.find((i) => i.id === form.industry_id) && (
              <Badge variant="secondary">
                <Building2 className="w-3 h-3 mr-1" />
                {industries.find((i) => i.id === form.industry_id)!.name}
              </Badge>
            )}
          </div>

          {/* Contact row */}
          {(form.phone || form.email || form.website || form.address) && (
            <div className="mt-5 grid sm:grid-cols-2 gap-2 text-sm">
              {form.phone && (
                <div className="flex items-center gap-2 text-foreground/80">
                  <Phone className="w-4 h-4 text-primary" />
                  {form.phone}
                </div>
              )}
              {form.email && (
                <div className="flex items-center gap-2 text-foreground/80">
                  <Mail className="w-4 h-4 text-primary" />
                  {form.email}
                </div>
              )}
              {form.website && (
                <div className="flex items-center gap-2 text-foreground/80 truncate">
                  <GlobeIcon className="w-4 h-4 text-primary" />
                  {form.website.replace(/^https?:\/\//, "")}
                </div>
              )}
              {form.address && (
                <div className="flex items-center gap-2 text-foreground/80 truncate">
                  <MapPinIcon className="w-4 h-4 text-primary" />
                  {form.address}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {form.description && (
            <div className="mt-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                <FileText className="w-3.5 h-3.5" /> GIỚI THIỆU
              </p>
              <p className="text-sm leading-relaxed text-foreground/85 whitespace-pre-line line-clamp-6">
                {form.description}
              </p>
            </div>
          )}

          {/* Certifications */}
          {form.certifications && form.certifications.length > 0 && (
            <div className="mt-5">
              <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                <Award className="w-3.5 h-3.5" /> CHỨNG NHẬN & DANH HIỆU
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                {form.certifications.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-accent/40 border border-border/60"
                  >
                    <div className="text-xl leading-none mt-0.5">{c.icon || "🏅"}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {c.name || "(chưa đặt tên)"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {[c.issuer, c.year].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Socials */}
          {form.socials && Object.values(form.socials).filter(Boolean).length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                KẾT NỐI
              </p>
              <SocialIconList socials={form.socials as Record<string, string>} size="sm" />
            </div>
          )}

          {/* Gallery */}
          {form.gallery && form.gallery.length > 0 && (
            <div className="mt-5">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-2">
                THƯ VIỆN
              </p>
              <div className="grid grid-cols-5 gap-1.5">
                {form.gallery.slice(0, 5).map((src, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted">
                    <img src={src} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Checklist summary */}
      <div className="rounded-2xl bg-muted/40 border border-border p-4 text-sm grid sm:grid-cols-2 gap-x-6 gap-y-1">
        <p className="flex justify-between">
          <span className="text-muted-foreground">Trạng thái</span>
          <span className="font-medium">{form.status === "public" ? "Công khai" : "Bản nháp"}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Tọa độ</span>
          <span className="font-medium">
            {form.lat !== null && form.lng !== null
              ? `${form.lat.toFixed(3)}, ${form.lng.toFixed(3)}`
              : "Chưa có"}
          </span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Mô tả chi tiết</span>
          <span className="font-medium">
            {form.description ? `${form.description.length} ký tự` : "—"}
          </span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Chứng nhận</span>
          <span className="font-medium">{form.certifications?.length || 0} mục</span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Mạng xã hội</span>
          <span className="font-medium">
            {Object.values(form.socials || {}).filter(Boolean).length} liên kết
          </span>
        </p>
        <p className="flex justify-between">
          <span className="text-muted-foreground">Thư viện</span>
          <span className="font-medium">{form.gallery?.length || 0} ảnh</span>
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          onClick={() => save(true)}
          disabled={saving}
          className="flex-1 h-11 gap-2 bg-gradient-vivid text-white border-0 shadow-pink"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {form.status === "public" ? "Cập nhật trang công khai" : "Xuất bản ngay"}
        </Button>
        {form.id && form.status === "public" && (
          <Link to="/business/$slug" params={{ slug: form.slug }} className="flex-1">
            <Button variant="outline" className="w-full h-11 gap-2">
              <Eye className="w-4 h-4" /> Xem trang công khai
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
