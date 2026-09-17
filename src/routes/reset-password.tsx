import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { KeyRound, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: i18n.t("auth.resetTitle", { defaultValue: "Đặt lại mật khẩu — BizConnect.One" }) },
    ],
  }),
});

function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"request" | "update">("request");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase sends recovery link with #type=recovery&access_token=...
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setMode("update");
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setMode("update");
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.resetEmailSent"));
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error(t("auth.pwdMinLength"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("auth.pwdMismatch"));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(t("auth.pwdUpdated"));
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="pt-24 px-4 flex items-center justify-center min-h-screen">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold">
              {mode === "update" ? t("auth.setNewPwd") : t("auth.forgotPwd")}
            </h1>
            <p className="text-muted-foreground mt-2">
              {mode === "update" ? t("auth.enterNewPwd") : t("auth.enterEmailForLink")}
            </p>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8 shadow-card">
            {mode === "request" ? (
              <form onSubmit={handleSendEmail} className="space-y-4">
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
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink gap-2"
                >
                  <Mail className="w-4 h-4" />{" "}
                  {loading ? t("auth.sending") : t("auth.sendRecoveryEmail")}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <Label htmlFor="password">{t("auth.newPwd")}</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="confirm">{t("auth.confirmPwd")}</Label>
                  <Input
                    id="confirm"
                    type="password"
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink gap-2"
                >
                  <KeyRound className="w-4 h-4" />{" "}
                  {loading ? t("auth.updating") : t("auth.updatePwd")}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground mt-5">
              <Link to="/login" className="text-primary font-medium hover:underline">
                {t("auth.backToLogin")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
