import { createClient } from "@supabase/supabase-js";
import { getServerSupabaseConfig } from "@/lib/supabase-env";

const { url, key, isConfigured } = getServerSupabaseConfig();

if (typeof process !== "undefined" && process.env.NODE_ENV === "development" && !isConfigured) {
  console.warn(
    "[Supabase Admin] Defina SUPABASE_API_URL + DATABASE_SERVICE_ROLE_KEY (ou SUPABASE_SERVICE_ROLE_KEY). DATABASE_URL https é opcional e deve ser o mesmo projeto."
  );
}

export const supabaseAdminConfigured = isConfigured;

export const supabaseAdmin = createClient(url, key);