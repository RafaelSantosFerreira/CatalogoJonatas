import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { logAppError, logAppInfo, createTraceId } from "@/lib/app-logger";
import {
  fetchCompanyTwilioSettings,
  sendTwilioContentMessage,
  saveWhatsAppLogToDb,
} from "@/lib/twilio-messaging.server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  to: z.string().min(5),
  contentVariables: z.record(z.string(), z.string()).optional(),
});

export async function POST(request: Request) {
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) return Response.json({ error: "Não autorizado." }, { status: 403 });

  const traceId = createTraceId("admin-wa-test");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Payload inválido.", details: parsed.error.flatten() }, { status: 400 });
  }

  const { to, contentVariables } = parsed.data;

  try {
    const settings = await fetchCompanyTwilioSettings();
    if (!settings) return Response.json({ success: false, error: "Configurações da empresa não encontradas." }, { status: 404 });
    if (!settings.whatsapp_notifications_enabled) return Response.json({ success: false, error: "Notificações WhatsApp desativadas." }, { status: 400 });

    const { twilio_account_sid, twilio_auth_token, twilio_whatsapp_from, twilio_content_sid } = settings;
    if (!twilio_account_sid || !twilio_auth_token || !twilio_whatsapp_from || !twilio_content_sid) {
      return Response.json({ success: false, error: "Credenciais Twilio não configuradas." }, { status: 400 });
    }

    const toFormatted = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

    const result = await sendTwilioContentMessage({
      accountSid: twilio_account_sid,
      authToken: twilio_auth_token,
      from: twilio_whatsapp_from,
      to: toFormatted,
      contentSid: twilio_content_sid,
      contentVariables: contentVariables ?? {},
    });

    await saveWhatsAppLogToDb({
      to: toFormatted,
      from: twilio_whatsapp_from,
      contentSid: twilio_content_sid,
      contentVariables: contentVariables ?? {},
      result,
      requestPayload: { From: twilio_whatsapp_from, To: toFormatted, ContentSid: twilio_content_sid, TraceId: traceId, Source: "admin-test" },
      traceId,
    });

    logAppInfo("api/admin/whatsapp-test.POST", "Teste WhatsApp enviado", { adminId, traceId, success: result.success });

    if (!result.success) {
      return Response.json({ success: false, error: result.error, errorCode: result.errorCode, httpStatus: result.httpStatus }, { status: 500 });
    }
    return Response.json({ success: true, messageSid: result.messageSid, traceId });
  } catch (e) {
    logAppError("api/admin/whatsapp-test.POST", e, { adminId, traceId });
    return Response.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
