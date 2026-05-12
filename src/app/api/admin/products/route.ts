import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { supabaseAdmin, supabaseAdminConfigured } from "@/integrations/supabase/server";
import { loadProductsEnriched, loadProductById } from "@/lib/load-products-enriched";
import { parseProductPrice, saveProductDetails } from "@/lib/product-mutations";
import { logAppError } from "@/lib/app-logger";
import type { ProductFormData } from "@/types/product";

export const dynamic = "force-dynamic";

function isProductFormData(body: unknown): body is ProductFormData {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return typeof o.name === "string";
}

export async function GET(request: Request) {
  if (!supabaseAdminConfigured) {
    return Response.json({ error: "Service role do Supabase não configurada no servidor." }, { status: 503 });
  }
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) {
    return Response.json({ error: "Não autorizado." }, { status: 403 });
  }
  try {
    const products = await loadProductsEnriched(supabaseAdmin);
    return Response.json({ products });
  } catch (e) {
    logAppError("api/admin/products.GET", e);
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!supabaseAdminConfigured) {
    return Response.json({ error: "Service role do Supabase não configurada no servidor." }, { status: 503 });
  }
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
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .insert({
        name: data.name.trim(),
        description: data.description || null,
        price: parseProductPrice(data.price),
        image_url: data.image_url || null,
        category: data.category || null,
        brand: data.brand || null,
        sku: data.sku || null,
        active: data.active,
      })
      .select("*")
      .maybeSingle();

    if (error) throw error;
    if (!product) throw new Error("Produto não retornado após insert.");

    await saveProductDetails(supabaseAdmin, product.id, data);
    const enriched = await loadProductById(supabaseAdmin, product.id);
    if (!enriched) throw new Error("Falha ao recarregar produto criado.");
    return Response.json({ product: enriched });
  } catch (e) {
    logAppError("api/admin/products.POST", e);
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 400 });
  }
}
