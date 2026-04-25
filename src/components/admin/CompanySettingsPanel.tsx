
"use client";

import { useEffect, useState } from "react";
import {
  Mail, MessageCircle, Building2, Loader2, CheckCircle2,
  Server, Key, Eye, EyeOff, Phone, Hash, Zap, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { PHONE_COUNTRIES } from "@/data/phone-countries";
import type { CompanySettingsFormData } from "@/types/company-settings";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createTraceId, logAppInfo, logAppWarn } from "@/lib/app-logger";

const INITIAL: CompanySettingsFormData = {
  company_name: "",
  order_email: "",
  whatsapp_country_code: "+55",
  whatsapp_number: "",
  email_notifications_enabled: true,
  whatsapp_notifications_enabled: true,
  smtp_host: "",
  smtp_port: 587,
  smtp_user: "",
  smtp_password: "",
  smtp_secure: false,
  smtp_from_name: "",
  smtp_from_email: "",
  twilio_account_sid: "",
  twilio_auth_token: "",
  twilio_whatsapp_from: "",
  twilio_content_sid: "",
};

function PasswordInput({ id, value, onChange, placeholder, disabled }: {
  id: string; value: string; onChange: (v: string) => void;
  placeholder?: string; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        tabIndex={-1}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function CompanySettingsPanel() {
  const { settings, loading, saving, saveSettings, refetch } = useCompanySettings();
  const [form, setForm] = useState<CompanySettingsFormData>(INITIAL);
  const [seeding, setSeeding] = useState(false);
  const [testingWhatsapp, setTestingWhatsapp] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        company_name: settings.company_name ?? "",
        order_email: settings.order_email ?? "",
        whatsapp_country_code: settings.whatsapp_country_code ?? "+55",
        whatsapp_number: settings.whatsapp_number ?? "",
        email_notifications_enabled: settings.email_notifications_enabled ?? true,
        whatsapp_notifications_enabled: settings.whatsapp_notifications_enabled ?? true,
        smtp_host: settings.smtp_host ?? "",
        smtp_port: settings.smtp_port ?? 587,
        smtp_user: settings.smtp_user ?? "",
        smtp_password: settings.smtp_password ?? "",
        smtp_secure: settings.smtp_secure ?? false,
        smtp_from_name: settings.smtp_from_name ?? "",
        smtp_from_email: settings.smtp_from_email ?? "",
        twilio_account_sid: settings.twilio_account_sid ?? "",
        twilio_auth_token: settings.twilio_auth_token ?? "",
        twilio_whatsapp_from: settings.twilio_whatsapp_from ?? "",
        twilio_content_sid: settings.twilio_content_sid ?? "",
      });
    }
  }, [settings]);

  const set = <K extends keyof CompanySettingsFormData>(key: K, value: CompanySettingsFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await saveSettings(form);
    if (error) { toast.error(`Erro ao salvar: ${error}`); return; }
    toast.success("Configurações salvas com sucesso!");
  };

  const handleApplyPreset = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed-twilio", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        await refetch();
        toast.success("Credenciais Twilio do .env gravadas em company_settings.");
      } else {
        toast.error(`Erro ao aplicar credenciais: ${data.error}`);
      }
    } catch {
      toast.error("Erro de conexão ao aplicar credenciais.");
    } finally {
      setSeeding(false);
    }
  };

  const hasTwilioFormComplete = Boolean(
    form.twilio_account_sid &&
      form.twilio_auth_token &&
      form.twilio_whatsapp_from &&
      form.twilio_content_sid
  );

  const testNotification = async (channel: "whatsapp" | "email") => {
    const traceId = createTraceId(`admin-${channel}`);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      toast.error("Sessão expirada. Entre novamente no painel.");
      return;
    }
    if (channel === "whatsapp") setTestingWhatsapp(true);
    else setTestingEmail(true);
    try {
      logAppInfo("admin.testNotification.start", `Teste ${channel}`, { traceId });
      logAppInfo("admin.testNotification.params", "Parâmetros usados no teste", {
        traceId,
        channel,
      });
      const res = await fetch("/api/test-notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          "x-trace-id": traceId,
          "x-flow-source": "admin-test-button",
        },
        body: JSON.stringify({ channel }),
      });
      const data = await res.json();
      if (data.success) {
        const extra = data.messageSid
          ? ` (SID: ${String(data.messageSid).slice(0, 10)}…)`
          : data.messageId
            ? ` (id: ${String(data.messageId).slice(0, 24)}…)`
            : "";
        toast.success(`${data.message ?? "Teste enviado."}${extra}`);
      } else {
        logAppWarn("admin.testNotification.fail", `Falha teste ${channel}`, {
          traceId,
          error: data.error,
          httpStatus: res.status,
        });
        toast.error(data.error || "Falha no teste de envio.");
      }
    } catch {
      toast.error("Não foi possível contatar o servidor.");
    } finally {
      if (channel === "whatsapp") setTestingWhatsapp(false);
      else setTestingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          Configurações da Empresa
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure os canais de notificação e as credenciais de envio de pedidos.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados da empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label htmlFor="company_name">Nome da empresa</Label>
              <Input
                id="company_name"
                placeholder="Ex: Ferragem Central"
                value={form.company_name}
                onChange={(e) => set("company_name", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* E-mail de destino */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4" /> Notificação por E-mail
            </CardTitle>
            <CardDescription>
              E-mail que receberá o resumo de cada pedido finalizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="email_enabled">Ativar notificações por e-mail</Label>
              <Switch
                id="email_enabled"
                checked={form.email_notifications_enabled}
                onCheckedChange={(v) => set("email_notifications_enabled", v)}
              />
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label htmlFor="order_email">E-mail para receber pedidos</Label>
              <Input
                id="order_email"
                type="email"
                placeholder="ferragem@exemplo.com"
                value={form.order_email}
                onChange={(e) => set("order_email", e.target.value)}
                disabled={!form.email_notifications_enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Servidor SMTP */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" /> Servidor SMTP
              <Badge variant="secondary" className="text-xs font-normal ml-1">Envio de e-mail</Badge>
            </CardTitle>
            <CardDescription>
              Credenciais do servidor SMTP usado para enviar os e-mails de pedido automaticamente.
              Exemplos: <span className="font-mono text-xs">smtp.gmail.com</span>,{" "}
              <span className="font-mono text-xs">smtp.sendgrid.net</span>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="smtp_host">Host SMTP</Label>
                <Input
                  id="smtp_host"
                  placeholder="smtp.gmail.com"
                  value={form.smtp_host}
                  onChange={(e) => set("smtp_host", e.target.value)}
                  disabled={!form.email_notifications_enabled}
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="smtp_port">Porta</Label>
                <Input
                  id="smtp_port"
                  type="number"
                  placeholder="587"
                  value={form.smtp_port}
                  onChange={(e) => set("smtp_port", Number(e.target.value))}
                  disabled={!form.email_notifications_enabled}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smtp_secure">Usar SSL/TLS</Label>
                <p className="text-xs text-muted-foreground">
                  Ative para porta 465 (SSL). Desative para porta 587 (STARTTLS).
                </p>
              </div>
              <Switch
                id="smtp_secure"
                checked={form.smtp_secure}
                onCheckedChange={(v) => set("smtp_secure", v)}
                disabled={!form.email_notifications_enabled}
              />
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="smtp_user">Usuário SMTP</Label>
              <Input
                id="smtp_user"
                placeholder="seu@email.com"
                value={form.smtp_user}
                onChange={(e) => set("smtp_user", e.target.value)}
                disabled={!form.email_notifications_enabled}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="smtp_password">Senha / App Password</Label>
              <PasswordInput
                id="smtp_password"
                placeholder="••••••••••••"
                value={form.smtp_password}
                onChange={(v) => set("smtp_password", v)}
                disabled={!form.email_notifications_enabled}
              />
              <p className="text-xs text-muted-foreground">
                Para Gmail, use uma{" "}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  App Password
                </a>{" "}
                de 16 caracteres.
              </p>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="smtp_from_name">Nome do remetente</Label>
                <Input
                  id="smtp_from_name"
                  placeholder="Ferragem Central"
                  value={form.smtp_from_name}
                  onChange={(e) => set("smtp_from_name", e.target.value)}
                  disabled={!form.email_notifications_enabled}
                />
              </div>
              <div className="space-y-1.5 col-span-2 sm:col-span-1">
                <Label htmlFor="smtp_from_email">E-mail do remetente</Label>
                <Input
                  id="smtp_from_email"
                  type="email"
                  placeholder="pedidos@ferragem.com"
                  value={form.smtp_from_email}
                  onChange={(e) => set("smtp_from_email", e.target.value)}
                  disabled={!form.email_notifications_enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp destino */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-green-500" /> Notificação por WhatsApp
            </CardTitle>
            <CardDescription>
              Número da empresa que receberá a mensagem com os detalhes do pedido (envio manual via link).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="whatsapp_enabled">Ativar notificações por WhatsApp</Label>
              <Switch
                id="whatsapp_enabled"
                checked={form.whatsapp_notifications_enabled}
                onCheckedChange={(v) => set("whatsapp_notifications_enabled", v)}
              />
            </div>
            <Separator />
            <div className="space-y-1.5">
              <Label>Número do WhatsApp da empresa</Label>
              <div className="flex gap-2">
                <Select
                  value={form.whatsapp_country_code}
                  onValueChange={(v) => set("whatsapp_country_code", v)}
                  disabled={!form.whatsapp_notifications_enabled}
                >
                  <SelectTrigger className="w-44 shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PHONE_COUNTRIES.map((c) => (
                      <SelectItem key={`${c.code}-${c.name}`} value={c.code}>
                        {c.flag} {c.code} — {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Ex: 11999998888"
                  value={form.whatsapp_number}
                  onChange={(e) => set("whatsapp_number", e.target.value)}
                  disabled={!form.whatsapp_notifications_enabled}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Digite apenas os números, sem espaços ou traços.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Twilio API */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <Key className="h-4 w-4 text-purple-500" /> API Twilio WhatsApp
                  <Badge variant="secondary" className="text-xs font-normal ml-1">Envio automático ao cliente</Badge>
                </CardTitle>
                <CardDescription className="mt-1.5">
                  Credenciais da sua conta{" "}
                  <a
                    href="https://console.twilio.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-foreground"
                  >
                    Twilio Console
                  </a>{" "}
                  para envio automático de mensagens WhatsApp ao cliente via template aprovado.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50 dark:hover:bg-purple-950 dark:border-purple-800 dark:text-purple-400"
                onClick={handleApplyPreset}
                disabled={seeding}
              >
                {seeding ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Zap className="h-3.5 w-3.5" />
                )}
                Importar do .env (servidor)
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasTwilioFormComplete && (
              <Alert className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-700 dark:text-green-400 text-sm">
                  Suas credenciais Twilio estão configuradas e salvas. O envio automático de WhatsApp ao cliente está ativo.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="twilio_account_sid">Account SID</Label>
              <Input
                id="twilio_account_sid"
                placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={form.twilio_account_sid}
                onChange={(e) => set("twilio_account_sid", e.target.value)}
                disabled={!form.whatsapp_notifications_enabled}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Encontrado na página principal do Twilio Console.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="twilio_auth_token">Auth Token</Label>
              <PasswordInput
                id="twilio_auth_token"
                placeholder="••••••••••••••••••••••••••••••••"
                value={form.twilio_auth_token}
                onChange={(v) => set("twilio_auth_token", v)}
                disabled={!form.whatsapp_notifications_enabled}
              />
              <p className="text-xs text-muted-foreground">
                Mantenha este token em segredo. Encontrado ao lado do Account SID.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="twilio_whatsapp_from">
                <Phone className="inline h-3.5 w-3.5 mr-1" />
                Número Twilio WhatsApp (From)
              </Label>
              <Input
                id="twilio_whatsapp_from"
                placeholder="whatsapp:+14155238886"
                value={form.twilio_whatsapp_from}
                onChange={(e) => set("twilio_whatsapp_from", e.target.value)}
                disabled={!form.whatsapp_notifications_enabled}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Formato obrigatório:{" "}
                <span className="font-mono">whatsapp:+14155238886</span>.
                Use o número do Sandbox ou do seu número aprovado na Twilio.
              </p>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="twilio_content_sid">
                <Hash className="inline h-3.5 w-3.5 mr-1" />
                Content SID (Template da Mensagem)
              </Label>
              <Input
                id="twilio_content_sid"
                placeholder="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={form.twilio_content_sid}
                onChange={(e) => set("twilio_content_sid", e.target.value)}
                disabled={!form.whatsapp_notifications_enabled}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                SID do template aprovado no{" "}
                <a
                  href="https://console.twilio.com/us1/develop/sms/content-template-builder"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-foreground"
                >
                  Content Template Builder
                </a>
                . Exemplo:{" "}
                <span className="font-mono">HXb5b62575e6e4ff6129ad7c8efe1f983e</span>.
                O template deve ter 2 variáveis: <span className="font-mono">{"{{1}}"}</span> (nome do cliente) e{" "}
                <span className="font-mono">{"{{2}}"}</span> (resumo do pedido).
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4" /> Testes de envio
            </CardTitle>
            <CardDescription>
              Usa as configurações <strong>salvas</strong> no banco. Após editar, clique em
              <span className="whitespace-nowrap"> «Salvar configurações»</span> antes de testar.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
            <Button
              type="button"
              variant="secondary"
              className="gap-2 border-green-200 bg-green-50/80 hover:bg-green-100/90 dark:border-green-900 dark:bg-green-950/30 dark:hover:bg-green-950/50"
              onClick={() => testNotification("whatsapp")}
              disabled={testingWhatsapp || testingEmail}
            >
              {testingWhatsapp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4" />
              )}
              Testar WhatsApp (Twilio)
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={() => testNotification("email")}
              disabled={testingWhatsapp || testingEmail}
            >
              {testingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Testar e-mail (SMTP)
            </Button>
            <p className="w-full text-xs text-muted-foreground">
              O teste de WhatsApp envia para o número da empresa (WhatsApp) configurado acima, usando o
              template Twilio. O teste de e-mail envia para o e-mail de pedidos com o SMTP que você
              definiu.
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-8">
          <Button type="submit" disabled={saving} className="gap-2 min-w-36">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</>
            ) : (
              <><CheckCircle2 className="h-4 w-4" /> Salvar Configurações</>
            )}
          </Button>
        </div>
      </form>
    </main>
  );
}
