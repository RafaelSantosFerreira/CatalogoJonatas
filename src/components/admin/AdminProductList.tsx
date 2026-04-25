
"use client";

import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { ProductFormModal } from "@/components/ProductFormModal";
import { ProductViewModal } from "@/components/ProductViewModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import type { Product } from "@/types/product";

interface Props {
  products: Product[];
  loading: boolean;
}

export function AdminProductList({ products, loading }: Props) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = useCallback(() => { setSelected(null); setFormOpen(true); }, []);
  const handleEdit = useCallback((p: Product) => { setSelected(p); setFormOpen(true); }, []);
  const handleView = useCallback((p: Product) => { setSelected(p); setViewOpen(true); }, []);
  const handleDelete = useCallback((p: Product) => { setSelected(p); setDeleteOpen(true); }, []);

  return (
    <>
      <div className="mb-6 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground flex-1">
          <SlidersHorizontal className="h-4 w-4" />
          <span>{filtered.length} produto{filtered.length !== 1 ? "s" : ""}</span>
        </div>
        <Button onClick={handleNew} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Produto
        </Button>
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
          <p className="text-sm text-muted-foreground">Clique em &quot;Novo Produto&quot; para começar.</p>
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

      <ProductFormModal open={formOpen} onClose={() => setFormOpen(false)} product={selected} />
      <ProductViewModal open={viewOpen} onClose={() => setViewOpen(false)} product={selected} />
      <DeleteConfirmDialog open={deleteOpen} onClose={() => setDeleteOpen(false)} product={selected} />
    </>
  );
}
