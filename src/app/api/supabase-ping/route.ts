import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig, getServerSupabaseConfig } from "@/lib/supabase-env";

function safeOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "(URL inválida)";
  }
}

/**
 * GET /api/supabase-ping — testa apenas conectividade (sem alterar dados).
 * Não expõe chaves; só origem da URL e status de cada teste.
 */
export async function GET() {
  const pub = getPublicSupabaseConfig();
  const srv = getServerSupabaseConfig();

  type PingPart = {
    configured: boolean;
    origin: string;
    ok: boolean;
    status?: number;
    detail?: string;
  };

  const publicPart: PingPart = {
    configured: pub.isConfigured,
    origin: pub.isConfigured ? safeOrigin(pub.url) : "(placeholder)",
    ok: false,
  };

  const serverPart: PingPart = {
    configured: srv.isConfigured,
    origin: srv.isConfigured ? safeOrigin(srv.url) : "(placeholder)",
    ok: false,
  };

  if (pub.isConfigured) {
    try {
      const healthUrl = `${pub.url.replace(/\/$/, "")}/auth/v1/health`;
      const res = await fetch(healthUrl, {
        headers: { apikey: pub.key },
        cache: "no-store",
      });
      publicPart.status = res.status;
      const text = await res.text().catch(() => "");
      publicPart.ok = res.ok;
      if (!res.ok) publicPart.detail = text.slice(0, 200);
    } catch (e) {
      publicPart.detail = e instanceof Error ? e.message : String(e);
    }
  } else {
    publicPart.detail = "Defina NEXT_PUBLIC_DATABASE_URL e NEXT_PUBLIC_DATABASE_PUBLISHABLE_KEY";
  }

  if (srv.isConfigured) {
    try {
      const admin = createClient(srv.url, srv.key, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await admin.from("products").select("id").limit(1);
      if (!error) {
        serverPart.ok = true;
        serverPart.detail = "Conectou ao PostgREST (consulta products OK).";
      } else {
        const msg = error.message ?? "";
        const network =
          /fetch failed|ENOTFOUND|ECONNREFUSED|network/i.test(msg) ||
          (error as { cause?: { code?: string } }).cause?.code === "ENOTFOUND";
        serverPart.ok = !network;
        serverPart.detail = network
          ? msg.slice(0, 300)
          : `Conectou; resposta da API: ${error.code ?? "?"} — ${msg}`.slice(0, 300);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      serverPart.detail = msg.slice(0, 300);
      serverPart.ok = !/fetch failed|ENOTFOUND|ECONNREFUSED/i.test(msg);
    }
  } else {
    serverPart.detail = "Defina DATABASE_URL e DATABASE_SERVICE_ROLE_KEY";
  }

  const connected =
    pub.isConfigured &&
    srv.isConfigured &&
    publicPart.ok &&
    serverPart.ok;

  return Response.json(
    {
      connected,
      message: connected
        ? "Cliente e servidor conseguem falar com o backend (Auth health + REST)."
        : "Verifique public/server e os campos detail.",
      public: publicPart,
      server: serverPart,
    },
    { status: connected ? 200 : 503 }
  );
}
