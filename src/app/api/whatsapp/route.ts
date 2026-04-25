import { supabaseAdmin } from "@/integrations/supabase/server";
import { createTraceId, logAppError, logAppInfo, logAppWarn } from "@/lib/app-logger";
import {
  fetchCompanyTwilioSettings,
  sendTwilioContentMessage,
  saveWhatsAppLogToDb,
} from "@/lib/twilio-messaging.server";

export async function POST(request: Request) {
  const traceId = request.headers.get("x-trace-id") || createTraceId("apiwa");
  const flowSource = request.headers.get("x-flow-source") || "unknown";
  try {
    logAppInfo("api/whatsapp.start", "Recebido POST /api/whatsapp", { traceId, flowSource });
    const body = await request.json();
    const { to, contentVariables, orderId, useCompanyWhatsappTarget } = body as {
      to?: string;
      contentVariables: Record<string, string>;
      orderId?: string;
      useCompanyWhatsappTarget?: boolean;
    };

    if (!contentVariables) {
      return Response.json(
        {
          success: false,
          error: "Campo 'contentVariables' é obrigatório.",
          traceId,
        },
        { status: 400 }
      );
    }

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

    const {
      twilio_account_sid,
      twilio_auth_token,
      twilio_whatsapp_from,
      twilio_content_sid,
    } = settings;

    if (!twilio_account_sid || !twilio_auth_token || !twilio_whatsapp_from) {
      return Response.json(
        {
          success: false,
          error: "Credenciais Twilio não configuradas. Acesse as configurações da empresa.",
          traceId,
        },
        { status: 400 }
      );
    }

    if (!twilio_content_sid) {
      return Response.json(
        {
          success: false,
          error: "Content SID do template Twilio não configurado. Acesse as configurações da empresa.",
          traceId,
        },
        { status: 400 }
      );
    }

    let destination = to;
    if (useCompanyWhatsappTarget) {
      const companyCountryCode = (settings as { whatsapp_country_code?: string }).whatsapp_country_code ?? "+55";
      const companyNumber = (settings as { whatsapp_number?: string }).whatsapp_number ?? "";
      const ccDigits = companyCountryCode.replace(/\D/g, "");
      let numberDigits = companyNumber.replace(/\D/g, "");
      numberDigits = numberDigits.replace(/^0+/, "");
      const digits = `${ccDigits}${numberDigits}`;
      if (!digits) {
        return Response.json(
          {
            success: false,
            error: "WhatsApp da empresa não configurado em Configurações.",
            traceId,
          },
          { status: 400 }
        );
      }
      destination = `+${digits}`;
    }

    if (!destination) {
      return Response.json(
        {
          success: false,
          error: "Campo 'to' é obrigatório (ou useCompanyWhatsappTarget=true).",
          traceId,
        },
        { status: 400 }
      );
    }

    const toFormatted = destination.startsWith("whatsapp:") ? destination : `whatsapp:${destination}`;
    logAppInfo("api/whatsapp.target", "Destino normalizado", {
      traceId,
      toMasked: toFormatted.replace(/(\+\d{2})\d+(\d{2})/, "$1****$2"),
      hasOrderId: Boolean(orderId),
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
      await supabaseAdmin
        .from("orders")
        .update({
          whatsapp_sent: true,
          whatsapp_sent_at: new Date().toISOString(),
        })
        .eq("id", orderId);
    }

    logAppInfo("api/whatsapp.twilio.ok", "Twilio aceitou mensagem", {
      traceId,
      messageSid: result.messageSid,
    });
    return Response.json({ success: true, messageSid: result.messageSid, traceId });
  } catch (err) {
    logAppError("api/whatsapp.POST.catch", err, { traceId, flowSource });
    return Response.json(
      { success: false, error: "Erro interno no servidor.", traceId },
      { status: 500 }
    );
  }
}
