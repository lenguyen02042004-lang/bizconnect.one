import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, User, Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
  head: () => ({
    meta: [
      {
        title: i18n.t("auth.signupTitle", {
          defaultValue: "Đăng ký doanh nghiệp miễn phí — BizConnect.One",
        }),
      },
      {
        name: "description",
        content: i18n.t("auth.signupDesc", {
          defaultValue:
            "Tạo tài khoản doanh nghiệp miễn phí trên BizConnect.One: thiết kế danh thiếp online, hiển thị trên bản đồ toàn cầu và kết nối với đối tác B2B quốc tế.",
        }),
      },
      {
        property: "og:title",
        content: i18n.t("auth.signupTitle", {
          defaultValue: "Đăng ký doanh nghiệp miễn phí — BizConnect.One",
        }),
      },
      {
        property: "og:description",
        content: i18n.t("auth.signupOgDesc", {
          defaultValue:
            "Tạo tài khoản doanh nghiệp miễn phí: danh thiếp online, hiển thị trên bản đồ toàn cầu và kết nối đối tác B2B quốc tế.",
        }),
      },
      { property: "og:url", content: "https://earth-biz-link.lovable.app/signup" },
    ],
    links: [{ rel: "canonical", href: "https://earth-biz-link.lovable.app/signup" }],
  }),
});

function SignupPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"personal" | "business">("personal");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name, account_type: accountType },
      },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success(t("auth.signupSuccess"));
      navigate({ to: accountType === "personal" ? "/me" : "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold">{t("auth.signupHeading")}</h1>
            <p className="text-muted-foreground mt-2">{t("auth.signupSubheading")}</p>
          </div>
          <div className="bg-card border border-border rounded-3xl p-8 shadow-card">
            <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => setAccountType("personal")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                  accountType === "personal"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-4 h-4" /> {t("auth.personal")}
              </button>
              <button
                type="button"
                onClick={() => setAccountType("business")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${
                  accountType === "business"
                    ? "bg-background shadow text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building2 className="w-4 h-4" /> {t("auth.business")}
              </button>
            </div>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="name">{t("auth.fullName")}</Label>
                <Input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("auth.namePlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth.emailPlaceholder")}
                />
              </div>
              <div>
                <Label htmlFor="password">{t("auth.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">{t("auth.passwordHint")}</p>
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink gap-2"
              >
                <Sparkles className="w-4 h-4" />{" "}
                {loading ? t("auth.creatingAccount") : t("auth.signupFree")}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-5">
              {t("auth.alreadyHaveAccount")}{" "}
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t("auth.loginHere")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
