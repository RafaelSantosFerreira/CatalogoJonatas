
"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Palette, Ruler, Droplets } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Product, ProductColor, ProductSize, ProductVolume } from "@/types/product";
import type { SelectedAttributes } from "@/types/cart";

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  showPrices?: boolean;
  onConfirm: (product: Product, attrs: SelectedAttributes) => Promise<void>;
}

export function ProductAttributeModal({ open, onClose, product, showPrices = true, onConfirm }: Props) {
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
  const [selectedVolume, setSelectedVolume] = useState<ProductVolume | null>(null);
  const [loading, setLoading] = useState(false);

  if (!product) return null;

  const hasColors = (product.colors?.length ?? 0) > 0;
  const hasSizes = (product.sizes?.length ?? 0) > 0;
  const hasVolumes = (product.volumes?.length ?? 0) > 0;
  const hasAnyAttribute = hasColors || hasSizes || hasVolumes;

  const isColorRequired = hasColors && !selectedColor;
  const isSizeRequired = hasSizes && !selectedSize;
  const isVolumeRequired = hasVolumes && !selectedVolume;
  const canConfirm = !isColorRequired && !isSizeRequired && !isVolumeRequired;

  const handleClose = () => {
    setSelectedColor(null);
    setSelectedSize(null);
    setSelectedVolume(null);
    onClose();
  };

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setLoading(true);
    const attrs: SelectedAttributes = {
      color_id: selectedColor?.id,
      color_name: selectedColor?.color_name,
      size_id: selectedSize?.id,
      size_label: selectedSize?.size_label,
      volume_id: selectedVolume?.id,
      volume_label: selectedVolume
        ? `${selectedVolume.volume_value} ${selectedVolume.volume_unit}`
        : undefined,
    };
    await onConfirm(product, attrs);
    setLoading(false);
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShoppingCart className="h-4 w-4 text-primary" />
            Adicionar ao Carrinho
          </DialogTitle>
          <DialogDescription className="text-xs">
            {hasAnyAttribute
              ? "Selecione os atributos desejados antes de adicionar."
              : "Confirme para adicionar o produto ao carrinho."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border bg-muted/30 px-3 py-2 flex items-center gap-2">
            {product.image_url && (
              <Image
                src={product.image_url}
                alt={product.name}
                width={40}
                height={40}
                sizes="40px"
                className="h-10 w-10 rounded-md object-cover border shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{product.name}</p>
              {showPrices && product.price != null && (
                <p className="text-xs text-primary font-medium">
                  {product.price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              )}
            </div>
          </div>

          {hasColors && (
            <>
              <Separator />
              <ColorSelector
                colors={product.colors!}
                selected={selectedColor}
                onSelect={setSelectedColor}
              />
            </>
          )}

          {hasSizes && (
            <>
              <Separator />
              <SizeSelector
                sizes={product.sizes!}
                selected={selectedSize}
                onSelect={setSelectedSize}
              />
            </>
          )}

          {hasVolumes && (
            <>
              <Separator />
              <VolumeSelector
                volumes={product.volumes!}
                selected={selectedVolume}
                onSelect={setSelectedVolume}
              />
            </>
          )}

          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleConfirm}
              disabled={!canConfirm || loading}
            >
              {loading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
              Adicionar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ColorSelector({
  colors,
  selected,
  onSelect,
}: {
  colors: ProductColor[];
  selected: ProductColor | null;
  onSelect: (c: ProductColor) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Palette className="h-4 w-4" />
        Cor
        <span className="text-destructive text-xs">*</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-all
              ${selected?.id === c.id
                ? "border-primary bg-primary/10 font-semibold ring-1 ring-primary"
                : "hover:border-primary/50 hover:bg-muted"
              }`}
          >
            {c.hex_code && (
              <span
                className="h-3 w-3 rounded-full border"
                style={{ backgroundColor: c.hex_code }}
              />
            )}
            {c.color_name}
          </button>
        ))}
      </div>
    </div>
  );
}

function SizeSelector({
  sizes,
  selected,
  onSelect,
}: {
  sizes: ProductSize[];
  selected: ProductSize | null;
  onSelect: (s: ProductSize) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Ruler className="h-4 w-4" />
        Tamanho
        <span className="text-destructive text-xs">*</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s)}
            className={`rounded-md border px-3 py-1 text-xs transition-all
              ${selected?.id === s.id
                ? "border-primary bg-primary/10 font-semibold ring-1 ring-primary"
                : "hover:border-primary/50 hover:bg-muted"
              }`}
          >
            {s.size_label}{s.size_unit ? ` ${s.size_unit}` : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

function VolumeSelector({
  volumes,
  selected,
  onSelect,
}: {
  volumes: ProductVolume[];
  selected: ProductVolume | null;
  onSelect: (v: ProductVolume) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-sm font-medium">
        <Droplets className="h-4 w-4" />
        Volume
        <span className="text-destructive text-xs">*</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {volumes.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v)}
            className={`rounded-md border px-3 py-1 text-xs transition-all
              ${selected?.id === v.id
                ? "border-primary bg-primary/10 font-semibold ring-1 ring-primary"
                : "hover:border-primary/50 hover:bg-muted"
              }`}
          >
            {v.volume_value} {v.volume_unit}
          </button>
        ))}
      </div>
    </div>
  );
}
