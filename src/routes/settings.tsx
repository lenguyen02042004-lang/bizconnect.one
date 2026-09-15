import { useEffect, useState } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ImageUpload } from "@/components/ImageUpload";
import { toast } from "sonner";
import { Loader2, Save, KeyRound, User, Mail } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw redirect({ to: "/login" });
  },
  head: () => ({
    meta: [
      {
        title: i18n.t("settings.titleMeta", { defaultValue: "Cài đặt tài khoản — BizConnect.One" }),
      },
    ],
  }),
});

function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEmail(user.email ?? "");
    supabase
      .from("profiles")
      .select("display_name, avatar_url, email")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setDisplayName(data.display_name ?? "");
          setAvatarUrl(data.avatar_url);
        }
      });
  }, [user]);

  if (!user) {
    return (
      <DashboardShell maxWidth="4xl">
        <div className="py-16 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardShell>
    );
  }

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim() || null,
        avatar_url: avatarUrl,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success(t("settings.profileUpdated"));
  };

  const updateEmail = async () => {
    if (!email.trim() || email === user.email) return;
    const { error } = await supabase.auth.updateUser({ email });
    if (error) toast.error(error.message);
    else toast.success(t("settings.emailCheckInbox"));
  };

  const updatePassword = async () => {
    if (newPassword.length < 6) {
      toast.error(t("settings.pwdMinLength"));
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success(t("settings.pwdChanged"));
      setNewPassword("");
    }
  };

  return (
    <DashboardShell maxWidth="4xl" title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <div className="space-y-6">
        {/* Profile */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-card">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-primary" /> {t("settings.profile")}
          </h2>
          <div className="grid sm:grid-cols-[160px_1fr] gap-5">
            <ImageUpload
              bucket="avatars"
              userId={user.id}
              value={avatarUrl}
              onChange={setAvatarUrl}
              label={t("settings.avatar")}
              aspect="square"
            />
            <div className="space-y-3">
              <div>
                <Label htmlFor="dn">{t("settings.displayName")}</Label>
                <Input
                  id="dn"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("settings.displayNamePlaceholder")}
                />
              </div>
              <Button
                onClick={saveProfile}
                disabled={saving}
                className="gap-2 bg-gradient-vivid text-white border-0 shadow-pink"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {t("settings.saveChanges")}
              </Button>
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-card">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <Mail className="w-4 h-4 text-primary" /> {t("settings.loginEmail")}
          </h2>
          <div className="flex gap-2">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Button onClick={updateEmail} variant="outline" disabled={email === user.email}>
              {t("settings.updateBtn")}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">{t("settings.emailCheckNotice")}</p>
        </div>

        {/* Password */}
        <div className="bg-card border border-border rounded-3xl p-6 shadow-card">
          <h2 className="font-semibold flex items-center gap-2 mb-4">
            <KeyRound className="w-4 h-4 text-primary" /> {t("settings.changePwd")}
          </h2>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder={t("settings.newPwdPlaceholder")}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button onClick={updatePassword} variant="outline" disabled={!newPassword}>
              {t("settings.changeBtn")}
            </Button>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
