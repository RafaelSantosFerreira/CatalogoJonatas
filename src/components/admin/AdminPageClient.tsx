
"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminProductsPanel } from "@/components/admin/AdminProductsPanel";
import { CompanySettingsPanel } from "@/components/admin/CompanySettingsPanel";
import { AdminStatsPanel } from "@/components/admin/AdminStatsPanel";
import { AdminGuard } from "@/components/admin/AdminGuard";

type AdminTab = "products" | "stats" | "settings";

export function AdminPageClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("products");

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "products" && <AdminProductsPanel />}
        {activeTab === "stats" && <AdminStatsPanel />}
        {activeTab === "settings" && <CompanySettingsPanel />}
      </div>
    </AdminGuard>
  );
}
