
"use client";

import { Package, Pencil, Trash2, Eye, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Product } from "@/types/product";

interface AdminProductCardProps {
  product: Product;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function AdminProductCard({ product, onView, onEdit, onDelete }: AdminProductCardProps) {
  const formattedPrice =
    product.price != null
      ? product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="group relative flex flex-col rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="relative h-48 bg-muted cursor-pointer overflow-hidden" onClick={() => onView(product)}>
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
        {!product.active && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <Badge variant="secondary">Inativo</Badge>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight cursor-pointer hover:text-primary transition-colors line-clamp-2" onClick={() => onView(product)}>
            {product.name}
          </h3>
          {formattedPrice && <span className="shrink-0 text-sm font-bold text-primary">{formattedPrice}</span>}
        </div>

        {product.category && (
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{product.category}</span>
          </div>
        )}

        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
        )}

        <div className="flex flex-wrap gap-1 mt-auto pt-2">
          {product.colors?.slice(0, 3).map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
              {c.hex_code && <span className="h-2.5 w-2.5 rounded-full border" style={{ backgroundColor: c.hex_code }} />}
              {c.color_name}
            </span>
          ))}
          {(product.colors?.length ?? 0) > 3 && (
            <span className="text-xs text-muted-foreground">+{(product.colors?.length ?? 0) - 3}</span>
          )}
        </div>

        <div className="flex items-center gap-1 pt-2 border-t">
          <Button variant="ghost" size="sm" className="flex-1 gap-1 text-xs" onClick={() => onView(product)}>
            <Eye className="h-3.5 w-3.5" /> Ver
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-1 text-xs" onClick={() => onEdit(product)}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 gap-1 text-xs text-destructive hover:text-destructive" onClick={() => onDelete(product)}>
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
