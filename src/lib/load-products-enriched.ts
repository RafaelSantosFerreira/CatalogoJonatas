import { db, schema } from "@/db";
import { eq, inArray, desc } from "drizzle-orm";
import type { Product, ProductColor, ProductSize, ProductVolume } from "@/types/product";

function groupByProductId<T extends { product_id: string }>(rows: T[]): Record<string, T[]> {
  const grouped: Record<string, T[]> = {};
  for (const row of rows) {
    if (!grouped[row.product_id]) grouped[row.product_id] = [];
    grouped[row.product_id].push(row);
  }
  return grouped;
}

export async function loadProductsEnriched(): Promise<Product[]> {
  const data = await db.select().from(schema.products).orderBy(desc(schema.products.created_at));
  if (!data.length) return [];

  const productIds = data.map((p) => p.id);
  const [colors, sizes, volumes] = await Promise.all([
    db.select().from(schema.productColors).where(inArray(schema.productColors.product_id, productIds)),
    db.select().from(schema.productSizes).where(inArray(schema.productSizes.product_id, productIds)),
    db.select().from(schema.productVolumes).where(inArray(schema.productVolumes.product_id, productIds)),
  ]);

  const colorsByProduct = groupByProductId(colors);
  const sizesByProduct = groupByProductId(sizes);
  const volumesByProduct = groupByProductId(volumes);

  return data.map((p) => ({
    ...p,
    price: p.price ?? undefined,
    colors: (colorsByProduct[p.id] ?? []) as ProductColor[],
    sizes: (sizesByProduct[p.id] ?? []) as ProductSize[],
    volumes: (volumesByProduct[p.id] ?? []) as ProductVolume[],
  })) as unknown as Product[];
}

export async function loadProductById(id: string): Promise<Product | null> {
  const row = (await db.select().from(schema.products).where(eq(schema.products.id, id)))[0];
  if (!row) return null;

  const [colors, sizes, volumes] = await Promise.all([
    db.select().from(schema.productColors).where(eq(schema.productColors.product_id, id)),
    db.select().from(schema.productSizes).where(eq(schema.productSizes.product_id, id)),
    db.select().from(schema.productVolumes).where(eq(schema.productVolumes.product_id, id)),
  ]);

  return {
    ...row,
    price: row.price ?? undefined,
    colors: colors as ProductColor[],
    sizes: sizes as ProductSize[],
    volumes: volumes as ProductVolume[],
  } as unknown as Product;
}
