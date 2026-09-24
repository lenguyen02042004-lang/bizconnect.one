import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Copy, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { uploadPublicFile } from "@/lib/upload";
import { useNavigate } from "@tanstack/react-router";

export type PaymentTarget = {
  name: string;
  price: number;
  subType?: string;
  isAddon?: boolean;
  addonId?: string;
};

export type BankInfo = {
  name: string;
  account: string;
  owner: string;
  bin: string;
  vndRate: number;
};

// Generate VietQR URL
export function vietQrUrl(amount: number, content: string, bankInfo: BankInfo) {
  const vnd = amount * bankInfo.vndRate;
  const cleanAccount = bankInfo.account.replace(/\s+/g, "");
  return `https://img.vietqr.io/image/${encodeURIComponent(bankInfo.bin)}-${encodeURIComponent(cleanAccount)}-compact2.png?amount=${vnd}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(bankInfo.owner)}`;
}

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: PaymentTarget | null;
  userId: string;
  bizId: string | null;
  bankInfo: BankInfo;
  onSuccess?: () => void;
}

export function PaymentModal({
  open,
  onOpenChange,
  target,
  userId,
  bizId,
  bankInfo,
  onSuccess,
}: PaymentModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setReceiptUrl(null);
      setQrLoaded(false);
      setIsUploading(false);
      setSubmitting(false);
    }
  }, [open, target]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadPublicFile("receipts", file, userId);
      setReceiptUrl(url);
      toast.success(t("pricing.uploadSuccess"));
    } catch {
      toast.error(t("pricing.uploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!target) {
      toast.error(t("pricing.generalError"));
      return;
    }
    setSubmitting(true);
    try {
      const planId = target.subType ?? "membership";

      const { error: rpcErr } = await supabase.rpc("submit_manual_payment", {
        p_plan_id: planId,
        p_amount: target.price,
        p_receipt_url: receiptUrl ?? "",
        p_business_id: bizId ?? null,
      });

      if (rpcErr) throw rpcErr;

      toast.success(t("pricing.paymentPending"));
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate({ to: "/dashboard" });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t("pricing.generalError"));
    } finally {
      setSubmitting(false);
    }
  };

  const generatePaymentContent = () => {
    if (!target || !userId) return "";
    const rawPlan = target.subType ?? "membership";

    const PLAN_SHORT_CODES: Record<string, string> = {
      contact_block_addon: "CBA",
      b2b_block_500: "B2B",
      icon_premium: "ICO",
    };

    const planId =
      PLAN_SHORT_CODES[rawPlan] || rawPlan.toUpperCase().replace(/_/g, "").substring(0, 5);
    const shortUser = userId.substring(0, 8).toUpperCase();
    const shortBiz = bizId ? bizId.substring(0, 8).toUpperCase() : "";

    return `BIZC ${planId} ${shortUser} ${shortBiz}`.trim();
  };

  const paymentContent = generatePaymentContent();
  const qrSrc = target ? vietQrUrl(target.price, paymentContent, bankInfo) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-3xl">
        <div className="bg-gradient-vivid p-6 text-white">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <QrCode className="w-5 h-5" />
              <DialogTitle className="text-white text-lg">
                {t("pricing.paymentTransfer")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-white/80 text-sm">
              {t("pricing.plan")}: <strong>{target?.name}</strong> —{" "}
              <strong>{((target?.price ?? 0) * bankInfo.vndRate).toLocaleString("vi-VN")} VNĐ</strong>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-5">
          {/* QR Code */}
          <div className="flex flex-col sm:flex-row gap-5 items-start">
            <div className="relative flex-shrink-0 bg-white rounded-2xl p-2 border-2 border-primary/20 shadow-sm mx-auto sm:mx-0">
              {!qrLoaded && (
                <div className="w-44 h-44 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                </div>
              )}
              <img
                src={qrSrc}
                alt="QR thanh toán"
                className={`w-44 h-44 object-contain rounded-xl ${qrLoaded ? "block" : "hidden"}`}
                onLoad={() => setQrLoaded(true)}
                onError={() => setQrLoaded(true)}
              />
            </div>

            <div className="flex-1 space-y-2 text-sm min-w-0">
              <InfoRow label={t("pricing.bank")} value={bankInfo.name} />
              <InfoRow label={t("pricing.accountNum")} value={bankInfo.account} copyable />
              <InfoRow label={t("pricing.accountName")} value={bankInfo.owner} />
              <InfoRow
                label={t("pricing.amount")}
                value={`${((target?.price ?? 0) * bankInfo.vndRate).toLocaleString("vi-VN")} VNĐ`}
                highlight
              />
              <InfoRow label={t("pricing.transferContent")} value={paymentContent} copyable />
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-400">
            {t("pricing.transferNotice")}
          </div>

          {/* Upload receipt */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">
              {t("pricing.uploadReceipt")}
            </Label>
            <div
              className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-smooth"
              onClick={() => fileRef.current?.click()}
            >
              {receiptUrl ? (
                <div className="relative inline-block">
                  <img
                    src={receiptUrl}
                    alt="Biên lai"
                    className="h-24 object-contain rounded-lg mx-auto"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setReceiptUrl(null);
                    }}
                    className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : isUploading ? (
                <div className="py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
                </div>
              ) : (
                <div className="py-4 text-muted-foreground text-sm">
                  <Upload className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  {t("pricing.clickToUpload")}
                </div>
              )}
            </div>
            <Input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleUpload}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("pricing.cancel")}
            </Button>
            <Button
              className="flex-1 bg-gradient-vivid text-white border-0"
              onClick={handleSubmit}
              disabled={submitting || isUploading}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" /> {t("pricing.sending")}
                </>
              ) : (
                t("pricing.confirmPayment")
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  label,
  value,
  copyable,
  highlight,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  highlight?: boolean;
}) {
  const { t } = useTranslation();
  const copy = () => {
    navigator.clipboard.writeText(value);
    toast.success(`${t("pricing.copied")} ${label}`);
  };
  return (
    <div
      className={`rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 ${highlight ? "bg-primary/10 border border-primary/20" : "bg-muted/40"}`}
    >
      <span className="text-muted-foreground text-xs flex-shrink-0">{label}</span>
      <span className={`font-semibold text-right truncate ${highlight ? "text-primary" : ""}`}>
        {value}
      </span>
      {copyable && (
        <button
          onClick={copy}
          className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
