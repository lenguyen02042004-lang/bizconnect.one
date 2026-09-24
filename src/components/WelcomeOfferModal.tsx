import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, Check, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { PaymentModal, PaymentTarget, BankInfo } from "@/components/PaymentModal";

const DEFAULT_BANK: BankInfo = {
  name: "TPBank (Tiên Phong Bank)",
  account: "00003554020",
  owner: "LE TAN LOI",
  bin: "970423",
  vndRate: 1,
};

interface WelcomeOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bizId: string;
  userId: string;
}

export function WelcomeOfferModal({ open, onOpenChange, bizId, userId }: WelcomeOfferModalProps) {
  const { t } = useTranslation();
  const [bankInfo, setBankInfo] = useState<BankInfo>(DEFAULT_BANK);
  const [showPayment, setShowPayment] = useState(false);
  const [target, setTarget] = useState<PaymentTarget | null>(null);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "bank_info")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const val = data.value as Record<string, string | undefined>;
          setBankInfo({
            ...DEFAULT_BANK,
            name: val.bank_name || DEFAULT_BANK.name,
            account: val.account_number || DEFAULT_BANK.account,
            owner: val.account_owner || DEFAULT_BANK.owner,
            bin: val.bin || DEFAULT_BANK.bin,
          });
        }
      });
  }, []);

  const handleSelect = (plan: PaymentTarget) => {
    setTarget(plan);
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    onOpenChange(false);
  };

  if (showPayment && target) {
    return (
      <PaymentModal
        open={true}
        onOpenChange={(v) => {
          if (!v) setShowPayment(false);
        }}
        target={target}
        userId={userId}
        bizId={bizId}
        bankInfo={bankInfo}
        onSuccess={handlePaymentSuccess}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden rounded-3xl border-0">
        <div className="bg-gradient-vivid p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-50 blur-xl pointer-events-none" />
          <DialogHeader className="relative z-10">
            <div className="flex justify-center mb-3">
              <div className="bg-white/20 p-3 rounded-full">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-white text-2xl sm:text-3xl font-display font-bold">
              Chúc mừng bạn đã nhận quyền thành công!
            </DialogTitle>
            <DialogDescription className="text-white/90 text-sm sm:text-base mt-2 max-w-lg mx-auto">
              Bạn có 30 ngày dùng thử miễn phí. Hãy nâng cấp gói Thành Viên Doanh Nghiệp ngay hôm nay để mở khóa toàn bộ tiềm năng kết nối và duy trì hiển thị hồ sơ suốt 1 năm.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 bg-muted/20">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Premium Membership */}
            <div className="bg-white dark:bg-card border-2 border-primary/50 shadow-glow rounded-3xl p-6 relative flex flex-col scale-[1.02]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-white text-xs font-bold uppercase tracking-wider shadow-md">
                Khuyên dùng
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-primary" />
                <h3 className="text-xl font-bold">Gói Thành Viên B2B</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold">150k</span>
                <span className="text-muted-foreground font-medium"> / năm</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Duy trì hiển thị hồ sơ <strong>rõ nét suốt 1 năm</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Cấp sẵn <strong>200 lượt kết nối</strong> cơ bản</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                  <span>Cấp sẵn <strong>200 tin nhắn</strong> chào mừng</span>
                </li>
              </ul>
              <Button
                onClick={() =>
                  handleSelect({ name: "Gói Thành Viên B2B", price: 150000, subType: "icon_premium" })
                }
                className="w-full bg-gradient-vivid text-white border-0 py-6 text-base font-semibold group"
              >
                Nâng cấp ngay <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Expansion Block */}
            <div className="bg-white dark:bg-card border border-border shadow-sm rounded-3xl p-6 flex flex-col hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-foreground/80">Mở rộng Danh bạ</h3>
              </div>
              <div className="mb-4">
                <span className="text-3xl font-bold text-foreground/80">150k</span>
                <span className="text-muted-foreground font-medium"> / 500 lượt</span>
              </div>
              <ul className="space-y-3 mb-6 flex-1 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-primary/60 flex-shrink-0" />
                  <span>Mua thêm <strong>500 lượt xem</strong> liên hệ B2B</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 mt-0.5 text-primary/60 flex-shrink-0" />
                  <span>Cộng dồn vào giới hạn hiện tại</span>
                </li>
              </ul>
              <Button
                variant="outline"
                onClick={() =>
                  handleSelect({ name: "Mở rộng 500 Lượt", price: 150000, subType: "b2b_block_500" })
                }
                className="w-full py-6 text-base font-semibold"
              >
                Mua thêm lượt
              </Button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => onOpenChange(false)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors underline underline-offset-4"
            >
              Để sau, tôi muốn tiếp tục dùng thử
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
