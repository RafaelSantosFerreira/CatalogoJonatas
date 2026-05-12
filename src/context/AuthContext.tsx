
"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  clearAdminBearerTokens,
  decodeJwtPayload,
  persistAdminBearerTokens,
  readStoredAdminTokens,
} from "@/lib/admin-bearer-storage";
import { logAppError } from "@/lib/app-logger";
import { withTimeout } from "@/lib/with-timeout";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

type LoginFallbackResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user?: User;
};

/** Restaura sessão em memória a partir do backup em sessionStorage (útil quando o SDK não persistiu). */
function sessionFromStoredTokens(): { session: Session; user: User } | null {
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
  const user = {
    id: String(pay.sub),
    email: typeof pay.email === "string" ? pay.email : "",
    aud: "authenticated",
    role: "authenticated",
  } as User;
  const session = {
    access_token: t.access,
    refresh_token: t.refresh,
    token_type: "bearer",
    expires_in: exp - Math.floor(Date.now() / 1000),
    expires_at: exp,
    user,
  } as Session;
  return { session, user };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) logAppError("AuthContext.getSession", error);
        if (data.session) {
          persistAdminBearerTokens(data.session.access_token, data.session.refresh_token);
          setSession(data.session);
          setUser(data.session.user ?? null);
        } else {
          const restored = sessionFromStoredTokens();
          if (restored) {
            setSession(restored.session);
            setUser(restored.user);
          } else {
            setSession(null);
            setUser(null);
          }
        }
        setLoading(false);
      })
      .catch((e) => {
        logAppError("AuthContext.getSession.promise", e);
        const restored = sessionFromStoredTokens();
        if (restored) {
          setSession(restored.session);
          setUser(restored.user);
        }
        setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const fallbackServerLogin = async (): Promise<{ error: string | null }> => {
      try {
        const res = await fetch("/api/admin-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const raw = await res.text();
        let payload: LoginFallbackResponse | { error?: string; message?: string } = {};
        if (raw.trim()) {
          try {
            payload = JSON.parse(raw) as LoginFallbackResponse | { error?: string; message?: string };
          } catch {
            return { error: raw.slice(0, 200) || `Resposta inválida do servidor (HTTP ${res.status}).` };
          }
        } else if (!res.ok) {
          return {
            error:
              res.status === 503
                ? "Servidor não alcançou o Supabase. Verifique SUPABASE_API_URL e sua rede."
                : `Falha no servidor (HTTP ${res.status}).`,
          };
        }

        if (!res.ok || !("access_token" in payload) || !payload.access_token) {
          const message =
            ("error" in payload && payload.error) ||
            ("message" in payload && payload.message) ||
            "Falha ao autenticar no servidor.";
          return { error: message };
        }

        persistAdminBearerTokens(payload.access_token, payload.refresh_token);

        const { data: sessData, error: sessErr } = await supabase.auth.setSession({
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
        });
        if (!sessErr && sessData.session) {
          setSession(sessData.session);
          setUser(sessData.session.user);
          return { error: null };
        }
        if (sessErr) {
          logAppError("AuthContext.signIn.fallback.setSession", sessErr);
        }
        const now = Math.floor(Date.now() / 1000);
        const expiresIn = payload.expires_in ?? 3600;
        const sessionLike = {
          access_token: payload.access_token,
          refresh_token: payload.refresh_token,
          token_type: payload.token_type ?? "bearer",
          expires_in: expiresIn,
          expires_at: now + expiresIn,
          user: payload.user ?? null,
        } as unknown as Session;

        setSession(sessionLike);
        setUser((payload.user as User | null) ?? null);
        return { error: null };
      } catch (e) {
        logAppError("AuthContext.signIn.fallback.throw", e);
        return { error: e instanceof Error ? e.message : "Erro no fallback de login." };
      }
    };

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        logAppError("AuthContext.signIn", new Error(error.message), {
          code: error.code,
        });
        if (/Failed to fetch/i.test(error.message || "")) {
          return fallbackServerLogin();
        }
        return { error: error.message ?? null };
      }

      // Evita corrida entre redirecionamento e listener de auth state.
      // Sem isso, o AdminGuard pode rodar com sessão nula logo após o login.
      if (data.session) {
        persistAdminBearerTokens(data.session.access_token, data.session.refresh_token);
        setSession(data.session);
        setUser(data.session.user ?? null);
      }
      return { error: null };
    } catch (e) {
      logAppError("AuthContext.signIn.throw", e);
      if (e instanceof Error && /Failed to fetch/i.test(e.message)) {
        return fallbackServerLogin();
      }
      return { error: e instanceof Error ? e.message : "Erro inesperado no login." };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await withTimeout(supabase.auth.signOut(), 12_000);
    } catch (e) {
      logAppError("AuthContext.signOut", e);
    } finally {
      clearAdminBearerTokens();
      setSession(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
