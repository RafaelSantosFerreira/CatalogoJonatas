
"use client";

import { useState } from "react";
import { Package, Settings, Wifi } from "lucide-react";
import { AdminProductsPanel } from "./AdminProductsPanel";
import { CompanySettingsPanel } from "./CompanySettingsPanel";
import { WhatsAppLogsPanel } from "./WhatsAppLogsPanel";
import { cn } from "@/lib/utils";

type Tab = "products" | "settings" | "whatsapp-logs";

export function AdminTabs() {
  const [activeTab, setActiveTab] = useState<Tab>("products");

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4">
          <nav className="flex gap-1 pt-2">
            <TabButton
              active={activeTab === "products"}
              onClick={() => setActiveTab("products")}
              icon={<Package className="h-4 w-4" />}
              label="Produtos"
            />
            <TabButton
              active={activeTab === "settings"}
              onClick={() => setActiveTab("settings")}
              icon={<Settings className="h-4 w-4" />}
              label="Configurações"
            />
            <TabButton
              active={activeTab === "whatsapp-logs"}
              onClick={() => setActiveTab("whatsapp-logs")}
              icon={<Wifi className="h-4 w-4" />}
              label="Logs WhatsApp"
            />
          </nav>
        </div>
      </div>

      {activeTab === "products" && <AdminProductsPanel />}
      {activeTab === "settings" && <CompanySettingsPanel />}
      {activeTab === "whatsapp-logs" && <WhatsAppLogsPanel />}
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
