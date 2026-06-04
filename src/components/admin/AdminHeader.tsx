
"use client";

import { Wrench, LogOut, ShieldCheck, Package, Settings, BarChart3, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useAppDisplayName } from "@/hooks/useAppDisplayName";
import { toast } from "sonner";

type AdminTab = "products" | "stats" | "settings" | "orders";

interface AdminHeaderProps {
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
}

export function AdminHeader({ activeTab = "products", onTabChange }: AdminHeaderProps) {
  const { user, signOut } = useAuth();
  const appName = useAppDisplayName();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sessão encerrada com sucesso.");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold leading-none">{appName}</h1>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Painel Administrativo</p>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-1 rounded-lg border bg-muted/50 p-1">
          <Button
            variant={activeTab === "products" ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => onTabChange?.("products")}
          >
            <Package className="h-3.5 w-3.5" />
            Produtos
          </Button>
          <Button
            variant={activeTab === "stats" ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => onTabChange?.("stats")}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Estatísticas
          </Button>
          <Button
            variant={activeTab === "orders" ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => onTabChange?.("orders")}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Pedidos
          </Button>
          <Button
            variant={activeTab === "settings" ? "default" : "ghost"}
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={() => onTabChange?.("settings")}
          >
            <Settings className="h-3.5 w-3.5" />
            Configurações
          </Button>
        </nav>

        <div className="flex items-center gap-2">
          <span className="hidden md:block text-xs text-muted-foreground">{user?.email}</span>
          <ThemeToggle />
          <Button variant="outline" size="sm" className="gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="sm:hidden flex border-t">
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            activeTab === "products"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => onTabChange?.("products")}
        >
          <Package className="h-3.5 w-3.5" /> Produtos
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            activeTab === "stats"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => onTabChange?.("stats")}
        >
          <BarChart3 className="h-3.5 w-3.5" /> Estatísticas
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            activeTab === "orders"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => onTabChange?.("orders")}
        >
          <ClipboardList className="h-3.5 w-3.5" /> Pedidos
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors ${
            activeTab === "settings"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground"
          }`}
          onClick={() => onTabChange?.("settings")}
        >
          <Settings className="h-3.5 w-3.5" /> Configurações
        </button>
      </div>
    </header>
  );
}
