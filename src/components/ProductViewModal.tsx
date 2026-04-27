
"use client";

import { Package, Tag, Ruler, Droplets, Palette, BadgeCheck, BadgeX } from "lucide-react";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/types/product";

interface Props { open: boolean; onClose: () => void; product: Product | null; showPrices?: boolean; }

export function ProductViewModal({ open, onClose, product, showPrices = true }: Props) {
  if (!product) return null;

  const price = product.price != null
    ? product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2">
            {product.name}
            {product.active
              ? <BadgeCheck className="h-4 w-4 text-green-500" />
              : <BadgeX className="h-4 w-4 text-muted-foreground" />}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <div className="px-6 py-4 space-y-4">
            {product.image_url ? (
              <div className="relative w-full h-56 rounded-lg border overflow-hidden">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-40 rounded-lg border bg-muted flex items-center justify-center">
                <Package className="h-14 w-14 text-muted-foreground/30" />
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {showPrices && price && <Badge variant="default" className="text-sm">{price}</Badge>}
              {product.category && <Badge variant="secondary"><Tag className="h-3 w-3 mr-1" />{product.category}</Badge>}
              {product.brand && <Badge variant="outline">{product.brand}</Badge>}
              {product.sku && <Badge variant="outline" className="font-mono text-xs">{product.sku}</Badge>}
            </div>

            {product.description && (
              <>
                <Separator />
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              </>
            )}

            {(product.colors?.length ?? 0) > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Palette className="h-4 w-4" /> Cores disponíveis
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.colors?.map((c) => (
                      <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs">
                        {c.hex_code && <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: c.hex_code }} />}
                        {c.color_name}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(product.sizes?.length ?? 0) > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Ruler className="h-4 w-4" /> Tamanhos
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes?.map((s) => (
                      <Badge key={s.id} variant="secondary">{s.size_label}{s.size_unit ? ` ${s.size_unit}` : ""}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}

            {(product.volumes?.length ?? 0) > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <Droplets className="h-4 w-4" /> Volume / Capacidade
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {product.volumes?.map((v) => (
                      <Badge key={v.id} variant="secondary">{v.volume_value} {v.volume_unit}</Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
