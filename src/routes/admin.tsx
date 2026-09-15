import { useState } from "react";
import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  checkIsAdmin,
  bulkImportBusinesses,
  adminListBusinesses,
  seedDemoAccounts,
} from "@/lib/admin.functions";
import { DashboardShell } from "@/components/DashboardShell";
import { Shield } from "lucide-react";

import { DemoAccountsSection } from "@/components/admin/DemoAccountsSection";
import { BankSettingsSection } from "@/components/admin/BankSettingsSection";
import { PaymentReviewSection } from "@/components/admin/PaymentReviewSection";
import { SubscriptionManagementSection } from "@/components/admin/SubscriptionManagementSection";
import { BusinessTableSection } from "@/components/admin/BusinessTableSection";
import { BulkImportSection } from "@/components/admin/BulkImportSection";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/login" });
  },
  component: AdminPage,
  head: () => ({ meta: [{ title: "Quản trị — BizConnect.One" }] }),
});

function AdminPage() {
  const checkAdmin = useServerFn(checkIsAdmin);
  const importFn = useServerFn(bulkImportBusinesses);
  const listFn = useServerFn(adminListBusinesses);
  const seedFn = useServerFn(seedDemoAccounts);

  const adminQ = useQuery({ queryKey: ["is-admin"], queryFn: () => checkAdmin() });

  if (adminQ.isLoading)
    return (
      <Shell>
        <p>Đang kiểm tra quyền...</p>
      </Shell>
    );
  if (!adminQ.data?.isAdmin)
    return (
      <Shell>
        <div className="text-center py-16">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h1 className="font-display text-2xl font-bold">Chỉ dành cho quản trị viên</h1>
          <p className="text-muted-foreground mt-2">Tài khoản của bạn chưa có quyền truy cập.</p>
        </div>
      </Shell>
    );

  return (
    <Shell>
      <div className="flex items-center gap-2 mb-6">
        <Shield className="w-7 h-7 text-primary" />
        <h1 className="font-display text-3xl font-bold">Quản trị viên</h1>
      </div>

      <DemoAccountsSection seedFn={seedFn as any} />
      <BankSettingsSection />
      <PaymentReviewSection />
      <SubscriptionManagementSection />
      <BusinessTableSection listFn={listFn as any} />
      <BulkImportSection importFn={importFn as any} />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <DashboardShell maxWidth="6xl">{children}</DashboardShell>;
}
