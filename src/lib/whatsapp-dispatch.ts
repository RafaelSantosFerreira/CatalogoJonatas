import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { createTraceId, logAppError, logAppInfo, logAppWarn } from "@/lib/app-logger";
import {
  fetchCompanyTwilioSettings,
  sendTwilioContentMessage,
  sendTwilioBodyMessage,
  saveWhatsAppLogToDb,
} from "@/lib/twilio-messaging.server";

export interface WhatsAppDispatchParams {
  orderId: string;
  /** Número de destino, ex: "+5511999999999". Mutuamente exclusivo com useCompanyTarget. */
  to?: string;
  /** Se true, usa o WhatsApp da empresa (company_settings) como destino. */
  useCompanyTarget?: boolean;
  /** Texto livre — usar em vez de contentVariables quando não há template aprovado. */
  body?: string;
  /** Variáveis de template Meta — usar com template aprovado. */
  contentVariables?: Record<string, string>;
}

export async function dispatchWhatsApp(params: WhatsAppDispatchParams): Promise<void> {
  const { orderId, to, useCompanyTarget, body, contentVariables } = params;
  const traceId = createTraceId("dispatch");

  const settings = await fetchCompanyTwilioSettings();
  if (!settings) {
    logAppWarn("whatsapp-dispatch.noSettings", "company_settings não encontrado", { orderId, traceId });
    return;
  }

  if (!settings.whatsapp_notifications_enabled) {
    logAppInfo("whatsapp-dispatch.disabled", "Notificações WhatsApp desativadas", { orderId, traceId });
    return;
  }

  const { twilio_account_sid, twilio_auth_token, twilio_whatsapp_from, twilio_content_sid } = settings;
  if (!twilio_account_sid || !twilio_auth_token || !twilio_whatsapp_from) {
    logAppWarn("whatsapp-dispatch.noCredentials", "Credenciais Twilio ausentes", { orderId, traceId });
    return;
  }

  let destination = to;
  if (useCompanyTarget) {
    const ccDigits = (settings.whatsapp_country_code ?? "+55").replace(/\D/g, "");
    const numberDigits = (settings.whatsapp_number ?? "").replace(/\D/g, "").replace(/^0+/, "");
    const digits = `${ccDigits}${numberDigits}`;
    if (!digits) {
      logAppWarn("whatsapp-dispatch.noCompanyPhone", "WhatsApp da empresa não configurado", { orderId, traceId });
      return;
    }
    destination = `+${digits}`;
  }

  if (!destination) {
    logAppWarn("whatsapp-dispatch.noDestination", "Sem destino para disparo", { orderId, traceId });
    return;
  }

  const toFormatted = destination.startsWith("whatsapp:") ? destination : `whatsapp:${destination}`;
  const useBodyMode = Boolean(body);

  if (!useBodyMode && !twilio_content_sid) {
    logAppWarn("whatsapp-dispatch.noContentSid", "Content SID não configurado", { orderId, traceId });
    return;
  }

  const requestPayload: Record<string, unknown> = {
    From: twilio_whatsapp_from,
    To: toFormatted,
    TraceId: traceId,
    Source: "orders-dispatch",
    ...(useBodyMode ? { Body: body } : { ContentSid: twilio_content_sid, ContentVariables: contentVariables }),
  };

  try {
    const result = useBodyMode
      ? await sendTwilioBodyMessage({
          accountSid: twilio_account_sid,
          authToken: twilio_auth_token,
          from: twilio_whatsapp_from,
          to: toFormatted,
          body: body!,
        })
      : await sendTwilioContentMessage({
          accountSid: twilio_account_sid,
          authToken: twilio_auth_token,
          from: twilio_whatsapp_from,
          to: toFormatted,
          contentSid: twilio_content_sid!,
          contentVariables: contentVariables ?? {},
        });

    await saveWhatsAppLogToDb({
      orderId,
      to: toFormatted,
      from: twilio_whatsapp_from,
      ...(useBodyMode ? { body: body! } : { contentSid: twilio_content_sid!, contentVariables: contentVariables ?? {} }),
      result,
      requestPayload,
      traceId,
    });

    if (result.success) {
      await db
        .update(schema.orders)
        .set({ whatsapp_sent: true, whatsapp_sent_at: new Date().toISOString() })
        .where(eq(schema.orders.id, orderId));
      logAppInfo("whatsapp-dispatch.ok", "WhatsApp enviado com sucesso", { orderId, traceId, messageSid: result.messageSid });
    } else {
      logAppWarn("whatsapp-dispatch.fail", "Twilio retornou falha", {
        orderId, traceId, errorCode: result.errorCode, httpStatus: result.httpStatus,
      });
    }
  } catch (e) {
    logAppError("whatsapp-dispatch.catch", e, { orderId, traceId });
  }
}
