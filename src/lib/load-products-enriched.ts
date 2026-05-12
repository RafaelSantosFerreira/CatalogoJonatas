import type { SupabaseClient } from "@supabase/supabase-js";
import type { Product, ProductColor, ProductSize, ProductVolume } from "@/types/product";

type DetailRow = { id: string; product_id: string };

function groupByProductId<T extends DetailRow>(rows: T[] | null | undefined): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const row of rows ?? []) {
    if (!grouped[row.product_id]) grouped[row.product_id] = [];
    grouped[row.product_id].push(row);
  }
  return grouped;
}

/** Lista produtos com cores, tamanhos e volumes (mesma forma que o catálogo/admin esperam). */
export async function loadProductsEnriched(db: SupabaseClient): Promise<Product[]> {
  const { data, error } = await db.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  if (!data?.length) return [];

  const productIds = data.map((p) => p.id);
  const [colorsRes, sizesRes, volumesRes] = await Promise.all([
    db.from("product_colors").select("*").in("product_id", productIds),
    db.from("product_sizes").select("*").in("product_id", productIds),
    db.from("product_volumes").select("*").in("product_id", productIds),
  ]);
  if (colorsRes.error) throw colorsRes.error;
  if (sizesRes.error) throw sizesRes.error;
  if (volumesRes.error) throw volumesRes.error;

  const colorsByProduct = groupByProductId(colorsRes.data as ProductColor[]);
  const sizesByProduct = groupByProductId(sizesRes.data as ProductSize[]);
  const volumesByProduct = groupByProductId(volumesRes.data as ProductVolume[]);

  return data.map((p) => ({
    ...p,
    colors: colorsByProduct[p.id] ?? [],
    sizes: sizesByProduct[p.id] ?? [],
    volumes: volumesByProduct[p.id] ?? [],
  })) as Product[];
}

export async function loadProductById(db: SupabaseClient, id: string): Promise<Product | null> {
  const { data: row, error } = await db.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!row) return null;
  const [colorsRes, sizesRes, volumesRes] = await Promise.all([
    db.from("product_colors").select("*").eq("product_id", id),
    db.from("product_sizes").select("*").eq("product_id", id),
    db.from("product_volumes").select("*").eq("product_id", id),
  ]);
  if (colorsRes.error) throw colorsRes.error;
  if (sizesRes.error) throw sizesRes.error;
  if (volumesRes.error) throw volumesRes.error;
  return {
    ...row,
    colors: colorsRes.data ?? [],
    sizes: sizesRes.data ?? [],
    volumes: volumesRes.data ?? [],
  } as Product;
}
