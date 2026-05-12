import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/server";
import { getPublicSupabaseConfig } from "@/lib/supabase-env";
import { getSetupAdminCredentials } from "@/lib/env-setup-admin";

/**
 * Autentica o request via Bearer (sessão do admin) e confere papel admin em `user_roles`.
 * Retorna null se não for admin.
 */
export async function getAdminUserIdFromRequest(request: Request): Promise<string | null> {
  const h = request.headers.get("Authorization");
  if (!h?.startsWith("Bearer ")) return null;
  const token = h.slice(7);
  if (!token) return null;

  const pub = getPublicSupabaseConfig();
  if (!pub.isConfigured) return null;

  const client = createClient(pub.url, pub.key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  // Em rotas server-side sem sessão persistida, precisamos passar o JWT explicitamente.
  const { data: userData, error: userErr } = await client.auth.getUser(token);
  if (userErr || !userData.user) return null;
  const uid = userData.user.id;
  const userEmail = (userData.user.email || "").trim().toLowerCase();
  const expectedAdminEmail = getSetupAdminCredentials().email.trim().toLowerCase();

  if (!userData.user.email_confirmed_at) return null;
  if (!userEmail || userEmail !== expectedAdminEmail) return null;

  const { data: role, error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("user_id", uid)
    .eq("role", "admin")
    .maybeSingle();
  if (roleErr || !role) return null;
  return uid;
}
