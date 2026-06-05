
"use client";

import { useEffect, useState, useCallback } from "react";
import {
  RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle,
  ChevronDown, ChevronUp, Phone, Hash, Calendar, Wifi,
  Send, Info, Zap, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { readStoredAdminTokens } from "@/lib/admin-bearer-storage";

interface WhatsAppLog {
  id: string;
  order_id?: string;
  to_number: string;
  from_number?: string;
  content_sid?: string;
  content_variables?: Record<string, string>;
  status: "success" | "error" | "pending";
  twilio_message_sid?: string;
  http_status_code?: number;
  error_code?: string;
  error_message?: string;
  response_body?: Record<string, unknown>;
  request_payload?: Record<string, unknown>;
  sent_at?: string;
  created_at: string;
}

const TWILIO_ERROR_HINTS: Record<string, string> = {
  "21211": "Número de destino inválido. Verifique o formato: deve ser whatsapp:+5511999999999.",
  "21608": "Número não está no Sandbox do Twilio. O destinatário precisa enviar 'join <palavra>' para o número Sandbox primeiro.",
  "21610": "Número bloqueou mensagens do Twilio (opted out). O destinatário precisa enviar 'START' para reativar.",
  "21614": "Número de destino não é um número de celular válido.",
  "63016": "Template não aprovado ou ContentSid inválido. Verifique o Content SID nas configurações.",
  "63007": "Número remetente (From) não está habilitado para WhatsApp. Verifique o número Twilio.",
  "20003": "Credenciais inválidas (Account SID ou Auth Token incorretos). Verifique nas configurações.",
  "20429": "Limite de requisições atingido (rate limit). Aguarde alguns minutos e tente novamente.",
  "NETWORK_ERROR": "Erro de rede ao conectar com a API Twilio. Verifique a conexão do servidor.",
};

function getErrorHint(errorCode?: string): string | null {
  if (!errorCode) return null;
  return TWILIO_ERROR_HINTS[errorCode] ?? null;
}

function StatusBadge({ status }: { status: WhatsAppLog["status"] }) {
  if (status === "success") {
    return (
      <Badge className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800">
        <CheckCircle2 className="h-3 w-3" /> Sucesso
      </Badge>
    );
  }
  if (status === "error") {
    return (
      <Badge className="gap-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800">
        <XCircle className="h-3 w-3" /> Erro
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
      <Clock className="h-3 w-3" /> Pendente
    </Badge>
  );
}

function HttpStatusBadge({ code }: { code?: number }) {
  if (!code) return null;
  const isOk = code >= 200 && code < 300;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-xs font-mono font-semibold",
        isOk
          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
      )}
    >
      HTTP {code}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
      title="Copiar"
    >
      {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

function LogRow({ log }: { log: WhatsAppLog }) {
  const [expanded, setExpanded] = useState(false);
  const formattedDate = new Date(log.created_at).toLocaleString("pt-BR");
  const shortOrderId = log.order_id ? `#${log.order_id.slice(0, 8).toUpperCase()}` : "—";
  const hint = getErrorHint(log.error_code);

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
      >
        <StatusBadge status={log.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium font-mono truncate">{log.to_number}</span>
            <HttpStatusBadge code={log.http_status_code} />
            {log.error_code && (
              <span className="text-xs text-red-600 dark:text-red-400 font-mono">
                Código: {log.error_code}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" /> {formattedDate}
            </span>
            <span>Pedido: {shortOrderId}</span>
          </div>
          {log.error_message && !expanded && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-0.5 truncate">
              ⚠ {log.error_message}
            </p>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t bg-muted/20 px-4 py-3 space-y-3 text-sm">
          {log.error_message && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-3 py-2">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> Mensagem de Erro Twilio
              </p>
              <p className="text-xs text-red-600 dark:text-red-300 font-mono break-all">
                {log.error_message}
              </p>
            </div>
          )}

          {hint && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1">
                <Info className="h-3.5 w-3.5" /> Diagnóstico — Código {log.error_code}
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">{hint}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="Para" value={log.to_number} mono copyable />
            <InfoRow icon={<Phone className="h-3.5 w-3.5" />} label="De" value={log.from_number ?? "—"} mono />
            <InfoRow icon={<Hash className="h-3.5 w-3.5" />} label="Content SID" value={log.content_sid ?? "—"} mono copyable />
            <InfoRow icon={<Wifi className="h-3.5 w-3.5" />} label="Message SID" value={log.twilio_message_sid ?? "—"} mono copyable />
          </div>

          {log.content_variables && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Variáveis do Template</p>
              <pre className="text-xs bg-muted rounded p-2 overflow-x-auto font-mono">
                {JSON.stringify(log.content_variables, null, 2)}
              </pre>
            </div>
          )}

          {log.response_body && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">
                Resposta Completa da Twilio
              </p>
              <pre className="text-xs bg-muted rounded p-2 overflow-x-auto font-mono max-h-48">
                {JSON.stringify(log.response_body, null, 2)}
              </pre>
            </div>
          )}

          {log.request_payload && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Payload Enviado</p>
              <pre className="text-xs bg-muted rounded p-2 overflow-x-auto font-mono">
                {JSON.stringify(log.request_payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon, label, value, mono, copyable,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
        {icon} {label}
      </p>
      <p className={cn("text-xs break-all flex items-center gap-1", mono && "font-mono")}>
        {value}
        {copyable && value !== "—" && <CopyButton text={value} />}
      </p>
    </div>
  );
}

function LogStats({ logs }: { logs: WhatsAppLog[] }) {
  const total = logs.length;
  const success = logs.filter((l) => l.status === "success").length;
  const errors = logs.filter((l) => l.status === "error").length;

  return (
    <div className="grid grid-cols-3 gap-3 mb-4">
      <StatCard label="Total" value={total} color="default" />
      <StatCard label="Sucesso" value={success} color="green" />
      <StatCard label="Erro" value={errors} color="red" />
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "default" | "green" | "red" }) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-center",
        color === "green" && "border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800",
        color === "red" && "border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800"
      )}
    >
      <p
        className={cn(
          "text-xl font-bold",
          color === "green" && "text-green-700 dark:text-green-400",
          color === "red" && "text-red-700 dark:text-red-400"
        )}
      >
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function TestSendPanel({ onSent }: { onSent: () => void }) {
  const [phone, setPhone] = useState("+5553");
  const [sending, setSending] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSend = async () => {
    if (!phone.trim()) {
      toast.error("Informe o número de destino.");
      return;
    }
    setSending(true);
    setLastResult(null);
    try {
      const token = readStoredAdminTokens()?.access;
      const res = await fetch("/api/admin/whatsapp-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          to: phone.trim(),
          contentVariables: { "1": "Teste", "2": "Pedido de teste via painel de logs" },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLastResult({ success: true, message: `Mensagem enviada! SID: ${data.messageSid ?? "—"}` });
        toast.success("Mensagem de teste enviada com sucesso!");
      } else {
        const hint = getErrorHint(String(data.errorCode ?? ""));
        const msg = hint
          ? `${data.error} — ${hint}`
          : (data.error ?? "Erro desconhecido.");
        setLastResult({ success: false, message: msg });
        toast.error("Falha no envio. Veja o diagnóstico abaixo.");
      }
      setTimeout(() => onSent(), 800);
    } catch {
      setLastResult({ success: false, message: "Erro de conexão com o servidor." });
      toast.error("Erro de conexão.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="mb-6 border-dashed border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-500" />
          Envio de Teste
        </CardTitle>
        <CardDescription className="text-xs">
          Dispare uma mensagem de teste para verificar se as credenciais Twilio estão funcionando.
          O resultado aparecerá nos logs abaixo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="test-phone" className="text-xs">
              Número de destino (formato: +5511999999999)
            </Label>
            <Input
              id="test-phone"
              placeholder="+5511999999999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="font-mono text-sm h-9"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleSend}
            disabled={sending}
            className="gap-2 shrink-0"
          >
            {sending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {sending ? "Enviando..." : "Enviar Teste"}
          </Button>
        </div>

        {lastResult && (
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-xs",
              lastResult.success
                ? "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
                : "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
            )}
          >
            <span className="font-semibold flex items-center gap-1">
              {lastResult.success ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              {lastResult.success ? "Sucesso" : "Erro"}
            </span>
            <p className="mt-0.5 break-all">{lastResult.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function WhatsAppLogsPanel() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50", status: statusFilter });
      const token = readStoredAdminTokens()?.access;
      const res = await fetch(`/api/whatsapp-logs?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data ?? []);
      } else {
        setError(data.error ?? "Erro ao carregar logs.");
      }
    } catch {
      setError("Erro de conexão ao carregar logs.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <main className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Wifi className="h-6 w-6 text-green-500" />
          Logs de WhatsApp
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Histórico de todas as tentativas de envio via Twilio. Use o painel de teste para
          diagnosticar erros em tempo real — o resultado aparece nos logs abaixo.
        </p>
      </div>

      <TestSendPanel onSent={fetchLogs} />

      <Separator className="mb-5" />

      <div className="flex items-center gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erro</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchLogs}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {!loading && logs.length > 0 && <LogStats logs={logs} />}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 mb-4">
          <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border bg-muted animate-pulse" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wifi className="h-10 w-10 text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm font-medium text-muted-foreground">Nenhum log encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">
              Use o painel de teste acima para disparar uma mensagem e ver o resultado aqui.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <LogRow key={log.id} log={log} />
          ))}
        </div>
      )}
    </main>
  );
}
