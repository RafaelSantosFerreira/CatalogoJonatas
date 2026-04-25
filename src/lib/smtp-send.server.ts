import nodemailer from "nodemailer";

type SmtpInput = {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  smtp_secure: boolean;
  smtp_from_name?: string;
  smtp_from_email: string;
};

/**
 * Envia e-mail de teste usando as credenciais SMTP fornecidas.
 */
export async function sendSmtpTest(
  smtp: SmtpInput,
  toAddress: string
): Promise<{ ok: true; messageId: string } | { ok: false; error: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: smtp.smtp_port,
      secure: smtp.smtp_secure,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_password },
    });

    const fromName = (smtp.smtp_from_name || "Aplicativo").trim() || "Aplicativo";
    const fromEmail = smtp.smtp_from_email;

    const info = await transporter.sendMail({
      from: `${fromName} <${fromEmail}>`,
      to: toAddress,
      subject: `Teste de e-mail — ${fromName}`,
      text:
        "Este é um e-mail de teste enviado a partir do painel administrativo.\n\n" +
        "Se você recebeu esta mensagem, o SMTP está configurado corretamente.\n" +
        `Data: ${new Date().toLocaleString("pt-BR")}`,
    });

    const id = (info as { messageId?: string })?.messageId;
    if (!id) {
      return { ok: true, messageId: "(aceito, sem id)" };
    }
    return { ok: true, messageId: id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
