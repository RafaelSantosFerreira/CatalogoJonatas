import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProductFormData } from "@/types/product";

export function parseProductPrice(price: string): number | null {
  if (price === "" || price === null || price === undefined) return null;
  const parsed = parseFloat(price);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export async function saveProductDetails(db: SupabaseClient, productId: string, data: ProductFormData): Promise<void> {
  const clearColors = await db.from("product_colors").delete().eq("product_id", productId);
  if (clearColors.error) throw clearColors.error;
  const clearSizes = await db.from("product_sizes").delete().eq("product_id", productId);
  if (clearSizes.error) throw clearSizes.error;
  const clearVolumes = await db.from("product_volumes").delete().eq("product_id", productId);
  if (clearVolumes.error) throw clearVolumes.error;

  if (data.colors.filter((c) => c.color_name).length > 0) {
    const insertColors = await db.from("product_colors").insert(
      data.colors
        .filter((c) => c.color_name)
        .map((c) => ({ product_id: productId, color_name: c.color_name, hex_code: c.hex_code || null }))
    );
    if (insertColors.error) throw insertColors.error;
  }
  if (data.sizes.filter((s) => s.size_label).length > 0) {
    const insertSizes = await db.from("product_sizes").insert(
      data.sizes
        .filter((s) => s.size_label)
        .map((s) => ({ product_id: productId, size_label: s.size_label, size_unit: s.size_unit || null }))
    );
    if (insertSizes.error) throw insertSizes.error;
  }
  if (data.volumes.filter((v) => v.volume_value).length > 0) {
    const insertVolumes = await db.from("product_volumes").insert(
      data.volumes
        .filter((v) => v.volume_value)
        .map((v) => ({
          product_id: productId,
          volume_value: parseFloat(v.volume_value),
          volume_unit: v.volume_unit,
        }))
    );
    if (insertVolumes.error) throw insertVolumes.error;
  }
}
