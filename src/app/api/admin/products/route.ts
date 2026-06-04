import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { loadProductsEnriched, loadProductById } from "@/lib/load-products-enriched";
import { parseProductPrice, saveProductDetails } from "@/lib/product-mutations";
import { db, schema } from "@/db";
import { logAppError, messageFromUnknown } from "@/lib/app-logger";
import type { ProductFormData } from "@/types/product";

export const dynamic = "force-dynamic";

function isProductFormData(body: unknown): body is ProductFormData {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return typeof o.name === "string";
}

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
  if (!isProductFormData(body) || !body.name.trim()) {
    return Response.json({ error: "Nome do produto é obrigatório." }, { status: 400 });
  }
  const data = body;

  try {
    const id = crypto.randomUUID();
    await db.insert(schema.products).values({
      id,
      name: data.name.trim(),
      description: data.description || null,
      price: parseProductPrice(data.price),
      image_url: data.image_url || null,
      category: data.category || null,
      brand: data.brand || null,
      sku: data.sku || null,
      internal_code: data.internal_code?.trim() || null,
      active: data.active,
    });

    await saveProductDetails(id, data);
    const enriched = await loadProductById(id);
    if (!enriched) throw new Error("Falha ao recarregar produto criado.");
    return Response.json({ product: enriched });
  } catch (e) {
    logAppError("api/admin/products.POST", e);
    return Response.json({ error: messageFromUnknown(e) }, { status: 400 });
  }
}
