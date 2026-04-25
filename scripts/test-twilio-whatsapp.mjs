/**
 * Envia uma mensagem WhatsApp de teste via API REST da Twilio (Content API),
 * usando as mesmas variáveis do app (variáveis "1" e "2" do template).
 *
 * Uso (na raiz do projeto):
 *   node scripts/test-twilio-whatsapp.mjs
 *
 * Opcional no .env.local:
 *   TWILIO_TEST_TO=whatsapp:+5511999999999
 * Se omitir, monta a partir de WHATSAPP_COUNTRY_CODE + WHATSAPP_NUMBER.
 */
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

function loadEnvLocal() {
  if (!existsSync(envPath)) {
    console.error("Crie .env.local na raiz do projeto.");
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

function buildTestTo(env) {
  const explicit = env.TWILIO_TEST_TO?.trim();
  if (explicit) return explicit.startsWith("whatsapp:") ? explicit : `whatsapp:${explicit.replace(/^\+/, "+")}`;

  const cc = (env.WHATSAPP_COUNTRY_CODE || "+55").replace(/\D/g, "");
  let num = (env.WHATSAPP_NUMBER || "").replace(/\D/g, "");
  if (!num) {
    console.error(
      "Defina TWILIO_TEST_TO=whatsapp:+5511999999999 no .env.local ou preencha WHATSAPP_NUMBER."
    );
    process.exit(1);
  }
  num = num.replace(/^0+/, "");
  return `whatsapp:+${cc}${num}`;
}

async function main() {
  const env = loadEnvLocal();
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = env.TWILIO_AUTH_TOKEN?.trim();
  const from = env.TWILIO_WHATSAPP_FROM?.trim();
  const contentSid = env.TWILIO_CONTENT_SID?.trim();

  if (!accountSid || !authToken || !from || !contentSid) {
    console.error("Faltam TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM ou TWILIO_CONTENT_SID no .env.local.");
    process.exit(1);
  }

  const to = buildTestTo(env);
  const contentVariables = JSON.stringify({
    "1": "Teste Ferragem Pro",
    "2": "#TESTE | 1x Produto teste | Total: R$ 0,01",
  });

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const form = new URLSearchParams();
  form.append("From", from);
  form.append("To", to);
  form.append("ContentSid", contentSid);
  form.append("ContentVariables", contentVariables);

  console.log("Destino (mascarado):", to.replace(/whatsapp:\+(\d{2})(\d+)(\d{2})$/, (_, a, mid, end) => `whatsapp:+${a}${"*".repeat(Math.min(mid.length, 8))}${end}`));
  console.log("From:", from);
  console.log("ContentSid:", contentSid.slice(0, 12) + "…");
  console.log("Enviando…\n");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text.slice(0, 500) };
  }

  if (!res.ok) {
    console.error("Falha Twilio HTTP", res.status);
    console.error(JSON.stringify(body, null, 2));
    process.exit(1);
  }

  console.log("OK — mensagem aceita pela Twilio.");
  console.log("SID:", body.sid);
  console.log("Status:", body.status);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
