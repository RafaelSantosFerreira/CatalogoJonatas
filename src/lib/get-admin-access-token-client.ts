"use client";

import { readStoredAdminTokens } from "@/lib/admin-bearer-storage";
import { getCachedAdminAccessToken, setCachedAdminAccessToken } from "@/lib/admin-session-bridge";

export async function getAdminAccessTokenForClient(): Promise<string | null> {
  const stored = readStoredAdminTokens()?.access ?? null;
  if (stored) {
    setCachedAdminAccessToken(stored);
    return stored;
  }
  return getCachedAdminAccessToken();
}
