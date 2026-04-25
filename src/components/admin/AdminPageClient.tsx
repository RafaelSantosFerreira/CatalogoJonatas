
"use client";

import { useState } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminProductsPanel } from "@/components/admin/AdminProductsPanel";
import { CompanySettingsPanel } from "@/components/admin/CompanySettingsPanel";
import { AdminGuard } from "@/components/admin/AdminGuard";

type AdminTab = "products" | "settings";

export function AdminPageClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("products");

  return (
    <AdminGuard>
      <div className="min-h-screen bg-background">
        <AdminHeader activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === "products" ? <AdminProductsPanel /> : <CompanySettingsPanel />}
      </div>
    </AdminGuard>
  );
}
