import { supabaseAdmin } from "@/integrations/supabase/server";
import { logAppError } from "@/lib/app-logger";
import { getTwilioFromEnv } from "@/lib/env-twilio";
import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { checkRateLimit } from "@/lib/rate-limit";

/**
 * Grava Twilio em company_settings a partir do .env (sem segredos no código-fonte).
 */
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
        {
          success: false,
          error: `Defina no .env.local: ${twilio.missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const payload = { ...twilio.data, updated_at: new Date().toISOString() };

    const { data: existing } = await supabaseAdmin.from("company_settings").select("id").maybeSingle();

    let result;
    if (existing?.id) {
      result = await supabaseAdmin.from("company_settings").update(payload).eq("id", existing.id).select("id").maybeSingle();
    } else {
      result = await supabaseAdmin.from("company_settings").insert(payload).select("id").maybeSingle();
    }

    if (result.error) {
      logAppError("api/seed-twilio.supabase", result.error);
      return Response.json({ success: false, error: result.error.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      message: "Configurações Twilio salvas a partir do .env.",
    });
  } catch (err) {
    logAppError("api/seed-twilio.catch", err);
    return Response.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
