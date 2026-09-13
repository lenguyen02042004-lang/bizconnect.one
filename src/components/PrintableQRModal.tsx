import React from "react";
import { X, Share2, Download, Printer } from "lucide-react";
import type { BusinessProfile } from "@/types/business";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PrintableQRModalProps {
  business: BusinessProfile;
  qrUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PrintableQRModal({ business, qrUrl, isOpen, onClose }: PrintableQRModalProps) {
  const isLocal = typeof window !== "undefined" && window.location.origin.includes("localhost");
  const profileUrl = typeof window !== "undefined" ? `${isLocal ? "https://bizconnect.one" : window.location.origin}/business/${business.slug}` : "";

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Danh thiếp doanh nghiệp: ${business.name}`,
          text: `Khám phá danh thiếp của ${business.name} trên BizConnect`,
          url: profileUrl,
        });
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast.success("Đã sao chép đường dẫn!");
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleDownloadImage = async () => {
    try {
      const { toPng } = await import("html-to-image");
      const element = document.getElementById("print-area");
      if (!element) return;
      toast.info("Đang tạo ảnh...");
      const dataUrl = await toPng(element, { backgroundColor: '#ffffff', pixelRatio: 2, style: { transform: 'scale(1)', transformOrigin: 'top left' } });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `card_${business.slug}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã tải danh thiếp xuống!");
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi tải ảnh");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-sm sm:max-w-md bg-white border-gray-200 text-black p-0 overflow-y-auto max-h-[95dvh] shadow-2xl printable-modal"
        style={{ zIndex: 1100 }}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 no-print">
          <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-gray-800">
            Card visit • {business.name}
          </DialogTitle>
          <DialogClose asChild>
            <button className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-colors">
              <X className="w-4 h-4" />
            </button>
          </DialogClose>
        </div>

        <div id="print-area" className="p-4 sm:p-6 pb-6 flex flex-col items-center text-center print-area bg-white">
          <div className="w-full flex justify-center mb-3">
            {business.logo_url && (
              <img src={`https://wsrv.nl/?url=${encodeURIComponent(business.logo_url)}`} alt="Logo" className="h-12 sm:h-14 object-contain" crossOrigin="anonymous" />
            )}
          </div>
          
          <div className="bg-white border border-gray-200 rounded-3xl p-3 shadow-sm mb-4 w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center print-qr-container">
            {qrUrl ? (
              <img src={qrUrl} alt={`QR Code ${business.name}`} className="w-full h-full object-contain rounded-2xl" />
            ) : (
              <div className="w-full h-full bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400">Loading...</div>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-bold mb-1.5 text-wrap w-full px-2 text-black">{business.name}</h2>
          <p className="text-[#c8102e] text-xs font-bold tracking-widest uppercase mb-3 text-wrap w-full px-2">
            {business.industry || "BUSINESS"}
          </p>

          <div className="space-y-1.5 text-sm text-gray-600 w-full px-4 text-left border-t border-gray-100 pt-3">
            {(business.address || business.province) && (
              <p className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-gray-400 uppercase">Địa chỉ</span>
                <span className="text-black text-wrap">{[business.address, business.province].filter(Boolean).join(", ")}</span>
              </p>
            )}
            {business.phone && (
              <p className="flex flex-col gap-0.5 mt-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">Điện thoại</span>
                <span className="font-semibold text-black">{business.phone}</span>
              </p>
            )}
            {business.website && (
              <p className="flex flex-col gap-0.5 mt-2">
                <span className="text-xs font-semibold text-gray-400 uppercase">Website</span>
                <span className="text-[#c8102e] font-mono text-wrap">{business.website.replace(/^https?:\/\//, "")}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 bg-gray-50 border-t border-gray-200 no-print">
          <Button variant="outline" className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-100 h-11 rounded-xl" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" /> Chia sẻ
          </Button>
          <Button variant="outline" className="flex-1 bg-white border-gray-200 text-gray-700 hover:bg-gray-100 h-11 rounded-xl" onClick={handleDownloadImage}>
            <Download className="w-4 h-4 mr-2" /> Tải ảnh
          </Button>
          <Button className="flex-1 bg-[#c8102e] text-white border-0 hover:bg-[#a00d24] h-11 rounded-xl shadow-lg" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> In
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
