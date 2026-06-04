import { db, schema } from "@/db";
import { createTraceId, logAppError, logAppInfo } from "@/lib/app-logger";
import {
  fetchCompanyTwilioSettings,
  type TwilioSettings,
  sendTwilioContentMessage,
  saveWhatsAppLogToDb,
  fetchTwilioMessageStatus,
} from "@/lib/twilio-messaging.server";
import { sendSmtpTest } from "@/lib/smtp-send.server";
import { getAdminUserIdFromRequest } from "@/lib/verify-admin-request";
import { checkRateLimit } from "@/lib/rate-limit";
import { getTwilioFromEnv } from "@/lib/env-twilio";
import { z } from "zod";

function trimStr(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function mergeTwilioForTest(db: TwilioSettings | null, env: ReturnType<typeof getTwilioFromEnv>) {
  const e = env.ok ? env.data : null;
  const d = db ?? {};
  return {
    twilio_account_sid: trimStr(d.twilio_account_sid) || trimStr(e?.twilio_account_sid),
    twilio_auth_token: trimStr(d.twilio_auth_token) || trimStr(e?.twilio_auth_token),
    twilio_whatsapp_from: trimStr(d.twilio_whatsapp_from) || trimStr(e?.twilio_whatsapp_from),
    twilio_content_sid: trimStr(d.twilio_content_sid) || trimStr(e?.twilio_content_sid),
  };
}

type Channel = "whatsapp" | "email";
const notificationSchema = z.object({
  channel: z.enum(["whatsapp", "email"]),
});

function buildWhatsAppTo(whatsapp_country_code: string | null, whatsapp_number: string | null): string | null {
  const cc = (whatsapp_country_code || "+55").replace(/\D/g, "");
  let n = (whatsapp_number || "").replace(/\D/g, "");
  n = n.replace(/^0+/, "");
  if (!n) return null;
  return `whatsapp:+${cc}${n}`;
}

export async function POST(request: Request) {
  const traceId = request.headers.get("x-trace-id") || createTraceId("apitest");
  const rl = checkRateLimit({
    request,
    key: "api:test-notifications",
    windowMs: 60_000,
    max: 20,
  });
  if (!rl.allowed) {
    return Response.json(
      { success: false, error: "Muitas tentativas. Aguarde alguns segundos.", traceId },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }
  const adminId = await getAdminUserIdFromRequest(request);
  if (!adminId) {
    return Response.json(
      { success: false, error: "Acesso negado. Faça login como administrador.", traceId },
      { status: 401 }
    );
  }

  try {
    const rawBody = await request.json();
    const parsed = notificationSchema.safeParse(rawBody);
    if (!parsed.success) {
      return Response.json({ success: false, error: "Payload inválido.", traceId }, { status: 400 });
    }
    const channel: Channel = parsed.data.channel;
    logAppInfo("api/test-notifications.start", "Início do teste de notificação", { traceId, adminId, channel });

    const company = (await db.select().from(schema.companySettings))[0];
    if (!company) {
      return Response.json(
        { success: false, error: "Não foi possível carregar as configurações da empresa.", traceId },
        { status: 404 }
      );
    }

    if (channel === "whatsapp") {
      const envTwilio = getTwilioFromEnv();
      const sDb = await fetchCompanyTwilioSettings();
      const s = mergeTwilioForTest(sDb, envTwilio);
      const missing: string[] = [];
      if (!s.twilio_account_sid) missing.push("Account SID");
      if (!s.twilio_auth_token) missing.push("Auth Token");
      if (!s.twilio_whatsapp_from) missing.push("WhatsApp From");
      if (!s.twilio_content_sid) missing.push("Content SID");
      if (missing.length > 0) {
        const envHint = !envTwilio.ok
          ? ` No servidor faltam no .env: ${envTwilio.missing.join(", ")}. Reinicie após editar .env.local.`
          : " Reinicie o servidor de desenvolvimento se acabou de editar o .env.";
        return Response.json(
          {
            success: false,
            error: `Credenciais Twilio incompletas: ${missing.join(", ")}.${envHint}`,
            traceId,
          },
          { status: 400 }
        );
      }

      const to = buildWhatsAppTo(company.whatsapp_country_code, company.whatsapp_number);
      if (!to) {
        return Response.json(
          { success: false, error: "Defina o WhatsApp da empresa nas configurações.", traceId },
          { status: 400 }
        );
      }

      const now = new Date().toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

      const result = await sendTwilioContentMessage({
        accountSid: s.twilio_account_sid!,
        authToken: s.twilio_auth_token!,
        from: s.twilio_whatsapp_from!,
        to,
        contentSid: s.twilio_content_sid!,
        contentVariables: { "1": "Teste", "2": now },
      });

      await saveWhatsAppLogToDb({
        to,
        from: s.twilio_whatsapp_from!,
        contentSid: s.twilio_content_sid!,
        contentVariables: { "1": "Teste", "2": now },
        result,
        requestPayload: { kind: "admin_test", to, contentSid: s.twilio_content_sid, adminUserId: adminId },
      });

      if (!result.success) {
        return Response.json(
          { success: false, error: result.error ?? "Falha ao enviar no Twilio.", errorCode: result.errorCode, httpStatus: result.httpStatus, traceId },
          { status: 502 }
        );
      }

      // Aguarda 4s e consulta status real de entrega (erros como 63015 chegam depois)
      await new Promise(r => setTimeout(r, 4000));
      const delivery = await fetchTwilioMessageStatus(
        s.twilio_account_sid!,
        s.twilio_auth_token!,
        result.messageSid!
      );

      logAppInfo("api/test-notifications.delivery", "Status de entrega Twilio", {
        traceId,
        messageSid: result.messageSid,
        deliveryStatus: delivery.status,
        errorCode: delivery.errorCode,
        errorMessage: delivery.errorMessage,
      });

      if (delivery.status === "failed" || delivery.status === "undelivered") {
        const isSandbox = delivery.errorCode === "63015";
        const error = isSandbox
          ? `Número não entrou no WhatsApp Sandbox da Twilio. No WhatsApp do número ${to}, envie a mensagem "join <palavra-do-sandbox>" para +14155238886. A palavra do sandbox aparece no painel da Twilio em Messaging → Try it out → Send a WhatsApp message.`
          : delivery.errorMessage ?? "Mensagem não entregue pelo Twilio.";
        return Response.json({
          success: false,
          error,
          errorCode: delivery.errorCode,
          deliveryStatus: delivery.status,
          messageSid: result.messageSid,
          traceId,
        }, { status: 502 });
      }

      return Response.json({
        success: true,
        message: `Mensagem enfileirada no Twilio (status: ${delivery.status}).`,
        deliveryStatus: delivery.status,
        messageSid: result.messageSid,
        toMasked: "whatsapp:*** (número da empresa)",
        traceId,
      });
    }

    if (!company.email_notifications_enabled) {
      return Response.json(
        { success: false, error: "Ative as notificações por e-mail nas configurações.", traceId },
        { status: 400 }
      );
    }

    const toEmail = company.order_email?.trim();
    if (!toEmail) {
      return Response.json(
        { success: false, error: "Preencha o e-mail para receber pedidos.", traceId },
        { status: 400 }
      );
    }

    const host = company.smtp_host?.trim();
    const user = company.smtp_user?.trim();
    const pass = company.smtp_password ?? "";
    const fromE = company.smtp_from_email?.trim();
    const port = Number(company.smtp_port) || 587;
    if (!host || !user || !fromE) {
      return Response.json(
        { success: false, error: "Preencha host, usuário SMTP e e-mail do remetente.", traceId },
        { status: 400 }
      );
    }

    const r = await sendSmtpTest(
      {
        smtp_host: host,
        smtp_port: port,
        smtp_user: user,
        smtp_password: pass,
        smtp_secure: Boolean(company.smtp_secure),
        smtp_from_name: company.smtp_from_name || company.company_name || "Aplicativo",
        smtp_from_email: fromE,
      },
      toEmail
    );

    if (!r.ok) {
      logAppError("api/test-notifications.email", new Error(r.error));
      return Response.json({ success: false, error: r.error, traceId }, { status: 502 });
    }

    return Response.json({ success: true, message: "E-mail de teste enviado.", messageId: r.messageId, traceId });
  } catch (e) {
    logAppError("api/test-notifications", e, { traceId });
    return Response.json({ success: false, error: "Erro interno no servidor.", traceId }, { status: 500 });
  }
}
