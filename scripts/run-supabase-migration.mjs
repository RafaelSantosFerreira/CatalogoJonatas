import { readFileSync } from "node:fs";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = process.env.SUPABASE_PROJECT_REF || "itulqdxdpwiditvzsemh";

if (!token) {
  console.error("SUPABASE_ACCESS_TOKEN ausente.");
  process.exit(1);
}

let sql = readFileSync(new URL("../app.sql", import.meta.url), "utf8");

const replacement = `
-- Seed singleton de company_settings (compatível)
DO $$
BEGIN
  UPDATE public.company_settings
  SET twilio_account_sid='AC89a6a95f92422800361bce388e5c8cc6',
      twilio_auth_token='a409a2a3047d68580ec61192aa570a84',
      twilio_whatsapp_from='whatsapp:+14155238886',
      twilio_content_sid='HXb5b62575e6e4ff6129ad7c8efe1f983e',
      whatsapp_notifications_enabled=true,
      updated_at=now();

  IF NOT FOUND THEN
    INSERT INTO public.company_settings (
      id, twilio_account_sid, twilio_auth_token, twilio_whatsapp_from, twilio_content_sid, whatsapp_notifications_enabled
    ) VALUES (
      gen_random_uuid(), 'AC89a6a95f92422800361bce388e5c8cc6', 'a409a2a3047d68580ec61192aa570a84', 'whatsapp:+14155238886', 'HXb5b62575e6e4ff6129ad7c8efe1f983e', true
    );
  END IF;
END $$;
`;

const problematicBlockRegex =
  /-- Salva as configurações[\s\S]*?updated_at\s*=\s*now\(\);/m;

if (!problematicBlockRegex.test(sql)) {
  console.error("Bloco problemático de upsert não encontrado em app.sql");
  process.exit(1);
}

sql = sql.replace(problematicBlockRegex, () => replacement);
sql = sql.replace(
  /INSERT INTO auth\.users[\s\S]*?ON CONFLICT \(user_id, role\) DO NOTHING;/m,
  "-- Seed de admin removido na execução via API para evitar conflitos de constraints em ambientes existentes."
);

const response = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  }
);

const text = await response.text();
console.log(`STATUS=${response.status}`);
console.log(text.slice(0, 1500));

if (!response.ok) {
  process.exit(1);
}
