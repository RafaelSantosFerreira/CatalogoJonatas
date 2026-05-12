import { getPublicSupabaseConfig } from "@/lib/supabase-env";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAppError } from "@/lib/app-logger";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const rl = checkRateLimit({
    request,
    key: "api:admin-login",
    windowMs: 15 * 60_000,
    max: 30,
  });
  if (!rl.allowed) {
    return Response.json(
      { error: "Muitas tentativas de login. Aguarde e tente novamente." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  const { url, key, isConfigured } = getPublicSupabaseConfig();
  if (!isConfigured) {
    return Response.json(
      { error: "Configuração pública do Supabase ausente." },
      { status: 500 }
    );
  }

  let body: LoginBody = {};
  try {
    body = (await request.json()) as LoginBody;
  } catch {
    return Response.json({ error: "Payload inválido." }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  if (!email || !password) {
    return Response.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
  }

  const endpoint = `${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`;
  let authRes: Response;
  try {
    authRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch (e) {
    logAppError("api/admin-login.fetch", e);
    const msg = e instanceof Error ? e.message : String(e);
    const dnsOrNet = /ENOTFOUND|getaddrinfo|ECONNREFUSED|ETIMEDOUT|fetch failed/i.test(msg);
    return Response.json(
      {
        error: dnsOrNet
          ? "Não foi possível conectar ao Supabase (URL/DNS/rede ou projeto indisponível). Confira SUPABASE_API_URL no .env.local."
          : "Falha de rede ao contatar o Supabase.",
        code: "SUPABASE_UNREACHABLE",
      },
      { status: 503 }
    );
  }

  const text = await authRes.text();
  let json: unknown = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { error: text.slice(0, 500) };
  }

  if (!authRes.ok) {
    return Response.json(
      {
        error:
          (json as { msg?: string; error_description?: string; error?: string }).msg ||
          (json as { error_description?: string }).error_description ||
          (json as { error?: string }).error ||
          "Falha no login.",
      },
      { status: authRes.status }
    );
  }

  return Response.json(json);
}
