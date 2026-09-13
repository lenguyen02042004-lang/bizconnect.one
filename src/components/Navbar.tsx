import { Link } from "@tanstack/react-router";
import { Globe2, Sparkles, LogIn, LayoutDashboard, LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { InboxBell } from "@/components/InboxBell";

export function Navbar() {
  const { user, loading, accountType } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-vivid blur-md opacity-60 group-hover:opacity-100 transition-smooth" />
            <div className="relative w-9 h-9 rounded-xl bg-gradient-vivid flex items-center justify-center shadow-pink">
              <Globe2 className="w-5 h-5 text-white" />
            </div>
          </div>
          <span className="font-display font-bold text-lg tracking-tight whitespace-nowrap shrink-0">
            BizConnect<span className="text-gradient">.One</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" activeProps={{ className: "text-primary" }} className="hover:text-primary transition-smooth">
            {t("nav.map")}
          </Link>
          <Link to="/explore" activeProps={{ className: "text-primary" }} className="hover:text-primary transition-smooth">
            {t("nav.explore")}
          </Link>
          <Link to="/countries" activeProps={{ className: "text-primary" }} className="hover:text-primary transition-smooth">
            {t("nav.countries")}
          </Link>

          <Link to="/pricing" activeProps={{ className: "text-primary" }} className="hover:text-primary transition-smooth">
            {t("nav.pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          {!loading && user ? (
            <>
              <InboxBell />
              <Link to={accountType === "personal" ? "/me" : "/dashboard"}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <LayoutDashboard className="w-4 h-4" />{" "}
                  <span className="hidden sm:inline">
                    {accountType === "personal" ? "Quản lý cá nhân" : t("nav.dashboard")}
                  </span>
                </Button>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => supabase.auth.signOut()}
                title={t("nav.logout")}
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : !loading ? (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="gap-1.5 px-2 sm:px-3">
                  <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">{t("nav.login")}</span>
                </Button>
              </Link>
              <Link to="/signup">
                <Button
                  size="sm"
                  className="gap-1.5 px-2 sm:px-3 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink"
                >
                  <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">{t("nav.signup")}</span>
                </Button>
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
