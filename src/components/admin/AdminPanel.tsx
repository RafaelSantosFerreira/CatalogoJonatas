
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { Search, Plus, LogOut, Wrench, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ProductCard } from "@/components/ProductCard";
import { ProductFormModal } from "@/components/ProductFormModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { ProductViewModal } from "@/components/ProductViewModal";
import { useProductStore } from "@/store/productStore";
import type { Product } from "@/types/product";

export default function AdminPanel() {
  const router = useRouter();
  const { products, loading, fetchProducts } = useProductStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin/login");
      } else {
        setAuthChecked(true);
        fetchProducts();
      }
    });
  }, [router, fetchProducts]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = useCallback(() => { setSelected(null); setFormOpen(true); }, []);
  const handleEdit = useCallback((p: Product) => { setSelected(p); setFormOpen(true); }, []);
  const handleView = useCallback((p: Product) => { setSelected(p); setViewOpen(true); }, []);
  const handleDelete = useCallback((p: Product) => { setSelected(p); setDeleteOpen(true); }, []);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-muted-foreground text-sm">Verificando acesso...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Ferragem Pro</h1>
              <p className="text-xs text-muted-foreground">Painel Administrativo</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={handleNew} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Novo Produto
            </Button>
            <Button onClick={handleLogout} size="sm" variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            <span>{filtered.length} produto{filtered.length !== 1 ? "s" : ""}</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-card h-72 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-5xl mb-4">🔧</div>
            <h3 className="text-lg font-semibold mb-1">Nenhum produto cadastrado</h3>
            <p className="text-sm text-muted-foreground">Clique em "Novo Produto" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onView={handleView}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} product={selected} />
      <ProductViewModal open={viewOpen} onClose={() => setViewOpen(false)} product={selected} />
      <DeleteConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} product={selected} />
    </div>
  );
}
