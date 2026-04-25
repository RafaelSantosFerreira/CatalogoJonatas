
"use client";

import { Wrench, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CartDrawer } from "@/components/CartDrawer";
import { useAppDisplayName } from "@/hooks/useAppDisplayName";

export function Header() {
  const appName = useAppDisplayName();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-none">{appName}</h1>
            <p className="text-xs text-muted-foreground">Catálogo de Produtos</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <CartDrawer />
          <Button asChild size="sm" variant="outline" className="gap-2">
            <Link href="/admin">
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">Área Admin</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
