/**
 * Token usado por `productStore` para `/api/admin/*`.
 * O `useAuth().session` pode existir enquanto `getSession()` / sessionStorage estão vazios
 * (preview embutido, setSession falhou, etc.).
 */
let cachedAccessToken: string | null = null;

export function setCachedAdminAccessToken(token: string | null): void {
  cachedAccessToken = token;
}

export function getCachedAdminAccessToken(): string | null {
  return cachedAccessToken;
}
