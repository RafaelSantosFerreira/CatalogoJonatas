
"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { useProductStore } from "@/store/productStore";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import type { Product } from "@/types/product";

const ProductViewModal = dynamic(
  () => import("@/components/ProductViewModal").then((m) => m.ProductViewModal),
  { ssr: false }
);

export default function CatalogPage() {
  const { products, loading, fetchProducts } = useProductStore();
  const { settings } = useCompanySettings();
  const [search, setSearch] = useState("");
  const showPrices = settings?.show_prices ?? true;

  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);

  useEffect(() => {
    void fetchProducts("catalog");
  }, [fetchProducts]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

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
            <h3 className="text-lg font-semibold mb-1">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground">
              {search ? "Tente outro termo de busca." : "Nenhum produto cadastrado ainda."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence>
              {filtered.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  showPrices={showPrices}
                  onView={(prod) => { setSelected(prod); setViewOpen(true); }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      <ProductViewModal
        open={viewOpen}
        onClose={() => setViewOpen(false)}
        product={selected}
        showPrices={showPrices}
      />
    </div>
  );
}
