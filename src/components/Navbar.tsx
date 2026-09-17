import { useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { Globe2, Sparkles, LogIn, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { InboxBell } from "@/components/InboxBell";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

export function Navbar() {
  const { user, loading, accountType } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-colors duration-300 ${
        isHome 
          ? "bg-transparent border-transparent" 
          : "bg-background/80 backdrop-blur-md border-b border-border/40"
      }`}
    >
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
          <Link
            to="/"
            activeProps={{ className: "text-primary" }}
            className="hover:text-primary transition-smooth"
            suppressHydrationWarning
          >
            {t("nav.map")}
          </Link>
          <Link
            to="/explore"
            activeProps={{ className: "text-primary" }}
            className="hover:text-primary transition-smooth"
            suppressHydrationWarning
          >
            {t("nav.explore")}
          </Link>
          <Link
            to="/countries"
            activeProps={{ className: "text-primary" }}
            className="hover:text-primary transition-smooth"
            suppressHydrationWarning
          >
            {t("nav.countries")}
          </Link>

          <Link
            to="/pricing"
            activeProps={{ className: "text-primary" }}
            className="hover:text-primary transition-smooth"
            suppressHydrationWarning
          >
            {t("nav.pricing")}
          </Link>
        </nav>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          {!loading && user && (
            <div className="flex items-center">
              <InboxBell />
            </div>
          )}

          <div className="hidden sm:flex items-center gap-1">
            {!loading && user ? (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />{" "}
                    <span suppressHydrationWarning>{t("nav.dashboard")}</span>
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
                  <Button variant="ghost" size="sm" className="gap-1.5 px-3">
                    <LogIn className="w-4 h-4" />{" "}
                    <span suppressHydrationWarning>{t("nav.login")}</span>
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button
                    size="sm"
                    className="gap-1.5 px-3 bg-gradient-vivid hover:opacity-90 text-white border-0 shadow-pink"
                  >
                    <Sparkles className="w-4 h-4" />{" "}
                    <span suppressHydrationWarning>{t("nav.signup")}</span>
                  </Button>
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Menu */}
          <div className="sm:hidden ml-1">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Menu">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px] flex flex-col gap-6 pt-12">
                <SheetTitle className="sr-only">Menu</SheetTitle>
                
                {/* Mobile Auth Buttons */}
                {!loading && user ? (
                  <div className="flex flex-col gap-3 pb-6 border-b border-border/50">
                    <Link to="/dashboard" className="w-full" onClick={() => setIsOpen(false)}>
                      <Button className="w-full gap-2 justify-start h-11" variant="secondary">
                        <LayoutDashboard className="w-5 h-5" />
                        <span className="text-base" suppressHydrationWarning>{t("nav.dashboard")}</span>
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 justify-start h-11"
                      onClick={() => {
                        supabase.auth.signOut();
                        setIsOpen(false);
                      }}
                    >
                      <LogOut className="w-5 h-5" />
                      <span className="text-base" suppressHydrationWarning>{t("nav.logout")}</span>
                    </Button>
                  </div>
                ) : !loading ? (
                  <div className="flex flex-col gap-3 pb-6 border-b border-border/50">
                    <Link to="/login" className="w-full" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full gap-2 justify-start h-11">
                        <LogIn className="w-5 h-5" />
                        <span className="text-base" suppressHydrationWarning>{t("nav.login")}</span>
                      </Button>
                    </Link>
                    <Link to="/signup" className="w-full" onClick={() => setIsOpen(false)}>
                      <Button className="w-full gap-2 justify-start h-11 bg-gradient-vivid text-white border-0 shadow-pink">
                        <Sparkles className="w-5 h-5" />
                        <span className="text-base" suppressHydrationWarning>{t("nav.signup")}</span>
                      </Button>
                    </Link>
                  </div>
                ) : null}

                <nav className="flex flex-col gap-4 text-lg font-medium">
                  <Link
                    to="/"
                    activeProps={{ className: "text-primary" }}
                    className="hover:text-primary transition-smooth"
                    suppressHydrationWarning
                    onClick={() => setIsOpen(false)}
                  >
                    {t("nav.map")}
                  </Link>
                  <Link
                    to="/explore"
                    activeProps={{ className: "text-primary" }}
                    className="hover:text-primary transition-smooth"
                    suppressHydrationWarning
                    onClick={() => setIsOpen(false)}
                  >
                    {t("nav.explore")}
                  </Link>
                  <Link
                    to="/countries"
                    activeProps={{ className: "text-primary" }}
                    className="hover:text-primary transition-smooth"
                    suppressHydrationWarning
                    onClick={() => setIsOpen(false)}
                  >
                    {t("nav.countries")}
                  </Link>
                  <Link
                    to="/pricing"
                    activeProps={{ className: "text-primary" }}
                    className="hover:text-primary transition-smooth"
                    suppressHydrationWarning
                    onClick={() => setIsOpen(false)}
                  >
                    {t("nav.pricing")}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
