import { db, schema } from "@/db";
import { logAppError } from "@/lib/app-logger";

/** GET /api/supabase-ping — agora testa conectividade SQLite. Mantido por compatibilidade. */
export async function GET() {
  try {
    const row = (await db.select({ id: schema.products.id }).from(schema.products).limit(1))[0];
    return Response.json({
      connected: true,
      db: "postgresql",
      message: "Banco PostgreSQL acessível.",
      hasProducts: Boolean(row),
    });
  } catch (e) {
    logAppError("api/supabase-ping.GET", e);
    return Response.json({ connected: false, db: "postgresql", message: "Erro ao acessar banco PostgreSQL." }, { status: 500 });
  }
}
