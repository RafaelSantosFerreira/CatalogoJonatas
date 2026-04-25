import { createClient } from "@supabase/supabase-js";
import { getServerSupabaseConfig } from "@/lib/supabase-env";

const { url, key, isConfigured } = getServerSupabaseConfig();

if (typeof process !== "undefined" && process.env.NODE_ENV === "development" && !isConfigured) {
  console.warn(
    "[Supabase Admin] Defina DATABASE_URL e DATABASE_SERVICE_ROLE_KEY em .env.local para APIs server-side (veja .env.example)."
  );
}

export const supabaseAdminConfigured = isConfigured;

export const supabaseAdmin = createClient(url, key);