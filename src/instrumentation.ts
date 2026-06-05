export async function register() {
  if (process.env.NODE_ENV === "production") {
    const required = ["DATABASE_URL", "JWT_SECRET", "SETUP_ADMIN_EMAIL"];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(
        `[startup] Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}. ` +
        `Verifique o .env.local no servidor antes de iniciar.`
      );
    }
  }
}
