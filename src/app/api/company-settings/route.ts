import { db, schema } from "@/db";
import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { logAppError } from "@/lib/app-logger";

export async function GET() {
  try {
    const settings = await db.select().from(schema.companySettings).get();
    return Response.json({ data: settings ?? null });
  } catch (e) {
    logAppError("api/company-settings.GET", e);
    return Response.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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

  try {
    const existing = await db.select({ id: schema.companySettings.id }).from(schema.companySettings).get();
    const payload = { ...(body as object), updated_at: new Date().toISOString() };

    if (existing?.id) {
      const updated = await db
        .update(schema.companySettings)
        .set(payload)
        .returning();
      return Response.json({ data: updated[0] });
    } else {
      const inserted = await db
        .insert(schema.companySettings)
        .values(payload as Parameters<typeof db.insert>[0] extends { values: (v: infer V) => unknown } ? V : never)
        .returning();
      return Response.json({ data: inserted[0] });
    }
  } catch (e) {
    logAppError("api/company-settings.PUT", e);
    return Response.json({ error: "Erro ao salvar configurações." }, { status: 500 });
  }
}
