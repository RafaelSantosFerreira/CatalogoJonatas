import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { logAppError } from "@/lib/app-logger";
import { getSetupAdminCredentials } from "@/lib/env-setup-admin";
import { checkRateLimit } from "@/lib/rate-limit";

function isSetupAuthorized(request: Request): boolean {
  const token = process.env.SETUP_API_TOKEN?.trim();
  if (!token) return process.env.NODE_ENV !== "production";
  const provided = request.headers.get("x-setup-token")?.trim();
  return Boolean(provided && provided === token);
}

export async function POST(request: Request) {
  try {
    const rl = checkRateLimit({
      request,
      key: "api:setup",
      windowMs: 60_000,
      max: 5,
    });
    if (!rl.allowed) {
      return Response.json(
        { success: false, error: "Muitas tentativas de setup. Tente novamente em instantes." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    if (!isSetupAuthorized(request)) {
      return Response.json(
        { success: false, error: "Acesso negado ao endpoint de setup." },
        { status: 401 }
      );
    }

    const { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, usingDefaultPassword } =
      getSetupAdminCredentials();

    if (!ADMIN_PASSWORD) {
      return Response.json(
        {
          success: false,
          error:
            "Em produção defina SETUP_ADMIN_PASSWORD (e opcionalmente SETUP_ADMIN_EMAIL) no .env do servidor.",
        },
        { status: 403 }
      );
    }

    const existing = await db
      .select({ id: schema.adminUsers.id })
      .from(schema.adminUsers)
      .where(eq(schema.adminUsers.email, ADMIN_EMAIL))
      .get();

    if (existing) {
      return Response.json({
        success: true,
        message: "Usuário admin já existe.",
        adminEmail: ADMIN_EMAIL,
        usingDefaultPassword,
      });
    }

    const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await db.insert(schema.adminUsers).values({
      email: ADMIN_EMAIL,
      password_hash,
      full_name: "Administrador",
      email_confirmed_at: new Date().toISOString(),
    });

    return Response.json({
      success: true,
      message: "Usuário admin criado com sucesso!",
      adminEmail: ADMIN_EMAIL,
      usingDefaultPassword,
    });
  } catch (err) {
    logAppError("api/setup.catch", err);
    return Response.json({ success: false, error: "Erro interno no servidor." }, { status: 500 });
  }
}
