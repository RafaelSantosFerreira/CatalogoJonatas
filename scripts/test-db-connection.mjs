/**
 * Testa conexão com o backend (Nubase/Supabase-compatível).
 * Uso: na raiz do projeto → node scripts/test-db-connection.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

function loadEnvLocal() {
  if (!existsSync(envPath)) {
    console.error("Arquivo .env.local não encontrado em:", envPath);
    process.exit(1);
  }
  const env = {};
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

function mask(s) {
  if (!s || s.length < 12) return "(curto)";
  return `${s.slice(0, 8)}…${s.slice(-4)}`;
}

async function main() {
  const env = loadEnvLocal();
  const restUrl = (env.SUPABASE_API_URL || "").replace(/\/$/, "");
  const publicUrl = restUrl.replace(/\/rest\/v1$/i, "");
  const rawDbUrl = (env.DATABASE_URL || "").trim();
  const baseUrl = (/^https?:\/\//i.test(rawDbUrl) ? rawDbUrl : publicUrl).replace(/\/$/, "");
  const serviceKey = env.DATABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const publishable = env.SUPABASE_ANON_KEY;

  console.log("--- Teste de conexão ---");
  console.log(
    "Origem (API https):",
    baseUrl || "(vazio)",
    rawDbUrl && /^https?:\/\//i.test(rawDbUrl) ? "(DATABASE_URL)" : "(SUPABASE_API_URL)"
  );
  console.log("Chave publishable:", publishable ? mask(publishable) : "(ausente)");
  console.log("Chave service:", serviceKey ? mask(serviceKey) : "(ausente)");
  console.log("");

  if (!baseUrl || !serviceKey || !publishable) {
    console.error("Faltam variáveis obrigatórias no .env.local.");
    process.exit(1);
  }

  let ok = true;

  // 1) Auth health (como no /api/supabase-ping)
  try {
    const healthUrl = `${baseUrl}/auth/v1/health`;
    const res = await fetch(healthUrl, {
      headers: { apikey: publishable },
    });
    const body = await res.text();
    console.log("[1] GET /auth/v1/health");
    console.log("    HTTP:", res.status, res.ok ? "OK" : "FALHOU");
    console.log("    Corpo (trecho):", body.slice(0, 120).replace(/\s+/g, " "));
    if (!res.ok) ok = false;
  } catch (e) {
    console.log("[1] FALHOU:", e instanceof Error ? e.message : e);
    ok = false;
  }
  console.log("");

  // 2) PostgREST via supabase-js (service role)
  try {
    const admin = createClient(baseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await admin.from("products").select("id").limit(1);
    console.log("[2] PostgREST from('products').select('id').limit(1) (service role)");
    if (error) {
      console.log("    Erro API:", error.code, error.message);
      if (/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(error.message)) ok = false;
      else console.log("    (Conexão OK — erro é de schema/RLS/tabela, não de rede.)");
    } else {
      console.log("    OK — linhas:", data?.length ?? 0);
    }
  } catch (e) {
    console.log("[2] FALHOU:", e instanceof Error ? e.message : e);
    ok = false;
  }

  console.log("");
  console.log(ok ? "Resultado: CONEXÃO OK (rede + API respondendo)." : "Resultado: falha de rede ou HTTP de erro.");
  process.exit(ok ? 0 : 1);
}

main();
