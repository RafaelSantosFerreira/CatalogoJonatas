/**
 * Testa Postgres (Supabase): CREATE TABLE → INSERT → UPDATE → DELETE linha → DROP TABLE.
 *
 * Requer string de conexão PostgreSQL (não é a URL https do projeto).
 * Opções no .env.local (qualquer uma que existir):
 *   - POSTGRES_URL=postgresql://...
 *   - SUPABASE_DATABASE_URL=postgresql://...
 *   - DATABASE_URL=postgresql://...  (se for URI postgres, não https)
 *   - Ou: SUPABASE_DB_HOST, SUPABASE_DB_PORT, SUPABASE_DB_NAME, SUPABASE_DB_USER, SUPABASE_DB_PASSWORD
 *         (opcional SUPABASE_DB_SSLMODE=require)
 *
 * Pegue a URI em: Supabase Dashboard → Project Settings → Database → Connection string → URI
 * (use "Session mode" ou porta 5432 se o pooler em 6543 reclamar de DDL).
 *
 * Uso: npm run test:db:crud
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

const TABLE = "_catalogo_crud_smoke_test";

function loadEnvLocal() {
  if (!existsSync(envPath)) {
    console.error("Arquivo .env.local não encontrado:", envPath);
    process.exit(1);
  }
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return env;
}

function resolvePgConfig(env) {
  const tryUrls = [env.POSTGRES_URL, env.SUPABASE_DATABASE_URL, env.DIRECT_URL, env.DATABASE_URL].filter(
    Boolean
  );
  for (const u of tryUrls) {
    if (String(u).toLowerCase().startsWith("postgres")) {
      return { connectionString: u };
    }
  }
  const host = env.SUPABASE_DB_HOST?.trim();
  const port = Number(env.SUPABASE_DB_PORT?.trim() || "5432");
  const database = env.SUPABASE_DB_NAME?.trim() || "postgres";
  const user = env.SUPABASE_DB_USER?.trim();
  const password = env.SUPABASE_DB_PASSWORD ?? "";
  if (!host || !user) return null;
  const sslmode = (env.SUPABASE_DB_SSLMODE || "require").toLowerCase();
  const ssl =
    sslmode && sslmode !== "disable" && sslmode !== "false"
      ? { rejectUnauthorized: false }
      : undefined;
  return {
    host,
    port,
    database,
    user,
    password,
    ssl,
  };
}

async function main() {
  const env = loadEnvLocal();
  const cfg = resolvePgConfig(env);
  if (!cfg) {
    console.error(`
Não foi encontrada URI PostgreSQL no .env.local.

Adicione uma destas opções (exemplo de nome de variável):
  POSTGRES_URL="postgresql://postgres.[PROJECT]:[SENHA]@aws-0-....pooler.supabase.com:6543/postgres"

Ou variáveis SUPABASE_DB_HOST / SUPABASE_DB_USER / SUPABASE_DB_PASSWORD / ...

Onde obter: Supabase → Settings → Database → Connection string → URI
(Não use a URL https do projeto como substituto — é outro protocolo.)
`);
    process.exit(1);
  }

  const client = new pg.Client({ ...cfg, connectionTimeoutMillis: 25_000 });
  console.log("--- CRUD smoke test (Postgres direto) ---");
  console.log("Tabela temporária:", TABLE);
  if (cfg.connectionString) {
    const u = new URL(cfg.connectionString.replace(/^postgres(ql)?:\/\//, "http://"));
    console.log("Conectando em:", `${u.hostname}:${u.port || 5432}/${u.pathname?.replace(/^\//, "") || "postgres"}`);
  } else {
    console.log("Conectando em:", `${cfg.host}:${cfg.port}/${cfg.database}`);
  }
  console.log("");

  try {
    await client.connect();
    console.log("[0] Conexão: OK\n");

    await client.query(`DROP TABLE IF EXISTS public.${TABLE}`);
    console.log("[1] CREATE TABLE …");
    await client.query(`
      CREATE TABLE public.${TABLE} (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        label text NOT NULL,
        n integer NOT NULL DEFAULT 0
      )
    `);
    console.log("    OK\n");

    console.log("[2] INSERT (2 linhas) …");
    const ins = await client.query(
      `INSERT INTO public.${TABLE} (label, n) VALUES ($1, $2), ($3, $4) RETURNING id, label, n`,
      ["alpha", 1, "beta", 2]
    );
    const rows = ins.rows;
    console.log("    OK — ids:", rows.map((r) => r.id).join(", "));
    const idA = rows[0].id;
    const idB = rows[1].id;
    console.log("");

    console.log("[3] UPDATE (uma linha) …");
    const upd = await client.query(
      `UPDATE public.${TABLE} SET label = $1, n = $2 WHERE id = $3 RETURNING id, label, n`,
      ["alpha-atualizado", 10, idA]
    );
    console.log("    OK —", upd.rows[0]);
    console.log("");

    console.log("[4] DELETE (uma linha) …");
    const del = await client.query(`DELETE FROM public.${TABLE} WHERE id = $1 RETURNING id`, [idB]);
    console.log("    OK — removido id:", del.rows[0]?.id);
    const count = await client.query(`SELECT count(*)::int AS c FROM public.${TABLE}`);
    console.log("    Linhas restantes:", count.rows[0].c);
    console.log("");

    console.log("[5] DROP TABLE …");
    await client.query(`DROP TABLE IF EXISTS public.${TABLE}`);
    console.log("    OK — tabela removida\n");

    console.log("Resultado: TODAS AS ETAPAS OK.");
  } catch (e) {
    console.error("FALHA:", e instanceof Error ? e.message : e);
    try {
      await client.query(`DROP TABLE IF EXISTS public.${TABLE}`);
      console.error("(Tabela temporária removida após erro.)");
    } catch {
      /* ignore */
    }
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
