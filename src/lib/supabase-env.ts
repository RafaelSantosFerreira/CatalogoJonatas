/**
 * Evita crash na importação quando .env.local não está preenchido.
 * Os placeholders satisfazem createClient(); sem env real, as chamadas à API falham.
 */
const PLACEHOLDER_URL = "https://invalid-missing-env.supabase.co";
const PLACEHOLDER_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludmFsaWRlbnYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjIzOTAyMn0.invalid-placeholder-key";
const PLACEHOLDER_SERVICE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludmFsaWRlbnYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjEyMjM5MDIyfQ.invalid-placeholder-service-key";

function normalizeSupabaseUrl(value: string): string {
  const raw = value.trim().replace(/\/+$/, "");
  if (!raw) return "";
  return raw.replace(/\/rest\/v1$/i, "");
}

/** Base https do projeto (Auth + PostgREST). URI `postgres://` não entra aqui — alinhar com `scripts/test-db-connection.mjs`. */
function isSupabaseHttpApiUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

/**
 * Mesma regra do teste `npm run test:db`: URL https do projeto em `DATABASE_URL`
 * **ou**, se `DATABASE_URL` for Postgres/vazio, cair em `SUPABASE_API_URL`.
 */
function resolveServerSupabaseApiUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  if (databaseUrl && isSupabaseHttpApiUrl(databaseUrl)) {
    return normalizeSupabaseUrl(databaseUrl);
  }
  return normalizeSupabaseUrl(process.env.SUPABASE_API_URL?.trim() ?? "");
}

function resolveServiceRoleKey(): string {
  return (
    process.env.DATABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    ""
  );
}

export function getPublicSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  const url = normalizeSupabaseUrl(process.env.SUPABASE_API_URL?.trim() ?? "");
  const key = process.env.SUPABASE_ANON_KEY?.trim() ?? "";
  if (url && key) return { url, key, isConfigured: true };
  return { url: PLACEHOLDER_URL, key: PLACEHOLDER_ANON, isConfigured: false };
}

export function getServerSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  const url = resolveServerSupabaseApiUrl();
  const key = resolveServiceRoleKey();
  if (url && key) return { url, key, isConfigured: true };
  return { url: PLACEHOLDER_URL, key: PLACEHOLDER_SERVICE, isConfigured: false };
}
