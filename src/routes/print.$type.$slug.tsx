import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { getPersonalBySlug } from "@/lib/personal-public.functions";
import { getBusinessBySlug } from "@/lib/business-public.functions";
import { Printer, ArrowLeft, QrCode } from "lucide-react";

type Size = "card" | "card-back" | "a6" | "a5" | "poster";

const SIZES: { key: Size; label: string; w: number; h: number }[] = [
  { key: "card", label: "Card visit — mặt trước (9 × 5.4 cm)", w: 90, h: 54 },
  { key: "card-back", label: "Card visit — mặt sau QR (9 × 5.4 cm)", w: 90, h: 54 },
  { key: "a6", label: "Standee A6 (10.5 × 14.8 cm)", w: 105, h: 148 },
  { key: "a5", label: "Standee A5 (14.8 × 21 cm)", w: 148, h: 210 },
  { key: "poster", label: "Bảng dán QR A4 (21 × 29.7 cm)", w: 210, h: 297 },
];

export const Route = createFileRoute("/print/$type/$slug")({
  loader: async ({ params }) => {
    if (params.type !== "personal" && params.type !== "business") throw notFound();
    if (params.type === "personal") {
      const { profile } = await getPersonalBySlug({ data: { slug: params.slug } });
      if (!profile) throw notFound();
      return {
        kind: "personal" as const,
        title: profile.full_name,
        subtitle: [profile.job_title, profile.company_name].filter(Boolean).join(" · "),
        phone: profile.phone ?? "",
        email: profile.email ?? "",
        website: "",
        extra: profile.zalo ? `Zalo: ${profile.zalo}` : "",
        tagline: "",
        image: profile.avatar_url ?? "",
        path: `/p/${params.slug}`,
      };
    }
    const { business } = await getBusinessBySlug({ data: { slug: params.slug } });
    if (!business) throw notFound();
    return {
      kind: "business" as const,
      title: business.name,
      subtitle: business.industry,
      phone: business.phone,
      email: business.email,
      website: business.website ?? "",
      extra: [business.address, business.province, business.country_name].filter(Boolean).join(", "),
      tagline: business.short_intro ?? "",
      image: business.logo_url,
      path: `/business/${params.slug}`,
    };
  },
  head: () => ({
    meta: [
      { title: "Xuất bản in — Card visit, standee & bảng QR" },
      { name: "description", content: "Tạo bản in card visit 9×5.4 cm hai mặt, standee A5/A6 và bảng dán QR A4 để khách quét kết nối." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PrintPage,
});

function PrintPage() {
  const data = Route.useLoaderData();
  const [size, setSize] = useState<Size>("card");
  const [qr, setQr] = useState("");

  const url = typeof window !== "undefined" ? `https://bizconnect.one${data.path}?src=qr` : "";
  const cleanUrl = url.replace(/^https?:\/\//, "").replace(/\?src=qr$/, "");

  useEffect(() => {
    if (!url) return;
    QRCode.toDataURL(url, { margin: 0, width: 1200, color: { dark: "#111111", light: "#ffffff" } }).then(setQr);
  }, [url]);

  const s = SIZES.find((x) => x.key === size)!;
  const isCard = size === "card";
  const isBack = size === "card-back";
  const isPoster = size === "poster";

  return (
    <div className="min-h-screen bg-muted/40">
      <style>{`@media print { .no-print { display:none !important } body { background:#fff } .sheet { box-shadow:none !important; margin:0 !important } @page { margin: 8mm } }`}</style>

      <div className="no-print border-b border-border bg-background px-4 py-3 flex flex-wrap items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => history.back()} className="gap-1.5"><ArrowLeft className="w-4 h-4" /> Quay lại</Button>
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((o) => (
            <Button key={o.key} size="sm" variant={o.key === size ? "default" : "outline"} onClick={() => setSize(o.key)}>{o.label}</Button>
          ))}
        </div>
        <Button size="sm" onClick={() => window.print()} className="ml-auto gap-1.5 bg-gradient-vivid text-white border-0">
          <Printer className="w-4 h-4" /> In / Lưu PDF
        </Button>
      </div>

      <div className="p-6 flex justify-center">
        <div
          className="sheet bg-white text-black shadow-lg flex flex-col overflow-hidden"
          style={{ width: `${s.w}mm`, height: `${s.h}mm`, padding: isCard || isBack ? "5mm" : isPoster ? "16mm" : "12mm" }}
        >
          {/* MẶT TRƯỚC CARD VISIT — bố cục chuẩn: nhận diện trái, liên hệ dưới, QR nhỏ góc phải */}
          {isCard && (
            <>
              <div className="flex items-start gap-3">
                {data.image && <img src={data.image} alt="" className="w-[14mm] h-[14mm] object-cover rounded-[1.5mm]" />}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-[12pt] leading-tight">{data.title}</p>
                  {data.subtitle && <p className="text-[7.5pt] text-neutral-600 leading-snug">{data.subtitle}</p>}
                </div>
                {qr && <img src={qr} alt="Mã QR" style={{ width: "15mm", height: "15mm" }} />}
              </div>
              <div className="mt-auto pt-[2mm] border-t border-neutral-300 text-[7.5pt] leading-[1.35]">
                {data.phone && <p>ĐT: {data.phone}</p>}
                {data.email && <p className="break-all">Email: {data.email}</p>}
                {data.website && <p className="break-all">{data.website.replace(/^https?:\/\//, "")}</p>}
                {data.extra && <p className="text-neutral-600 line-clamp-2">{data.extra}</p>}
              </div>
            </>
          )}

          {/* MẶT SAU CARD VISIT — QR lớn để quét kết nối */}
          {isBack && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-[2mm]">
              {qr && <img src={qr} alt="Mã QR" style={{ width: "28mm", height: "28mm" }} />}
              <p className="text-[8pt] font-semibold">Quét mã để kết nối giao thương</p>
              <p className="text-[6.5pt] text-neutral-500 break-all">{cleanUrl}</p>
            </div>
          )}

          {/* STANDEE A5/A6 và BẢNG DÁN QR A4 */}
          {!isCard && !isBack && (
            <>
              <div className="text-center">
                {data.image && (
                  <img
                    src={data.image}
                    alt=""
                    className="object-cover rounded-xl mx-auto mb-3"
                    style={{ width: isPoster ? "38mm" : "24mm", height: isPoster ? "38mm" : "24mm" }}
                  />
                )}
                <p className="font-bold leading-tight" style={{ fontSize: isPoster ? "30pt" : "20pt" }}>{data.title}</p>
                {data.subtitle && <p className="text-neutral-600 mt-1" style={{ fontSize: isPoster ? "14pt" : "11pt" }}>{data.subtitle}</p>}
                {isPoster && data.tagline && (
                  <p className="text-neutral-700 mt-2 text-[12pt] leading-snug">{data.tagline}</p>
                )}
              </div>

              <div className="mt-auto flex flex-col items-center gap-3 text-center">
                {qr && <img src={qr} alt="Mã QR" style={{ width: isPoster ? "85mm" : "45mm", height: isPoster ? "85mm" : "45mm" }} />}
                <p className="font-semibold" style={{ fontSize: isPoster ? "16pt" : "10pt" }}>
                  Quét mã QR để xem hồ sơ &amp; kết nối giao thương
                </p>
                <div className="leading-relaxed" style={{ fontSize: isPoster ? "12pt" : "10pt" }}>
                  {data.phone && <p>{data.phone}</p>}
                  {data.email && <p className="break-all">{data.email}</p>}
                  {data.website && <p className="break-all">{data.website.replace(/^https?:\/\//, "")}</p>}
                  {data.extra && <p className="text-neutral-600">{data.extra}</p>}
                  <p className="text-neutral-500 break-all">{cleanUrl}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <p className="no-print text-center text-xs text-muted-foreground pb-8 flex items-center justify-center gap-1.5">
        <QrCode className="w-3.5 h-3.5" /> In mặt trước và mặt sau để có card visit hai mặt; bản A4 dùng để dán tại gian hàng.
      </p>
    </div>
  );
}
