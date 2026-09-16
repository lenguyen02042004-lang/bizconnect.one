import { Link, useLocation } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  Heart,
  BarChart3,
  Pencil,
  Settings as SettingsIcon,
  Shield,
  IdCard,
  UserPlus,
} from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export const DEMO_OWNER_PREFIX = "00000000-0000-0000-0000-0000000000";

type TabDef = {
  to:
    | "/dashboard"
    | "/inbox"
    | "/contacts"
    | "/following"
    | "/business/stats"
    | "/business/edit"
    | "/me"
    | "/leads"
    | "/settings"
    | "/admin";
  label: string;
  icon: ComponentType<{ className?: string }>;
  match: (path: string) => boolean;
  adminOnly?: boolean;
  group: "main" | "system";
  allowType: "both" | "personal" | "business";
};

const TABS: TabDef[] = [
  {
    to: "/dashboard",
    label: "Tổng quan",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard",
    group: "main",
    allowType: "both",
  },
  {
    to: "/inbox",
    label: "Hộp thư",
    icon: Inbox,
    match: (p) => p.startsWith("/inbox"),
    group: "main",
    allowType: "both",
  },
  {
    to: "/contacts",
    label: "Danh bạ",
    icon: BookOpen,
    match: (p) => p.startsWith("/contacts"),
    group: "main",
    allowType: "both",
  },
  {
    to: "/following",
    label: "Đang theo dõi",
    icon: Heart,
    match: (p) => p.startsWith("/following"),
    group: "main",
    allowType: "both",
  },
  {
    to: "/business/stats",
    label: "Thống kê",
    icon: BarChart3,
    match: (p) => p.startsWith("/business/stats"),
    group: "main",
    allowType: "business",
  },
  {
    to: "/business/edit",
    label: "Chỉnh sửa DN",
    icon: Pencil,
    match: (p) => p.startsWith("/business/edit"),
    group: "main",
    allowType: "business",
  },
  {
    to: "/leads",
    label: "Khách tiềm năng",
    icon: UserPlus,
    match: (p) => p.startsWith("/leads"),
    group: "main",
    allowType: "business",
  },
  {
    to: "/me",
    label: "Danh thiếp cá nhân",
    icon: IdCard,
    match: (p) => p.startsWith("/me"),
    group: "main",
    allowType: "personal",
  },
  {
    to: "/settings",
    label: "Cài đặt",
    icon: SettingsIcon,
    match: (p) => p.startsWith("/settings"),
    group: "system",
    allowType: "both",
  },
  {
    to: "/admin",
    label: "Quản trị",
    icon: Shield,
    match: (p) => p.startsWith("/admin"),
    adminOnly: true,
    group: "system",
    allowType: "both",
  },
];

interface Props {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: "4xl" | "5xl" | "6xl" | "7xl" | "full";
}

const WIDTH_CLS: Record<NonNullable<Props["maxWidth"]>, string> = {
  "4xl": "max-w-4xl",
  "5xl": "max-w-5xl",
  "6xl": "max-w-6xl",
  "7xl": "max-w-7xl",
  full: "max-w-none",
};

function useIsAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setIsAdmin(!!data);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);
  return isAdmin;
}

export function DashboardShell({ title, subtitle, actions, children, maxWidth = "6xl" }: Props) {
  const location = useLocation();
  const path = location.pathname;
  const widthCls = WIDTH_CLS[maxWidth];
  const { accountType } = useAuth();
  const isAdmin = useIsAdmin();

  const visible = TABS.filter((t) => {
    if (t.adminOnly && !isAdmin) return false;
    if (t.allowType !== "both" && t.allowType !== accountType) return false;
    return true;
  });
  const mainTabs = visible.filter((t) => t.group === "main");
  const systemTabs = visible.filter((t) => t.group === "system");

  const renderLink = (t: TabDef) => {
    const active = t.match(path);
    const Icon = t.icon;
    return (
      <Link
        key={t.to}
        to={t.to}
        className={`group inline-flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-smooth ${
          active
            ? "bg-gradient-vivid text-white shadow-pink font-semibold"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="truncate">{t.label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-16 flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border bg-card/40 sticky top-16 h-[calc(100vh-4rem)] py-6 px-3 overflow-y-auto">
          <div className="px-3 mb-3">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
              {accountType === "business" ? "Tài khoản doanh nghiệp" : "Tài khoản cá nhân"}
            </p>
          </div>
          <nav className="flex flex-col gap-0.5">{mainTabs.map(renderLink)}</nav>
          {systemTabs.length > 0 && (
            <>
              <div className="px-3 mt-5 mb-2">
                <p className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">
                  Hệ thống
                </p>
              </div>
              <nav className="flex flex-col gap-0.5">{systemTabs.map(renderLink)}</nav>
            </>
          )}
        </aside>

        {/* Right content area */}
        <main className="flex-1 min-w-0">
          {/* Mobile horizontal tabs */}
          <nav className="lg:hidden sticky top-16 z-30 bg-background/90 backdrop-blur border-b border-border">
            <div className="flex gap-1 overflow-x-auto no-scrollbar px-4">
              {visible.map((t) => {
                const active = t.match(path);
                const Icon = t.icon;
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    className={`relative inline-flex items-center gap-1.5 px-3 py-3 text-sm whitespace-nowrap transition-smooth ${
                      active
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                    {active && (
                      <span className="absolute left-2 right-2 bottom-0 h-0.5 rounded-full bg-gradient-vivid" />
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className={`${widthCls} mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-16`}>
            {(title || actions) && (
              <header className="flex flex-wrap justify-between items-end gap-3 mb-6">
                <div>
                  {title && (
                    <h1 className="text-2xl sm:text-3xl font-display font-bold">{title}</h1>
                  )}
                  {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
              </header>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
