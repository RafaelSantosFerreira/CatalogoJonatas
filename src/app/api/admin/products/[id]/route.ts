import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { supabaseAdmin, supabaseAdminConfigured } from "@/integrations/supabase/server";
import { loadProductById } from "@/lib/load-products-enriched";
import { parseProductPrice, saveProductDetails } from "@/lib/product-mutations";
import { logAppError } from "@/lib/app-logger";
import type { ProductFormData } from "@/types/product";

export const dynamic = "force-dynamic";

function isProductFormData(body: unknown): body is ProductFormData {
  if (!body || typeof body !== "object") return false;
  const o = body as Record<string, unknown>;
  return typeof o.name === "string";
}

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!supabaseAdminConfigured) {
    return Response.json({ error: "Service role do Supabase não configurada no servidor." }, { status: 503 });
  }
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
    const { data: product, error } = await supabaseAdmin
      .from("products")
      .update({
        name: data.name.trim(),
        description: data.description || null,
        price: parseProductPrice(data.price),
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

    if (error) throw error;
    if (!product) {
      return Response.json({ error: "Produto não encontrado ou não atualizado." }, { status: 404 });
    }

    await saveProductDetails(supabaseAdmin, id, data);
    const enriched = await loadProductById(supabaseAdmin, id);
    if (!enriched) throw new Error("Falha ao recarregar produto atualizado.");
    return Response.json({ product: enriched });
  } catch (e) {
    logAppError("api/admin/products.PUT", e);
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
  if (!supabaseAdminConfigured) {
    return Response.json({ error: "Service role do Supabase não configurada no servidor." }, { status: 503 });
  }
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) {
    return Response.json({ error: "Não autorizado." }, { status: 403 });
  }

  const { id } = await ctx.params;
  if (!id) {
    return Response.json({ error: "ID ausente." }, { status: 400 });
  }

  try {
    await supabaseAdmin.from("product_colors").delete().eq("product_id", id);
    await supabaseAdmin.from("product_sizes").delete().eq("product_id", id);
    await supabaseAdmin.from("product_volumes").delete().eq("product_id", id);
    const { error } = await supabaseAdmin.from("products").delete().eq("id", id);
    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (e) {
    logAppError("api/admin/products.DELETE", e);
    const msg = e instanceof Error ? e.message : String(e);
    return Response.json({ error: msg }, { status: 400 });
  }
}
