import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { loadProductById } from "@/lib/load-products-enriched";
import { parseProductPrice, saveProductDetails } from "@/lib/product-mutations";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { logAppError, messageFromUnknown } from "@/lib/app-logger";
import type { ProductFormData } from "@/types/product";

export const dynamic = "force-dynamic";

function isProductFormData(body: unknown): body is ProductFormData {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return typeof o.name === "string";
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) {
    return Response.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "ID ausente." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!isProductFormData(body) || !body.name.trim()) {
    return Response.json({ error: "Nome do produto é obrigatório." }, { status: 400 });
  }
  const data = body;

  try {
    const result = await db
      .update(schema.products)
      .set({
        name: data.name.trim(),
        description: data.description || null,
        price: parseProductPrice(data.price),
        image_url: data.image_url || null,
        category: data.category || null,
        brand: data.brand || null,
        sku: data.sku || null,
        internal_code: data.internal_code?.trim() || null,
        active: data.active,
        updated_at: new Date().toISOString(),
      })
      .where(eq(schema.products.id, id))
      .returning({ id: schema.products.id });

    if (!result.length) {
      return Response.json({ error: "Produto não encontrado." }, { status: 404 });
    }

    await saveProductDetails(id, data);
    const enriched = await loadProductById(id);
    if (!enriched) throw new Error("Falha ao recarregar produto atualizado.");
    return Response.json({ product: enriched });
  } catch (e) {
    logAppError("api/admin/products.PUT", e);
    return Response.json({ error: messageFromUnknown(e) }, { status: 400 });
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) {
    return Response.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "ID ausente." }, { status: 400 });
  }

  try {
    await db.delete(schema.productColors).where(eq(schema.productColors.product_id, id));
    await db.delete(schema.productSizes).where(eq(schema.productSizes.product_id, id));
    await db.delete(schema.productVolumes).where(eq(schema.productVolumes.product_id, id));
    await db.delete(schema.products).where(eq(schema.products.id, id));
    return new Response(null, { status: 204 });
  } catch (e) {
    logAppError("api/admin/products.DELETE", e);
    return Response.json({ error: messageFromUnknown(e) }, { status: 400 });
  }
}
