import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { createTraceId, logAppError, logAppInfo, logAppWarn } from "@/lib/app-logger";
import {
  fetchCompanyTwilioSettings,
  sendTwilioContentMessage,
  saveWhatsAppLogToDb,
} from "@/lib/twilio-messaging.server";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const whatsappPayloadSchema = z.object({
  to: z.string().min(5).optional(),
  contentVariables: z.record(z.string(), z.string()),
  orderId: z.string().uuid().optional(),
  useCompanyWhatsappTarget: z.boolean().optional(),
});

export async function POST(request: Request) {
  const traceId = request.headers.get("x-trace-id") || createTraceId("apiwa");
  const flowSource = request.headers.get("x-flow-source") || "unknown";
  try {
    const rl = checkRateLimit({
      request,
      key: "api:whatsapp",
      windowMs: 60_000,
      max: 30,
    });
    if (!rl.allowed) {
      return Response.json(
        { success: false, error: "Muitas tentativas. Tente novamente em instantes.", traceId },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    logAppInfo("api/whatsapp.start", "Recebido POST /api/whatsapp", { traceId, flowSource });
    const rawBody = await request.json();
    const parsed = whatsappPayloadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json(
        { success: false, error: "Payload inválido para envio WhatsApp.", traceId },
        { status: 400 }
      );
    }
    const { to, contentVariables, orderId, useCompanyWhatsappTarget } = parsed.data;

    const settings = await fetchCompanyTwilioSettings();
    if (!settings) {
      return Response.json(
        { success: false, error: "Configurações da empresa não encontradas.", traceId },
        { status: 404 }
      );
    }

    if (!settings.whatsapp_notifications_enabled) {
      return Response.json(
        { success: false, error: "Notificações por WhatsApp estão desativadas.", traceId },
        { status: 400 }
      );
    }

    const { twilio_account_sid, twilio_auth_token, twilio_whatsapp_from, twilio_content_sid } = settings;

    if (!twilio_account_sid || !twilio_auth_token || !twilio_whatsapp_from) {
      return Response.json(
        { success: false, error: "Credenciais Twilio não configuradas.", traceId },
        { status: 400 }
      );
    }

    if (!twilio_content_sid) {
      return Response.json(
        { success: false, error: "Content SID do template Twilio não configurado.", traceId },
        { status: 400 }
      );
    }

    let destination = to;
    if (useCompanyWhatsappTarget) {
      const ccDigits = (settings.whatsapp_country_code ?? "+55").replace(/\D/g, "");
      let numberDigits = (settings.whatsapp_number ?? "").replace(/\D/g, "");
      numberDigits = numberDigits.replace(/^0+/, "");
      const digits = `${ccDigits}${numberDigits}`;
      if (!digits) {
        return Response.json(
          { success: false, error: "WhatsApp da empresa não configurado.", traceId },
          { status: 400 }
        );
      }
      destination = `+${digits}`;
    }

    if (!destination) {
      return Response.json(
        { success: false, error: "Campo 'to' é obrigatório.", traceId },
        { status: 400 }
      );
    }

    const toFormatted = destination.startsWith("whatsapp:") ? destination : `whatsapp:${destination}`;
    logAppInfo("api/whatsapp.target", "Destino normalizado", {
      traceId,
      toMasked: toFormatted.replace(/(\+\d{2})\d+(\d{2})/, "$1****$2"),
    });

    const requestPayload = {
      From: twilio_whatsapp_from,
      To: toFormatted,
      ContentSid: twilio_content_sid,
      ContentVariables: contentVariables,
      TraceId: traceId,
      Source: flowSource,
    };

    const result = await sendTwilioContentMessage({
      accountSid: twilio_account_sid,
      authToken: twilio_auth_token,
      from: twilio_whatsapp_from,
      to: toFormatted,
      contentSid: twilio_content_sid,
      contentVariables,
    });

    await saveWhatsAppLogToDb({
      orderId,
      to: toFormatted,
      from: twilio_whatsapp_from,
      contentSid: twilio_content_sid,
      contentVariables,
      result,
      requestPayload,
    });

    if (!result.success) {
      logAppWarn("api/whatsapp.twilio.fail", "Twilio retornou falha", {
        traceId,
        errorCode: result.errorCode,
        httpStatus: result.httpStatus,
      });
      logAppError("api/whatsapp.sendFailed", new Error(result.error ?? "send failed"), {
        errorCode: result.errorCode,
        httpStatus: result.httpStatus,
      });
      return Response.json(
        {
          success: false,
          error: result.error ?? "Erro ao enviar mensagem via Twilio.",
          errorCode: result.errorCode,
          httpStatus: result.httpStatus,
          traceId,
        },
        { status: 500 }
      );
    }

    if (orderId) {
      await db
        .update(schema.orders)
        .set({ whatsapp_sent: true, whatsapp_sent_at: new Date().toISOString() })
        .where(eq(schema.orders.id, orderId));
    }

    logAppInfo("api/whatsapp.twilio.ok", "Twilio aceitou mensagem", {
      traceId,
      messageSid: result.messageSid,
    });
    return Response.json({ success: true, messageSid: result.messageSid, traceId });
  } catch (err) {
    logAppError("api/whatsapp.POST.catch", err, { traceId, flowSource });
    return Response.json({ success: false, error: "Erro interno no servidor.", traceId }, { status: 500 });
  }
}
