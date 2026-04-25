/**
 * Evita crash na importação quando .env.local não está preenchido.
 * Os placeholders satisfazem createClient(); sem env real, as chamadas à API falham.
 */
const PLACEHOLDER_URL = "https://invalid-missing-env.supabase.co";
const PLACEHOLDER_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludmFsaWRlbnYiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxMjIzOTAyMn0.invalid-placeholder-key";
const PLACEHOLDER_SERVICE =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImludmFsaWRlbnYiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjEyMjM5MDIyfQ.invalid-placeholder-service-key";

export function getPublicSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  const url = process.env.NEXT_PUBLIC_DATABASE_URL?.trim() ?? "";
  const key = process.env.NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY?.trim() ?? "";
  if (url && key) return { url, key, isConfigured: true };
  return { url: PLACEHOLDER_URL, key: PLACEHOLDER_ANON, isConfigured: false };
}

export function getServerSupabaseConfig(): { url: string; key: string; isConfigured: boolean } {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  const key = process.env.DATABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (url && key) return { url, key, isConfigured: true };
  return { url: PLACEHOLDER_URL, key: PLACEHOLDER_SERVICE, isConfigured: false };
}
