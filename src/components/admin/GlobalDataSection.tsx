import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Globe, LayoutGrid, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function GlobalDataSection({
  createCountryFn,
  createIndustryFn,
}: {
  createCountryFn: (args: any) => Promise<any>;
  createIndustryFn: (args: any) => Promise<any>;
}) {
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [countryFlag, setCountryFlag] = useState("");

  const [industrySlug, setIndustrySlug] = useState("");
  const [industryName, setIndustryName] = useState("");
  const [industryIcon, setIndustryIcon] = useState("");

  const countryMut = useMutation({
    mutationFn: async () => {
      if (!countryCode || !countryName || !countryFlag) {
        throw new Error("Vui lòng điền đầy đủ Mã, Tên và Cờ quốc gia");
      }
      return await createCountryFn({ data: { code: countryCode, name: countryName, flag: countryFlag } });
    },
    onSuccess: () => {
      toast.success("Thêm quốc gia thành công!");
      setCountryCode("");
      setCountryName("");
      setCountryFlag("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể thêm quốc gia");
    },
  });

  const industryMut = useMutation({
    mutationFn: async () => {
      if (!industrySlug || !industryName) {
        throw new Error("Vui lòng điền đầy đủ Slug và Tên danh mục");
      }
      return await createIndustryFn({ data: { slug: industrySlug, name: industryName, icon: industryIcon || undefined } });
    },
    onSuccess: () => {
      toast.success("Thêm danh mục thành công!");
      setIndustrySlug("");
      setIndustryName("");
      setIndustryIcon("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Không thể thêm danh mục");
    },
  });

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold font-display">Quản lý Dữ liệu Hệ thống (Global Data)</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Country Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold">Thêm Quốc gia</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Mã (Code, 2 ký tự)</label>
              <Input
                placeholder="VD: VN, US, JP"
                maxLength={2}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tên hiển thị</label>
              <Input
                placeholder="VD: Việt Nam, Hoa Kỳ"
                value={countryName}
                onChange={(e) => setCountryName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Cờ (Emoji)</label>
              <Input
                placeholder="VD: 🇻🇳, 🇺🇸"
                value={countryFlag}
                onChange={(e) => setCountryFlag(e.target.value)}
              />
            </div>
            <Button
              className="w-full mt-2"
              onClick={() => countryMut.mutate()}
              disabled={countryMut.isPending}
            >
              {countryMut.isPending ? "Đang xử lý..." : <><Plus className="w-4 h-4 mr-1.5" /> Thêm Quốc gia</>}
            </Button>
          </div>
        </div>

        {/* Create Industry Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-semibold">Thêm Ngành nghề</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">URL Slug (không dấu, cách bằng -)</label>
              <Input
                placeholder="VD: cong-nghe, fnb, ban-le"
                value={industrySlug}
                onChange={(e) => setIndustrySlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Tên ngành nghề</label>
              <Input
                placeholder="VD: Công nghệ, F&B, Bán lẻ"
                value={industryName}
                onChange={(e) => setIndustryName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Icon (Emoji - Tuỳ chọn)</label>
              <Input
                placeholder="VD: 💻, 🍽️, 🛍️"
                value={industryIcon}
                onChange={(e) => setIndustryIcon(e.target.value)}
              />
            </div>
            <Button
              className="w-full mt-2"
              onClick={() => industryMut.mutate()}
              disabled={industryMut.isPending}
            >
              {industryMut.isPending ? "Đang xử lý..." : <><Plus className="w-4 h-4 mr-1.5" /> Thêm Danh mục</>}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
