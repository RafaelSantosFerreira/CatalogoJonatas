import { db, schema } from "@/db";
import { logAppError } from "@/lib/app-logger";
import { getTwilioFromEnv } from "@/lib/env-twilio";
import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const rl = checkRateLimit({
      request,
      key: "api:seed-twilio",
      windowMs: 60_000,
      max: 10,
    });
    if (!rl.allowed) {
      return Response.json(
        { success: false, error: "Muitas tentativas. Tente novamente em instantes." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const adminId = await getAdminUserIdFromRequest(request);
    if (!adminId) {
      return Response.json(
        { success: false, error: "Acesso negado. Faça login como administrador." },
        { status: 401 }
      );
    }

    const twilio = getTwilioFromEnv();
    if (!twilio.ok) {
      return Response.json(
        { success: false, error: `Defina no .env.local: ${twilio.missing.join(", ")}` },
        { status: 400 }
      );
    }

    const payload = { ...twilio.data, updated_at: new Date().toISOString() };
    const existing = await db.select({ id: schema.companySettings.id }).from(schema.companySettings).get();

    try {
      if (existing?.id) {
        await db.update(schema.companySettings).set(payload);
      } else {
        await db.insert(schema.companySettings).values(payload);
      }
    } catch (e) {
      logAppError("api/seed-twilio.db", e);
      return Response.json({ success: false, error: "Erro ao salvar no banco." }, { status: 500 });
    }

    return Response.json({ success: true, message: "Configurações Twilio salvas a partir do .env." });
  } catch (err) {
    logAppError("api/seed-twilio.catch", err);
    return Response.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
