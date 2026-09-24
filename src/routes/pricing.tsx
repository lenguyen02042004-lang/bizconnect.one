import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, Plus, QrCode, Copy, Upload, Loader2, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PaymentModal, PaymentTarget } from "@/components/PaymentModal";
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
            "Chọn gói phù hợp: miễn phí để bắt đầu, B2B Premium $5/năm với 500 lượt gửi card chủ động, Icon Premium nổi bật trên danh bạ.",
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

// Remove local PaymentTarget and vietQrUrl as they are imported

function PricingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [target, setTarget] = useState<PaymentTarget | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [bizId, setBizId] = useState<string | null>(null);
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
          const val = data.value as Record<string, string | undefined>;
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

    const bizIdStr = businesses?.[0]?.id ?? null;
    if (
      !bizIdStr &&
      (planTarget.subType === "b2b_block_500" || planTarget.subType === "icon_premium")
    ) {
      toast.error(t("pricing.errorRequireBusiness"));
      return;
    }

    setUserId(user.id);
    setBizId(bizIdStr);
    setTarget(planTarget);
    setShowModal(true);
  };

  // Payment handle logic moved to PaymentModal

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

  const BUSINESS_ADDONS: Array<{
    id: string;
    name: string;
    price: number;
    desc: string;
    block?: boolean;
  }> = [];

  return (
    <div className="min-h-screen bg-background">
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
      <PaymentModal
        open={showModal}
        onOpenChange={setShowModal}
        target={target}
        userId={userId}
        bizId={bizId}
        bankInfo={bankInfo}
      />
    </div>
  );
}
