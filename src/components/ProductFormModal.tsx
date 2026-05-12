
"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ColorFields } from "@/components/ColorFields";
import { SizeFields } from "@/components/SizeFields";
import { VolumeFields } from "@/components/VolumeFields";
import { logAppError } from "@/lib/app-logger";
import { useProductStore } from "@/store/productStore";
import type { Product, ProductFormData } from "@/types/product";

/** Limite para armazenar imagem como data URL no banco (evita linhas gigantes). */
const MAX_IMAGE_BYTES = 750 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error ?? new Error("Falha ao ler arquivo"));
    r.readAsDataURL(file);
  });
}

const EMPTY_FORM: ProductFormData = {
  name: "", description: "", price: "", image_url: "",
  category: "", brand: "", sku: "", active: true,
  colors: [], sizes: [], volumes: [],
};

interface Props { open: boolean; onClose: () => void; product: Product | null; }

async function resizeImageFile(file: File, maxDimension = 1600): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/webp";
  let quality = outputType === "image/png" ? undefined : 0.86;

  const toBlob = (q?: number) =>
    new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, outputType, q));

  let blob = await toBlob(quality);
  if (!blob) return file;

  // Tenta reduzir qualidade automaticamente se ainda estiver grande.
  while (blob.size > 5 * 1024 * 1024 && quality && quality > 0.5) {
    quality -= 0.08;
    blob = await toBlob(quality);
    if (!blob) break;
  }
  if (!blob) return file;

  const ext = outputType === "image/png" ? "png" : "webp";
  const filename = (file.name.replace(/\.[^.]+$/, "") || "imagem") + `.${ext}`;
  return new File([blob], filename, { type: outputType, lastModified: Date.now() });
}

export function ProductFormModal({ open, onClose, product }: Props) {
  const { createProduct, updateProduct } = useProductStore();
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        description: product.description ?? "",
        price: product.price != null ? String(product.price) : "",
        image_url: product.image_url ?? "",
        category: product.category ?? "",
        brand: product.brand ?? "",
        sku: product.sku ?? "",
        active: product.active,
        colors: product.colors?.map((c) => ({ color_name: c.color_name, hex_code: c.hex_code ?? "" })) ?? [],
        sizes: product.sizes?.map((s) => ({ size_label: s.size_label, size_unit: s.size_unit ?? "" })) ?? [],
        volumes: product.volumes?.map((v) => ({ volume_value: String(v.volume_value), volume_unit: v.volume_unit })) ?? [],
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setUploadError(null);
    setSaveError(null);
  }, [product, open]);

  const set = useCallback((field: keyof ProductFormData, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value })), []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const resized = await resizeImageFile(file);
      if (resized.size > MAX_IMAGE_BYTES) {
        setUploadError(
          "Imagem ainda grande demais após o processamento (~750 KB). Use arquivo menor ou imagem com menos pixels."
        );
      } else {
        const dataUrl = await readFileAsDataUrl(resized);
        set("image_url", dataUrl);
      }
    } catch {
      setUploadError("Erro ao processar a imagem. Tente outro arquivo.");
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleRemoveImage = () => {
    set("image_url", "");
    setUploadError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaveError(null);
    setSaving(true);
    try {
      if (product) await updateProduct(product.id, form);
      else await createProduct(form);
    } catch (e) {
      logAppError("ProductFormModal.submit", e, {
        mode: product ? "update" : "create",
        name: form.name,
      });
      const detail = e instanceof Error ? e.message : "Erro desconhecido.";
      setSaveError(
        detail
          ? `Não foi possível salvar: ${detail}`
          : "Não foi possível salvar o produto. Verifique os logs e tente novamente."
      );
      setSaving(false);
      return;
    }
    setSaving(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-full p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>{product ? "Editar Produto" : "Novo Produto"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[75vh]">
          <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">

            {/* Image Upload */}
            <div className="space-y-1.5">
              <Label>Foto do Produto</Label>
              {form.image_url ? (
                <div className="relative w-full h-48 rounded-lg border overflow-hidden group">
                  <Image
                    src={form.image_url}
                    alt="preview"
                    fill
                    sizes="(max-width: 768px) 100vw, 480px"
                    className="object-cover"
                    unoptimized={
                      form.image_url.startsWith("data:") || form.image_url.startsWith("blob:")
                    }
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="cursor-pointer">
                      <Button type="button" variant="secondary" size="sm" asChild>
                        <span>
                          {uploading
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : "Trocar foto"}
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </label>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center justify-center w-full h-36 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/40 hover:bg-muted/70 transition-colors gap-2">
                    {uploading ? (
                      <>
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Enviando imagem...</span>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-8 w-8 text-muted-foreground/50" />
                        <span className="text-sm text-muted-foreground">Clique para enviar uma foto</span>
                        <span className="text-xs text-muted-foreground/60">JPG, PNG ou WEBP · máx. 5 MB</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
              {uploadError && (
                <p className="text-xs text-destructive">{uploadError}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nome *</Label>
                <Input required value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Nome do produto" />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Ex: Parafusos" />
              </div>
              <div className="space-y-1.5">
                <Label>Marca</Label>
                <Input value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Ex: Tramontina" />
              </div>
              <div className="space-y-1.5">
                <Label>SKU / Código</Label>
                <Input value={form.sku} onChange={(e) => set("sku", e.target.value)} placeholder="Ex: PRF-001" />
              </div>
              <div className="space-y-1.5">
                <Label>Preço (R$)</Label>
                {/* min="0" allows zero price */}
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Descreva o produto..." rows={3} />
            </div>

            <ColorFields colors={form.colors} onChange={(v) => set("colors", v)} />
            <SizeFields sizes={form.sizes} onChange={(v) => set("sizes", v)} />
            <VolumeFields volumes={form.volumes} onChange={(v) => set("volumes", v)} />

            <div className="flex items-center justify-between pt-1">
              <Label htmlFor="active-switch">Produto ativo</Label>
              <Switch id="active-switch" checked={form.active} onCheckedChange={(v) => set("active", v)} />
            </div>

            <div className="flex gap-2 pt-2 pb-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={saving || uploading}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : product ? "Salvar" : "Criar Produto"}
              </Button>
            </div>
            {saveError && (
              <p className="text-xs text-destructive pt-1">{saveError}</p>
            )}
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
