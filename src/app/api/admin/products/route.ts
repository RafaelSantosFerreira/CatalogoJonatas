import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { loadProductsEnriched, loadProductById } from "@/lib/load-products-enriched";
import { parseProductPrice, saveProductDetails } from "@/lib/product-mutations";
import { db, schema } from "@/db";
import { logAppError, messageFromUnknown } from "@/lib/app-logger";
import { z } from "zod";

export const dynamic = "force-dynamic";

const productSchema = z.object({
  name: z.string().min(1, "Nome do produto é obrigatório."),
  description: z.string().nullable().optional(),
  price: z.union([z.number(), z.string(), z.null()]).optional(),
  image_url: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  internal_code: z.string().nullable().optional(),
  active: z.boolean().optional().default(true),
  colors: z.array(z.unknown()).optional(),
  sizes: z.array(z.unknown()).optional(),
  volumes: z.array(z.unknown()).optional(),
});

export async function GET(request: Request) {
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) {
    return Response.json({ error: "Não autorizado." }, { status: 403 });
  }
  try {
    const products = await loadProductsEnriched();
    return Response.json({ products });
  } catch (e) {
    logAppError("api/admin/products.GET", e);
    return Response.json({ error: messageFromUnknown(e) }, { status: 502 });
  }
}

export async function POST(request: Request) {
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) {
    return Response.json({ error: "Não autorizado." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Dados inválidos.", details: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const id = crypto.randomUUID();
    await db.insert(schema.products).values({
      id,
      name: data.name.trim(),
      description: data.description || null,
      price: data.price != null ? parseProductPrice(String(data.price)) : null,
      image_url: data.image_url || null,
      category: data.category || null,
      brand: data.brand || null,
      sku: data.sku || null,
      internal_code: data.internal_code?.trim() || null,
      active: data.active,
    });

    await saveProductDetails(id, {
      name: data.name,
      description: data.description ?? "",
      price: data.price != null ? String(data.price) : "",
      image_url: data.image_url ?? "",
      category: data.category ?? "",
      brand: data.brand ?? "",
      sku: data.sku ?? "",
      internal_code: data.internal_code ?? "",
      active: data.active,
      colors: (data.colors ?? []) as { color_name: string; hex_code: string }[],
      sizes: (data.sizes ?? []) as { size_label: string; size_unit: string }[],
      volumes: (data.volumes ?? []) as { volume_value: string; volume_unit: string }[],
    });
    const enriched = await loadProductById(id);
    if (!enriched) throw new Error("Falha ao recarregar produto criado.");
    return Response.json({ product: enriched });
  } catch (e) {
    logAppError("api/admin/products.POST", e);
    return Response.json({ error: messageFromUnknown(e) }, { status: 400 });
  }
}
