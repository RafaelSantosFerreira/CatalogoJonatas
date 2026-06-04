"use client";

import { useState } from "react";
import { readStoredAdminTokens } from "@/lib/admin-bearer-storage";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type ItemDivergence = {
  order_item_id: string;
  order_id: string;
  unit_price: number;
  quantity: number;
  stored_total_price: number;
  expected_total_price: number;
};

type OrderDivergence = {
  order_id: string;
  stored_total_amount: number;
  expected_total_amount: number;
};

type IntegrityResult = {
  checked_at: string;
  item_price_divergences: ItemDivergence[];
  order_total_divergences: OrderDivergence[];
  is_clean: boolean;
};

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function IntegrityPanel() {
  const [result, setResult] = useState<IntegrityResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheck() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const token = readStoredAdminTokens()?.access;
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch("/api/admin/validate-integrity", { headers });
      if (!res.ok) {
        setError("Erro ao verificar integridade.");
        return;
      }
      setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          Integridade dos dados
        </h3>
        <Button size="sm" variant="outline" onClick={handleCheck} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
          {loading ? "Verificando..." : "Verificar integridade"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {result && result.is_clean && (
        <div className="rounded-lg border border-green-300 bg-green-50 dark:bg-green-900/20 dark:border-green-700 px-4 py-3 text-sm text-green-800 dark:text-green-400 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Nenhuma divergência encontrada. Dados consistentes.
          <span className="ml-auto text-xs text-muted-foreground">
            {new Date(result.checked_at).toLocaleString("pt-BR")}
          </span>
        </div>
      )}

      {result && !result.is_clean && (
        <div className="space-y-3">
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            {result.item_price_divergences.length + result.order_total_divergences.length} divergência(s) encontrada(s).
            <span className="ml-auto text-xs text-muted-foreground">
              {new Date(result.checked_at).toLocaleString("pt-BR")}
            </span>
          </div>

          {result.item_price_divergences.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Itens com total_price incorreto ({result.item_price_divergences.length}):
              </p>
              <div className="space-y-1">
                {result.item_price_divergences.map((d) => (
                  <div key={d.order_item_id} className="text-xs bg-muted/50 rounded px-3 py-1.5 flex justify-between gap-4">
                    <span className="font-mono text-muted-foreground">
                      Pedido {d.order_id.slice(0, 8).toUpperCase()}
                    </span>
                    <span>
                      {d.quantity} × {fmt(d.unit_price)} = {fmt(d.expected_total_price)}
                      <span className="text-destructive ml-2">(armazenado: {fmt(d.stored_total_price)})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.order_total_divergences.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Pedidos com total_amount incorreto ({result.order_total_divergences.length}):
              </p>
              <div className="space-y-1">
                {result.order_total_divergences.map((d) => (
                  <div key={d.order_id} className="text-xs bg-muted/50 rounded px-3 py-1.5 flex justify-between gap-4">
                    <span className="font-mono text-muted-foreground">
                      {d.order_id.slice(0, 8).toUpperCase()}
                    </span>
                    <span>
                      Esperado: {fmt(d.expected_total_amount)}
                      <span className="text-destructive ml-2">(armazenado: {fmt(d.stored_total_amount)})</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
