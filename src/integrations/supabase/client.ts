import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "@/lib/supabase-env";

const { url, key, isConfigured } = getPublicSupabaseConfig();

if (typeof window !== "undefined" && !isConfigured) {
  console.warn(
    "[Supabase] Crie .env.local com SUPABASE_API_URL e SUPABASE_ANON_KEY (veja .env.example)."
  );
}

/** false se faltar .env — a UI pode evitar chamadas ou mostrar aviso */
export const supabasePublicConfigured = isConfigured;

export const supabase = createClient(url, key, {
  auth: {
    storage: typeof window !== "undefined" ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
  },
});
