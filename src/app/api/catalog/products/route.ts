import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/supabase-env";
import { loadProductsEnriched } from "@/lib/load-products-enriched";
import { logAppError, messageFromUnknown } from "@/lib/app-logger";

export const dynamic = "force-dynamic";

/** Catálogo público: leitura via servidor (evita bloqueio de fetch direto ao Supabase em previews embutidos). */
export async function GET() {
  const { url, key, isConfigured } = getPublicSupabaseConfig();
  if (!isConfigured) {
    return Response.json({ error: "Supabase público não configurado." }, { status: 500 });
  }
  const db = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  try {
    const products = await loadProductsEnriched(db);
    return Response.json({ products });
  } catch (e) {
    logAppError("api/catalog/products.GET", e);
    const msg = messageFromUnknown(e);
    return Response.json({ error: msg }, { status: 502 });
  }
}
