
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Wrench, Loader2, Eye, EyeOff, ShieldCheck, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { logAppError } from "@/lib/app-logger";
import { toast } from "sonner";

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error("Credenciais inválidas. Verifique seu e-mail e senha.");
    } else {
      toast.success("Login realizado com sucesso!");
      router.push("/admin");
    }
    setLoading(false);
  };

  const handleSetup = async () => {
    setSetupLoading(true);
    try {
      const headers: Record<string, string> = {};
      const setupToken = process.env.NEXT_PUBLIC_SETUP_API_TOKEN?.trim();
      if (setupToken) headers["x-setup-token"] = setupToken;

      const res = await fetch("/api/setup", { method: "POST", headers });
      let data: {
        success?: boolean;
        error?: string;
        message?: string;
        adminEmail?: string;
        usingDefaultPassword?: boolean;
      };
      try {
        data = await res.json();
      } catch (parseErr) {
        logAppError("LoginForm.setup.json", parseErr, { httpStatus: res.status });
        toast.error("Resposta inválida do servidor.");
        setSetupLoading(false);
        return;
      }
      if (data.success) {
        toast.success(
          data.message ||
            (data.usingDefaultPassword
              ? "Usuário admin pronto. Use a senha padrão de desenvolvimento ou SETUP_ADMIN_PASSWORD no .env."
              : "Usuário admin configurado.")
        );
        setEmail(data.adminEmail || "admin@ferragem.com");
        setPassword(data.usingDefaultPassword ? "admin123" : "");
        if (!data.usingDefaultPassword && data.adminEmail) {
          toast.info("Informe a senha definida em SETUP_ADMIN_PASSWORD no servidor.");
        }
      } else {
        logAppError("LoginForm.setup.failed", new Error(data.error || "setup failed"), {
          httpStatus: res.status,
        });
        toast.error(data.error || "Erro ao criar usuário admin.");
      }
    } catch (err) {
      logAppError("LoginForm.setup.network", err);
      toast.error("Erro ao conectar com o servidor.");
    }
    setSetupLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-3 mb-8">
          <Link
            href="/"
            className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
              <Wrench className="h-7 w-7" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold">Ferragem Pro</h1>
              <p className="text-sm text-muted-foreground">Acesso restrito à equipe</p>
            </div>
          </Link>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Área Administrativa
            </CardTitle>
            <CardDescription>
              Informe suas credenciais para acessar o painel de gestão de produtos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@ferragem.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center mb-2">
                Primeiro acesso? Clique abaixo para criar o usuário admin padrão.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs"
                onClick={handleSetup}
                disabled={setupLoading}
              >
                {setupLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Settings className="h-3 w-3" />
                )}
                Configurar Primeiro Acesso
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
