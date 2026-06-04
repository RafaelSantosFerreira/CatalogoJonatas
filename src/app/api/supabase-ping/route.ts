import { db, schema } from "@/db";
import { logAppError } from "@/lib/app-logger";

/** GET /api/supabase-ping — agora testa conectividade SQLite. Mantido por compatibilidade. */
export async function GET() {
  try {
    const row = await db.select({ id: schema.products.id }).from(schema.products).limit(1).get();
    return Response.json({
      connected: true,
      db: "sqlite",
      message: "Banco SQLite acessível.",
      hasProducts: Boolean(row),
    });
  } catch (e) {
    logAppError("api/supabase-ping.GET", e);
    return Response.json({ connected: false, db: "sqlite", message: "Erro ao acessar banco SQLite." }, { status: 500 });
  }
}
