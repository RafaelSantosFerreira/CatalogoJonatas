"use client";

import { supabase } from "@/integrations/supabase/client";
import { readStoredAdminTokens } from "@/lib/admin-bearer-storage";
import { getCachedAdminAccessToken, setCachedAdminAccessToken } from "@/lib/admin-session-bridge";

/**
 * Token Bearer para rotas `/api/admin/*` e similares no browser.
 * Mesma ordem que o productStore: sessionStorage → cache → getSession().
 */
export async function getAdminAccessTokenForClient(): Promise<string | null> {
  const stored = readStoredAdminTokens()?.access ?? null;
  if (stored) {
    setCachedAdminAccessToken(stored);
    return stored;
  }
  const mem = getCachedAdminAccessToken();
  if (mem) return mem;
  const { data } = await supabase.auth.getSession();
  if (data.session?.access_token) {
    setCachedAdminAccessToken(data.session.access_token);
    return data.session.access_token;
  }
  return null;
}
