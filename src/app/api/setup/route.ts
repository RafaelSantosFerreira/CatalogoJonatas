import { supabaseAdmin } from "@/integrations/supabase/server";
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

    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const alreadyExists = existingUsers?.users?.some((u) => u.email === ADMIN_EMAIL);

    if (alreadyExists) {
      return Response.json({
        success: true,
        message: "Usuário admin já existe.",
        adminEmail: ADMIN_EMAIL,
        usingDefaultPassword,
      });
    }

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: "Administrador" },
    });

    if (createError) {
      logAppError("api/setup.createUser", createError);
      return Response.json({ success: false, error: createError.message }, { status: 500 });
    }

    if (newUser?.user?.id) {
      const { error: pErr } = await supabaseAdmin.from("profiles").insert({
        id: newUser.user.id,
        email: ADMIN_EMAIL,
        full_name: "Administrador",
      });
      if (pErr) logAppError("api/setup.profiles", pErr);

      const { error: rErr } = await supabaseAdmin.from("user_roles").insert({
        user_id: newUser.user.id,
        role: "admin",
      });
      if (rErr) logAppError("api/setup.user_roles", rErr);
    }

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
