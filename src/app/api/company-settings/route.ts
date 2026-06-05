import { db, schema } from "@/db";
import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { logAppError } from "@/lib/app-logger";
import { z } from "zod";

const companySettingsSchema = z.object({
  company_name: z.string().nullable().optional(),
  order_email: z.string().email().nullable().optional(),
  whatsapp_country_code: z.string().max(5).optional(),
  whatsapp_number: z.string().nullable().optional(),
  email_notifications_enabled: z.boolean().optional(),
  whatsapp_notifications_enabled: z.boolean().optional(),
  show_prices: z.boolean().optional(),
  smtp_host: z.string().nullable().optional(),
  smtp_port: z.number().int().nullable().optional(),
  smtp_user: z.string().nullable().optional(),
  smtp_password: z.string().nullable().optional(),
  smtp_secure: z.boolean().nullable().optional(),
  smtp_from_name: z.string().nullable().optional(),
  smtp_from_email: z.string().email().nullable().optional(),
  twilio_account_sid: z.string().nullable().optional(),
  twilio_auth_token: z.string().nullable().optional(),
  twilio_whatsapp_from: z.string().nullable().optional(),
  twilio_content_sid: z.string().nullable().optional(),
});

export async function GET() {
  try {
    const settings = (await db.select().from(schema.companySettings))[0];
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

  const parsedBody = companySettingsSchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json({ error: "Dados inválidos.", details: parsedBody.error.flatten() }, { status: 400 });
  }

  try {
    const existing = (await db.select({ id: schema.companySettings.id }).from(schema.companySettings))[0];
    const payload = { ...parsedBody.data, updated_at: new Date().toISOString() };

    if (existing?.id) {
      const updated = await db
        .update(schema.companySettings)
        .set(payload)
        .returning();
      return Response.json({ data: updated[0] });
    } else {
      const inserted = await db
        .insert(schema.companySettings)
        .values(payload)
        .returning();
      return Response.json({ data: inserted[0] });
    }
  } catch (e) {
    logAppError("api/company-settings.PUT", e);
    return Response.json({ error: "Erro ao salvar configurações." }, { status: 500 });
  }
}
