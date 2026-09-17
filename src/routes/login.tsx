import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { getAuthErrorMessage } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      {
        title: i18n.t("auth.loginTitle", {
          defaultValue: "Đăng nhập tài khoản doanh nghiệp — BizConnect.One",
        }),
      },
      {
        name: "description",
        content: i18n.t("auth.loginDesc", {
          defaultValue:
            "Đăng nhập vào BizConnect.One để quản lý danh thiếp doanh nghiệp, hộp thư kết nối và danh bạ đối tác B2B toàn cầu của bạn.",
        }),
      },
      {
        property: "og:title",
        content: i18n.t("auth.loginTitle", {
          defaultValue: "Đăng nhập tài khoản doanh nghiệp — BizConnect.One",
        }),
      },
      {
        property: "og:description",
        content: i18n.t("auth.loginOgDesc", {
          defaultValue:
            "Đăng nhập để quản lý danh thiếp doanh nghiệp, hộp thư kết nối và danh bạ đối tác B2B toàn cầu.",
        }),
      },
      { property: "og:url", content: "https://bizconnect.one/login" },
    ],
    links: [{ rel: "canonical", href: "https://bizconnect.one/login" }],
  }),
});

function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      setLoading(false);
      toast.error(getAuthErrorMessage(error));
    } else {
      // Determine account type to route correctly
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", data.user.id)
          .single();

        if (profile) {
          setLoading(false);
          toast.success(t("auth.loginSuccess"));
          navigate({ to: "/dashboard" });
        } else {
          setLoading(false);
          navigate({ to: "/dashboard" });
        }
      } else {
        setLoading(false);
        navigate({ to: "/dashboard" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold">{t("auth.welcomeBack")}</h1>
            <p className="text-muted-foreground mt-2">{t("auth.loginSubheading")}</p>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 shadow-card">
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Link to="/reset-password" className="text-xs text-primary hover:underline">
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink gap-2"
              >
                <Sparkles className="w-4 h-4" />{" "}
                {loading ? t("auth.loggingIn") : t("auth.loginBtn")}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-5">
              {t("auth.noAccount")}{" "}
              <Link to="/signup" className="text-primary font-medium hover:underline">
                {t("auth.signupFreeLink")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
