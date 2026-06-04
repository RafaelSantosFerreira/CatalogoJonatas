import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { ProductFormData } from "@/types/product";

export function parseProductPrice(price: string): number | null {
  if (price === "" || price === null || price === undefined) return null;
  const parsed = parseFloat(price);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

export async function saveProductDetails(productId: string, data: ProductFormData): Promise<void> {
  await db.delete(schema.productColors).where(eq(schema.productColors.product_id, productId));
  await db.delete(schema.productSizes).where(eq(schema.productSizes.product_id, productId));
  await db.delete(schema.productVolumes).where(eq(schema.productVolumes.product_id, productId));

  const colors = data.colors.filter((c) => c.color_name);
  if (colors.length > 0) {
    await db.insert(schema.productColors).values(
      colors.map((c) => ({
        product_id: productId,
        color_name: c.color_name,
        hex_code: c.hex_code || null,
      }))
    );
  }

  const sizes = data.sizes.filter((s) => s.size_label);
  if (sizes.length > 0) {
    await db.insert(schema.productSizes).values(
      sizes.map((s) => ({
        product_id: productId,
        size_label: s.size_label,
        size_unit: s.size_unit || null,
      }))
    );
  }

  const volumes = data.volumes.filter((v) => v.volume_value);
  if (volumes.length > 0) {
    await db.insert(schema.productVolumes).values(
      volumes.map((v) => ({
        product_id: productId,
        volume_value: parseFloat(v.volume_value),
        volume_unit: v.volume_unit,
      }))
    );
  }
}
