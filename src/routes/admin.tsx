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
  adminCreateCountry,
  adminCreateIndustry,
  adminListContacts,
  adminMarkContactRead,
} from "@/lib/admin.functions";
import { DashboardShell } from "@/components/DashboardShell";
import { Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DemoAccountsSection } from "@/components/admin/DemoAccountsSection";
import { BankSettingsSection } from "@/components/admin/BankSettingsSection";
import { PaymentReviewSection } from "@/components/admin/PaymentReviewSection";
import { SubscriptionManagementSection } from "@/components/admin/SubscriptionManagementSection";
import { BusinessTableSection } from "@/components/admin/BusinessTableSection";
import { BulkImportSection } from "@/components/admin/BulkImportSection";
import { GlobalDataSection } from "@/components/admin/GlobalDataSection";
import { PlatformContactsSection } from "@/components/admin/PlatformContactsSection";
import { AdminClaimsSection } from "@/components/admin/AdminClaimsSection";

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
  const createCountryFn = useServerFn(adminCreateCountry);
  const createIndustryFn = useServerFn(adminCreateIndustry);
  const listContactsFn = useServerFn(adminListContacts);
  const markContactReadFn = useServerFn(adminMarkContactRead);

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary" />
          <h1 className="font-display text-3xl font-bold">Quản trị viên</h1>
        </div>
      </div>

      <Tabs defaultValue="businesses" className="w-full space-y-6">
        <TabsList className="bg-background border border-border w-full flex-wrap h-auto justify-start p-1 gap-1">
          <TabsTrigger value="businesses" className="data-[state=active]:bg-muted">
            Doanh nghiệp
          </TabsTrigger>
          <TabsTrigger value="claims" className="data-[state=active]:bg-muted">
            Yêu cầu xác thực
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-muted">
            Giao dịch & Gói cước
          </TabsTrigger>
          <TabsTrigger value="contacts" className="data-[state=active]:bg-muted">
            Tin nhắn liên hệ
          </TabsTrigger>
          <TabsTrigger value="settings" className="data-[state=active]:bg-muted">
            Cài đặt hệ thống
          </TabsTrigger>
        </TabsList>

        <TabsContent value="businesses" className="space-y-6">
          <BusinessTableSection listFn={listFn as any} />
        </TabsContent>

        <TabsContent value="claims" className="space-y-6">
          <AdminClaimsSection />
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <PaymentReviewSection />
          <SubscriptionManagementSection />
        </TabsContent>

        <TabsContent value="contacts" className="space-y-6">
          <PlatformContactsSection
            listFn={listContactsFn as any}
            markReadFn={markContactReadFn as any}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <DemoAccountsSection seedFn={seedFn as any} />
          <GlobalDataSection
            createCountryFn={createCountryFn as any}
            createIndustryFn={createIndustryFn as any}
          />
          <BankSettingsSection />
          <BulkImportSection importFn={importFn as any} />
        </TabsContent>
      </Tabs>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <DashboardShell maxWidth="6xl">{children}</DashboardShell>;
}
