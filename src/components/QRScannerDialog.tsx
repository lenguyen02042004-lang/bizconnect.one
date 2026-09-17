import { useEffect, useRef, useState } from "react";
import * as ZXing from "@zxing/library";
import { X, ScanLine, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PostScanSheet, type ScannedPreview } from "@/components/PostScanSheet";
import { SendCardDialog } from "@/components/SendCardDialog";

interface QRScannerDialogProps {
  onClose: () => void;
}

export function QRScannerDialog({ onClose }: QRScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState<ScannedPreview | null>(null);
  const [showSend, setShowSend] = useState(false);

  useEffect(() => {
    // Don't start scanner if we already have a result
    if (preview) return;

    let reader: any = new ZXing.BrowserMultiFormatReader();
    let isScanning = true;

    const startScanner = async () => {
      try {
        const videoInputDevices = await reader?.listVideoInputDevices();
        if (!videoInputDevices || videoInputDevices.length === 0) {
          setError("Không tìm thấy camera trên thiết bị này.");
          setLoading(false);
          return;
        }

        // Prefer back camera
        const backCamera = videoInputDevices.find(
          (d: any) =>
            d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("environment"),
        );
        const deviceId = backCamera ? backCamera.deviceId : videoInputDevices[0].deviceId;

        if (videoRef.current && reader && isScanning) {
          await reader.decodeFromVideoDevice(
            deviceId,
            videoRef.current,
            async (result: any, err: any) => {
              if (result && isScanning) {
                const text = result.getText();
                try {
                  const url = new URL(text);
                  const path = url.pathname;

                  if (path.startsWith("/business/")) {
                    const slug = path.replace("/business/", "").split("?")[0];
                    reader?.reset();
                    isScanning = false;
                    await fetchAndShowPreview("business", slug);
                  } else if (path.startsWith("/p/")) {
                    const slug = path.replace("/p/", "").split("?")[0];
                    reader?.reset();
                    isScanning = false;
                    await fetchAndShowPreview("personal", slug);
                  } else {
                    toast.error("Mã QR này không thuộc hệ thống BizConnect.");
                  }
                } catch {
                  // Relative path fallback
                  if (text.startsWith("/business/")) {
                    const slug = text.replace("/business/", "").split("?")[0];
                    reader?.reset();
                    isScanning = false;
                    await fetchAndShowPreview("business", slug);
                  } else if (text.startsWith("/p/")) {
                    const slug = text.replace("/p/", "").split("?")[0];
                    reader?.reset();
                    isScanning = false;
                    await fetchAndShowPreview("personal", slug);
                  } else {
                    toast.error("Mã QR không hợp lệ.");
                  }
                }
              }
              if (err && !(err instanceof ZXing.NotFoundException)) {
                console.error("QR Scan Error:", err);
              }
            },
          );
          setLoading(false);
        }
      } catch (err: any) {
        console.error(err);
        setError("Lỗi khi truy cập camera. Vui lòng cấp quyền sử dụng camera.");
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      isScanning = false;
      if (reader) {
        reader.reset();
        reader = null;
      }
    };
  }, [preview]);

  const fetchAndShowPreview = async (type: "business" | "personal", slug: string) => {
    toast.loading("Đang tải thông tin...", { id: "scan-load" });
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      if (type === "business") {
        let query = supabase
          .from("businesses")
          .select(
            "id, name, slug, logo_url, phone, email, website, address, province, industry_id, industries(name)",
          );
        if (isUuid) query = query.eq("id", slug);
        else query = query.eq("slug", slug);
        
        const { data } = await query.maybeSingle();

        if (!data) {
          toast.error("Không tìm thấy doanh nghiệp này.", { id: "scan-load" });
          return;
        }
        toast.dismiss("scan-load");
        setPreview({
          type: "business",
          id: data.id,
          slug: data.slug,
          name: data.name,
          logo_url: data.logo_url,
          industry: (data as any).industries?.name ?? null,
          phone: data.phone,
          email: data.email,
          website: data.website,
          address: data.address,
          province: data.province,
        });
      } else {
        let query = supabase
          .from("personal_profiles")
          .select("id, full_name, slug, avatar_url, job_title, company_name, phone, email")
          .eq("is_public", true);
          
        if (isUuid) query = query.eq("id", slug);
        else query = query.eq("slug", slug);

        const { data } = await query.maybeSingle();

        if (!data) {
          toast.error("Không tìm thấy danh thiếp cá nhân này.", {
            id: "scan-load",
          });
          return;
        }
        toast.dismiss("scan-load");
        setPreview({
          type: "personal",
          id: data.id,
          slug: data.slug,
          name: data.full_name,
          avatar_url: data.avatar_url,
          job_title: data.job_title,
          company_name: data.company_name,
          phone: data.phone,
          email: data.email,
        });
      }
    } catch (e: any) {
      toast.error("Lỗi khi tải dữ liệu.", { id: "scan-load" });
    }
  };

  // If we have a scanned result → show PostScanSheet
  if (preview) {
    return (
      <>
        {showSend ? (
          <SendCardDialog
            toId={preview.id}
            toName={preview.name}
            toType={preview.type}
            onClose={() => {
              setShowSend(false);
              onClose();
            }}
          />
        ) : (
          <PostScanSheet preview={preview} onClose={onClose} onSendCard={() => setShowSend(true)} />
        )}
      </>
    );
  }

  return (
    <Dialog
      open={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-black border-border rounded-3xl">
        <div className="relative flex flex-col items-center justify-center p-6 min-h-[340px]">
          <h3 className="text-xl font-bold font-display mb-1 text-white">Quét mã QR</h3>
          <p className="text-sm text-white/60 text-center mb-5">
            Đưa mã QR của danh thiếp doanh nghiệp hoặc cá nhân vào khung hình.
          </p>

          {error ? (
            <div className="p-4 bg-destructive/10 text-destructive rounded-xl text-sm w-full text-center">
              {error}
            </div>
          ) : (
            <div className="relative w-full aspect-square max-w-[300px] overflow-hidden rounded-2xl bg-black/5 shadow-inner">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center text-white/60 bg-black/50 z-10">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              )}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
              />

              {/* Scanner overlay UI */}
              {!loading && (
                <div className="absolute inset-0 z-20 shadow-[0_0_0_4000px_rgba(0,0,0,0.45)]">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 rounded-xl flex items-center justify-center">
                    {/* Animated scan line */}
                    <div className="w-[120%] h-[2px] bg-primary/90 animate-scan shadow-[0_0_8px_2px_rgba(200,16,46,0.6)]" />

                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-primary rounded-tl-lg -translate-x-1 -translate-y-1" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-primary rounded-tr-lg translate-x-1 -translate-y-1" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-primary rounded-bl-lg -translate-x-1 translate-y-1" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-primary rounded-br-lg translate-x-1 translate-y-1" />
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="mt-4 text-white/60 hover:text-white"
            onClick={onClose}
          >
            <X className="w-4 h-4 mr-1.5" /> Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
