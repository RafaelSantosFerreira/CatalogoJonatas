import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { signAdminJwt } from "@/lib/verify-admin-request";
import { checkRateLimit } from "@/lib/rate-limit";
import { logAppError } from "@/lib/app-logger";
import { getSetupAdminCredentials } from "@/lib/env-setup-admin";

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

  const expectedEmail = getSetupAdminCredentials().email.trim().toLowerCase();
  if (email.toLowerCase() !== expectedEmail) {
    return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
  }

  try {
    const admin = (await db
      .select()
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, email)))[0];

    if (!admin) {
      return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return Response.json({ error: "Credenciais inválidas." }, { status: 401 });
    }

    const access_token = signAdminJwt({ sub: admin.id, email: admin.email });
    const expires_in = 7 * 24 * 3600;

    return Response.json({
      access_token,
      refresh_token: access_token,
      expires_in,
      token_type: "bearer",
      user: { id: admin.id, email: admin.email },
    });
  } catch (e) {
    logAppError("api/admin-login", e);
    return Response.json({ error: "Erro interno no servidor." }, { status: 500 });
  }
}
