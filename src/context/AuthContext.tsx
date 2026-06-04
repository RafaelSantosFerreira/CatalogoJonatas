"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  clearAdminBearerTokens,
  decodeJwtPayload,
  persistAdminBearerTokens,
  readStoredAdminTokens,
} from "@/lib/admin-bearer-storage";
import { setCachedAdminAccessToken } from "@/lib/admin-session-bridge";
import { logAppError } from "@/lib/app-logger";

interface LocalUser {
  id: string;
  email: string;
}

interface LocalSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number;
  user: LocalUser;
}

interface AuthContextValue {
  user: LocalUser | null;
  session: LocalSession | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user?: LocalUser;
};

function sessionFromStoredTokens(): { session: LocalSession; user: LocalUser } | null {
  const t = readStoredAdminTokens();
  if (!t) return null;
  const pay = decodeJwtPayload(t.access);
  if (!pay?.sub) {
    clearAdminBearerTokens();
    return null;
  }
  const exp = pay.exp;
  if (typeof exp !== "number" || exp < Math.floor(Date.now() / 1000) + 30) {
    clearAdminBearerTokens();
    return null;
  }
  const user: LocalUser = {
    id: String(pay.sub),
    email: typeof pay.email === "string" ? pay.email : "",
  };
  const session: LocalSession = {
    access_token: t.access,
    refresh_token: t.refresh,
    token_type: "bearer",
    expires_in: exp - Math.floor(Date.now() / 1000),
    expires_at: exp,
    user,
  };
  return { session, user };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const restored = sessionFromStoredTokens();
    if (restored) {
      setCachedAdminAccessToken(restored.session.access_token);
      setSession(restored.session);
      setUser(restored.user);
    } else {
      setCachedAdminAccessToken(null);
    }
    setLoading(false);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const raw = await res.text();
      let payload: LoginResponse | { error?: string; message?: string } = {};
      if (raw.trim()) {
        try {
          payload = JSON.parse(raw) as LoginResponse | { error?: string; message?: string };
        } catch {
          return { error: raw.slice(0, 200) || `Resposta inválida do servidor (HTTP ${res.status}).` };
        }
      } else if (!res.ok) {
        return { error: `Falha no servidor (HTTP ${res.status}).` };
      }

      if (!res.ok || !("access_token" in payload) || !payload.access_token) {
        const message =
          ("error" in payload && payload.error) ||
          ("message" in payload && payload.message) ||
          "Falha ao autenticar no servidor.";
        return { error: message };
      }

      const loginPayload = payload as LoginResponse;
      persistAdminBearerTokens(loginPayload.access_token, loginPayload.refresh_token);
      setCachedAdminAccessToken(loginPayload.access_token);

      const now = Math.floor(Date.now() / 1000);
      const expiresIn = loginPayload.expires_in ?? 3600;
      const newSession: LocalSession = {
        access_token: loginPayload.access_token,
        refresh_token: loginPayload.refresh_token,
        token_type: loginPayload.token_type ?? "bearer",
        expires_in: expiresIn,
        expires_at: now + expiresIn,
        user: loginPayload.user ?? { id: "", email },
      };

      setSession(newSession);
      setUser(newSession.user);
      return { error: null };
    } catch (e) {
      logAppError("AuthContext.signIn.throw", e);
      return { error: e instanceof Error ? e.message : "Erro inesperado no login." };
    }
  }, []);

  const signOut = useCallback(async () => {
    clearAdminBearerTokens();
    setCachedAdminAccessToken(null);
    setSession(null);
    setUser(null);
  }, []);

  const authValue = useMemo(
    () => ({ user, session, loading, signIn, signOut }),
    [user, session, loading, signIn, signOut]
  );

  return <AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
