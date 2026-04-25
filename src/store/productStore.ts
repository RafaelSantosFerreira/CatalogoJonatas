
"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product, ProductFormData } from "@/types/product";

async function fetchProductDetails(productId: string) {
  const [colorsRes, sizesRes, volumesRes] = await Promise.all([
    supabase.from("product_colors").select("*").eq("product_id", productId),
    supabase.from("product_sizes").select("*").eq("product_id", productId),
    supabase.from("product_volumes").select("*").eq("product_id", productId),
  ]);
  return {
    colors: colorsRes.data ?? [],
    sizes: sizesRes.data ?? [],
    volumes: volumesRes.data ?? [],
  };
}

type DetailRow = { id: string; product_id: string };

function groupByProductId<T extends DetailRow>(rows: T[] | null | undefined): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const row of rows ?? []) {
    if (!grouped[row.product_id]) grouped[row.product_id] = [];
    grouped[row.product_id].push(row);
  }
  return grouped;
}

function parsePrice(price: string): number | null {
  if (price === "" || price === null || price === undefined) return null;
  const parsed = parseFloat(price);
  // Allow zero as a valid price
  if (isNaN(parsed)) return null;
  return parsed;
}

async function saveProductDetails(productId: string, data: ProductFormData) {
  await supabase.from("product_colors").delete().eq("product_id", productId);
  await supabase.from("product_sizes").delete().eq("product_id", productId);
  await supabase.from("product_volumes").delete().eq("product_id", productId);

  if (data.colors.filter((c) => c.color_name).length > 0) {
    await supabase.from("product_colors").insert(
      data.colors
        .filter((c) => c.color_name)
        .map((c) => ({ product_id: productId, color_name: c.color_name, hex_code: c.hex_code || null }))
    );
  }
  if (data.sizes.filter((s) => s.size_label).length > 0) {
    await supabase.from("product_sizes").insert(
      data.sizes
        .filter((s) => s.size_label)
        .map((s) => ({ product_id: productId, size_label: s.size_label, size_unit: s.size_unit || null }))
    );
  }
  if (data.volumes.filter((v) => v.volume_value).length > 0) {
    await supabase.from("product_volumes").insert(
      data.volumes
        .filter((v) => v.volume_value)
        .map((v) => ({ product_id: productId, volume_value: parseFloat(v.volume_value), volume_unit: v.volume_unit }))
    );
  }
}

export function useProductStore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) { setLoading(false); return; }

    const productIds = data.map((p) => p.id);
    const [colorsRes, sizesRes, volumesRes] = await Promise.all([
      supabase.from("product_colors").select("*").in("product_id", productIds),
      supabase.from("product_sizes").select("*").in("product_id", productIds),
      supabase.from("product_volumes").select("*").in("product_id", productIds),
    ]);

    const colorsByProduct = groupByProductId(colorsRes.data);
    const sizesByProduct = groupByProductId(sizesRes.data);
    const volumesByProduct = groupByProductId(volumesRes.data);

    const enriched = data.map((p) => ({
      ...p,
      colors: colorsByProduct[p.id] ?? [],
      sizes: sizesByProduct[p.id] ?? [],
      volumes: volumesByProduct[p.id] ?? [],
    }));
    setProducts(enriched as Product[]);
    setLoading(false);
  }, []);

  const createProduct = useCallback(async (data: ProductFormData) => {
    const { data: product } = await supabase
      .from("products")
      .insert({
        name: data.name,
        description: data.description || null,
        price: parsePrice(data.price),
        image_url: data.image_url || null,
        category: data.category || null,
        brand: data.brand || null,
        sku: data.sku || null,
        active: data.active,
      })
      .select("*")
      .maybeSingle();

    if (!product) return;
    await saveProductDetails(product.id, data);
    const details = await fetchProductDetails(product.id);
    setProducts((prev) => [{ ...product, ...details } as Product, ...prev]);
  }, []);

  const updateProduct = useCallback(async (id: string, data: ProductFormData) => {
    const { data: product } = await supabase
      .from("products")
      .update({
        name: data.name,
        description: data.description || null,
        price: parsePrice(data.price),
        image_url: data.image_url || null,
        category: data.category || null,
        brand: data.brand || null,
        sku: data.sku || null,
        active: data.active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (!product) return;
    await saveProductDetails(id, data);
    const details = await fetchProductDetails(id);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? ({ ...product, ...details } as Product) : p))
    );
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await supabase.from("product_colors").delete().eq("product_id", id);
    await supabase.from("product_sizes").delete().eq("product_id", id);
    await supabase.from("product_volumes").delete().eq("product_id", id);
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { products, loading, fetchProducts, createProduct, updateProduct, deleteProduct };
}
