import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Plus, QrCode, Copy, Upload, Loader2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadPublicFile } from "@/lib/upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

export const Route = createFileRoute("/pricing")({
  component: PricingPage,
  head: () => ({
    meta: [
      {
        title: i18n.t("pricing.titleMeta", {
          defaultValue: "Bảng giá gói thành viên — BizConnect.One",
        }),
      },
      {
        name: "description",
        content: i18n.t("pricing.descMeta", {
          defaultValue:
            "Chọn gói phù hợp: miễn phí để bắt đầu, B2B Premium $5/năm với 500 lượt gửi card chủ động, Icon Premium nổi bật trên bản đồ.",
        }),
      },
      {
        property: "og:title",
        content: i18n.t("pricing.ogTitle", { defaultValue: "Bảng giá — BizConnect.One" }),
      },
    ],
    links: [{ rel: "canonical", href: "https://bizconnect.one/pricing" }],
  }),
});

// ─── Bank config (update these with real info) ───────────────────────────────
const BANK = {
  name: "TPBank (Tiên Phong Bank)",
  account: "00003554020",
  owner: "LE TAN LOI",
  bin: "970423", // TPBank BIN for VietQR
  vndRate: 1, // Direct VND payment
};

// Generate VietQR URL (https://vietqr.io/danh-sach-api/create-qr/)
function vietQrUrl(amount: number, content: string, bankInfo: typeof BANK) {
  const vnd = amount * bankInfo.vndRate;
  const cleanAccount = bankInfo.account.replace(/\s+/g, "");
  return `https://img.vietqr.io/image/${bankInfo.bin}-${cleanAccount}-compact2.png?amount=${vnd}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent(bankInfo.owner)}`;
}

type PaymentTarget = {
  name: string;
  price: number;
  subType?: string;
  isAddon?: boolean;
  addonId?: string;
};

