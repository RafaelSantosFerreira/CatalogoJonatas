import { db, schema } from "@/db";
import { logAppError, logAppInfo } from "@/lib/app-logger";

export interface TwilioSettings {
  twilio_account_sid?: string | null;
  twilio_auth_token?: string | null;
  twilio_whatsapp_from?: string | null;
  twilio_content_sid?: string | null;
  whatsapp_notifications_enabled?: boolean | null;
  whatsapp_country_code?: string | null;
  whatsapp_number?: string | null;
}

interface TwilioErrorResponse {
  message?: string;
  code?: number | string;
  status?: number;
  more_info?: string;
}

interface TwilioSuccessResponse {
  sid?: string;
  status?: string;
}

export async function fetchCompanyTwilioSettings(): Promise<TwilioSettings | null> {
  const row = await db.select({
    twilio_account_sid: schema.companySettings.twilio_account_sid,
    twilio_auth_token: schema.companySettings.twilio_auth_token,
    twilio_whatsapp_from: schema.companySettings.twilio_whatsapp_from,
    twilio_content_sid: schema.companySettings.twilio_content_sid,
    whatsapp_notifications_enabled: schema.companySettings.whatsapp_notifications_enabled,
    whatsapp_country_code: schema.companySettings.whatsapp_country_code,
    whatsapp_number: schema.companySettings.whatsapp_number,
  }).from(schema.companySettings).get();
  return row ?? null;
}

export interface TwilioSendResult {
  success: boolean;
  error?: string;
  errorCode?: string;
  httpStatus?: number;
  messageSid?: string;
  responseBody?: Record<string, unknown>;
}

export async function sendTwilioContentMessage(params: {
  accountSid: string;
  authToken: string;
  from: string;
  to: string;
  contentSid: string;
  contentVariables: Record<string, string>;
}): Promise<TwilioSendResult> {
  const { accountSid, authToken, from, to, contentSid, contentVariables } = params;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const formData = new URLSearchParams();
  formData.append("From", from);
  formData.append("To", to);
  formData.append("ContentSid", contentSid);
  formData.append("ContentVariables", JSON.stringify(contentVariables));

  let responseBody: Record<string, unknown> = {};
  let httpStatus = 0;

  const mask = (v: string): string => {
    if (!v) return "(vazio)";
    if (v.length <= 8) return `${v.slice(0, 2)}***${v.slice(-1)}`;
    return `${v.slice(0, 6)}***${v.slice(-4)}`;
  };
  const maskPhone = (v: string): string => v.replace(/(\+\d{2})\d+(\d{2})/, "$1****$2");

  logAppInfo("twilio-messaging.request", "Enviando request Twilio", {
    accountSidMasked: mask(accountSid),
    authTokenMasked: mask(authToken),
    fromMasked: maskPhone(from),
    toMasked: maskPhone(to),
    contentSidMasked: mask(contentSid),
    contentVariables,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    httpStatus = response.status;

    try {
      responseBody = await response.json();
    } catch {
      responseBody = { raw: await response.text().catch(() => "") };
    }

    if (!response.ok) {
      const errBody = responseBody as TwilioErrorResponse;
      const errorMessage = errBody?.message ?? `HTTP ${httpStatus}`;
      const errorCode = errBody?.code ? String(errBody.code) : String(httpStatus);

      logAppError("twilio-messaging.sendHttpError", new Error(errorMessage), {
        httpStatus,
        errorCode,
        responseBody,
      });

      return { success: false, error: errorMessage, errorCode, httpStatus, responseBody };
    }

    const successBody = responseBody as TwilioSuccessResponse;
    logAppInfo("twilio-messaging.response.ok", "Twilio aceitou a mensagem", {
      httpStatus,
      messageSid: successBody?.sid,
      status: successBody?.status,
    });

    return { success: true, messageSid: successBody?.sid, httpStatus, responseBody };
  } catch (fetchErr) {
    const errorMessage = fetchErr instanceof Error ? fetchErr.message : "Erro de rede desconhecido";
    logAppError("twilio-messaging.sendNetwork", fetchErr);
    return {
      success: false,
      error: errorMessage,
      errorCode: "NETWORK_ERROR",
      httpStatus: 0,
      responseBody: { networkError: errorMessage },
    };
  }
}

export async function saveWhatsAppLogToDb(params: {
  orderId?: string;
  to: string;
  from: string;
  contentSid: string;
  contentVariables: Record<string, string>;
  result: TwilioSendResult;
  requestPayload: Record<string, unknown>;
}): Promise<void> {
  const { orderId, to, from, contentSid, contentVariables, result, requestPayload } = params;

  try {
    await db.insert(schema.whatsappLogs).values({
      order_id: orderId ?? null,
      to_number: to,
      from_number: from,
      content_sid: contentSid,
      content_variables: contentVariables,
      status: result.success ? "success" : "error",
      twilio_message_sid: result.messageSid ?? null,
      http_status_code: result.httpStatus ?? null,
      error_code: result.errorCode ?? null,
      error_message: result.error ?? null,
      response_body: result.responseBody ?? null,
      request_payload: requestPayload,
      sent_at: new Date().toISOString(),
    });
  } catch (logError) {
    logAppError("twilio-messaging.saveLog", logError);
  }
}
