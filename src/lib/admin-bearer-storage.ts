/**
 * Quando o browser não consegue falar com o Supabase (ex.: preview embutido),
 * `setSession` pode falhar e o SDK não persiste tokens — o estado React ainda
 * recebe a sessão via fallback, mas `getSession()` fica vazio. Guardamos cópia
 * em sessionStorage para `getAccessToken` e hidratação após F5.
 */

export const ADMIN_ACCESS_TOKEN_KEY = "ferragem_catalogo_admin_access_token";
export const ADMIN_REFRESH_TOKEN_KEY = "ferragem_catalogo_admin_refresh_token";

export function persistAdminBearerTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, refreshToken);
  } catch {
    /* private mode / quota */
  }
}

export function clearAdminBearerTokens(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function readStoredAdminTokens(): { access: string; refresh: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const access = sessionStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    const refresh = sessionStorage.getItem(ADMIN_REFRESH_TOKEN_KEY) ?? "";
    if (!access) return null;
    return { access, refresh };
  } catch {
    return null;
  }
}

/** Payload JWT (claims) sem validar assinatura — só exp / sub / email para UI local. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2 || !parts[1]) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "===".slice((b64.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