function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [target, setTarget] = useState<PaymentTarget | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [bizId, setBizId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [bankInfo, setBankInfo] = useState(BANK);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
    });
    // Fetch bank info from settings (uses any-typed query)
    supabase
      .from("app_settings")
      .select("value")
      .eq("key", "bank_info")
      .single()
      .then(({ data }) => {
        if (data?.value) {
          const val = data.value as any;
          setBankInfo({
            ...BANK,
            name: val.bank_name || BANK.name,
            account: val.account_number || BANK.account,
            owner: val.account_owner || BANK.owner,
            bin: val.bin || BANK.bin,
          });
        }
      });
  }, []);

  const openPayment = async (planTarget: PaymentTarget) => {
    if (planTarget.price === 0) {
      navigate({ to: "/signup" });
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast.error(t("pricing.loginToUpgrade"));
      navigate({ to: "/login" });
      return;
    }
    
    // Check for business ID
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", user.id)
      .limit(1);
    
    setUserId(user.id);
    setBizId(businesses?.[0]?.id ?? null);
    setTarget(planTarget);
    setReceiptUrl(null);
    setQrLoaded(false);
    setShowModal(true);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setIsUploading(true);
    try {
      const url = await uploadPublicFile("receipts", file, user.id);
      setReceiptUrl(url);
      toast.success(t("pricing.uploadSuccess"));
    } catch {
      toast.error(t("pricing.uploadError"));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!receiptUrl || !target) {
      toast.error(t("pricing.requireReceipt"));
      return;
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setSubmitting(true);
    try {
      const planId = target.subType ?? "membership";

      // Sử dụng hàm RPC bảo mật (Trust First) thay vì insert trực tiếp
      const { error: rpcErr } = await supabase.rpc("submit_manual_payment", {
        p_plan_id: planId,
        p_receipt_url: receiptUrl ?? "",
        p_business_id: bizId,
      });

      if (rpcErr) throw rpcErr;

      toast.success(t("pricing.upgradeSuccess"));
      setShowModal(false);
      navigate({ to: "/dashboard" });
    } catch (err: any) {
      toast.error(err.message ?? t("pricing.generalError"));
    } finally {
      setSubmitting(false);
    }
  };

  const generatePaymentContent = () => {
    if (!target || !userId) return "";
    const planId = (target.subType ?? "membership").toUpperCase();
    const shortUser = userId.substring(0, 8).toUpperCase();
    const shortBiz = bizId ? bizId.substring(0, 8).toUpperCase() : "";
    return `BIZC ${planId} ${shortUser} ${shortBiz}`.trim();
  };

  const paymentContent = generatePaymentContent();
  const qrSrc = target ? vietQrUrl(target.price, paymentContent, bankInfo) : "";

  // ─── Plan definitions (using t) ─────────────────────────────────────────────────────────
  const PERSONAL_PLANS = [
    {
      id: "personal_free",
      name: t("pricing.plans.personalFree.name"),
      price: 0,
      period: "",
      badge: null,
      description: t("pricing.plans.personalFree.desc"),
      features: [
        t("pricing.plans.personalFree.f1"),
        t("pricing.plans.personalFree.f2"),
        t("pricing.plans.personalFree.f3"),
        t("pricing.plans.personalFree.f4"),
      ],
      cta: t("pricing.plans.personalFree.cta"),
      featured: false,
      disabled: true,
    },
  ];

  const PERSONAL_ADDONS = [
    {
      id: "contact_block_addon",
      name: t("pricing.addons.contactBlock.name"),
      price: 150000,
      desc: t("pricing.addons.contactBlock.desc"),
      block: true,
    },
  ];

  const BUSINESS_PLANS = [
    {
      id: "biz_free",
      name: t("pricing.plans.bizFree.name"),
      price: 0,
      period: "",
      badge: null,
      description: t("pricing.plans.bizFree.desc"),
      features: [
        t("pricing.plans.bizFree.f1"),
        t("pricing.plans.bizFree.f2"),
        t("pricing.plans.bizFree.f3"),
        t("pricing.plans.bizFree.f4"),
        t("pricing.plans.bizFree.f5"),
      ],
      cta: t("pricing.plans.bizFree.cta"),
      featured: false,
      disabled: true,
    },
    {
      id: "b2b_block_500",
      name: t("pricing.plans.bizBlock500.name"),
      price: 150000,
      period: t("pricing.plans.bizBlock500.period"),
      badge: t("pricing.plans.bizBlock500.badge"),
      description: t("pricing.plans.bizBlock500.desc"),
      features: [
        t("pricing.plans.bizBlock500.f1"),
        t("pricing.plans.bizBlock500.f2"),
        t("pricing.plans.bizBlock500.f3"),
        t("pricing.plans.bizBlock500.f4"),
        t("pricing.plans.bizBlock500.f5"),
        t("pricing.plans.bizBlock500.f6"),
      ],
      cta: t("pricing.plans.bizBlock500.cta"),
      featured: true,
      disabled: false,
      subType: "b2b_block_500",
    },
    {
      id: "icon_premium",
      name: t("pricing.plans.bizIconPremium.name"),
      price: 150000,
      period: t("pricing.plans.bizIconPremium.period"),
      badge: null,
      description: t("pricing.plans.bizIconPremium.desc"),
      features: [
        t("pricing.plans.bizIconPremium.f1"),
        t("pricing.plans.bizIconPremium.f2"),
        t("pricing.plans.bizIconPremium.f3"),
        t("pricing.plans.bizIconPremium.f4"),
      ],
      cta: t("pricing.plans.bizIconPremium.cta"),
      featured: false,
      disabled: false,
      subType: "icon_premium",
    },
  ];

  const BUSINESS_ADDONS: Array<any> = [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-medium mb-4">
            <Sparkles className="w-3 h-3 text-primary" /> {t("pricing.headerTag")}
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold mb-3">
            {t("pricing.headerTitle")}{" "}
            <span className="text-gradient">{t("pricing.headerPrice")}</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">{t("pricing.headerDesc")}</p>
        </div>

        {/* ── Tài khoản Doanh nghiệp ── */}
        <div className="mb-3">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            {t("pricing.bizAccount")}
          </h2>
          <div className="grid md:grid-cols-3 gap-5 mb-6">
            {BUSINESS_PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 border transition-smooth ${
                  plan.featured
                    ? "bg-gradient-vivid text-white border-transparent shadow-glow scale-105"
                    : "bg-card border-border shadow-card hover:border-primary/30"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white text-primary text-xs font-bold shadow-pink">
                    {plan.badge}
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  {plan.id === "icon_premium" && <Crown className="w-5 h-5 text-primary" />}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                </div>
                <div className="mb-3">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? "0đ" : plan.price / 1000 + "k"}
                  </span>
                  <span className={plan.featured ? "opacity-80" : "text-muted-foreground"}>
                    {plan.period}
                  </span>
                </div>
                <p
                  className={`text-sm mb-5 ${plan.featured ? "opacity-90" : "text-muted-foreground"}`}
                >
                  {plan.description}
                </p>
                <ul className="space-y-2.5 mb-6 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.featured ? "text-white" : "text-primary"}`}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() =>
                    openPayment({
                      name: plan.name,
                      price: plan.price,
                      subType: plan.subType as PaymentTarget["subType"],
                    })
                  }
                  disabled={plan.disabled}
                  className={`w-full ${
                    plan.featured
                      ? "bg-white text-primary hover:bg-white/90"
                      : "bg-gradient-vivid text-white hover:opacity-90 border-0"
                  } disabled:opacity-50`}
                >
                  {plan.disabled ? t("pricing.default") : plan.cta}
                </Button>
              </div>
            ))}
          </div>

          {/* Biz Add-ons */}
          {BUSINESS_ADDONS.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-bold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                {t("pricing.bizAddons")}
              </h3>
              <div className="space-y-3">
                {BUSINESS_ADDONS.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{a.name}</p>
                      <p className="text-xs text-muted-foreground">{a.desc}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-lg font-bold">
                        {a.price === 0 ? "0đ" : a.price / 1000 + "k"}
                      </p>
                      <Button
                        size="sm"
                        onClick={() =>
                          openPayment({
                            name: a.name,
                            price: a.price,
                            subType: a.id as PaymentTarget["subType"],
                            isAddon: true,
                          })
                        }
                        className="gap-1 bg-gradient-vivid text-white border-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> {t("pricing.buyBtn")}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Tài khoản Cá nhân ── */}
        <div className="mt-10">
          <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
            {t("pricing.personalAccount")}
          </h2>
          <div className="grid md:grid-cols-2 gap-5 mb-6">
            {PERSONAL_PLANS.map((plan) => (
              <div
                key={plan.id}
                className="bg-card border border-border shadow-card rounded-3xl p-6"
              >
                <h3 className="text-lg font-bold mb-2">{plan.name}</h3>
                <div className="mb-3">
                  <span className="text-4xl font-bold">
                    {plan.price === 0 ? "0đ" : plan.price / 1000 + "k"}
                  </span>
                  <span className="text-muted-foreground"> {t("pricing.forever")}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>
                <ul className="space-y-2 mb-6 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup">
                  <Button className="w-full bg-gradient-vivid text-white border-0">
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}

            {/* Personal add-on */}
            <div className="bg-card border border-border rounded-3xl p-6 flex flex-col justify-center">
              <h3 className="font-bold mb-3 text-sm text-muted-foreground uppercase tracking-wide">
                {t("pricing.personalAddons")}
              </h3>
              {PERSONAL_ADDONS.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                >
                  <div>
                    <p className="font-medium text-sm">{a.name}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold">
                      {a.price === 0 ? "0đ" : a.price / 1000 + "k"}
                    </p>
                    <Button
                      size="sm"
                      onClick={() =>
                        openPayment({
                          name: a.name,
                          price: a.price,
                          subType: a.id as PaymentTarget["subType"],
                          isAddon: true,
                        })
                      }
                      className="gap-1 bg-gradient-vivid text-white border-0"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t("pricing.buyBtn")}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Payment Modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
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
                <strong>{((target?.price ?? 0) * BANK.vndRate).toLocaleString("vi-VN")} VNĐ</strong>
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
                <InfoRow label={t("pricing.bank")} value={BANK.name} />
                <InfoRow label={t("pricing.accountNum")} value={BANK.account} copyable />
                <InfoRow label={t("pricing.accountName")} value={BANK.owner} />
                <InfoRow
                  label={t("pricing.amount")}
                  value={`${((target?.price ?? 0) * BANK.vndRate).toLocaleString("vi-VN")} VNĐ`}
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
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                {t("pricing.cancel")}
              </Button>
              <Button
                className="flex-1 bg-gradient-vivid text-white border-0"
                onClick={handleSubmit}
                disabled={!receiptUrl || submitting || isUploading}
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
    </div>
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
