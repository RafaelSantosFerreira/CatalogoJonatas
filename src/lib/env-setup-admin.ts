/**
 * Credenciais do primeiro usuário admin criado por POST /api/setup.
 * Em produção, exige SETUP_ADMIN_PASSWORD (não usa senha padrão fraca).
 */

export function getSetupAdminCredentials(): {
  email: string;
  password: string;
  usingDefaultPassword: boolean;
} {
  const isProd = process.env.NODE_ENV === "production";
  const email = (process.env.SETUP_ADMIN_EMAIL || "admin@ferragem.com").trim();
  const fromEnv = process.env.SETUP_ADMIN_PASSWORD?.trim();
  if (fromEnv) {
    return { email, password: fromEnv, usingDefaultPassword: false };
  }
  if (isProd) {
    return { email, password: "", usingDefaultPassword: false };
  }
  return { email, password: "admin123", usingDefaultPassword: true };
}
