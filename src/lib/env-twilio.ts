/** Lê credenciais Twilio do ambiente (servidor). Nada hardcoded. */

export type TwilioEnvPayload = {
  twilio_account_sid: string;
  twilio_auth_token: string;
  twilio_whatsapp_from: string;
  twilio_content_sid: string;
  whatsapp_notifications_enabled: boolean;
};

export function getTwilioFromEnv(): { ok: true; data: TwilioEnvPayload } | { ok: false; missing: string[] } {
  const twilio_account_sid = process.env.TWILIO_ACCOUNT_SID?.trim() ?? "";
  const twilio_auth_token = process.env.TWILIO_AUTH_TOKEN?.trim() ?? "";
  const twilio_whatsapp_from = process.env.TWILIO_WHATSAPP_FROM?.trim() ?? "";
  const twilio_content_sid = process.env.TWILIO_CONTENT_SID?.trim() ?? "";
  const whatsapp_notifications_enabled =
    process.env.WHATSAPP_NOTIFICATIONS_ENABLED === "true" ||
    process.env.WHATSAPP_NOTIFICATIONS_ENABLED === "1";

  const missing: string[] = [];
  if (!twilio_account_sid) missing.push("TWILIO_ACCOUNT_SID");
  if (!twilio_auth_token) missing.push("TWILIO_AUTH_TOKEN");
  if (!twilio_whatsapp_from) missing.push("TWILIO_WHATSAPP_FROM");
  if (!twilio_content_sid) missing.push("TWILIO_CONTENT_SID");

  if (missing.length > 0) return { ok: false, missing };

  return {
    ok: true,
    data: {
      twilio_account_sid,
      twilio_auth_token,
      twilio_whatsapp_from,
      twilio_content_sid,
      whatsapp_notifications_enabled,
    },
  };
}
