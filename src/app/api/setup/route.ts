import { supabaseAdmin } from "@/integrations/supabase/server";
import { logAppError } from "@/lib/app-logger";
import { getSetupAdminCredentials } from "@/lib/env-setup-admin";

export async function POST() {
  try {
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
