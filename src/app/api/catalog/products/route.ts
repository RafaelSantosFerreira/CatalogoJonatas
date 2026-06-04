import { loadProductsEnriched } from "@/lib/load-products-enriched";
import { logAppError, messageFromUnknown } from "@/lib/app-logger";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await loadProductsEnriched();
    return Response.json({ products });
  } catch (e) {
    logAppError("api/catalog/products.GET", e);
    return Response.json({ error: messageFromUnknown(e) }, { status: 502 });
  }
}
